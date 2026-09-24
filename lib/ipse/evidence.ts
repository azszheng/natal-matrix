/**
 * lib/ipse/evidence.ts
 *
 * Shared, domain-agnostic building blocks: continuous aspect-orb weighting,
 * house angularity, dispositor chains, and a single consolidated
 * "functional condition" read per planet (dignity + sect + angularity +
 * aspects + dispositor -> one accessibility figure). Every domain analyzer
 * calls planetCondition() rather than re-deriving dignity/sect/angularity
 * logic itself.
 *
 * Reuses existing calculations rather than duplicating them:
 * getDignityInfo() from lib/astro/dignities.ts for domicile/exaltation/
 * detriment/fall and the traditional sign ruler; chart.western.aspects /
 * body.house for everything else.
 */

import type { NatalChart, BodyId, SignId, AspectKind } from '@/lib/astro/types';
import { getDignityInfo } from '@/lib/astro/dignities';
import type { ChartInput, AstroFactor, PlanetCondition, SectContext, IPSESystem, Polarity } from './types';
import { planetSectStatus, sectAccessibilityModifier } from './sect';

export function makeFactor(
  label: string, system: IPSESystem, weight: number, polarity: Polarity,
  sourcePlanet?: BodyId, sourceHouse?: number,
): AstroFactor {
  return { label, system, weight, polarity, sourcePlanet, sourceHouse };
}

// Continuous orb-strength curve. Per spec: 0-1 deg very high, 1-3 high,
// 3-5 moderate, 5+ context-dependent -- implemented as a smooth falloff
// rather than hard steps so two aspects a fraction of a degree apart don't
// jump discontinuously in weight.
export function aspectStrength(orb: number, maxOrb = 6): number {
  return Math.max(0, 1 - Math.abs(orb) / maxOrb);
}

const HARD_ASPECTS: AspectKind[] = ['square', 'opposition'];
const EASY_ASPECTS: AspectKind[] = ['trine', 'sextile'];

export function houseAngularity(house: number): 'angular' | 'succedent' | 'cadent' {
  if ([1, 4, 7, 10].includes(house)) return 'angular';
  if ([2, 5, 8, 11].includes(house)) return 'succedent';
  return 'cadent';
}

export function signRuler(sign: SignId): BodyId {
  return getDignityInfo('sun', sign).traditionalRuler;
}

// Walks sign -> ruler -> ruler's own sign -> ... until it loops (the planet
// rules its own sign, a final dispositor) or maxDepth is hit. A debilitated
// planet whose dispositor is strong can function substantially better than
// its own dignity alone would suggest -- this is what makes that check
// possible.
export function walkDispositorChain(chart: ChartInput, planet: BodyId, maxDepth = 4): BodyId[] {
  const chain: BodyId[] = [];
  let current = planet;
  for (let i = 0; i < maxDepth; i++) {
    const body = chart.western.bodies[current];
    if (!body) break;
    const ruler = signRuler(body.sign);
    if (chain.includes(ruler) || ruler === current) { chain.push(ruler); break; }
    chain.push(ruler);
    current = ruler;
  }
  return chain;
}

function dignityRank(chart: ChartInput, body: BodyId): 'strong' | 'moderate' | 'weak' {
  const label = chart.western.dignities[body]?.label;
  if (label === 'domicile' || label === 'exaltation') return 'strong';
  if (label === 'detriment' || label === 'fall') return 'weak';
  return 'moderate';
}

// A single consolidated read of a planet's functional condition. This is
// the module every domain analyzer calls instead of re-deriving dignity/
// sect/angularity logic itself.
export function planetCondition(chart: ChartInput, sect: SectContext, planet: BodyId): PlanetCondition | null {
  const body = chart.western.bodies[planet];
  if (!body) return null;

  const dignityLabel = chart.western.dignities[planet]?.label ?? 'peregrine';
  const dignity = dignityLabel === null ? 'peregrine' : dignityLabel;
  const angularity = houseAngularity(body.house);
  const sectStatus = planetSectStatus(sect, planet);

  const chain = walkDispositorChain(chart, planet);
  const dispositor = chain[0] ?? signRuler(body.sign);
  // Dispositor's OWN condition (one hop) -- not the whole chain -- drives
  // the "compensated expression" read. null means the planet is already its
  // own dispositor (domicile), so there's no separate compensator to check.
  const dispositorCondition = dispositor === planet ? null : dignityRank(chart, dispositor);

  const hardAspects: PlanetCondition['hardAspects'] = [];
  const easyAspects: PlanetCondition['easyAspects'] = [];
  for (const asp of chart.western.aspects) {
    if (asp.a !== planet && asp.b !== planet) continue;
    const other = asp.a === planet ? asp.b : asp.a;
    if (HARD_ASPECTS.includes(asp.kind)) hardAspects.push({ other, kind: asp.kind, orb: asp.orb });
    else if (EASY_ASPECTS.includes(asp.kind)) easyAspects.push({ other, kind: asp.kind, orb: asp.orb });
  }

  // Accessibility: one continuous 0-1 figure combining dignity, sect,
  // angularity, and net aspect pressure. Internal only -- drives
  // capacity/expression tiers, never shown to the user as a number.
  let accessibility = 0.5;
  if (dignity === 'domicile' || dignity === 'exaltation') accessibility += 0.2;
  if (dignity === 'detriment' || dignity === 'fall') accessibility -= 0.12;
  if (angularity === 'angular') accessibility += 0.08;
  if (angularity === 'cadent') accessibility -= 0.04;
  accessibility += sectAccessibilityModifier(sectStatus);
  const easySum = easyAspects.reduce((s, a) => s + aspectStrength(a.orb), 0);
  const hardSum = hardAspects.reduce((s, a) => s + aspectStrength(a.orb), 0);
  accessibility += Math.min(easySum * 0.06, 0.15);
  accessibility -= Math.min(hardSum * 0.04, 0.12);
  // A weak dispositor compounds the planet's own debility; a strong one
  // provides a real, functional outlet even when the planet itself is
  // debilitated (the Mars-in-Libra-disposited-by-a-strong-Venus case).
  if (dispositorCondition === 'strong') accessibility += 0.1;
  if (dispositorCondition === 'weak') accessibility -= 0.06;
  accessibility = Math.max(0, Math.min(1, accessibility));

  return {
    planet, sign: body.sign, house: body.house, angularity,
    dignity: dignity as PlanetCondition['dignity'], sectStatus,
    dispositor, dispositorCondition, hardAspects, easyAspects, accessibility,
  };
}

export function findAspect(chart: NatalChart, a: BodyId, b: BodyId) {
  return chart.western.aspects.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
}
