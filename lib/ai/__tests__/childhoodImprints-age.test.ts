import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { getAgeFromBirthDate, isMinorChart } from '../childhoodImprints';

describe('getAgeFromBirthDate — timezone-safe date parsing', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => { process.env.TZ = 'America/Los_Angeles'; });
  afterAll(() => { process.env.TZ = originalTZ; });

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not turn someone 18 a day early in a negative-UTC-offset timezone', () => {
    // Born 2000-06-15. `new Date('2000-06-15')` parses as UTC midnight,
    // which in Pacific time (UTC-7 in June) reads back as June 14 -- shifting
    // the effective birthday a day earlier and turning someone 18 one day
    // before their real birthday. Freeze "today" at local June 14, 2018 --
    // the day BEFORE the true 18th birthday -- where the correct age is
    // still 17.
    vi.setSystemTime(new Date('2018-06-14T12:00:00-07:00'));
    expect(getAgeFromBirthDate('2000-06-15')).toBe(17);
    expect(isMinorChart('2000-06-15')).toBe(true);
  });

  it('correctly turns 18 on the actual local birthday', () => {
    vi.setSystemTime(new Date('2018-06-15T12:00:00-07:00'));
    expect(getAgeFromBirthDate('2000-06-15')).toBe(18);
    expect(isMinorChart('2000-06-15')).toBe(false);
  });

  it('is still 17 the day before, and 18 the day of, for a birthday on the 1st (month-boundary case)', () => {
    vi.setSystemTime(new Date('2018-05-31T12:00:00-07:00'));
    expect(getAgeFromBirthDate('2000-06-01')).toBe(17);
    vi.setSystemTime(new Date('2018-06-01T12:00:00-07:00'));
    expect(getAgeFromBirthDate('2000-06-01')).toBe(18);
  });
});
