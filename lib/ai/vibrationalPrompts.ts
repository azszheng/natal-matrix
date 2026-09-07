/**
 * vibrationalPrompts.ts
 * AI prompt builders for the Vibrational (harmonic) astrology section.
 */

import type { NatalChart, BodyId, SignId } from '@/lib/astro/types';
import type { VibrationalHarmonic, VibrationalConjunction } from '@/lib/astro/vibrational';
import type { InterpretSection, InterpretMode } from './prompts';

const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', chiron: 'Chiron', asc: 'Ascendant', mc: 'Midheaven',
};

function bodyLabel(b: BodyId): string { return BODY_LABEL[b] ?? b; }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function signOfLongitude(lon: number): SignId {
  const SIGNS: SignId[] = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
  ];
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
}

function degreeOfLongitude(lon: number): number {
  return (((lon % 360) + 360) % 360) % 30;
}

function chartSummary(chart: NatalChart): string {
  const b = chart.western.bodies;
  return `Sun ${cap(b.sun.sign)} H${b.sun.house} · Moon ${cap(b.moon.sign)} H${b.moon.house} · ${cap(b.asc.sign)} Rising`;
}

function modeInstruction(mode: InterpretMode): string {
  if (mode === 'essence')
    return 'Length: 150–250 words. Style: warm, plain-language. Skip jargon — explain what this current feels like to live with.';
  if (mode === 'astrologer')
    return 'Length: 450–650 words. Style: technical. Explain the harmonic mechanism itself (why multiplying by this number reveals this pattern), then interpret the specific conjunction.';
  return 'Length: 300–450 words. Style: psychologically grounded, accessible, but comfortable naming the technique by name.';
}

function conjunctionLine(c: VibrationalConjunction): string {
  return `  ${bodyLabel(c.bodyA)} conjunct ${bodyLabel(c.bodyB)} in the harmonic chart (orb ${c.orb.toFixed(2)}°, strength ${c.strength}%)`;
}

const METHOD_NOTE = `METHOD NOTE: This is harmonic ("Vibrational") astrology, the technique developed by David Cochrane building on John Addey's harmonic charts. Each planet's natal ecliptic longitude is multiplied by the harmonic number and reduced mod 360°; any natal aspect of that order becomes a conjunction in the resulting harmonic chart. A tight conjunction here means the two bodies form a genuinely exact Nth-harmonic relationship in the birth chart — this is a real, computed astronomical relationship, not a metaphor.`;

// ── A. Single-harmonic prompt ─────────────────────────────────────────────────

export function buildVibrationalHarmonicSection(
  harmonic: VibrationalHarmonic,
  chart: NatalChart,
  mode: InterpretMode = 'deepdive',
): InterpretSection {
  const hasHits = harmonic.conjunctions.length > 0;
  const top = harmonic.conjunctions.slice(0, 5);

  const conjunctionBlock = hasHits
    ? topConjunctionDetail(top, harmonic.number)
    : `  (No conjunction within a ${3}° orb was found for this harmonic in this chart — this harmonic is not strongly activated.)`;

  const prompt = `VIBRATIONAL ASTROLOGY — ${harmonic.number}TH HARMONIC INTERPRETATION
${METHOD_NOTE}

HARMONIC THEME: ${harmonic.theme}

CHART CONTEXT: ${chartSummary(chart)}

${harmonic.number}TH HARMONIC CONJUNCTIONS FOUND (strongest first):
${conjunctionBlock}

INSTRUCTIONS:
${modeInstruction(mode)}

${hasHits
    ? `Interpret what it means that these specific bodies form a tight ${harmonic.number}th-harmonic conjunction in this chart. Address:
1. What each involved body represents on its own, briefly.
2. What gets fused or amplified when they meet at this specific harmonic frequency.
3. How the ${harmonic.number}th harmonic's theme (${harmonic.theme}) shows up because of this specific combination — not generically.
4. How this shows up in daily life, work, or self-expression.
5. How to work with it consciously.`
    : `No strong ${harmonic.number}th-harmonic conjunction was found in this chart. Write briefly and honestly about that: explain in 2-4 sentences what the ${harmonic.number}th harmonic represents in general (${harmonic.theme}), and note that its absence as a tight activation doesn't mean the theme is missing from the person's life — only that it isn't singled out as an exceptionally concentrated current by this specific technique. Do not invent a conjunction that isn't there.`}

Do not present this as fated or deterministic. Ground every claim in the specific bodies and orb listed — do not write generically about "harmonics" without reference to this chart's actual data.
Begin with a 3–5 word thematic title, then a blank line, then the interpretation. No headers within the body. No bullets.`;

  return {
    type:       'vibrational',
    label:      `${harmonic.label}`,
    frontTitle: hasHits
      ? `${harmonic.label} · ${top[0].strength}% strength`
      : `${harmonic.label} · not strongly activated`,
    anchor:     hasHits
      ? `${bodyLabel(top[0].bodyA)} conjunct ${bodyLabel(top[0].bodyB)} · H${harmonic.number} · ${top[0].orb.toFixed(2)}° orb`
      : `H${harmonic.number} · no tight conjunction found`,
    prompt,
  };
}

function topConjunctionDetail(top: VibrationalConjunction[], harmonic: number): string {
  return top.map(c => {
    const signA = signOfLongitude(c.harmonicLonA);
    const signB = signOfLongitude(c.harmonicLonB);
    return `${conjunctionLine(c)}\n    (H${harmonic} positions: ${bodyLabel(c.bodyA)} ${cap(signA)} ${degreeOfLongitude(c.harmonicLonA).toFixed(1)}°, ${bodyLabel(c.bodyB)} ${cap(signB)} ${degreeOfLongitude(c.harmonicLonB).toFixed(1)}°)`;
  }).join('\n');
}

// ── B. Whole-profile summary prompt ───────────────────────────────────────────

export function buildVibrationalProfileSection(
  profile: VibrationalHarmonic[],
  chart: NatalChart,
  mode: InterpretMode = 'deepdive',
): InterpretSection {
  const active = [...profile]
    .filter(h => h.conjunctions.length > 0)
    .sort((a, b) => b.strength - a.strength);

  const summaryLines = profile
    .map(h => {
      const top = h.conjunctions[0];
      const shortLabel = h.label.split('—')[1]?.trim() ?? h.label;
      return top
        ? `  H${h.number} (${shortLabel}): ${bodyLabel(top.bodyA)} conjunct ${bodyLabel(top.bodyB)}, ${top.strength}% strength`
        : `  H${h.number} (${shortLabel}): no tight conjunction`;
    })
    .join('\n');

  const prompt = `VIBRATIONAL ASTROLOGY — WHOLE-PROFILE READING
${METHOD_NOTE}

CHART CONTEXT: ${chartSummary(chart)}

HARMONIC ACTIVATION SUMMARY (six base harmonics: 5, 7, 8, 9, 11, 13):
${summaryLines}

INSTRUCTIONS:
${modeInstruction(mode)}

Write a whole-profile "vibrational signature" reading, honest about which harmonics are and aren't strongly activated. Address:
1. Which harmonic(s) show the strongest, tightest activation, and what that says about where this person's energy is most concentrated.
2. How the top 2-3 active harmonics interact or reinforce each other, grounded in the specific bodies involved.
3. Briefly note which harmonics show weak or no activation, and that this simply means this technique doesn't flag them as a concentrated current — not that the theme is absent from the person's life.
4. A grounded closing paragraph on how to work with the dominant vibrational current(s) consciously.

${active.length === 0 ? 'No harmonic in this set shows a tight conjunction. Say so plainly, explain briefly what that means (a more diffuse, less singularly-concentrated energetic signature across these specific frequencies), and do not invent activations that are not in the data.' : ''}

Do not present this as fated or deterministic. Do not claim this technique overrides or is more "true" than the person's Western or Vedic chart — frame it as one additional lens.
Begin with a 3–5 word thematic title, then a blank line, then the interpretation. No headers within the body. No bullets.`;

  return {
    type:       'vibrational',
    label:      'Vibrational Signature',
    frontTitle: active.length > 0
      ? `Vibrational Signature · H${active[0].number} dominant`
      : 'Vibrational Signature · diffuse',
    anchor:     active.length > 0
      ? `Strongest: H${active[0].number} — ${bodyLabel(active[0].conjunctions[0].bodyA)} conjunct ${bodyLabel(active[0].conjunctions[0].bodyB)}`
      : 'No dominant harmonic found',
    prompt,
  };
}
