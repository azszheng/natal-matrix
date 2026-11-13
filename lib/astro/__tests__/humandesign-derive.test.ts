import { describe, it, expect } from 'vitest';
import { computeHumanDesignChart } from '../humandesign';
import { CHANNELS, GATE_CENTER } from '../humandesign-constants';
import type { ResolvedBirth } from '../types';
import {
  getGateChannelInfo, isCenterDefined, getCenterForGate,
  enrichAllActivations, getHangingActivations,
} from '../humandesign-derive';

const birth: ResolvedBirth = {
  name: 'Test', date: '1986-10-26', time: '01:15',
  city: 'Fuzhou', region: 'Fujian', country: 'China',
  lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
  utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
};

const chart = computeHumanDesignChart(birth);

describe('getCenterForGate', () => {
  it('maps a gate to the same center as the raw GATE_CENTER table', () => {
    for (const [gate, center] of GATE_CENTER.entries()) {
      expect(getCenterForGate(gate)).toBe(center);
    }
  });

  it('returns undefined for an out-of-range gate number', () => {
    expect(getCenterForGate(999)).toBeUndefined();
  });
});

describe('isCenterDefined', () => {
  it('agrees with the computed chart\'s definedCenters list', () => {
    for (const center of chart.definedCenters) {
      expect(isCenterDefined(center, chart.definedCenters)).toBe(true);
    }
    const allCenters = new Set(GATE_CENTER.values());
    for (const center of allCenters) {
      if (!chart.definedCenters.includes(center)) {
        expect(isCenterDefined(center, chart.definedCenters)).toBe(false);
      }
    }
  });
});

describe('getGateChannelInfo — channel status', () => {
  it('marks a gate whose partner is also activated as a full_channel', () => {
    for (const ch of chart.definedChannels) {
      const infoA = getGateChannelInfo(ch.a, chart.definedGates).find(i => i.channel.a === ch.a && i.channel.b === ch.b);
      const infoB = getGateChannelInfo(ch.b, chart.definedGates).find(i => i.channel.a === ch.a && i.channel.b === ch.b);
      expect(infoA?.status).toBe('full_channel');
      expect(infoB?.status).toBe('full_channel');
      expect(infoA?.pairedGateActivated).toBe(true);
    }
  });

  it('marks a gate whose partner is not activated as a hanging_gate', () => {
    // Find a gate that IS activated but whose channel partner is NOT.
    const hangingCase = CHANNELS.find(ch =>
      chart.definedGates.includes(ch.a) !== chart.definedGates.includes(ch.b),
    );
    if (!hangingCase) return; // this specific chart happens to have none; nothing to assert
    const activatedGate = chart.definedGates.includes(hangingCase.a) ? hangingCase.a : hangingCase.b;
    const missingGate    = activatedGate === hangingCase.a ? hangingCase.b : hangingCase.a;
    const info = getGateChannelInfo(activatedGate, chart.definedGates)
      .find(i => i.pairedGate === missingGate);
    expect(info?.status).toBe('hanging_gate');
    expect(info?.pairedGateActivated).toBe(false);
  });

  it('returns one entry per channel a gate belongs to (some gates sit in two channels)', () => {
    const multiChannelGate = [...new Set(CHANNELS.map(c => c.a).concat(CHANNELS.map(c => c.b)))]
      .find(g => CHANNELS.filter(c => c.a === g || c.b === g).length > 1);
    expect(multiChannelGate).toBeDefined();
    const info = getGateChannelInfo(multiChannelGate!, chart.definedGates);
    expect(info.length).toBeGreaterThan(1);
  });
});

describe('enrichAllActivations', () => {
  const enriched = enrichAllActivations(chart);

  it('produces one enriched entry per personality + design activation', () => {
    expect(enriched.length).toBe(chart.personality.length + chart.design.length);
  });

  it('tags Personality and Design activations with the correct side', () => {
    const personalitySide = enriched.filter(a => a.side === 'Personality');
    const designSide      = enriched.filter(a => a.side === 'Design');
    expect(personalitySide.length).toBe(chart.personality.length);
    expect(designSide.length).toBe(chart.design.length);
  });

  it('sets centerDefined consistent with the chart\'s definedCenters', () => {
    for (const a of enriched) {
      if (!a.center) continue;
      expect(a.centerDefined).toBe(chart.definedCenters.includes(a.center));
    }
  });
});

describe('getHangingActivations', () => {
  it('only returns activations with at least one hanging channel', () => {
    for (const a of getHangingActivations(chart)) {
      expect(a.channels.some(c => c.status === 'hanging_gate')).toBe(true);
    }
  });

  it('excludes activations whose gate is not part of any channel at all', () => {
    const enriched = enrichAllActivations(chart);
    const noChannelGate = enriched.find(a => a.channels.length === 0);
    if (!noChannelGate) return;
    const hanging = getHangingActivations(chart);
    expect(hanging.find(a => a.gate === noChannelGate.gate && a.planet === noChannelGate.planet)).toBeUndefined();
  });
});
