import { describe, it, expect } from 'vitest';
import { categorizeWeather } from '../atmosphere';

describe('categorizeWeather — trace-precipitation false positives', () => {
  it('does not report rain for a trace/negligible precipitation reading', () => {
    // Real reproduction case: Phoenix, AZ, monsoon-onset day, ERA5 grid-cell
    // average of 0.1mm precipitation that hour with 71% cloud cover -- the
    // ground truth for that location/time was dry, overcast conditions, not
    // rain. Previously this returned 'rain' (threshold was 0.05mm).
    expect(categorizeWeather(0.1, 0, 71)).toBe('cloudy');
  });

  it('does not report snow for a trace flurry reading', () => {
    expect(categorizeWeather(0, 0.05, 80)).toBe('cloudy');
  });

  it('still reports rain for a clearly measurable precipitation amount', () => {
    expect(categorizeWeather(0.5, 0, 90)).toBe('rain');
    expect(categorizeWeather(0.2, 0, 90)).toBe('rain'); // exactly at the new threshold
  });

  it('still reports snow for a clearly measurable snowfall amount', () => {
    // Real reproduction case: NYC, Feb 26 2010 (the Feb 2010 North American
    // blizzard) -- ERA5 shows ~1.68cm/hr snowfall that hour, well above any
    // reasonable trace threshold.
    expect(categorizeWeather(2.6, 1.68, 100)).toBe('snow');
    expect(categorizeWeather(0, 0.1, 90)).toBe('snow'); // exactly at the new threshold
  });

  it('reports clear for genuinely dry, low-cloud conditions', () => {
    expect(categorizeWeather(0, 0, 10)).toBe('clear');
  });

  it('reports cloudy when cloud cover is high but there is no measurable precipitation', () => {
    expect(categorizeWeather(0, 0, 75)).toBe('cloudy');
  });

  it('returns unknown only when all three readings are missing', () => {
    expect(categorizeWeather(-1, -1, -1)).toBe('unknown');
  });

  it('prioritizes snow over rain when both are measurable', () => {
    expect(categorizeWeather(1, 1, 100)).toBe('snow');
  });
});
