/**
 * synastryScoring.ts
 * Salience scoring, theme classification, and enriched synastry computation.
 */

import type { NatalChart, BodyId, AspectKind } from './types';
import {
  computeSynastryRaw,
  SYNASTRY_BODIES,
  type RawSynastryAspect,
  type SynastryAspect,
  type SalienceLevel,
  type SynastryTheme,
  type SynastryHouseOverlay,
  type SharedPattern,
  type SynastryResult,
} from './synastry';
import { computeSynastryOverlays } from './synastryOverlays';
import { detectSharedPatterns } from './synastryPatterns';
import { buildThemeSummaries } from './synastrySummary';

// ── Planet / aspect weight tables ─────────────────────────────────────────────

const ASPECT_WEIGHTS: Record<AspectKind, number> = {
  conjunction: 1.0,
  opposition:  0.95,
  square:      0.9,
  trine:       0.8,
  sextile:     0.6,
  quincunx:    0.45,
};

const PLANET_WEIGHTS: Partial<Record<BodyId, number>> = {
  sun:      1.0,
  moon:     1.0,
  asc:      1.0,
  venus:    0.95,
  mars:     0.95,
  mercury:  0.85,
  saturn:   0.85,
  trueNode: 0.85,
  mc:       0.8,
  jupiter:  0.75,
  chiron:   0.7,
  uranus:   0.6,
  neptune:  0.6,
  pluto:    0.65,
};

// Planet pairs with elevated priority (stored as sorted-key → multiplier)
const PAIR_BOOST: Record<string, number> = {
  'moon-sun':      1.25,
  'asc-sun':       1.2,
  'asc-moon':      1.2,
  'moon-venus':    1.2,
  'mars-venus':    1.2,
  'sun-venus':     1.15,
  'mars-moon':     1.15,
  'asc-venus':     1.15,
  'asc-mars':      1.15,
  'moon-saturn':   1.15,
  'saturn-venus':  1.15,
  'saturn-sun':    1.15,
  'trueNode-sun':  1.15,
  'trueNode-moon': 1.15,
  'trueNode-venus':1.1,
  'asc-trueNode':  1.1,
};

// Generational pairs — near-zero weight unless very tight
const GENERATIONAL_PAIRS = new Set([
  'uranus-uranus', 'uranus-neptune', 'uranus-pluto',
  'neptune-neptune', 'neptune-pluto', 'pluto-pluto',
]);

// ── Classification helpers ────────────────────────────────────────────────────

export function isPersonalPlanet(b: BodyId): boolean {
  return ['sun', 'moon', 'mercury', 'venus', 'mars'].includes(b);
}
export function isLuminary(b: BodyId): boolean {
  return b === 'sun' || b === 'moon';
}
export function isAngle(b: BodyId): boolean {
  return b === 'asc' || b === 'mc';
}
export function isNode(b: BodyId): boolean {
  return b === 'trueNode' || b === 'southNode';
}
export function isOuterPlanet(b: BodyId): boolean {
  return ['uranus', 'neptune', 'pluto'].includes(b);
}

function pairKey(a: BodyId, b: BodyId): string {
  return [a, b].sort().join('-');
}

export function isGenerationalPair(a: BodyId, b: BodyId): boolean {
  return GENERATIONAL_PAIRS.has(pairKey(a, b));
}

// ── Salience scoring ──────────────────────────────────────────────────────────

function orbTightnessWeight(orb: number, maxOrb: number): number {
  if (!maxOrb || maxOrb <= 0) return 1;
  const ratio = Math.min(Math.max(orb / maxOrb, 0), 1);
  return 1 - ratio * ratio;
}

export function scoreSynastryAspect(
  asp: RawSynastryAspect,
  maxOrb: number,
): number {
  if (isGenerationalPair(asp.bodyA, asp.bodyB)) {
    // Only surface if extremely tight (< 1°)
    if (asp.orb >= 1) return 5;
    return 20;
  }

  const aspectW  = ASPECT_WEIGHTS[asp.kind] ?? 0.3;
  const planetWA = PLANET_WEIGHTS[asp.bodyA] ?? 0.5;
  const planetWB = PLANET_WEIGHTS[asp.bodyB] ?? 0.5;
  const pairW    = PAIR_BOOST[pairKey(asp.bodyA, asp.bodyB)] ?? 1.0;
  const orbW     = orbTightnessWeight(asp.orb, maxOrb);

  const raw = aspectW * ((planetWA + planetWB) / 2) * pairW * orbW;

  // Normalize to 0–100 (raw max ≈ 1.25 * 1.0 * 1.25 * 1.0 ≈ 1.5625)
  return Math.min(Math.round(raw * 64), 100);
}

export function getSalienceLevel(score: number): SalienceLevel {
  if (score >= 80) return 'very_high';
  if (score >= 65) return 'high';
  if (score >= 45) return 'moderate';
  if (score >= 25) return 'low';
  return 'background';
}

// ── Theme classification ──────────────────────────────────────────────────────

const HARD_ASPECTS: AspectKind[] = ['conjunction', 'opposition', 'square'];
const SOFT_ASPECTS: AspectKind[] = ['trine', 'sextile'];

export function classifyAspectThemes(asp: RawSynastryAspect): SynastryTheme[] {
  const themes = new Set<SynastryTheme>();
  const { bodyA, bodyB, kind } = asp;
  const pair = pairKey(bodyA, bodyB);
  const isHard = HARD_ASPECTS.includes(kind);
  const isSoft = SOFT_ASPECTS.includes(kind);

  // Identity & visibility
  if (['sun', 'asc', 'mc'].includes(bodyA) || ['sun', 'asc', 'mc'].includes(bodyB)) {
    themes.add('identity_visibility');
  }

  // Emotional bond — Moon contacts
  if (bodyA === 'moon' || bodyB === 'moon') {
    themes.add('emotional_bond');
  }
  if (['moon-sun', 'moon-venus', 'moon-saturn', 'moon-pluto'].includes(pair)) {
    themes.add('emotional_bond');
  }

  // Attraction & chemistry
  if (['mars-venus', 'asc-venus', 'asc-mars', 'mars-pluto', 'venus-pluto',
       'mars-uranus', 'venus-uranus'].includes(pair)) {
    themes.add('attraction_chemistry');
  }

  // Communication
  if (bodyA === 'mercury' || bodyB === 'mercury') {
    themes.add('communication');
  }

  // Commitment & stability — Saturn contacts
  if (bodyA === 'saturn' || bodyB === 'saturn') {
    themes.add('commitment_stability');
    if (isHard) themes.add('conflict_activation');
  }

  // Growth & shadow — Pluto/hard Saturn/Chiron
  if (bodyA === 'pluto' || bodyB === 'pluto') {
    themes.add('growth_shadow');
    if (isPersonalPlanet(bodyA) || isPersonalPlanet(bodyB)) {
      themes.add('attraction_chemistry');
    }
  }
  if (bodyA === 'chiron' || bodyB === 'chiron') {
    themes.add('growth_shadow');
  }
  if (bodyA === 'saturn' && isHard) themes.add('growth_shadow');
  if (bodyB === 'saturn' && isHard) themes.add('growth_shadow');

  // Ease & support — Jupiter + soft aspects
  if (bodyA === 'jupiter' || bodyB === 'jupiter') {
    themes.add('ease_support');
  }
  if (isSoft && (isLuminary(bodyA) || isLuminary(bodyB) ||
    bodyA === 'venus' || bodyB === 'venus' || bodyA === 'jupiter' || bodyB === 'jupiter')) {
    themes.add('ease_support');
  }

  // Karmic development — Nodes, Saturn, Pluto
  if (isNode(bodyA) || isNode(bodyB)) {
    themes.add('karmic_development');
  }

  // Creative play — Sun-Venus, Venus-Jupiter, Moon-Jupiter, Venus-Neptune
  if (['sun-venus', 'venus-jupiter', 'moon-jupiter', 'venus-neptune', 'sun-jupiter'].includes(pair)) {
    themes.add('creative_play');
  }

  // Conflict activation — hard Mars, hard Pluto, hard Saturn, Mercury-Mars
  if (isHard && (bodyA === 'mars' || bodyB === 'mars')) {
    themes.add('conflict_activation');
  }
  if (isHard && (bodyA === 'pluto' || bodyB === 'pluto')) {
    themes.add('conflict_activation');
  }
  if (isHard && (bodyA === 'uranus' || bodyB === 'uranus')) {
    themes.add('conflict_activation');
  }
  if (isHard && pair === 'mars-mercury') {
    themes.add('conflict_activation');
  }

  // Family roots — Moon/Saturn/IC-family contacts
  if (['moon-saturn', 'moon-pluto'].includes(pair) ||
      (bodyA === 'saturn' && (bodyB === 'moon' || bodyB === 'sun')) ||
      (bodyB === 'saturn' && (bodyA === 'moon' || bodyA === 'sun'))) {
    themes.add('family_roots');
  }
  if (isNode(bodyA) || isNode(bodyB)) {
    themes.add('family_roots');
  }

  // Spiritual & unconscious — Neptune
  if (bodyA === 'neptune' || bodyB === 'neptune') {
    themes.add('spiritual_unconscious');
  }
  if (['moon-neptune', 'venus-neptune', 'sun-neptune', 'trueNode-neptune'].includes(pair)) {
    themes.add('spiritual_unconscious');
  }

  // Prune to max 3 most relevant themes
  const priority: SynastryTheme[] = [
    'emotional_bond', 'attraction_chemistry', 'commitment_stability',
    'growth_shadow', 'communication', 'ease_support', 'karmic_development',
    'identity_visibility', 'creative_play', 'conflict_activation',
    'family_roots', 'spiritual_unconscious',
  ];
  const sorted = priority.filter(t => themes.has(t));
  return sorted.slice(0, 3);
}

// ── Main enriched computation ─────────────────────────────────────────────────

export function computeSynastry(
  chartA: NatalChart,
  chartB: NatalChart,
): SynastryResult {
  const rawAspects = computeSynastryRaw(chartA, chartB);

  const aspects: SynastryAspect[] = rawAspects.map(raw => ({
    ...raw,
    salienceScore: scoreSynastryAspect(raw, raw.maxOrb),
    salienceLevel: getSalienceLevel(scoreSynastryAspect(raw, raw.maxOrb)),
    themes:        classifyAspectThemes(raw),
    isGenerational: isGenerationalPair(raw.bodyA, raw.bodyB),
  })).sort((a, b) => b.salienceScore - a.salienceScore);

  const hasHouseData = !!(
    chartA.western.houses?.cusps?.length &&
    chartB.western.houses?.cusps?.length
  );

  const overlays = hasHouseData
    ? computeSynastryOverlays(chartA, chartB)
    : [];

  const patterns = detectSharedPatterns(chartA, chartB, hasHouseData);

  const themes = buildThemeSummaries(aspects, overlays, patterns);

  return { aspects, overlays, patterns, themes, hasHouseData, chartA, chartB };
}
