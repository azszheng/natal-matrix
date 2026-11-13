// Pure data — no server-only imports. Safe for client components.
//
// Deterministic derivations from an already-computed HdChart. Nothing here
// does astronomical calculation (see humandesign.ts for that) — this module
// only reorganizes chart facts (gate <-> center <-> channel <-> definition)
// into the shape the interpretation prompt builders need. Kept separate and
// pure so it's cheap to unit test independently of prompt text.

import { CHANNELS, GATE_CENTER } from './humandesign-constants';
import type {
  Channel, CenterId, HdActivation, HdChart, HdPlanetId,
} from './humandesign-constants';

export type ChannelStatus = 'full_channel' | 'hanging_gate';

export type GateChannelInfo = {
  channel: Channel;
  status: ChannelStatus;
  pairedGate: number;
  pairedGateActivated: boolean;
};

// All channels a gate can belong to (a gate may sit in more than one of the
// 36 channels), each annotated with whether the chart completes it.
export function getGateChannelInfo(gate: number, definedGates: readonly number[]): GateChannelInfo[] {
  return CHANNELS
    .filter(ch => ch.a === gate || ch.b === gate)
    .map(channel => {
      const pairedGate = channel.a === gate ? channel.b : channel.a;
      const pairedGateActivated = definedGates.includes(pairedGate);
      return {
        channel,
        status: pairedGateActivated ? 'full_channel' : 'hanging_gate',
        pairedGate,
        pairedGateActivated,
      } as GateChannelInfo;
    });
}

export function isCenterDefined(center: CenterId, definedCenters: readonly CenterId[]): boolean {
  return definedCenters.includes(center);
}

export function getCenterForGate(gate: number): CenterId | undefined {
  return GATE_CENTER.get(gate);
}

export type EnrichedActivation = HdActivation & {
  side: 'Personality' | 'Design';
  center: CenterId | undefined;
  centerDefined: boolean;
  channels: GateChannelInfo[];
};

function enrich(activation: HdActivation, side: 'Personality' | 'Design', hdChart: HdChart): EnrichedActivation {
  const center = getCenterForGate(activation.gate);
  return {
    ...activation,
    side,
    center,
    centerDefined: center ? isCenterDefined(center, hdChart.definedCenters) : false,
    channels: getGateChannelInfo(activation.gate, hdChart.definedGates),
  };
}

export function enrichAllActivations(hdChart: HdChart): EnrichedActivation[] {
  return [
    ...hdChart.personality.map(a => enrich(a, 'Personality', hdChart)),
    ...hdChart.design.map(a => enrich(a, 'Design', hdChart)),
  ];
}

// Activated gates (personality or design) that are genuinely hanging gates —
// every channel the gate belongs to is incomplete, so the gate carries no
// stable full-channel circuit at all. A gate that completes a full channel
// on one side and hangs on another already has a stable circuit and isn't
// prioritized as "hanging" — matching the same rule used when assembling
// the priority hanging-gate sections of the full report.
export function getHangingActivations(hdChart: HdChart): EnrichedActivation[] {
  return enrichAllActivations(hdChart).filter(
    a => a.channels.length > 0 && a.channels.every(c => c.status === 'hanging_gate'),
  );
}

// Planet display-priority groups for the "Gates by Planet" section, per the
// report structure: Sun/Earth first, then Moon, then the Nodes, then the
// personal planets, then the socials, then the outers.
export const PLANET_TIERS: readonly { label: string; planets: readonly HdPlanetId[] }[] = [
  { label: 'Sun & Earth',        planets: ['sun', 'earth'] },
  { label: 'Moon',               planets: ['moon'] },
  { label: 'The Nodes',          planets: ['northNode', 'southNode'] },
  { label: 'Mercury, Venus, Mars', planets: ['mercury', 'venus', 'mars'] },
  { label: 'Jupiter & Saturn',   planets: ['jupiter', 'saturn'] },
  { label: 'Uranus, Neptune, Pluto', planets: ['uranus', 'neptune', 'pluto'] },
];
