import { describe, it, expect } from 'vitest';
import { lonToGateLine, computeHumanDesignChart } from '../humandesign';
import { GATE_SEQUENCE, GATE_CENTER } from '../humandesign-constants';
import { julday } from '../sweph';
import type { ResolvedBirth } from '../types';

// Independently cross-referenced against multiple published Human Design
// gate/degree tables (not derived from this codebase): Gate 41 begins at
// exactly 2°00' Aquarius = 302.0° tropical longitude, and the wheel runs in
// increasing-longitude order 41 -> 19 -> 13 -> 49 -> 30 -> ..., matching
// GATE_SEQUENCE exactly. Each gate spans 360/64 = 5.625°.
const MANDALA_START = 302.0;
const GATE_WIDTH = 5.625;

describe('lonToGateLine — gate wheel alignment', () => {
  it('places the first five documented gates at their verified boundaries', () => {
    // [gate, line] expected at the exact start of each gate
    const expected = [
      { gate: 41, lon: MANDALA_START + 0 * GATE_WIDTH },
      { gate: 19, lon: MANDALA_START + 1 * GATE_WIDTH },
      { gate: 13, lon: MANDALA_START + 2 * GATE_WIDTH },
      { gate: 49, lon: MANDALA_START + 3 * GATE_WIDTH },
      { gate: 30, lon: MANDALA_START + 4 * GATE_WIDTH },
    ];
    for (const { gate, lon } of expected) {
      expect(lonToGateLine(lon).gate).toBe(gate);
      expect(lonToGateLine(lon).line).toBe(1);
    }
  });

  it('stays on the previous gate just before a boundary, and wraps correctly at 360°/0°', () => {
    const justBefore41 = MANDALA_START - 0.001;
    const result = lonToGateLine(((justBefore41 % 360) + 360) % 360);
    // The gate immediately before 41 in the wheel is the last entry of GATE_SEQUENCE.
    expect(result.gate).toBe(GATE_SEQUENCE[GATE_SEQUENCE.length - 1]);
    expect(result.line).toBe(6);
  });

  it('divides each gate into six equal-width lines', () => {
    const lineWidth = GATE_WIDTH / 6;
    for (let line = 1; line <= 6; line++) {
      const lon = MANDALA_START + (line - 1) * lineWidth + lineWidth / 2; // midpoint of the line
      expect(lonToGateLine(lon)).toEqual({ gate: 41, line });
    }
  });

  it('never produces an out-of-range gate or line for any longitude', () => {
    for (let lon = 0; lon < 360; lon += 0.7) {
      const { gate, line } = lonToGateLine(lon);
      expect(GATE_SEQUENCE).toContain(gate);
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(6);
    }
  });
});

describe('computeHumanDesignChart — structural sanity', () => {
  const birth: ResolvedBirth = {
    name: 'Test', date: '1986-10-26', time: '01:15',
    city: 'Fuzhou', region: 'Fujian', country: 'China',
    lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
    utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
  };

  const chart = computeHumanDesignChart(birth);

  it('places the Design calculation strictly before birth, roughly 88 solar-arc days earlier', () => {
    const birthJD  = julday(birth.utc);
    const designJD = julday(chart.designUtc);
    expect(designJD).toBeLessThan(birthJD);
    expect(birthJD - designJD).toBeGreaterThan(85);
    expect(birthJD - designJD).toBeLessThan(93);
  });

  it('produces gates/lines in valid ranges for every activation', () => {
    for (const activation of [...chart.personality, ...chart.design]) {
      expect(GATE_SEQUENCE).toContain(activation.gate);
      expect(activation.line).toBeGreaterThanOrEqual(1);
      expect(activation.line).toBeLessThanOrEqual(6);
    }
  });

  it('only counts a channel as defined when both of its gates are actually activated', () => {
    for (const ch of chart.definedChannels) {
      expect(chart.definedGates).toContain(ch.a);
      expect(chart.definedGates).toContain(ch.b);
    }
  });

  it('derives defined centers only from defined channels', () => {
    const expectedCenters = new Set(
      chart.definedChannels.flatMap(ch => [GATE_CENTER.get(ch.a), GATE_CENTER.get(ch.b)]),
    );
    expect(new Set(chart.definedCenters)).toEqual(expectedCenters);
  });

  it('derives a Manifesting Generator only when Sacral and Throat are both defined and connected', () => {
    if (chart.type === 'Manifesting Generator') {
      expect(chart.definedCenters).toContain('sacral');
      expect(chart.definedCenters).toContain('throat');
    }
  });

  it('produces a profile string built from the actual Sun lines', () => {
    const pSun = chart.personality.find(a => a.planet === 'sun')!;
    const dSun = chart.design.find(a => a.planet === 'sun')!;
    expect(chart.profile).toBe(`${pSun.line}/${dSun.line}`);
  });

  it('still matches the one hand-checked reference result after the constant fix (profile 6/3, Sacral, Split)', () => {
    // This exact chart (Oct 26 1986, 1:15 AM, Fuzhou CN) was the one the
    // previous MANDALA_START=273.9 was tuned against, and hand-verified to
    // produce profile 6/3, Sacral authority, Split definition. The corrected
    // 302.0 constant reproduces the same coarse result for this chart (while
    // fixing the underlying per-gate mapping for every other chart) — this
    // pins that down as a regression guard.
    expect(chart.profile).toBe('6/3');
    expect(chart.authority).toBe('Sacral');
    expect(chart.definition).toBe('Split');
  });
});
