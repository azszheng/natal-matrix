import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../natal';
import type { ResolvedBirth } from '../types';
import { computeSynastry } from '../synastryScoring';

const einstein: ResolvedBirth = {
  name: 'Einstein', date: '1879-03-14', time: '11:30',
  city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
  lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
};

const personB: ResolvedBirth = {
  name: 'Person B', date: '1995-07-22', time: '03:14',
  city: 'Tokyo', region: 'Tokyo', country: 'Japan',
  lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo', utc: '1995-07-21T18:14:00Z', julianDayUT: 0,
};

const personC: ResolvedBirth = {
  name: 'Person C', date: '2000-01-05', time: '19:47',
  city: 'Sydney', region: 'NSW', country: 'Australia',
  lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney', utc: '2000-01-05T08:47:00Z', julianDayUT: 0,
};

const personD: ResolvedBirth = {
  name: 'Person D', date: '1962-11-30', time: '09:03',
  city: 'Nairobi', region: 'Nairobi', country: 'Kenya',
  lat: -1.2921, lng: 36.8219, timezone: 'Africa/Nairobi', utc: '1962-11-30T06:03:00Z', julianDayUT: 0,
};

describe('synastry regression — output is actually input-sensitive', () => {
  const chartA = computeNatalChart(einstein);
  const chartB = computeNatalChart(personB);
  const chartC = computeNatalChart(personC);
  const chartD = computeNatalChart(personD);

  const pairs = [
    ['A-B', chartA, chartB],
    ['A-C', chartA, chartC],
    ['A-D', chartA, chartD],
    ['B-C', chartB, chartC],
    ['C-D', chartC, chartD],
  ] as const;

  it('never surfaces "ASC in 1st house" / "MC in 10th house" as a shared pattern', () => {
    // Every chart's own Ascendant is definitionally in its own house 1, and
    // its own Midheaven in its own house 10 — so this "match" is true for
    // any two charts and carries zero signal. It should never be surfaced
    // as if it were a discovered commonality between two specific people.
    for (const [, x, y] of pairs) {
      const { patterns } = computeSynastry(x, y);
      const labels = patterns.map(p => p.label);
      expect(labels).not.toContain('Both have ASC in the 1st house');
      expect(labels).not.toContain('Both have MC in the 10th house');
    }
  });

  it('produces meaningfully different top-aspect signatures across different pairs', () => {
    const signatures = pairs.map(([, x, y]) => {
      const r = computeSynastry(x, y);
      return r.aspects.slice(0, 5).map(a => `${a.bodyA}-${a.kind}-${a.bodyB}`).join('|');
    });
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it('does not peg every theme to the same maximum score for every pair', () => {
    // Before the fix, additive stacking of aspect/overlay/pattern subscores
    // meant nearly every theme for nearly every pair rounded to exactly 100.
    // Real pairs should show a spread, not a wall of identical maxed scores.
    const allTopScores: number[] = [];
    for (const [, x, y] of pairs) {
      const { themes } = computeSynastry(x, y);
      allTopScores.push(...themes.slice(0, 5).map(t => t.score));
    }
    const maxedOut = allTopScores.filter(s => s === 100).length;
    expect(maxedOut).toBeLessThan(allTopScores.length);
    expect(new Set(allTopScores).size).toBeGreaterThan(3);
  });
});
