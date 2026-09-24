/**
 * lib/ipse/domain-common.ts
 *
 * Shared plumbing used by all four domain analyzers: capacity/expression
 * tiering from continuous internal scores, style selection from the
 * Western+Vibrational catalog, and the astrological "basis" object that
 * powers the UI's "Why?" expandable (spec section 23).
 */

import type { BodyId } from '@/lib/astro/types';
import type {
  AstroBasis, AstroFactor, CapacityLevel, ChartInput, ConfidenceLevel, ExpressionEase,
  IPSEDomainId, PlanetCondition, SectContext, StyleTrait,
} from './types';
import { planetCondition, walkDispositorChain } from './evidence';
import { computeStyleScores, IPSE_STYLE_CATALOG, type ScoredStyle } from './western';
import { refineStylesWithVibrational } from './vibrational';
import type { VedicLens } from './vedic';
import type { HumanDesignLens } from './human-design';

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// Blended capacity looks at the top 3 candidate styles regardless of which
// one is ultimately named -- it measures how much overall emphasis this
// domain carries in the chart, independent of which specific style wins.
export function blendedCapacityScore(scores: ScoredStyle[]): number {
  const top3 = [...scores].sort((a, b) => b.score - a.score).slice(0, 3);
  return top3.reduce((s, x, i) => s + x.score * (i === 0 ? 0.6 : i === 1 ? 0.25 : 0.15), 0);
}

export function capacityFromScore(score: number): CapacityLevel {
  if (score >= 58) return 'emphasized';
  if (score >= 34) return 'moderate';
  if (score >= 16) return 'mixed';
  return 'less_emphasized';
}

export function expressionFromAccessibility(avg: number): ExpressionEase {
  if (avg >= 0.6) return 'natural';
  if (avg >= 0.48) return 'conditional';
  if (avg >= 0.36) return 'variable';
  return 'effortful';
}

export function confidenceFromFactorCount(n: number, hasSecondSystem: boolean): ConfidenceLevel {
  if (n >= 3 && hasSecondSystem) return 'high';
  if (n >= 2) return 'moderate';
  return 'low';
}

export function styleTraitsFromScores(scores: ScoredStyle[]): StyleTrait[] {
  return scores
    .filter(s => s.score >= 16)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(s => ({ id: s.id, label: s.label, strength: capacityFromScore(s.score), evidence: s.evidence }));
}

// A combined "Profile Style" headline from the top 1-2 detected styles, e.g.
// "Systems-Oriented Investigative Thinker" from Systems Thinker +
// Investigative Analyst. Falls back to a domain-generic label when nothing
// cleared the detection threshold.
export function profileStyleLabel(styles: StyleTrait[], fallback: string): string {
  if (styles.length === 0) return fallback;
  if (styles.length === 1) return styles[0].label;
  const [first, second] = styles;
  const firstWord = first.label.split(' ')[0].replace(/[^A-Za-z]/g, '');
  return `${firstWord}-Oriented ${second.label}`;
}

export function computeDomainStyles(chart: ChartInput, domain: keyof typeof IPSE_STYLE_CATALOG) {
  const base = computeStyleScores(chart, domain);
  const refined = refineStylesWithVibrational(chart, IPSE_STYLE_CATALOG[domain], base);
  return refined;
}

export function buildBasis(
  chart: ChartInput, sect: SectContext, keyPlanetIds: BodyId[],
  vedicLens: VedicLens | undefined, vibrationalAvailable: boolean, hdLens: HumanDesignLens | undefined,
): AstroBasis {
  const keyPlanets = keyPlanetIds.map(p => {
    const c = planetCondition(chart, sect, p);
    return c ? { planet: p, sign: c.sign, house: c.house, dignity: c.dignity, sect: c.sectStatus } : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const aspects: string[] = [];
  const seen = new Set<string>();
  for (const p of keyPlanetIds) {
    const c = planetCondition(chart, sect, p);
    if (!c) continue;
    for (const a of [...c.hardAspects, ...c.easyAspects]) {
      const key = [p, a.other].sort().join('-') + a.kind;
      if (seen.has(key)) continue;
      seen.add(key);
      aspects.push(`${cap(p)} ${a.kind} ${cap(a.other)} (${a.orb.toFixed(1)} deg)`);
    }
  }

  const houses = [...new Set(keyPlanetIds.map(p => chart.western.bodies[p]?.house).filter((h): h is number => typeof h === 'number'))];
  const dispositorChains = keyPlanetIds.map(p => ({ planet: p, chain: walkDispositorChain(chart, p) }));

  return {
    keyPlanets, aspects: aspects.slice(0, 8), houses, dispositorChains,
    vedic: vedicLens?.available ? vedicLens.summary : undefined,
    vibrational: vibrationalAvailable ? 'Harmonic resonance checked against this domain\'s style catalog.' : undefined,
    humanDesign: hdLens?.available ? hdLens.summary : undefined,
  };
}

export function averageAccessibility(chart: ChartInput, sect: SectContext, planets: BodyId[]): number {
  const conditions = planets.map(p => planetCondition(chart, sect, p)).filter((c): c is PlanetCondition => c !== null);
  if (conditions.length === 0) return 0.5;
  return conditions.reduce((s, c) => s + c.accessibility, 0) / conditions.length;
}

export function factorsFromConditions(conditions: PlanetCondition[]): AstroFactor[] {
  const factors: AstroFactor[] = [];
  for (const c of conditions) {
    if (c.dignity === 'domicile' || c.dignity === 'exaltation') {
      factors.push({ label: `${cap(c.planet)} ${c.dignity}`, system: 'western', weight: 0.6, polarity: 'supportive', sourcePlanet: c.planet });
    } else if (c.dignity === 'detriment' || c.dignity === 'fall') {
      factors.push({ label: `${cap(c.planet)} ${c.dignity}`, system: 'western', weight: 0.4, polarity: 'challenging', sourcePlanet: c.planet });
    }
    if (c.sectStatus === 'in_sect') factors.push({ label: `${cap(c.planet)} in sect`, system: 'western', weight: 0.3, polarity: 'supportive', sourcePlanet: c.planet });
    if (c.sectStatus === 'contrary_to_sect') factors.push({ label: `${cap(c.planet)} contrary to sect`, system: 'western', weight: 0.3, polarity: 'challenging', sourcePlanet: c.planet });
    if (c.angularity === 'angular') factors.push({ label: `${cap(c.planet)} angular (house ${c.house})`, system: 'western', weight: 0.3, polarity: 'supportive', sourcePlanet: c.planet });
    for (const a of c.easyAspects.slice(0, 2)) factors.push({ label: `${cap(c.planet)} ${a.kind} ${cap(a.other)}`, system: 'western', weight: 0.4, polarity: 'supportive', sourcePlanet: c.planet });
    for (const a of c.hardAspects.slice(0, 2)) factors.push({ label: `${cap(c.planet)} ${a.kind} ${cap(a.other)}`, system: 'western', weight: 0.4, polarity: 'challenging', sourcePlanet: c.planet });
  }
  return factors;
}

export const DOMAIN_META: Record<IPSEDomainId, { shortCode: 'I' | 'P' | 'S' | 'E'; label: string; definition: string; fallbackStyle: string }> = {
  intellectual: {
    shortCode: 'I', label: 'Intellectual Intelligence',
    definition: 'How you learn, reason, model information, detect patterns, synthesize ideas, and develop understanding.',
    fallbackStyle: 'Pattern-Oriented Thinker',
  },
  practical: {
    shortCode: 'P', label: 'Practical Intelligence',
    definition: 'How you translate understanding and intention into effective action -- judgment, initiative, execution, and follow-through.',
    fallbackStyle: 'Applied Problem-Solver',
  },
  spiritual: {
    shortCode: 'S', label: 'Spiritual Intelligence',
    definition: 'How you construct meaning, engage symbolism, relate to existential questions, and integrate intuitive or transpersonal experience. Not a measure of religiosity.',
    fallbackStyle: 'Meaning-Oriented Seeker',
  },
  emotional: {
    shortCode: 'E', label: 'Emotional Intelligence',
    definition: 'How you perceive, process, regulate, and communicate emotion in yourself and others. Sensitivity is not automatically regulation.',
    fallbackStyle: 'Relationally Perceptive',
  },
};
