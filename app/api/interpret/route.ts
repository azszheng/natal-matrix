import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { buildSystemPrompt, buildChartContext, buildVedicSystemPrompt, buildVedicChartContext } from '@/lib/ai/prompts';
import type { InterpretationProvider } from '@/lib/ai/interpretationInput';
import { buildFocusedContext } from '@/lib/ai/interpretationInput';

export const maxDuration = 60;

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'placeholder' });
const OPENAI_MODEL = process.env.OPENAI_ASTROLOGY_MODEL ?? 'gpt-4o-mini';

const MAX_TOKENS: Record<InterpretMode, number> = {
  essence:    600,
  deepdive:   1400,
  astrologer: 2000,
};

const VEDIC_MAX_TOKENS: Record<InterpretMode, number> = {
  essence:    500,
  deepdive:   1600,
  astrologer: 1800,
};

function sseStream(
  run: (send: (token: string) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const enq = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      try {
        await run((token) => enq(`data: ${JSON.stringify({ token })}\n\n`));
        enq('data: [DONE]\n\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        enq(`data: ${JSON.stringify({ error: msg })}\n\n`);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function streamClaude(
  chart: NatalChart,
  section: InterpretSection,
  mode: InterpretMode,
  send: (token: string) => void,
) {
  const isVedic      = section.system === 'vedic';
  const systemPrompt = isVedic ? buildVedicSystemPrompt(mode) : buildSystemPrompt(mode, '');
  const chartContext = isVedic ? buildVedicChartContext(chart) : buildChartContext(chart);
  const maxTokens    = isVedic ? (VEDIC_MAX_TOKENS[mode] ?? 1200) : (MAX_TOKENS[mode] ?? 800);

  const response = claude.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `CHART DATA:\n${chartContext}`, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: section.prompt },
      ],
    }],
  } as Parameters<typeof claude.messages.stream>[0]);

  for await (const event of response) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      send(event.delta.text);
    }
  }
}

async function streamOpenAI(
  chart: NatalChart,
  section: InterpretSection,
  mode: InterpretMode,
  send: (token: string) => void,
) {
  const systemPrompt = buildSystemPrompt(mode, '');
  const focusedCtx   = buildFocusedContext(chart, section);

  const stream = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: systemPrompt,
    input: `CHART DATA:\n${focusedCtx}\n\n${section.prompt}`,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') {
      send(event.delta);
    }
  }
}

export async function POST(req: Request) {
  const {
    chart,
    section,
    mode = 'deepdive',
    provider = 'claude',
  }: {
    chart: NatalChart;
    section: InterpretSection;
    mode: InterpretMode;
    provider?: InterpretationProvider;
  } = await req.json();

  if (provider === 'openai') {
    if (process.env.OPENAI_INTERPRETATIONS_ENABLED !== 'true') {
      return new Response(JSON.stringify({ error: 'OpenAI interpretations not enabled' }), { status: 403 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 503 });
    }
    return sseStream((send) => streamOpenAI(chart, section, mode, send));
  }

  // Default: Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 503 });
  }
  return sseStream((send) => streamClaude(chart, section, mode, send));
}
