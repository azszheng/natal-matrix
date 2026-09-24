/**
 * lib/ipse/spiritual.ts
 *
 * Spiritual Intelligence (S): meaning-making, symbolic cognition,
 * transpersonal awareness. Explicitly NOT religiosity. Primary: Jupiter,
 * Neptune, Moon. Secondary: Pluto, Sun, Mercury, Venus. Each primary
 * planet's emphasis produces a different FLAVOR of spiritual orientation
 * (philosophical vs. mystical vs. transformational vs. experiential vs.
 * conceptual) rather than one undifferentiated "spirituality" score.
 */

import type { ChartInput, IPSEDomainProfile, InterpretationTrait, PlanetCondition, SectContext, ShadowTrait } from './types';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import { planetCondition } from './evidence';
import { findCompensator } from './compensation';
import { generatePlanetShadow } from './shadows';
import { computeVedicLens } from './vedic';
import { computeHumanDesignLens } from './human-design';
import {
  averageAccessibility, blendedCapacityScore, buildBasis, capacityFromScore, computeDomainStyles,
  confidenceFromFactorCount, DOMAIN_META, expressionFromAccessibility, factorsFromConditions, profileStyleLabel, styleTraitsFromScores,
} from './domain-common';

type Flavor = { planet: 'jupiter' | 'neptune' | 'pluto' | 'moon' | 'mercury'; label: string; description: string };

const FLAVORS: Flavor[] = [
  { planet: 'jupiter', label: 'philosophical', description: 'Meaning built through ethics, philosophy, and a cosmological sense of purpose.' },
  { planet: 'neptune', label: 'mystical', description: 'Meaning arrived at through intuition, imagination, and a dissolving of ordinary boundaries.' },
  { planet: 'pluto', label: 'transformational', description: 'Meaning forged through psychological depth, death-and-rebirth cycles, and facing what is hidden.' },
  { planet: 'moon', label: 'experiential', description: 'Meaning felt somatically and instinctively -- ancestral, embodied, and rooted in lived experience rather than abstraction.' },
  { planet: 'mercury', label: 'conceptual', description: 'Meaning approached analytically -- metaphysics as something to think through, not just feel.' },
];

export function analyzeSpiritual(chart: ChartInput, sect: SectContext, hdChart: HdChart | null | undefined): IPSEDomainProfile {
  const meta = DOMAIN_META.spiritual;
  const { scores, summary: vibrationalSummary } = computeDomainStyles(chart, 'spiritual');
  const styles = styleTraitsFromScores(scores);
  const capacityScore = blendedCapacityScore(scores);
  const capacityLevel = capacityFromScore(capacityScore);

  const conditions: Record<string, PlanetCondition> = {};
  for (const p of ['jupiter', 'neptune', 'pluto', 'moon', 'mercury', 'sun', 'venus'] as const) {
    const c = planetCondition(chart, sect, p);
    if (c) conditions[p] = c;
  }

  // Which flavor is most emphasized: whichever of the five anchor planets
  // has the highest accessibility AND at least one real aspect (not just a
  // bare placement) -- avoids naming a flavor off a planet with no evidence.
  const rankedFlavors = FLAVORS
    .map(f => ({ f, c: conditions[f.planet] }))
    .filter(({ c }) => c && (c.hardAspects.length > 0 || c.easyAspects.length > 0 || c.dignity === 'domicile' || c.dignity === 'exaltation'))
    .sort((a, b) => (b.c?.accessibility ?? 0) - (a.c?.accessibility ?? 0));

  const dominantFlavor = rankedFlavors[0]?.f;
  const avgAccess = averageAccessibility(chart, sect, ['jupiter', 'neptune', 'moon']);
  const ease = expressionFromAccessibility(avgAccess);

  const vedicLens = computeVedicLens(chart, 'spiritual');
  const hdLens = computeHumanDesignLens(hdChart, 'spiritual');

  const strengths: InterpretationTrait[] = [];
  if (dominantFlavor) {
    strengths.push({
      text: dominantFlavor.description,
      confidence: rankedFlavors[0].c && rankedFlavors[0].c.accessibility >= 0.6 ? 'high' : 'moderate',
      sourceFactors: [{ label: `${cap(dominantFlavor.planet)} anchors a ${dominantFlavor.label} orientation`, system: 'western', weight: 0.5, polarity: 'supportive', sourcePlanet: dominantFlavor.planet }],
    });
  }
  if (styles[0]) strengths.push({ text: spiritualStyleFlavor(styles[0].id), confidence: styles[0].strength === 'emphasized' ? 'high' : 'moderate', sourceFactors: styles[0].evidence });
  if (rankedFlavors.length >= 2) {
    strengths.push({ text: `A second, complementary current runs through ${rankedFlavors[1].f.label} territory as well -- meaning here rarely comes from just one source.`, confidence: 'moderate', sourceFactors: [] });
  }
  if (strengths.length === 0) strengths.push({ text: 'Meaning-making here is quiet and undifferentiated rather than organized around one obvious symbolic current.', confidence: 'low', sourceFactors: [] });

  const shadows: ShadowTrait[] = [];
  for (const p of ['neptune', 'pluto', 'jupiter'] as const) {
    const c = conditions[p];
    if (!c) continue;
    const s = generatePlanetShadow(p, c, 'spiritual');
    if (s) shadows.push(s);
    if (shadows.length >= 3) break;
  }

  const compensators = [];
  if (conditions.mercury) {
    const c = findCompensator(chart, sect, 'mercury', ['jupiter', 'saturn'], 'grounding intuitive material in something checkable');
    if (c) compensators.push(c);
  }

  const optimalConditions = [
    'Space for reflection that is not immediately required to be useful or productive',
    dominantFlavor?.label === 'mystical' ? 'A grounding practice or trusted person to check impressions against, so intuition does not run unchecked' : 'Real-world grounding so meaning-making stays connected to lived experience',
    'Permission to hold a question open rather than needing a final answer',
  ];

  const factors = factorsFromConditions(Object.values(conditions));
  const confidence = confidenceFromFactorCount(factors.length, vedicLens.available || hdLens.available);
  const label = profileStyleLabel(styles, meta.fallbackStyle);

  return {
    domain: 'spiritual', shortCode: meta.shortCode, domainLabel: meta.label, definition: meta.definition,
    capacity: { level: capacityLevel, confidence, evidence: factors },
    profileStyleLabel: label, styles,
    strengths: strengths.slice(0, 5),
    styleDescription: dominantFlavor ? `This intelligence runs primarily ${dominantFlavor.label}: ${dominantFlavor.description}` : 'Meaning-making here draws on more than one current without a single dominant flavor.',
    expression: { ease, description: expressionDescription(ease) },
    shadows: shadows.slice(0, 4), compensators,
    optimalConditions,
    synthesis: `Your Spiritual Intelligence shows up primarily as a ${label}.${dominantFlavor ? ` ${dominantFlavor.description}` : ''}`,
    basis: buildBasis(chart, sect, ['jupiter', 'neptune', 'pluto', 'moon', 'mercury', 'sun', 'venus'], vedicLens, Boolean(vibrationalSummary), hdLens),
  };
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function spiritualStyleFlavor(styleId: string): string {
  const table: Record<string, string> = {
    experientialMystic: 'Genuine openness to non-ordinary perception and comfort with mystery.',
    symbolicInterpreter: 'Willingness to explore hidden or taboo subjects and return with real understanding.',
    philosophicalSeeker: 'Curiosity about meaning and belief that stays exploratory rather than dogmatic.',
    archetypalThinker: 'Sensing what is emerging before it is fully formed elsewhere.',
    contemplativeObserver: 'Discipline in reflective practice and real comfort with solitude.',
    existentialInvestigator: 'Sensitivity to inherited or generational patterns, and the capacity to consciously process them.',
    rationalSpiritualist: 'Purpose built through lived responsibility and tested principle rather than doctrine.',
    skepticalSeeker: 'A belief system built from direct conviction rather than consensus.',
  };
  return table[styleId] ?? 'A distinct, recognizable orientation toward meaning.';
}

function expressionDescription(ease: string): string {
  if (ease === 'natural') return 'Meaning-making tends to flow without much effort or special condition.';
  if (ease === 'conditional') return 'This works well, but tends to need the right context -- solitude, a real conversation, or a genuine question -- to activate.';
  if (ease === 'variable') return 'This can feel vivid in one season and completely dormant in another.';
  return 'Real depth is present here, but reaching it may require moving through real discomfort, doubt, or disorientation first.';
}
