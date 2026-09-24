/**
 * lib/ipse/emotional.ts
 *
 * Emotional Intelligence (E): perceiving, processing, regulating, and
 * communicating emotion. Primary: Moon, Venus. Modifiers: Mercury, Saturn,
 * Mars, Neptune, Pluto.
 *
 * Critical distinction (spec): emotional SENSITIVITY is not automatically
 * emotional REGULATION. Moon-Neptune can produce extreme sensitivity with
 * poor boundaries; Moon-Saturn can produce excellent containment with
 * possible suppression. Both are tracked as separate axes.
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

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function moonPairFlavor(other: string): { sensitivity: string; regulationRisk: string } | null {
  const table: Record<string, { sensitivity: string; regulationRisk: string }> = {
    neptune: { sensitivity: 'Extreme sensitivity and permeability to atmosphere and others\' feelings.', regulationRisk: 'Boundaries can blur -- it may be hard to tell which feelings are yours.' },
    saturn: { sensitivity: 'Deep feeling held under real containment.', regulationRisk: 'Containment can tip into suppression rather than genuine processing.' },
    mercury: { sensitivity: 'Feelings that get articulated clearly, almost as they happen.', regulationRisk: 'Articulation can substitute for actually feeling something, rather than expressing it.' },
    pluto: { sensitivity: 'Emotional depth and real psychological insight into yourself and others.', regulationRisk: 'Intensity can turn into obsession or difficulty letting a feeling (or a person) go.' },
    venus: { sensitivity: 'Warm, relationally attuned feeling.', regulationRisk: 'Harmony can be prioritized over honesty about what is actually felt.' },
    mars: { sensitivity: 'Feeling that moves quickly into action or expression.', regulationRisk: 'Reactivity -- feeling and acting can happen almost simultaneously, before reflection.' },
  };
  return table[other] ?? null;
}

export function analyzeEmotional(chart: ChartInput, sect: SectContext, hdChart: HdChart | null | undefined): IPSEDomainProfile {
  const meta = DOMAIN_META.emotional;
  const { scores, summary: vibrationalSummary } = computeDomainStyles(chart, 'emotional');
  const styles = styleTraitsFromScores(scores);
  const capacityScore = blendedCapacityScore(scores);
  const capacityLevel = capacityFromScore(capacityScore);

  const moon = planetCondition(chart, sect, 'moon');
  const venus = planetCondition(chart, sect, 'venus');
  const modifiers: PlanetCondition[] = (['mercury', 'saturn', 'mars', 'neptune', 'pluto'] as const)
    .map(p => planetCondition(chart, sect, p)).filter((c): c is PlanetCondition => c !== null);

  // Sensitivity axis: how much Moon picks up. Regulation axis: whether
  // Saturn (containment) or hard-aspect pressure on Moon suggests that
  // sensitivity is actively metabolized versus just absorbed.
  const sensitivityLevel = moon ? (moon.easyAspects.length + moon.hardAspects.length >= 2 ? 'emphasized' : moon.easyAspects.length + moon.hardAspects.length === 1 ? 'moderate' : 'less_emphasized') : 'mixed';
  const saturnCondition = conditionOf(modifiers, 'saturn');
  const regulationStrong = saturnCondition ? saturnCondition.accessibility >= 0.55 : false;

  const avgAccess = averageAccessibility(chart, sect, ['moon', 'venus']);
  const ease = expressionFromAccessibility(avgAccess);

  const vedicLens = computeVedicLens(chart, 'emotional');
  const hdLens = computeHumanDesignLens(hdChart, 'emotional');

  const strengths: InterpretationTrait[] = [];
  if (moon) {
    const MEANINGFUL_MOON_MODIFIERS = ['neptune', 'saturn', 'mercury', 'pluto', 'venus', 'mars'];
    const mostSignificant = [...moon.hardAspects, ...moon.easyAspects]
      .filter(a => MEANINGFUL_MOON_MODIFIERS.includes(a.other))
      .sort((a, b) => a.orb - b.orb)[0];
    if (mostSignificant) {
      const flavor = moonPairFlavor(mostSignificant.other);
      if (flavor) strengths.push({ text: flavor.sensitivity, confidence: mostSignificant.orb <= 3 ? 'high' : 'moderate', sourceFactors: [{ label: `Moon ${mostSignificant.kind} ${cap(mostSignificant.other)}`, system: 'western', weight: 0.5, polarity: 'mixed', sourcePlanet: 'moon' }] });
    }
  }
  if (styles[0]) strengths.push({ text: emotionalStyleFlavor(styles[0].id), confidence: styles[0].strength === 'emphasized' ? 'high' : 'moderate', sourceFactors: styles[0].evidence });
  if (regulationStrong) strengths.push({ text: 'A real capacity for containment -- feeling deeply without being immediately overtaken by it.', confidence: 'moderate', sourceFactors: saturnCondition ? [{ label: `Saturn ${saturnCondition.dignity}`, system: 'western', weight: 0.4, polarity: 'supportive', sourcePlanet: 'saturn' }] : [] });
  if (strengths.length === 0) strengths.push({ text: 'Emotional processing here is even rather than organized around one dominant signature.', confidence: 'low', sourceFactors: [] });

  const shadows: ShadowTrait[] = [];
  if (moon) {
    // Sensitivity WITHOUT regulation is the specific shadow the spec calls
    // out explicitly -- surfaced here as its own named pattern rather than
    // folded generically into "Moon shadow."
    if (sensitivityLevel === 'emphasized' && !regulationStrong) {
      shadows.push({
        trait: 'High sensitivity without a strong containment structure -- feelings (your own and others\') may arrive faster than they can be sorted through.',
        domain: 'emotional', confidence: 'moderate',
        sourceFactors: [{ label: 'Moon carries multiple significant aspects', system: 'western', weight: 0.5, polarity: 'challenging', sourcePlanet: 'moon' }],
        counterEvidence: [],
      });
    }
    const s = generatePlanetShadow('moon', moon, 'emotional');
    if (s) shadows.push(s);
  }
  if (regulationStrong && saturnCondition && saturnCondition.hardAspects.length >= 1) {
    shadows.push({ trait: 'Containment that can tip into suppression rather than genuine processing.', domain: 'emotional', confidence: 'moderate', sourceFactors: [], counterEvidence: [] });
  }

  const compensators = [];
  if (moon) {
    const c = findCompensator(chart, sect, 'moon', ['venus', 'saturn', 'jupiter', 'mercury'], 'emotional steadiness');
    if (c) compensators.push(c);
  }

  const optimalConditions = [
    'Relationships or environments where feeling something out loud is actually welcomed',
    !regulationStrong ? 'A regular way to process feeling (journaling, movement, conversation) before it accumulates' : 'Enough safety to let containment relax sometimes, rather than defaulting to it constantly',
    'Enough time between feeling something and having to respond to it',
  ];

  const factors = factorsFromConditions(moon && venus ? [moon, venus, ...modifiers] : modifiers);
  const confidence = confidenceFromFactorCount(factors.length, vedicLens.available || hdLens.available);
  const label = profileStyleLabel(styles, meta.fallbackStyle);

  return {
    domain: 'emotional', shortCode: meta.shortCode, domainLabel: meta.label, definition: meta.definition,
    capacity: { level: capacityLevel, confidence, evidence: factors },
    profileStyleLabel: label, styles,
    strengths: strengths.slice(0, 5),
    styleDescription: `Sensitivity here runs ${sensitivityLevel.replace('_', ' ')}, and containment runs ${regulationStrong ? 'strong' : 'lighter'} -- these are two separate axes, not one score.`,
    expression: { ease, description: expressionDescription(ease) },
    shadows: shadows.slice(0, 4), compensators,
    optimalConditions,
    synthesis: `Your Emotional Intelligence shows up primarily as a ${label}. Sensitivity and regulation are tracked separately here: high sensitivity does not automatically mean strong regulation, and vice versa.`,
    basis: buildBasis(chart, sect, ['moon', 'venus', 'mercury', 'saturn', 'mars', 'neptune', 'pluto'], vedicLens, Boolean(vibrationalSummary), hdLens),
  };
}

function conditionOf(list: PlanetCondition[], planet: string): PlanetCondition | undefined {
  return list.find(c => c.planet === planet);
}

function emotionalStyleFlavor(styleId: string): string {
  const table: Record<string, string> = {
    relationalEmpath: 'Deep attunement to others\' emotional states and unspoken atmosphere.',
    somaticAffectiveProcessor: 'Capacity for intense, transformative emotional bonds and comfort with real intensity.',
    cognitiveEmotionalProcessor: 'Ability to name and articulate feelings clearly, bridging emotional and verbal understanding.',
    diplomaticRegulator: 'Natural diplomacy and skill at reading and easing relational tension.',
    protectiveRegulator: 'Steady, dependable presence and real discretion under pressure.',
    boundaryOrientedRegulator: 'Deep compassion paired with an active, ongoing process of learning where boundaries belong.',
    internalIntegrator: 'Channeling emotional intensity into disciplined follow-through rather than needing to externalize it immediately.',
  };
  return table[styleId] ?? 'A distinct, recognizable emotional processing style.';
}

function expressionDescription(ease: string): string {
  if (ease === 'natural') return 'Emotional processing tends to move cleanly from feeling to understanding to expression.';
  if (ease === 'conditional') return 'This works well in the right relationship or setting, but is not automatic everywhere.';
  if (ease === 'variable') return 'This can look completely different depending on who is around and how safe the environment feels.';
  return 'Real emotional depth is present, but reaching clear expression may require moving through real defense, fear, or old pattern first.';
}
