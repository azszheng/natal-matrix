/**
 * lib/ipse/vibrational.ts
 *
 * Vibrational Astrology as a STYLE-detection refinement (spec section 15):
 * a hidden harmonic resonance on a style's anchor planet pair adds a small,
 * capped nudge and a piece of evidence tagged "refining" -- never a large
 * additive intelligence score.
 */

import type { NatalChart, BodyId } from '@/lib/astro/types';
import type { AstroFactor } from './types';
import type { ScoredStyle } from './western';

function angularSep(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

const IPSE_HARMONICS = [5, 7, 8, 9, 10, 11, 12, 13, 16, 24];

function distanceToNearestHarmonic(separation: number, harmonic: number): number {
  const angle = 360 / harmonic;
  let min = Infinity;
  for (let k = 0; k <= harmonic; k++) min = Math.min(min, angularSep(separation, k * angle));
  return min;
}
function harmonicOrbMax(harmonic: number): number {
  return Math.max(0.5, Math.min(2.5, 6 / Math.sqrt(harmonic)));
}
function harmonicStrength(lonA: number, lonB: number, harmonic: number): number {
  const separation = angularSep(lonA, lonB);
  const distance = distanceToNearestHarmonic(separation, harmonic);
  const orb = harmonicOrbMax(harmonic);
  if (distance > orb) return 0;
  return Math.pow(1 - distance / orb, 2);
}

function bestHarmonicHit(chart: NatalChart, a: BodyId, b: BodyId): { harmonic: number; strength: number } | null {
  const pa = chart.western.bodies[a];
  const pb = chart.western.bodies[b];
  if (!pa || !pb) return null;
  let best: { harmonic: number; strength: number } | null = null;
  for (const h of IPSE_HARMONICS) {
    const strength = harmonicStrength(pa.longitude, pb.longitude, h);
    if (strength >= 0.45 && (!best || strength > best.strength)) best = { harmonic: h, strength };
  }
  return best;
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

export type VibrationalRefinement = { scores: ScoredStyle[]; summary: string; available: boolean };

export function refineStylesWithVibrational(
  chart: NatalChart, catalog: { id: string; vibrationalPair?: [BodyId, BodyId] }[], scores: ScoredStyle[],
): VibrationalRefinement {
  if (typeof chart.western.bodies.sun?.longitude !== 'number') return { scores, summary: '', available: false };

  const refined: ScoredStyle[] = [];
  const hits: string[] = [];
  for (const score of scores) {
    const def = catalog.find(s => s.id === score.id);
    if (!def?.vibrationalPair) { refined.push(score); continue; }
    const hit = bestHarmonicHit(chart, def.vibrationalPair[0], def.vibrationalPair[1]);
    if (!hit) { refined.push(score); continue; }
    const bonus = (hit.strength * 15) / 70 * 130 / 2; // same scaling the prior implementation used, kept small and capped
    const factor: AstroFactor = {
      label: `${cap(def.vibrationalPair[0])}-${cap(def.vibrationalPair[1])} ${hit.harmonic}th harmonic resonance`,
      system: 'vibrational', weight: hit.strength, polarity: 'mixed', sourcePlanet: def.vibrationalPair[0],
    };
    hits.push(score.label);
    refined.push({ ...score, score: Math.min(100, Math.round(score.score + bonus)), evidence: [...score.evidence, factor] });
  }

  return {
    scores: refined,
    available: true,
    summary: hits.length ? `Harmonic analysis adds a resonance signature refining ${hits.slice(0, 2).join(' and ')}.` : 'No strong harmonic resonance detected for this domain -- the Western signal stands on its own.',
  };
}
