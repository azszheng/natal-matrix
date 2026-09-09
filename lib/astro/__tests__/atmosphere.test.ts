import { describe, it, expect, vi, afterEach } from 'vitest';
import { categorizeWeather, computeAtmosphere } from '../atmosphere';
import type { NatalChart } from '../types';

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

describe('computeAtmosphere — queries the UTC calendar date, not the local one', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockArchiveByDate(byDate: Record<string, { precipitation: number[]; snowfall: number[]; cloud_cover: number[] }>) {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const match = /start_date=(\d{4}-\d{2}-\d{2})/.exec(url);
      const requestedDate = match?.[1];
      const hourly = requestedDate ? byDate[requestedDate] : undefined;
      if (!hourly) {
        return { ok: true, json: async () => ({ hourly: undefined }) };
      }
      return { ok: true, json: async () => ({ hourly }) };
    }));
  }

  function fakeChart(overrides: Partial<NatalChart['input']>): NatalChart {
    return {
      input: {
        name: 'Test', date: '', time: '', city: '', region: '', country: '',
        lat: 0, lng: 0, timezone: '', utc: '', julianDayUT: 0,
        ...overrides,
      },
      western: { bodies: { sun: { longitude: 0 }, moon: { longitude: 0 } } },
    } as unknown as NatalChart;
  }

  it('uses the UTC date (not the local birth date) when the birth instant falls on a different UTC calendar day', () => {
    // Real reproduction case: Oct 26 1986, 1:15 AM, Fuzhou, China (UTC+8).
    // Local date is Oct 26, but the birth instant (17:15 UTC) falls on
    // Oct 25 in UTC. Previously this queried Oct 26's data and indexed
    // hour 17 of the WRONG day -- an entirely different 24-hour period,
    // roughly a full day off. Every hour of Oct 26 here is set to a
    // trivially wrong 'rain' signature; Oct 25 hour 17 is 'cloudy'.
    const zeros = (n: number) => Array(24).fill(n);
    mockArchiveByDate({
      '1986-10-25': { precipitation: zeros(0), snowfall: zeros(0), cloud_cover: zeros(0).map((_, i) => i === 17 ? 86 : 0) },
      '1986-10-26': { precipitation: zeros(0).map((_, i) => i === 17 ? 5 : 0), snowfall: zeros(0), cloud_cover: zeros(100) },
    });

    const chart = fakeChart({
      date: '1986-10-26', time: '01:15',
      lat: 26.0745, lng: 119.2965,
      utc: '1986-10-25T17:15:00Z',
    });

    return computeAtmosphere(chart).then(atmo => {
      expect(atmo.weatherCategory).toBe('cloudy'); // from Oct 25 (correct UTC date), not 'rain' from Oct 26
    });
  });

  it('handles the opposite crossing direction (negative UTC offset, local date behind UTC date)', () => {
    // Los Angeles, 11:30 PM local on Jan 1 (PST, UTC-8) -> UTC instant is
    // Jan 2, 07:30. Local date (Jan 1) is BEHIND the UTC date (Jan 2).
    const zeros = (n: number) => Array(24).fill(n);
    mockArchiveByDate({
      '2020-01-01': { precipitation: zeros(0).map((_, i) => i === 7 ? 5 : 0), snowfall: zeros(0), cloud_cover: zeros(100) },
      '2020-01-02': { precipitation: zeros(0), snowfall: zeros(0), cloud_cover: zeros(0).map((_, i) => i === 7 ? 10 : 0) },
    });

    const chart = fakeChart({
      date: '2020-01-01', time: '23:30',
      lat: 34.0522, lng: -118.2437,
      utc: '2020-01-02T07:30:00Z',
    });

    return computeAtmosphere(chart).then(atmo => {
      expect(atmo.weatherCategory).toBe('clear'); // from Jan 2 (correct UTC date), not 'rain' from Jan 1
    });
  });
});
