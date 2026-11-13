import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../natal';
import { computeTransits } from '../transits';
import type { ResolvedBirth } from '../types';

const birth: ResolvedBirth = {
  name: 'Test', date: '1986-10-26', time: '01:15',
  city: 'Fuzhou', region: 'Fujian', country: 'China',
  lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
  utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
};

describe('computeTransits — planetary returns', () => {
  const natal = computeNatalChart(birth);

  it('detects a body conjunct its own natal position (a "return") instead of skipping it', () => {
    // At the exact moment of birth, every transiting body is by definition
    // sitting on its own natal degree -- this must surface as a conjunction,
    // not be silently excluded just because transitBody === natalBody.
    const aspects = computeTransits(natal, birth.utc);
    const selfConjunctions = aspects.filter(a => a.transitBody === a.natalBody && a.kind === 'conjunction');
    // Every body present in both the transiting-bodies list and the natal
    // targets list should return an exact (near-zero orb) self-conjunction.
    const bodiesWithSelfHit = new Set(selfConjunctions.map(a => a.transitBody));
    expect(bodiesWithSelfHit.has('sun')).toBe(true);
    expect(bodiesWithSelfHit.has('moon')).toBe(true);
    expect(bodiesWithSelfHit.has('saturn')).toBe(true);
    for (const a of selfConjunctions) {
      expect(a.orb).toBeLessThan(0.01);
    }
  });
});
