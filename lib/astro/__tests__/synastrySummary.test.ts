import { describe, it, expect } from 'vitest';
import { buildThemeSummaries } from '../synastrySummary';
import type { SynastryAspect, SynastryHouseOverlay, SharedPattern } from '../synastry';

function aspect(theme: 'emotional_bond', salienceScore: number): SynastryAspect {
  return {
    bodyA: 'moon', bodyB: 'venus', kind: 'trine', exactAngle: 120, orb: 1, maxOrb: 6,
    salienceScore, salienceLevel: 'high', themes: [theme], isGenerational: false,
  };
}

function overlay(theme: 'emotional_bond', salienceScore: number): SynastryHouseOverlay {
  return {
    planetOwner: 'A', planet: 'moon', planetSign: 'cancer', planetLon: 100, house: 4,
    salienceScore, salienceLevel: 'moderate', themes: [theme], label: 'test overlay',
  };
}

describe('buildThemeSummaries — no discontinuous score cliff from a weak second category', () => {
  it('a single strong aspect keeps a "very high" score even when a negligible overlay also touches the theme', () => {
    // Before the fix: the discrete weighted-average (BLEND_WEIGHTS[2] =
    // [0.7, 0.3]) dropped the top category's effective weight from 1.0 to
    // 0.7 the instant a second category had ANY evidence -- 95 + a
    // near-zero overlay would have scored ~68 ("high"), not ~95-97
    // ("very_high"), contradicting the intent that a single strong signal
    // still reads as strong.
    const strongOnly = buildThemeSummaries([aspect('emotional_bond', 95)], [], []);
    const strongPlusWeak = buildThemeSummaries(
      [aspect('emotional_bond', 95)],
      [overlay('emotional_bond', 2)],
      [],
    );

    expect(strongOnly[0].salienceLevel).toBe('very_high');
    expect(strongPlusWeak[0].salienceLevel).toBe('very_high');
    // The weak second category should barely move the score, not cost ~30%.
    expect(strongPlusWeak[0].score).toBeGreaterThanOrEqual(strongOnly[0].score - 5);
  });

  it('still curbs the score when MULTIPLE strong categories stack (does not just sum to the ceiling)', () => {
    const summaries = buildThemeSummaries(
      [aspect('emotional_bond', 95)],
      [overlay('emotional_bond', 90)],
      [],
    );
    // A strong aspect (95) plus a strong overlay should land meaningfully
    // above the aspect alone, but not blow straight through 100 as an
    // unbounded sum would (95 + 90*0.5 discount would already cap near ~100).
    expect(summaries[0].score).toBeLessThanOrEqual(100);
    expect(summaries[0].score).toBeGreaterThan(95);
  });

  it('discounts overlay-only evidence relative to a direct aspect (overlays are broader/less specific)', () => {
    const overlayOnly = buildThemeSummaries([], [overlay('emotional_bond', 90)], []);
    const aspectOnly = buildThemeSummaries([aspect('emotional_bond', 90)], [], []);
    expect(overlayOnly[0].score).toBeLessThan(aspectOnly[0].score);
  });
});
