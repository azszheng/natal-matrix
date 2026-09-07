/**
 * vibrational.ts
 *
 * Harmonic ("Vibrational") astrology — the technique popularized by David
 * Cochrane, built on John Addey's harmonic charts. The math is exact and
 * has one universally agreed definition:
 *
 *   harmonic longitude = (natal ecliptic longitude × H) mod 360
 *
 * Any exact aspect of order H in the natal chart (e.g. a trine, which is
 * 1/3 of the circle) becomes an exact CONJUNCTION in the Hth harmonic
 * chart — that collapsing-to-conjunction is the entire mechanism. This
 * module computes the six "base harmonics" Cochrane's Vibrational
 * Astrology treats as primary (5, 7, 8, 9, 11, 13) and finds which body
 * pairs land in a tight harmonic conjunction for each one.
 *
 * Orb convention: this implementation uses a flat 3° orb for harmonic
 * conjunctions across all six base harmonics. There is no single
 * universally published orb table for harmonic charts — practitioners
 * (and harmonic software like Cochrane's own Sirius) vary this by
 * preference — so this is a documented, conservative choice, not a claim
 * of one canonical standard. "Strength" scales linearly from 0 at the
 * orb boundary to 100 at an exact (0°) conjunction, reflecting the
 * standard harmonic-astrology principle that a tighter orb means a
 * stronger "current."
 */

import type { NatalChart, BodyId } from './types';

export type VibrationalConjunction = {
  bodyA: BodyId;
  bodyB: BodyId;
  harmonicLonA: number;
  harmonicLonB: number;
  orb: number;
  strength: number; // 0–100, 100 = exact conjunction in the harmonic chart
};

export type VibrationalHarmonic = {
  number: number;
  label: string;
  theme: string;
  conjunctions: VibrationalConjunction[]; // sorted tightest orb first
  strength: number;                       // strength of the single tightest conjunction (0 if none found)
};

// Bodies used for harmonic analysis. South Node is deliberately excluded —
// it's synthesized as True Node + 180°, so it would form a fixed, meaningless
// "always in aspect" pairing with True Node in every harmonic, the same
// tautology already fixed for natal aspects and synastry shared patterns.
export const VIBRATIONAL_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'chiron', 'asc', 'mc',
];

export const HARMONIC_CONJUNCTION_ORB = 3;

export const BASE_HARMONICS: Array<{ number: number; label: string; theme: string }> = [
  {
    number: 5,
    label: '5th Harmonic — Creativity & Play',
    theme: 'Playfulness, creative self-expression, and spontaneous talent — the quintile current.',
  },
  {
    number: 7,
    label: '7th Harmonic — Inspiration & Devotion',
    theme: 'Quiet discipline, introspection, and single-minded devotion to a craft, belief, or practice.',
  },
  {
    number: 8,
    label: '8th Harmonic — Drive & Intensity',
    theme: 'The underlying driving force behind action — intensity, willpower, and what compels a person forward.',
  },
  {
    number: 9,
    label: '9th Harmonic — Belonging & Integration',
    theme: 'How a person places and integrates themselves within their community, and a sense of completion.',
  },
  {
    number: 11,
    label: '11th Harmonic — Innovation & Unrest',
    theme: 'Restlessness, originality, and an appetite for the new — Uranian, inventive, and impatient with the status quo.',
  },
  {
    number: 13,
    label: '13th Harmonic — Transformation & Mastery',
    theme: 'Individual achievement and the drive toward mastery through sustained transformation.',
  },
];

function angularSep(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function harmonicLongitude(longitude: number, harmonic: number): number {
  return (((longitude * harmonic) % 360) + 360) % 360;
}

export function computeHarmonicConjunctions(
  chart: NatalChart,
  harmonic: number,
  orbDeg: number = HARMONIC_CONJUNCTION_ORB,
): VibrationalConjunction[] {
  const bodies = chart.western.bodies;
  const ids = VIBRATIONAL_BODIES.filter(id => bodies[id]);
  const harmLons = new Map(ids.map(id => [id, harmonicLongitude(bodies[id].longitude, harmonic)]));
  const results: VibrationalConjunction[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const bodyA = ids[i];
      const bodyB = ids[j];
      const harmonicLonA = harmLons.get(bodyA)!;
      const harmonicLonB = harmLons.get(bodyB)!;
      const orb = angularSep(harmonicLonA, harmonicLonB);
      if (orb <= orbDeg) {
        results.push({
          bodyA, bodyB, harmonicLonA, harmonicLonB, orb,
          strength: Math.round((1 - orb / orbDeg) * 100),
        });
      }
    }
  }

  return results.sort((a, b) => a.orb - b.orb);
}

export function computeVibrationalProfile(chart: NatalChart): VibrationalHarmonic[] {
  return BASE_HARMONICS.map(({ number, label, theme }) => {
    const conjunctions = computeHarmonicConjunctions(chart, number);
    const strength = conjunctions.length > 0 ? conjunctions[0].strength : 0;
    return { number, label, theme, conjunctions, strength };
  });
}
