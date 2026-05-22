import Anthropic from '@anthropic-ai/sdk';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { buildSystemPrompt, buildChartContext } from '@/lib/ai/prompts';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

const MAX_TOKENS: Record<InterpretMode, number> = {
  essence:    400,
  deepdive:   800,
  astrologer: 1200,
};


export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 503 });
  }

  const { chart, section, mode = 'deepdive' }: { chart: NatalChart; section: InterpretSection; mode: InterpretMode } = await req.json();

  const systemPrompt = buildSystemPrompt(mode, '');
  const chartContext = buildChartContext(chart);
  const maxTokens = MAX_TOKENS[mode] ?? 800;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: MODEL,
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
        } as Parameters<typeof client.messages.stream>[0]);

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = `data: ${JSON.stringify({ token: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
