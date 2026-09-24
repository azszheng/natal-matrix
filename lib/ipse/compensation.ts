/**
 * lib/ipse/compensation.ts
 *
 * Every detected weakness is checked for compensation before it's reported
 * flat (spec section 10). A debilitated planet whose dispositor is strong,
 * or a weak planet with a strong alternative pathway (a different planet
 * that serves the same functional role in this domain), can function
 * substantially better than isolated dignity would suggest.
 */

import type { BodyId } from '@/lib/astro/types';
import type { ChartInput, Compensator, PlanetCondition } from './types';
import { planetCondition } from './evidence';
import type { SectContext } from './types';

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// A planet counts as "weak" for compensation purposes based on its OWN raw
// debility signal (dignity, sect, hard-aspect pressure) -- NOT the blended
// accessibility figure, which already folds in dispositor support. Using
// accessibility here would mean a well-disposited debilitated planet could
// never register as needing compensation in the first place, since the
// compensation would already be silently baked into the number before this
// check ever ran.
export function isWeak(condition: PlanetCondition): boolean {
  const dignityWeak = condition.dignity === 'detriment' || condition.dignity === 'fall';
  const sectWeak = condition.sectStatus === 'contrary_to_sect';
  const aspectWeak = condition.hardAspects.length >= 1 && condition.easyAspects.length === 0;
  return dignityWeak || (sectWeak && aspectWeak);
}

export function isStrong(condition: PlanetCondition): boolean {
  return condition.accessibility >= 0.62;
}

// Checks a weak primary planet against its dispositor and a small set of
// alternative planets known to serve a related functional role, returning a
// human-readable compensation narrative when one is found.
export function findCompensator(
  chart: ChartInput, sect: SectContext, weakPlanet: BodyId, alternatives: BodyId[], roleLabel: string,
): Compensator | null {
  const weak = planetCondition(chart, sect, weakPlanet);
  if (!weak || !isWeak(weak)) return null;

  // Dispositor compensation: the sign ruler provides a real functional
  // outlet even when the planet itself is debilitated.
  if (weak.dispositorCondition === 'strong') {
    return {
      weakFactor: `${cap(weakPlanet)} (${weak.dignity})`,
      compensatingFactor: `${cap(weak.dispositor)} (dispositor)`,
      narrative: `${cap(weakPlanet)}'s own placement is effortful, but it is disposited by a strong ${cap(weak.dispositor)} -- ${roleLabel} tends to find an outlet through ${dispositorFlavor(weak.dispositor)} rather than direct force.`,
    };
  }

  for (const alt of alternatives) {
    const altCondition = planetCondition(chart, sect, alt);
    if (altCondition && isStrong(altCondition)) {
      return {
        weakFactor: `${cap(weakPlanet)} (${weak.dignity})`,
        compensatingFactor: `${cap(alt)} (${altCondition.dignity})`,
        narrative: `${cap(weakPlanet)} alone is effortful here, but a strong ${cap(alt)} provides real, functional support -- ${roleLabel} may be more reliable than ${cap(weakPlanet)}'s condition alone would suggest.`,
      };
    }
  }

  return null;
}

function dispositorFlavor(dispositor: BodyId): string {
  const flavors: Partial<Record<BodyId, string>> = {
    venus: 'negotiation, diplomacy, and relational strategy',
    mercury: 'careful reasoning and sequencing rather than raw force',
    jupiter: 'expansion, opportunity, and confidence-building',
    saturn: 'structure, patience, and long-term discipline',
    mars: 'direct, decisive action once engaged',
    moon: 'instinct, timing, and emotional attunement',
    sun: 'visible, self-directed initiative',
  };
  return flavors[dispositor] ?? `${dispositor}'s own mode of operation`;
}
