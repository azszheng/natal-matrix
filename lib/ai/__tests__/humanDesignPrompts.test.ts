import { describe, it, expect } from 'vitest';
import { computeHumanDesignChart } from '@/lib/astro/humandesign';
import type { ResolvedBirth } from '@/lib/astro/types';
import { enrichAllActivations } from '@/lib/astro/humandesign-derive';
import type { EnrichedActivation } from '@/lib/astro/humandesign-derive';
import {
  buildHumanDesignSystemPrompt,
  buildHumanDesignGateActivationSection,
  buildHumanDesignCenterSection,
  buildHumanDesignTypeSection,
  buildHumanDesignReportSections,
} from '../humanDesignPrompts';

const birth: ResolvedBirth = {
  name: 'Test', date: '1986-10-26', time: '01:15',
  city: 'Fuzhou', region: 'Fujian', country: 'China',
  lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
  utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
};

const chart = computeHumanDesignChart(birth);
const enriched = enrichAllActivations(chart);

function withOverrides(a: EnrichedActivation, overrides: Partial<EnrichedActivation>): EnrichedActivation {
  return { ...a, ...overrides };
}

describe('buildHumanDesignSystemPrompt', () => {
  it('produces a different system prompt per mode', () => {
    const essence    = buildHumanDesignSystemPrompt('essence');
    const deepdive   = buildHumanDesignSystemPrompt('deepdive');
    const astrologer = buildHumanDesignSystemPrompt('astrologer');
    expect(essence).not.toBe(deepdive);
    expect(deepdive).not.toBe(astrologer);
  });

  it('carries the non-deterministic framing rules', () => {
    const prompt = buildHumanDesignSystemPrompt('deepdive');
    expect(prompt).toMatch(/never.*destined/i);
    expect(prompt).toMatch(/symbolic/i);
  });
});

describe('buildHumanDesignGateActivationSection — output changes with chart context', () => {
  const base = enriched[0];

  it('changes when the planet changes (same gate/line)', () => {
    const other = enriched.find(a => a.gate === base.gate && a.line === base.line && a.planet !== base.planet);
    if (!other) return; // no natural match in this chart; nothing to compare
    const p1 = buildHumanDesignGateActivationSection(base, chart);
    const p2 = buildHumanDesignGateActivationSection(other, chart);
    expect(p1.prompt).not.toBe(p2.prompt);
  });

  it('changes when the line changes', () => {
    const changedLine = withOverrides(base, { line: base.line === 6 ? 1 : base.line + 1 as EnrichedActivation['line'] });
    const p1 = buildHumanDesignGateActivationSection(base, chart);
    const p2 = buildHumanDesignGateActivationSection(changedLine, chart);
    expect(p1.prompt).not.toBe(p2.prompt);
  });

  it('changes when Personality vs Design side changes', () => {
    const flipped = withOverrides(base, { side: base.side === 'Personality' ? 'Design' : 'Personality' });
    const p1 = buildHumanDesignGateActivationSection(base, chart);
    const p2 = buildHumanDesignGateActivationSection(flipped, chart);
    expect(p1.prompt).not.toBe(p2.prompt);
    expect(p1.prompt).toContain(base.side);
    expect(p2.prompt).toContain(flipped.side);
  });

  it('changes when center-defined state changes', () => {
    const flipped = withOverrides(base, { centerDefined: !base.centerDefined });
    const p1 = buildHumanDesignGateActivationSection(base, chart);
    const p2 = buildHumanDesignGateActivationSection(flipped, chart);
    expect(p1.prompt).not.toBe(p2.prompt);
  });

  it('changes when channel status differs (full channel vs hanging gate)', () => {
    const fullChannelCase = enriched.find(a => a.channels.some(c => c.status === 'full_channel'));
    const hangingCase     = enriched.find(a => a.channels.some(c => c.status === 'hanging_gate'));
    if (!fullChannelCase || !hangingCase) return;
    const p1 = buildHumanDesignGateActivationSection(fullChannelCase, chart);
    const p2 = buildHumanDesignGateActivationSection(hangingCase, chart);
    expect(p1.prompt).not.toBe(p2.prompt);
  });

  it('never fabricates a paired gate for a gate with no channel at all', () => {
    const noChannel = withOverrides(base, { channels: [] });
    const p = buildHumanDesignGateActivationSection(noChannel, chart);
    expect(p.prompt).toMatch(/not part of a defined channel pairing/i);
  });
});

describe('buildHumanDesignCenterSection — defined vs open changes the prompt', () => {
  it('produces different framing for the same center defined vs open', () => {
    const center = chart.definedCenters[0] ?? 'g';
    const definedChart = { ...chart, definedCenters: [...new Set([...chart.definedCenters, center])] };
    const openChart    = { ...chart, definedCenters: chart.definedCenters.filter(c => c !== center) };
    const p1 = buildHumanDesignCenterSection(center, definedChart);
    const p2 = buildHumanDesignCenterSection(center, openChart);
    expect(p1.prompt).not.toBe(p2.prompt);
    expect(p1.frontTitle).toContain('Defined');
    expect(p2.frontTitle).toContain('Open');
  });
});

describe('buildHumanDesignTypeSection', () => {
  it('references the chart\'s actual Type, Strategy, and Not-Self theme', () => {
    const section = buildHumanDesignTypeSection(chart);
    expect(section.prompt).toContain(chart.type);
    expect(section.prompt).toContain(chart.strategy);
    expect(section.prompt).toContain(chart.notSelf);
  });
});

describe('buildHumanDesignReportSections', () => {
  it('includes one section per defined center and per defined channel, plus the fixed core sections', () => {
    const sections = buildHumanDesignReportSections(chart);
    const coreCount = 5; // overview, type, authority, profile, definition
    const practicesCount = 1;
    expect(sections.length).toBeGreaterThanOrEqual(
      coreCount + chart.definedCenters.length + chart.definedChannels.length + practicesCount,
    );
  });

  it('adds an astrology bridge section only when a natal chart is provided', () => {
    const withoutNatal = buildHumanDesignReportSections(chart);
    expect(withoutNatal.some(s => s.label === 'Astrology Integration')).toBe(false);
  });
});
