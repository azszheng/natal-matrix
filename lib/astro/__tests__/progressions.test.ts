import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../natal';
import { computeSecondaryProgressions } from '../progressions';
import type { ResolvedBirth } from '../types';

const birth: ResolvedBirth = {
  name: 'Test', date: '1986-10-26', time: '01:15',
  city: 'Fuzhou', region: 'Fujian', country: 'China',
  lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
  utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
};

describe('computeSecondaryProgressions — planetary returns', () => {
  const natal = computeNatalChart(birth);

  it('detects a progressed body conjunct its own natal position instead of skipping it', () => {
    // At age 0 (progressed date == birth date), every progressed body sits
    // exactly on its own natal degree -- this must surface as a conjunction,
    // not be silently excluded just because progId === natalId.
    const chart = computeSecondaryProgressions(natal, birth.utc);
    const selfConjunctions = chart.aspects.filter(a => a.progressedBody === a.natalBody && a.kind === 'conjunction');
    const bodiesWithSelfHit = new Set(selfConjunctions.map(a => a.progressedBody));
    expect(bodiesWithSelfHit.has('sun')).toBe(true);
    expect(bodiesWithSelfHit.has('moon')).toBe(true);
    for (const a of selfConjunctions) {
      expect(a.orb).toBeLessThan(0.01);
    }
  });
});
