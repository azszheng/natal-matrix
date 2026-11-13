import { describe, it, expect } from 'vitest';
import { computeVimshottariDasha } from '../dashas';
import type { NatalChart } from '../types';

const NAKSHATRA_SPAN = 360 / 27;

// Minimal synthetic chart: computeVimshottariDasha only reads
// natal.vedic.bodies.moon.{longitudeSidereal,nakshatra} and natal.input.utc.
function fakeChart(moonLongitudeSidereal: number, nakshatra: string, birthUTC: string): NatalChart {
  return {
    input: { utc: birthUTC },
    vedic: {
      bodies: {
        moon: { longitudeSidereal: moonLongitudeSidereal, nakshatra },
      },
    },
  } as unknown as NatalChart;
}

describe('computeVimshottariDasha — antardasha proportions', () => {
  it('proportions antardashas against the mahadasha lord\'s FULL nominal years, not the partial birth balance', () => {
    // Bharani is nakshatra index 1 (0-based); placing the Moon exactly
    // halfway through it (1.5 * NAKSHATRA_SPAN) makes the birth Mahadasha
    // (Venus, 20y) exactly half-elapsed at birth, leaving a 10y balance.
    const chart = fakeChart(1.5 * NAKSHATRA_SPAN, 'bharani', '2000-01-01T00:00:00Z');
    const result = computeVimshottariDasha(chart, '2000-01-01T00:00:00Z');

    expect(result.mahadasha.lord).toBe('venus');
    expect(result.mahadasha.durationYears).toBeCloseTo(10, 5);

    // Hand-derived expected sequence: walking the full-length Venus
    // antardasha cycle (venus, sun, moon, mars, rahu, jupiter, saturn,
    // mercury, ketu -- each (subLord years * 20) / 120), the 10 years
    // already elapsed before birth lands inside the Rahu segment
    // ([7.1667, 10.1667) years into the cycle: 3y venus+sun+moon+mars share
    // is [0, 7.1667), then rahu's 3y segment runs to 10.1667). So the
    // antardasha active at birth must be Rahu -- not Venus, which the old
    // buggy formula (scaled against the 10y partial balance instead of the
    // full 20y) would have produced as the first entry instead.
    expect(result.antardasha.lord).toBe('rahu');
    // Visible Rahu duration = segEnd(10 + 1/6) - elapsed(10) = 1/6 year.
    expect(result.antardasha.durationYears).toBeCloseTo(1 / 6, 2);
  });

  it('matches the classical table exactly when Moon sits at the very start of its nakshatra (no partial elapsed)', () => {
    // fractionTraversed = 0 -> the birth Mahadasha equals its full nominal
    // length, so elapsedBeforeWindow = 0 and the first antardasha must be
    // the mahadasha lord itself, with the classical self-antardasha length.
    const chart = fakeChart(1 * NAKSHATRA_SPAN, 'bharani', '2000-01-01T00:00:00Z');
    const result = computeVimshottariDasha(chart, '2000-01-01T00:00:00Z');

    expect(result.mahadasha.lord).toBe('venus');
    expect(result.mahadasha.durationYears).toBeCloseTo(20, 5);
    expect(result.antardasha.lord).toBe('venus');
    // Venus-in-Venus antardasha = 20 * 20 / 120 = 3.3333 years
    expect(result.antardasha.durationYears).toBeCloseTo((20 * 20) / 120, 2);
  });
});
