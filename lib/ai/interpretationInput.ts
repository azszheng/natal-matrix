import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { SIGNS } from '@/lib/astro/types';

export type InterpretationProvider = 'claude' | 'openai';

export type ComparisonRatings = {
  astrologyAccuracy:   number | null;  // 1–5
  specificity:         number | null;
  houseTopicAnchoring: number | null;
  userRelatability:    number | null;
  emotionalResonance:  number | null;
  clarity:             number | null;
  overallPreference:   'claude' | 'openai' | null;
};

export function buildProviderCacheKey(
  chart: NatalChart,
  section: InterpretSection,
  mode: InterpretMode,
  provider: InterpretationProvider,
): string {
  const { date, time, lat, lng } = chart.input;
  const chartHash = `${date}|${time}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
  const factorKey = `${section.type}|${section.label}`;
  return `nc_interp::${chartHash}::${mode}::${factorKey}::${provider}`;
}

function lonToSignDeg(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  const idx  = Math.floor(norm / 30);
  const deg  = norm % 30;
  return `${SIGNS[idx]} ${deg.toFixed(1)}°`;
}

const PERSONAL_BODIES = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
] as const;

const OUTER_BODIES = ['uranus', 'neptune', 'pluto', 'chiron', 'trueNode'] as const;

// Builds a focused chart context for the given section.
// Used for OpenAI: sends only what's relevant rather than a full chart dump.
export function buildFocusedContext(chart: NatalChart, section: InterpretSection): string {
  const bodies  = chart.western.bodies;
  const cusps   = chart.western.houses.cusps;
  const aspects = chart.western.aspects;
  const lines: string[] = [];

  const { date, time, lat, lng, city, country } = chart.input;
  const loc = city ? `${city}, ${country}` : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  lines.push(`Birth: ${date} ${time} | ${loc}`);

  // Core placements always included
  const sun = bodies.sun;
  const moon = bodies.moon;
  const asc = bodies.asc;
  const mc  = bodies.mc;
  lines.push(`Sun: ${sun.sign} ${sun.signDegree.toFixed(1)}° H${sun.house}${sun.isRetrograde ? ' Rx' : ''}`);
  lines.push(`Moon: ${moon.sign} ${moon.signDegree.toFixed(1)}° H${moon.house}${moon.isRetrograde ? ' Rx' : ''}`);
  lines.push(`ASC: ${asc.sign} ${asc.signDegree.toFixed(1)}°`);
  lines.push(`MC: ${mc.sign} ${mc.signDegree.toFixed(1)}°`);

  if (section.type === 'house') {
    // Include all house cusps + planet positions
    cusps.forEach((c, i) => lines.push(`H${i + 1} cusp: ${lonToSignDeg(c)}`));
    PERSONAL_BODIES.forEach(k => {
      const b = bodies[k];
      lines.push(`${k}: ${b.sign} ${b.signDegree.toFixed(1)}° H${b.house}`);
    });
  } else if (section.type === 'aspect') {
    // All aspects within orb + planet positions
    aspects.filter(a => a.orb <= 7).forEach(a => {
      lines.push(`${a.a}-${a.b} ${a.kind} orb ${a.orb.toFixed(1)}°${a.applying ? ' (app)' : ''}`);
    });
    PERSONAL_BODIES.forEach(k => {
      const b = bodies[k];
      lines.push(`${k}: ${b.sign} ${b.signDegree.toFixed(1)}° H${b.house}`);
    });
  } else {
    // topic / body / snapshot / etc — full personal picture
    PERSONAL_BODIES.forEach(k => {
      const b = bodies[k];
      lines.push(`${k}: ${b.sign} ${b.signDegree.toFixed(1)}° H${b.house}${b.isRetrograde ? ' Rx' : ''}`);
    });
    OUTER_BODIES.forEach(k => {
      const b = bodies[k];
      lines.push(`${k}: ${b.sign} ${b.signDegree.toFixed(1)}° H${b.house}${b.isRetrograde ? ' Rx' : ''}`);
    });
    cusps.forEach((c, i) => lines.push(`H${i + 1} cusp: ${lonToSignDeg(c)}`));
    aspects.filter(a => a.orb <= 5).slice(0, 15).forEach(a => {
      lines.push(`${a.a}-${a.b} ${a.kind} orb ${a.orb.toFixed(1)}°`);
    });
  }

  return lines.join('\n');
}
