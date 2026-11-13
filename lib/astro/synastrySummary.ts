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

    // House overlays and shared patterns are broader, less specific signals
    // than a direct interplanetary aspect (overlays are always computed for
    // all 28 body/owner combinations, so they corroborate far more easily);
    // discount them relative to aspects so a theme with only a house overlay
    // and no qualifying aspect doesn't score as high as one with a genuinely
    // tight aspect.
    const aspectScore  = decaySum(themeAspects.map(a => a.salienceScore));
    const overlayScore = decaySum(themeOverlays.map(o => o.salienceScore)) * 0.5;
    const patternScore = decaySum(themePatterns.map(p => p.salienceScore)) * 0.4;

    // Blend evidence types with the same diminishing-returns logic already
    // used to combine scores *within* a category (decaySum, above) — the
    // top category counts in full, and every additional category only adds
    // a fast-decaying, capped bonus. Aspects, house overlays, and shared
    // patterns each independently touch most themes for almost any two real
    // charts (14x14 body pairs, generous orbs, 28 house overlays always
    // computed), so a discrete weighted-average (previously: the top
    // category's effective weight dropped from 1.0 to 0.7 the instant a
    // second category had ANY evidence, even negligible) caused a strong
    // single-category signal to lose ~30% of its score just because a weak,
    // barely-qualifying second category also happened to exist — the exact
    // "one dominant signal still reads as strong" case this was meant to
    // preserve. decaySum already solves this correctly: a lone strong score
    // passes through unchanged, and multiple strong scores are curbed
    // without a cliff at the boundary between "1 category" and "2 categories."
    const score = Math.round(decaySum([aspectScore, overlayScore, patternScore].filter(s => s > 0)));

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
