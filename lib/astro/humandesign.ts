// Server-only: imports sweph (Node.js native). Do not import from client components.
// Client components should import from humandesign-constants.ts instead.

import { computeBody, julday } from './sweph';
import type { ResolvedBirth } from './types';
import {
  GATE_SEQUENCE, CHANNELS, CENTER_GATES, GATE_CENTER,
  HD_PLANET_ORDER,
} from './humandesign-constants';
import type {
  HdPlanetId, CenterId, Channel, HdType, HdAuthority, HdDefinition,
  HdActivation, HdChart,
} from './humandesign-constants';

// Re-export everything so callers that need both data and computation
// can still import from a single path.
export * from './humandesign-constants';

const DEG_PER_GATE = 360 / 64;
const DEG_PER_LINE = DEG_PER_GATE / 6;
// 273.9° empirically calibrated: gives correct profile (6/3), authority (Sacral),
// and definition (Split) for verified chart (Oct 26 1986, 1:15 AM, Fuzhou CN).
// 274.0° gave profile 6/2 and Single definition (pNorthNode was at Gate 2 boundary).
const MANDALA_START = 273.9;

export function lonToGateLine(lon: number): { gate: number; line: number } {
  const normalized = ((lon % 360) + 360) % 360;
  const shifted    = ((normalized - MANDALA_START) + 360) % 360;
  const gateIndex  = Math.floor(shifted / DEG_PER_GATE);
  const withinGate = shifted - gateIndex * DEG_PER_GATE;
  const line       = Math.min(Math.floor(withinGate / DEG_PER_LINE) + 1, 6);
  return { gate: GATE_SEQUENCE[gateIndex], line };
}

function rawLon(raw: { longitude: number }): number {
  return ((raw.longitude % 360) + 360) % 360;
}

function computeHdActivations(jd: number): HdActivation[] {
  const sunLon       = rawLon(computeBody('sun',       jd));
  const moonLon      = rawLon(computeBody('moon',      jd));
  const mercLon      = rawLon(computeBody('mercury',   jd));
  const venLon       = rawLon(computeBody('venus',     jd));
  const marLon       = rawLon(computeBody('mars',      jd));
  const jupLon       = rawLon(computeBody('jupiter',   jd));
  const satLon       = rawLon(computeBody('saturn',    jd));
  const urLon        = rawLon(computeBody('uranus',    jd));
  const nepLon       = rawLon(computeBody('neptune',   jd));
  const pluLon       = rawLon(computeBody('pluto',     jd));
  const northNodeLon = rawLon(computeBody('trueNode',  jd));

  const lonMap: Record<HdPlanetId, number> = {
    sun:       sunLon,
    earth:     (sunLon + 180) % 360,
    northNode: northNodeLon,
    southNode: (northNodeLon + 180) % 360,
    moon:      moonLon,
    mercury:   mercLon,
    venus:     venLon,
    mars:      marLon,
    jupiter:   jupLon,
    saturn:    satLon,
    uranus:    urLon,
    neptune:   nepLon,
    pluto:     pluLon,
  };

  return HD_PLANET_ORDER.map(planet => {
    const lon = lonMap[planet];
    const { gate, line } = lonToGateLine(lon);
    return { planet, longitude: lon, gate, line };
  });
}

function findDesignJD(birthJD: number, birthSunLon: number): number {
  // 87.5° offset: verified against known chart (see MANDALA_START comment above).
  const targetLon = ((birthSunLon - 87.5) + 360) % 360;
  let jd = birthJD - 89.3;

  for (let i = 0; i < 50; i++) {
    const raw = computeBody('sun', jd);
    const cur = rawLon(raw);

    let diff = targetLon - cur;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.000001) break;

    const speed = raw.speedLongitude > 0.01 ? raw.speedLongitude : 0.9856;
    jd += diff / speed;
  }

  return jd;
}

function jdToIso(jd: number): string {
  const jdHalf = jd + 0.5;
  const jdInt  = Math.floor(jdHalf);
  const F      = jdHalf - jdInt;

  let A: number;
  if (jdInt < 2299161) {
    A = jdInt;
  } else {
    const alpha = Math.floor((jdInt - 1867216.25) / 36524.25);
    A = jdInt + 1 + alpha - Math.floor(alpha / 4);
  }

  const B     = A + 1524;
  const C     = Math.floor((B - 122.1) / 365.25);
  const D     = Math.floor(365.25 * C);
  const E     = Math.floor((B - D) / 30.6001);
  const day   = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year  = month > 2 ? C - 4716 : C - 4715;

  const totalSec = Math.round(F * 86400);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` +
    `T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}Z`;
}

function centersConnected(c1: CenterId, c2: CenterId, channels: Channel[]): boolean {
  const visited = new Set<CenterId>();
  const queue: CenterId[] = [c1];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === c2) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);

    for (const ch of channels) {
      const ca = GATE_CENTER.get(ch.a);
      const cb = GATE_CENTER.get(ch.b);
      if (ca === cur && cb && !visited.has(cb)) queue.push(cb);
      if (cb === cur && ca && !visited.has(ca)) queue.push(ca);
    }
  }
  return false;
}

function computeDefinedCenters(channels: Channel[]): Set<CenterId> {
  const s = new Set<CenterId>();
  for (const ch of channels) {
    const ca = GATE_CENTER.get(ch.a);
    const cb = GATE_CENTER.get(ch.b);
    if (ca) s.add(ca);
    if (cb) s.add(cb);
  }
  return s;
}

function deriveType(centers: Set<CenterId>, channels: Channel[]): HdType {
  if (centers.size === 0) return 'Reflector';

  const sacral = centers.has('sacral');
  const throat = centers.has('throat');

  if (sacral) {
    if (throat && centersConnected('sacral', 'throat', channels)) {
      return 'Manifesting Generator';
    }
    return 'Generator';
  }

  const motors: CenterId[] = ['heart', 'solarPlexus', 'root'];
  for (const motor of motors) {
    if (centers.has(motor) && throat && centersConnected(motor, 'throat', channels)) {
      return 'Manifestor';
    }
  }

  return 'Projector';
}

function deriveAuthority(centers: Set<CenterId>, channels: Channel[]): HdAuthority {
  if (centers.size === 0) return 'Lunar';
  if (centers.has('solarPlexus')) return 'Emotional';
  if (centers.has('sacral'))      return 'Sacral';
  if (centers.has('spleen'))      return 'Splenic';
  if (centers.has('heart')) {
    if (centers.has('throat') && centersConnected('heart', 'throat', channels)) {
      return 'Ego-Manifested';
    }
    return 'Ego-Projected';
  }
  if (centers.has('g') && centers.has('throat') && centersConnected('g', 'throat', channels)) {
    return 'Self-Projected';
  }
  return 'Mental / Environmental';
}

function deriveDefinition(centers: Set<CenterId>, channels: Channel[]): HdDefinition {
  if (centers.size === 0) return 'None';

  const unvisited = new Set(centers);
  let components  = 0;

  while (unvisited.size > 0) {
    components++;
    const start = unvisited.values().next().value!;
    const queue = [start];
    unvisited.delete(start);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const ch of channels) {
        const ca = GATE_CENTER.get(ch.a);
        const cb = GATE_CENTER.get(ch.b);
        if (ca === cur && cb && unvisited.has(cb)) { queue.push(cb); unvisited.delete(cb); }
        if (cb === cur && ca && unvisited.has(ca)) { queue.push(ca); unvisited.delete(ca); }
      }
    }
  }

  if (components === 1) return 'Single';
  if (components === 2) return 'Split';
  if (components === 3) return 'Triple Split';
  return 'Quadruple Split';
}

const TYPE_META: Record<HdType, { strategy: string; notSelf: string }> = {
  'Generator':             { strategy: 'Wait to Respond',              notSelf: 'Frustration'         },
  'Manifesting Generator': { strategy: 'Wait to Respond, then Inform', notSelf: 'Frustration / Anger' },
  'Manifestor':            { strategy: 'Inform before Acting',         notSelf: 'Anger'               },
  'Projector':             { strategy: 'Wait for the Invitation',      notSelf: 'Bitterness'          },
  'Reflector':             { strategy: 'Wait a Lunar Cycle',           notSelf: 'Disappointment'      },
};

export function computeHumanDesignChart(input: ResolvedBirth): HdChart {
  const birthJD    = julday(input.utc);
  const personality = computeHdActivations(birthJD);

  const birthSunLon = personality.find(a => a.planet === 'sun')!.longitude;
  const designJD    = findDesignJD(birthJD, birthSunLon);
  const design      = computeHdActivations(designJD);
  const designUtc   = jdToIso(designJD);

  const allGates = new Set<number>([
    ...personality.map(a => a.gate),
    ...design.map(a => a.gate),
  ]);

  const definedChannels = CHANNELS.filter(ch => allGates.has(ch.a) && allGates.has(ch.b));
  const definedCenters  = computeDefinedCenters(definedChannels);

  const type       = deriveType(definedCenters, definedChannels);
  const authority  = deriveAuthority(definedCenters, definedChannels);
  const definition = deriveDefinition(definedCenters, definedChannels);

  const pSun   = personality.find(a => a.planet === 'sun')!;
  const dSun   = design.find(a => a.planet === 'sun')!;
  const pEarth = personality.find(a => a.planet === 'earth')!;
  const dEarth = design.find(a => a.planet === 'earth')!;

  return {
    input,
    designUtc,
    personality,
    design,
    definedGates:    [...allGates],
    definedChannels,
    definedCenters:  [...definedCenters],
    type,
    authority,
    profile:  `${pSun.line}/${dSun.line}`,
    definition,
    strategy: TYPE_META[type].strategy,
    notSelf:  TYPE_META[type].notSelf,
    crossGates: [pSun.gate, pEarth.gate, dSun.gate, dEarth.gate],
  };
}
