/**
 * lib/ipse/intellectual.ts
 *
 * Intellectual Intelligence (I): reasoning style, abstraction, pattern
 * recognition, learning style, synthesis. Primary: Mercury. Modifiers:
 * Uranus, Saturn, Jupiter, Pluto, Moon.
 */

import type { ChartInput, IPSEDomainProfile, InterpretationTrait, SectContext, ShadowTrait } from './types';
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

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

export function analyzeIntellectual(chart: ChartInput, sect: SectContext, hdChart: HdChart | null | undefined): IPSEDomainProfile {
  const meta = DOMAIN_META.intellectual;
  const { scores, summary: vibrationalSummary } = computeDomainStyles(chart, 'intellectual');
  const styles = styleTraitsFromScores(scores);
  const capacityScore = blendedCapacityScore(scores);
  const capacityLevel = capacityFromScore(capacityScore);

  const mercury = planetCondition(chart, sect, 'mercury');
  const modifiers = (['uranus', 'saturn', 'jupiter', 'pluto', 'moon'] as const)
    .map(p => planetCondition(chart, sect, p)).filter((c): c is NonNullable<typeof c> => c !== null);

  const avgAccess = averageAccessibility(chart, sect, ['mercury']);
  const ease = expressionFromAccessibility(avgAccess);

  const vedicLens = computeVedicLens(chart, 'intellectual');
  const hdLens = computeHumanDesignLens(hdChart, 'intellectual');

  // Only these five carry a defined cognitive-style flavor for Mercury
  // (spec section 6's explicit modifier list) -- an aspect to the Nodes or
  // Chiron is real evidence but not one this table has a meaningful,
  // non-generic thing to say about.
  const MEANINGFUL_MERCURY_MODIFIERS = ['uranus', 'saturn', 'jupiter', 'pluto', 'neptune', 'mars'];

  const strengths: InterpretationTrait[] = [];
  if (mercury) {
    for (const a of mercury.easyAspects.filter(a => MEANINGFUL_MERCURY_MODIFIERS.includes(a.other)).slice(0, 2)) {
      strengths.push({
        text: mercuryPairStrength(a.other),
        confidence: a.orb <= 3 ? 'high' : 'moderate',
        sourceFactors: [{ label: `Mercury ${a.kind} ${cap(a.other)}`, system: 'western', weight: 0.5, polarity: 'supportive', sourcePlanet: 'mercury' }],
      });
    }
    if (mercury.dignity === 'domicile' || mercury.dignity === 'exaltation') {
      strengths.push({ text: 'A mind that operates cleanly in its own preferred mode -- direct access to how you naturally reason.', confidence: 'high', sourceFactors: [{ label: `Mercury ${mercury.dignity}`, system: 'western', weight: 0.6, polarity: 'supportive', sourcePlanet: 'mercury' }] });
    }
  }
  if (styles[0]) strengths.push({ text: styleFlavor(styles[0].id), confidence: styles[0].strength === 'emphasized' ? 'high' : 'moderate', sourceFactors: styles[0].evidence });
  if (strengths.length === 0) strengths.push({ text: 'Understanding develops steadily through direct experience rather than a single obvious cognitive signature.', confidence: 'low', sourceFactors: [] });

  const shadows: ShadowTrait[] = [];
  if (mercury) {
    const s = generatePlanetShadow('mercury', mercury, 'intellectual');
    if (s) shadows.push(s);
  }
  for (const m of modifiers) {
    if (m.hardAspects.length >= 1 && m.dignity !== 'domicile') {
      const s = generatePlanetShadow(m.planet, m, 'intellectual');
      if (s && !shadows.some(x => x.trait === s.trait)) shadows.push(s);
    }
    if (shadows.length >= 3) break;
  }

  const compensators = [];
  const c1 = findCompensator(chart, sect, 'mercury', ['jupiter', 'saturn', 'uranus', 'moon'], 'clear thinking');
  if (c1) compensators.push(c1);

  const optimalConditions = [
    'Time to process before being asked to conclude',
    'Contact with real complexity rather than oversimplified problems',
    ease === 'natural' ? 'Few special conditions needed -- this tends to work reliably' : 'Enough quiet or structure to let a thought finish before the next one arrives',
  ];

  const factors = factorsFromConditions(mercury ? [mercury, ...modifiers] : modifiers);
  const confidence = confidenceFromFactorCount(factors.length, vedicLens.available || hdLens.available);

  const label = profileStyleLabel(styles, meta.fallbackStyle);
  const synthesis = buildSynthesis(label, mercury, ease, capacityLevel);

  return {
    domain: 'intellectual', shortCode: meta.shortCode, domainLabel: meta.label, definition: meta.definition,
    capacity: { level: capacityLevel, confidence, evidence: factors },
    profileStyleLabel: label, styles,
    strengths: strengths.slice(0, 5),
    styleDescription: styleDescriptionText(styles, mercury),
    expression: { ease, description: expressionDescription(ease, mercury) },
    shadows: shadows.slice(0, 4), compensators,
    optimalConditions,
    synthesis,
    basis: buildBasis(chart, sect, ['mercury', 'uranus', 'saturn', 'jupiter', 'pluto', 'moon'], vedicLens, Boolean(vibrationalSummary), hdLens),
  };
}

function mercuryPairStrength(other: string): string {
  const table: Record<string, string> = {
    uranus: 'Originality and rapid association -- your mind can jump between ideas in ways that feel obvious to you but surprising to others.',
    saturn: 'Structured reasoning -- precision, deliberation, and the patience to concentrate on one problem until it actually resolves.',
    pluto: 'Investigative depth -- a mechanistic, root-cause style of thinking that keeps going past where most people stop.',
    neptune: 'Imagination and pattern-sensing -- picking up on undercurrents and possibilities before they are explicit.',
    jupiter: 'Conceptual breadth -- synthesis across domains and comfort holding the big picture.',
    mars: 'Fast, decisive processing -- thinking that converts quickly into speech or action.',
  };
  return table[other] ?? `A distinct thinking style shaped by Mercury's connection to ${cap(other)}.`;
}

function styleFlavor(styleId: string): string {
  const table: Record<string, string> = {
    investigativeAnalyst: 'Comfort staying with a hard question long after most people would move on.',
    systemsThinker: 'Seeing how parts connect into a whole, and translating structural insight into workable ideas.',
    deliberativeReasoner: 'Precision and methodical follow-through -- conclusions that are carefully built rather than guessed at.',
    conceptualSynthesizer: 'Weaving broad understanding across different fields into one coherent picture.',
    intuitivePatternReader: 'Sensing a pattern before it can be fully articulated, then finding the language for it.',
    rapidAssociativeThinker: 'Quick, efficient thinking that performs well under real-time pressure.',
  };
  return table[styleId] ?? 'A distinct, recognizable way of processing information.';
}

function styleDescriptionText(styles: { label: string }[], mercury: ReturnType<typeof planetCondition>): string {
  if (styles.length === 0) return 'Intellectual processing here is even and undifferentiated rather than organized around one dominant style.';
  const names = styles.slice(0, 2).map(s => s.label).join(' and ');
  const houseNote = mercury ? ` most active in matters connected to house ${mercury.house}` : '';
  return `This intelligence operates primarily as ${names}${houseNote}, showing up as a consistent lens through which new information gets processed.`;
}

function expressionDescription(ease: string, mercury: ReturnType<typeof planetCondition>): string {
  if (!mercury) return 'Expression here depends more on context than on one obvious chart signature.';
  if (ease === 'natural') return 'Ideas tend to move from perception to articulation without much friction.';
  if (ease === 'conditional') return 'Clear thinking is available reliably, but works best under the right conditions rather than automatically.';
  if (ease === 'variable') return 'This mind can be sharp in one context and foggy in another -- consistency depends more on circumstance than capacity.';
  return 'Real intellectual capacity is present, but it often has to work through real resistance -- pressure, self-doubt, or a harder external environment -- to reach clean expression.';
}

function buildSynthesis(label: string, mercury: ReturnType<typeof planetCondition>, ease: string, capacity: string): string {
  const base = `Your Intellectual Intelligence shows up primarily as a ${label}.`;
  const capNote = capacity === 'emphasized' ? ' This is one of the more chart-emphasized ways you process the world.' : capacity === 'less_emphasized' ? ' This domain is quieter in the chart than the others -- not absent, just less structurally emphasized.' : '';
  const easeNote = mercury ? ` Expression tends to be ${ease.replace('_', ' ')}.` : '';
  return `${base}${capNote}${easeNote}`;
}
