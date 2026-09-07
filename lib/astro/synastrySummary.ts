/**
 * synastrySummary.ts
 * Builds per-theme summaries from aspects, overlays, and shared patterns.
 */

import type {
  SynastryAspect,
  SynastryHouseOverlay,
  SharedPattern,
  SynastryTheme,
  SynastryThemeSummary,
  SalienceLevel,
} from './synastry';
import { getSalienceLevel } from './synastryScoring';

const ALL_THEMES: SynastryTheme[] = [
  'emotional_bond',
  'attraction_chemistry',
  'communication',
  'commitment_stability',
  'growth_shadow',
  'ease_support',
  'karmic_development',
  'creative_play',
  'conflict_activation',
  'identity_visibility',
  'family_roots',
  'spiritual_unconscious',
];

// Diminishing-returns sum: the top score counts fully; every additional score
// contributes at a fast-decaying rate, and the combined contribution of ALL
// additional scores is capped at 30% of the top score. This is what actually
// keeps a pile of mediocre aspects from inflating a theme past what a single
// great aspect would score — an uncapped geometric series converges to
// 1/(1-decay) (~1.5x the top score for decay=0.35), which doesn't bound
// anything and let most themes drift to the scale ceiling for any two charts
// with more than a couple of matching aspects.
function decaySum(scores: number[], decay = 0.35, maxBonusRatio = 0.3): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => b - a);
  const top = sorted[0];
  let tail = 0;
  for (let i = 1; i < sorted.length; i++) tail += sorted[i] * Math.pow(decay, i);
  // Individual scores are already 0-100; a category subtotal shouldn't exceed
  // that scale either, or it just shifts the overflow downstream.
  return Math.min(top + Math.min(tail, top * maxBonusRatio), 100);
}

export function buildThemeSummaries(
  aspects: SynastryAspect[],
  overlays: SynastryHouseOverlay[],
  patterns: SharedPattern[],
): SynastryThemeSummary[] {
  const summaries: SynastryThemeSummary[] = [];

  for (const theme of ALL_THEMES) {
    const themeAspects  = aspects.filter(a => a.themes.includes(theme));
    const themeOverlays = overlays.filter(o => o.themes.includes(theme));
    const themePatterns = patterns.filter(p => p.themes.includes(theme));

    if (themeAspects.length === 0 && themeOverlays.length === 0 && themePatterns.length === 0) {
      continue;
    }

    const aspectScore  = decaySum(themeAspects.map(a => a.salienceScore));
    const overlayScore = decaySum(themeOverlays.map(o => o.salienceScore));
    const patternScore = decaySum(themePatterns.map(p => p.salienceScore));

    // Blend evidence types as a weighted average (weights redistributed over
    // whichever categories actually have evidence), not a sum — aspects,
    // house overlays, and shared patterns each independently touch most
    // themes for almost any two real charts (14x14 body pairs, generous
    // orbs, 28 house overlays always computed), so adding three
    // independently near-ceiling numbers pushed nearly every pairing's
    // every theme to "very high," regardless of actual relative strength.
    // A single category with strong evidence still reads as strong; it's
    // only stacking *multiple* strong categories that used to auto-max.
    const cats = [aspectScore, overlayScore, patternScore]
      .filter(s => s > 0)
      .sort((a, b) => b - a);
    const BLEND_WEIGHTS: Record<number, number[]> = {
      1: [1],
      2: [0.7, 0.3],
      3: [0.55, 0.3, 0.15],
    };
    const weights  = BLEND_WEIGHTS[cats.length] ?? [];
    const rawScore = cats.reduce((sum, s, i) => sum + s * (weights[i] ?? 0), 0);
    const score    = Math.min(Math.round(rawScore), 100);

    summaries.push({
      theme,
      score,
      salienceLevel: getSalienceLevel(score),
      topAspects:   themeAspects.slice(0, 4),
      topOverlays:  themeOverlays.slice(0, 3),
      topPatterns:  themePatterns.slice(0, 3),
    });
  }

  return summaries.sort((a, b) => b.score - a.score);
}
