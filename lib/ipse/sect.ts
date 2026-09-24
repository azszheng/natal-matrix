/**
 * lib/ipse/sect.ts
 *
 * Sect (day chart / night chart) as an EXPRESSION modifier, never a raw
 * score adjustment. A day chart favors the Sun, Jupiter, Saturn; a night
 * chart favors the Moon, Venus, Mars. Being "contrary to sect" does not
 * mean a planet is bad -- Saturn contrary to sect can still produce
 * enormous persistence and achievement, just with a higher chance of
 * overwork, inhibition, or fear-driven effort riding along with it.
 */

import type { BodyId } from '@/lib/astro/types';
import type { ChartInput, Sect, SectContext, SectStatus } from './types';

export function calculateSectContext(chart: ChartInput): SectContext {
  const sunHouse = chart.western.bodies.sun?.house ?? 1;
  // Houses 7-12 sit above the horizon (between ASC and DESC, the diurnal
  // hemisphere); 1-6 sit below it.
  const sect: Sect = sunHouse >= 7 && sunHouse <= 12 ? 'day' : 'night';

  return sect === 'day'
    ? {
      sect, luminaryOfSect: 'sun', luminaryContrary: 'moon',
      beneficOfSect: 'jupiter', maleficOfSect: 'saturn',
      beneficContrary: 'venus', maleficContrary: 'mars',
    }
    : {
      sect, luminaryOfSect: 'moon', luminaryContrary: 'sun',
      beneficOfSect: 'venus', maleficOfSect: 'mars',
      beneficContrary: 'jupiter', maleficContrary: 'saturn',
    };
}

// Sect status for a given planet. Only the six traditional sect-relevant
// bodies (Sun, Moon, Jupiter, Venus, Saturn, Mars) carry a sect valence;
// everything else (Mercury, the outers, nodes, Chiron) is sect-neutral --
// deliberately not fabricating a sect rule the tradition doesn't assign.
export function planetSectStatus(sect: SectContext, planet: BodyId): SectStatus {
  if (planet === sect.luminaryOfSect) return 'in_sect';
  if (planet === sect.luminaryContrary) return 'contrary_to_sect';
  if (planet === sect.beneficOfSect || planet === sect.maleficOfSect) return 'in_sect';
  if (planet === sect.beneficContrary || planet === sect.maleficContrary) return 'contrary_to_sect';
  return 'neutral';
}

// Sect modifies ACCESSIBILITY and shadow probability, never raw capacity.
// A contrary-to-sect malefic's function is more likely to feel excessive,
// costly, or dysregulated; an in-sect planet's function is more likely to
// find a constructive outlet. Small, bounded adjustments only.
export function sectAccessibilityModifier(status: SectStatus): number {
  if (status === 'in_sect') return 0.08;
  if (status === 'contrary_to_sect') return -0.1;
  return 0;
}

export function sectShadowWeightModifier(status: SectStatus): number {
  if (status === 'contrary_to_sect') return 0.15;
  if (status === 'in_sect') return -0.05;
  return 0;
}
