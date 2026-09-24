/**
 * lib/ipse/practical.ts
 *
 * Practical Intelligence (P): applied judgment, initiative, execution,
 * persistence, adaptability -- explicitly includes execution (spec: PQ
 * MUST include it; there is no separate fifth "execution" quotient).
 * Primary: Mars, Saturn, Mercury. Secondary: Sun, Jupiter, Uranus.
 */

import type { ChartInput, ExecutionProfile, ExecutionStyle, IPSEDomainProfile, InterpretationTrait, PracticalFacets, SectContext, ShadowTrait } from './types';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import { planetCondition } from './evidence';
import { findCompensator, isStrong, isWeak } from './compensation';
import { generatePlanetShadow } from './shadows';
import { computeVedicLens } from './vedic';
import { computeHumanDesignLens } from './human-design';
import {
  averageAccessibility, blendedCapacityScore, buildBasis, capacityFromScore, computeDomainStyles,
  confidenceFromFactorCount, DOMAIN_META, expressionFromAccessibility, factorsFromConditions, profileStyleLabel, styleTraitsFromScores,
} from './domain-common';

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function buildExecutionProfile(chart: ChartInput, sect: SectContext): ExecutionProfile {
  const mars = planetCondition(chart, sect, 'mars');
  const saturn = planetCondition(chart, sect, 'saturn');
  const mercury = planetCondition(chart, sect, 'mercury');
  const uranus = planetCondition(chart, sect, 'uranus');
  const jupiter = planetCondition(chart, sect, 'jupiter');

  const level = (c: ReturnType<typeof planetCondition>) => !c ? 'mixed' as const : c.accessibility >= 0.6 ? 'emphasized' as const : c.accessibility >= 0.45 ? 'moderate' as const : c.accessibility >= 0.32 ? 'mixed' as const : 'less_emphasized' as const;
  const ev = (c: ReturnType<typeof planetCondition>) => c ? factorsFor(c) : [];
  function factorsFor(c: NonNullable<ReturnType<typeof planetCondition>>) {
    return [{ label: `${cap(c.planet)} ${c.dignity}, ${c.sectStatus.replace(/_/g, ' ')}`, system: 'western' as const, weight: 0.5, polarity: (c.accessibility >= 0.5 ? 'supportive' : 'challenging') as 'supportive' | 'challenging', sourcePlanet: c.planet }];
  }

  const facets: PracticalFacets = {
    appliedJudgment: { level: level(jupiter), evidence: ev(jupiter) },
    initiation: { level: level(mars), evidence: ev(mars) },
    persistence: { level: level(saturn), evidence: ev(saturn) },
    organization: { level: level(mercury), evidence: ev(mercury) },
    completion: { level: level(saturn), evidence: ev(saturn) },
    adaptability: { level: level(uranus), evidence: ev(uranus) },
    resourcefulness: { level: level(jupiter), evidence: ev(jupiter) },
    pressurePerformance: { level: level(mars), evidence: ev(mars) },
  };

  const marsStrong = mars ? isStrong(mars) : false;
  const marsWeak = mars ? isWeak(mars) : false;
  const saturnStrong = saturn ? isStrong(saturn) : false;
  const saturnWeak = saturn ? isWeak(saturn) : false;
  const uranusStrong = uranus ? isStrong(uranus) : false;

  let overallStyle: ExecutionStyle;
  let narrative: string;

  if (marsStrong && saturnStrong) {
    overallStyle = 'balanced';
    narrative = 'This chart initiates and sustains: real capacity to start something and real capacity to see it through.';
  } else if (marsStrong && saturnWeak) {
    overallStyle = 'strong_initiator';
    narrative = 'A powerful starter -- initiation and momentum come easily, though maintenance and completion may fluctuate without an external structure to lean on.';
  } else if (marsWeak && saturnStrong) {
    overallStyle = 'strong_sustainer';
    narrative = 'Activation is slow, but once genuinely committed, persistence is excellent -- this is a chart that finishes what it starts, even if starting takes longer than expected.';
  } else if (uranusStrong && !saturnStrong) {
    overallStyle = marsStrong ? 'crisis_executor' : 'adaptive_executor';
    narrative = marsStrong
      ? 'This chart tends to perform best under real pressure or in a genuine crisis -- fast, resourceful, and energized by the stakes.'
      : 'Execution here is adaptive rather than routine-driven -- unexpected problems may be solved extremely well, while repetitive implementation feels less naturally engaging.';
  } else if (marsWeak && saturnWeak) {
    overallStyle = 'externally_structured';
    narrative = 'Execution may depend more on external structure, strong personal interest, urgency, or accountability than on internal drive alone -- that is a real and workable pattern, not a deficiency.';
  } else {
    overallStyle = 'selective_executor';
    narrative = 'Execution is selective -- highly effective when genuinely engaged, less automatic when the task does not connect to real interest or stakes.';
  }

  // This override only applies when NEITHER Mars nor Saturn is individually
  // strong -- a strong_sustainer or strong_initiator pattern is already a
  // legitimate, named outcome of one weak planet paired with a strong one
  // (per spec: "weak Mars + strong Saturn -> slow activation, excellent
  // persistence" is not the same thing as friction_heavy). Only reclassify
  // when both are weak/frictional AND Mars specifically carries real
  // affliction, i.e. the externally_structured/selective_executor cases.
  if (!marsStrong && !saturnStrong && mars && (mars.hardAspects.length >= 2 || mars.sectStatus === 'contrary_to_sect') && mars.accessibility < 0.4) {
    overallStyle = 'friction_heavy';
  }

  return { facets, overallStyle, narrative };
}

export function analyzePractical(chart: ChartInput, sect: SectContext, hdChart: HdChart | null | undefined): IPSEDomainProfile {
  const meta = DOMAIN_META.practical;
  const { scores, summary: vibrationalSummary } = computeDomainStyles(chart, 'practical');
  const styles = styleTraitsFromScores(scores);
  const capacityScore = blendedCapacityScore(scores);
  const capacityLevel = capacityFromScore(capacityScore);

  const mars = planetCondition(chart, sect, 'mars');
  const saturn = planetCondition(chart, sect, 'saturn');
  const others = (['mercury', 'sun', 'jupiter', 'uranus'] as const).map(p => planetCondition(chart, sect, p)).filter((c): c is NonNullable<typeof c> => c !== null);

  const avgAccess = averageAccessibility(chart, sect, ['mars', 'saturn']);
  const ease = expressionFromAccessibility(avgAccess);

  const vedicLens = computeVedicLens(chart, 'practical');
  const hdLens = computeHumanDesignLens(hdChart, 'practical');
  const executionProfile = buildExecutionProfile(chart, sect);

  const strengths: InterpretationTrait[] = [];
  strengths.push({ text: executionProfile.narrative, confidence: 'moderate', sourceFactors: [] });
  if (mars?.dignity === 'domicile' || mars?.dignity === 'exaltation') {
    strengths.push({ text: 'Direct, decisive action -- Mars has clean access to its own preferred mode of operating.', confidence: 'high', sourceFactors: [{ label: `Mars ${mars.dignity}`, system: 'western', weight: 0.6, polarity: 'supportive', sourcePlanet: 'mars' }] });
  }
  if (styles[0]) strengths.push({ text: practicalStyleFlavor(styles[0].id), confidence: styles[0].strength === 'emphasized' ? 'high' : 'moderate', sourceFactors: styles[0].evidence });

  const shadows: ShadowTrait[] = [];
  if (mars) { const s = generatePlanetShadow('mars', mars, 'practical'); if (s) shadows.push(s); }
  if (saturn) { const s = generatePlanetShadow('saturn', saturn, 'practical'); if (s) shadows.push(s); }
  if (executionProfile.overallStyle === 'strong_initiator') shadows.push({ trait: 'Strong initiation with inconsistent follow-through once the initial momentum fades.', domain: 'practical', sourceFactors: [], confidence: 'moderate', counterEvidence: [] });

  const compensators = [];
  const c1 = findCompensator(chart, sect, 'mars', ['saturn', 'sun'], 'initiation and momentum');
  if (c1) compensators.push(c1);
  const c2 = findCompensator(chart, sect, 'saturn', ['mars', 'jupiter'], 'follow-through');
  if (c2) compensators.push(c2);

  const optimalConditions = [
    executionProfile.overallStyle === 'externally_structured' ? 'External structure, accountability, or a real deadline' : 'A clear enough goal to direct real energy toward',
    executionProfile.overallStyle === 'crisis_executor' || executionProfile.overallStyle === 'adaptive_executor' ? 'Real stakes or genuine novelty rather than routine repetition' : 'Enough routine to let persistence actually compound',
    'Permission to work in the way that is natural here, rather than a borrowed productivity system',
  ];

  const factors = factorsFromConditions(mars && saturn ? [mars, saturn, ...others] : others);
  const confidence = confidenceFromFactorCount(factors.length, vedicLens.available || hdLens.available);

  const label = profileStyleLabel(styles, meta.fallbackStyle);

  return {
    domain: 'practical', shortCode: meta.shortCode, domainLabel: meta.label, definition: meta.definition,
    capacity: { level: capacityLevel, confidence, evidence: factors },
    profileStyleLabel: label, styles,
    strengths: strengths.slice(0, 5),
    styleDescription: `Execution here runs ${executionProfile.overallStyle.replace(/_/g, ' ')}: ${executionProfile.narrative}`,
    expression: { ease, description: expressionDescription(ease) },
    shadows: shadows.slice(0, 4), compensators,
    optimalConditions,
    synthesis: `Your Practical Intelligence shows up primarily as a ${label}. ${executionProfile.narrative}`,
    basis: buildBasis(chart, sect, ['mars', 'saturn', 'mercury', 'sun', 'jupiter', 'uranus'], vedicLens, Boolean(vibrationalSummary), hdLens),
    executionProfile,
  };
}

function practicalStyleFlavor(styleId: string): string {
  const table: Record<string, string> = {
    strategicExecutor: 'Holding a long-range structure and executing it with real discipline over time.',
    systemsBuilder: 'Turning a plan into a working, repeatable process rather than a one-off effort.',
    crisisPerformer: 'Composure and resourcefulness when the stakes are genuinely high.',
    structuredSustainer: 'Careful, steady stewardship of time, money, or materials.',
    pressureDrivenBuilder: 'Real endurance -- capability forged through carrying genuine responsibility.',
    adaptiveImproviser: 'Spotting and acting on real opportunity before it is obvious to everyone else.',
  };
  return table[styleId] ?? 'A distinct, recognizable way of getting things done.';
}

function expressionDescription(ease: string): string {
  if (ease === 'natural') return 'Turning intention into action tends to work reliably, without much special setup.';
  if (ease === 'conditional') return 'Execution is genuinely capable, but works best under specific conditions -- the right structure, timing, or level of interest.';
  if (ease === 'variable') return 'Output can look completely different from one period to the next -- this is closer to real variability than inconsistency.';
  return 'Real capacity is present, but it often has to move through resistance -- overwork, self-doubt, or external obstacles -- to become visible results.';
}
