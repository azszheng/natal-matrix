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

// Diminishing-returns sum: first item counts fully, each additional at 35% of the previous.
// Prevents many mediocre aspects from inflating a theme to the same level as one great one.
function decaySum(scores: number[], decay = 0.35): number {
  return [...scores]
    .sort((a, b) => b - a)
    .reduce((total, s, i) => total + s * Math.pow(decay, i), 0);
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
    const overlayScore = decaySum(themeOverlays.map(o => o.salienceScore)) * 0.5;
    const patternScore = decaySum(themePatterns.map(p => p.salienceScore)) * 0.4;

    const rawScore = aspectScore + overlayScore + patternScore;
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
