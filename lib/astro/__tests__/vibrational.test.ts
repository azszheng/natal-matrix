import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../natal';
import type { ResolvedBirth, NatalChart } from '../types';
import {
  harmonicLongitude,
  computeHarmonicConjunctions,
  computeVibrationalProfile,
  VIBRATIONAL_BODIES,
  EMPHASIZED_HARMONICS,
} from '../vibrational';

const einstein: ResolvedBirth = {
  name: 'Einstein', date: '1879-03-14', time: '11:30',
  city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
  lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
};

describe('harmonicLongitude — pure math', () => {
  it('multiplies longitude by the harmonic number and wraps mod 360', () => {
    expect(harmonicLongitude(10, 5)).toBeCloseTo(50, 10);
    expect(harmonicLongitude(72, 5)).toBeCloseTo(0, 10);   // exactly 1/5 of the circle → exact conjunction at H5
    expect(harmonicLongitude(51.43, 7)).toBeCloseTo(0, 1); // ~1/7 of the circle → near-exact at H7
  });

  it('always returns a value in [0, 360)', () => {
    for (const lon of [0, 359.999, 180, 1, 90.5]) {
      for (const h of [5, 7, 8, 9, 11, 13]) {
        const result = harmonicLongitude(lon, h);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
      }
    }
  });
});

describe('computeHarmonicConjunctions — synthetic exactness check', () => {
  it('finds an exact H5 conjunction for two bodies exactly 72° (=360/5) apart', () => {
    // Build a minimal fake chart with two bodies exactly a quintile apart.
    const chart = {
      western: {
        bodies: {
          sun:  { longitude: 10 },
          moon: { longitude: 82 }, // 10 + 72
        },
      },
    } as unknown as NatalChart;

    const conjunctions = computeHarmonicConjunctions(chart, 5);
    const sunMoon = conjunctions.find(c =>
      (c.bodyA === 'sun' && c.bodyB === 'moon') || (c.bodyA === 'moon' && c.bodyB === 'sun'),
    );
    expect(sunMoon).toBeDefined();
    expect(sunMoon!.orb).toBeCloseTo(0, 10);
    expect(sunMoon!.strength).toBe(100);
  });

  it('does not report a conjunction outside the orb', () => {
    const chart = {
      western: {
        bodies: {
          sun:  { longitude: 10 },
          moon: { longitude: 100 }, // 90° apart natally — not a clean 1/5 division
        },
      },
    } as unknown as NatalChart;

    const conjunctions = computeHarmonicConjunctions(chart, 5, 3);
    expect(conjunctions.length).toBe(0);
  });
});

describe('computeVibrationalProfile — real chart sanity', () => {
  const chart = computeNatalChart(einstein);
  const profile = computeVibrationalProfile(chart);

  it('returns exactly the eleven documented emphasized harmonics', () => {
    expect(profile.map(h => h.number)).toEqual(EMPHASIZED_HARMONICS.map(h => h.number));
    expect(profile.map(h => h.number)).toEqual([5, 7, 8, 9, 11, 13, 17, 19, 23, 29, 31]);
  });

  it('never surfaces trueNode against itself or a South Node tautology', () => {
    for (const h of profile) {
      for (const c of h.conjunctions) {
        expect(c.bodyA).not.toBe(c.bodyB);
        expect([c.bodyA, c.bodyB]).not.toContain('southNode');
      }
    }
  });

  it('only draws from the documented body set', () => {
    for (const h of profile) {
      for (const c of h.conjunctions) {
        expect(VIBRATIONAL_BODIES).toContain(c.bodyA);
        expect(VIBRATIONAL_BODIES).toContain(c.bodyB);
      }
    }
  });

  it('sorts conjunctions tightest-orb-first within each harmonic', () => {
    for (const h of profile) {
      for (let i = 1; i < h.conjunctions.length; i++) {
        expect(h.conjunctions[i].orb).toBeGreaterThanOrEqual(h.conjunctions[i - 1].orb);
      }
    }
  });
});
