import type { NatalChart, BodyId, TransitAspect } from './types';
import { ASPECTS, getOrb } from './constants';
import { computeBody, julday } from './sweph';

// Transiting bodies — ordered slowest to fastest (most to least significant)
const TRANSIT_BODIES: BodyId[] = [
  'pluto', 'neptune', 'uranus', 'saturn', 'jupiter',
  'mars', 'sun', 'venus', 'mercury', 'moon', 'trueNode',
];

// Natal points to aspect against
const NATAL_TARGETS: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'trueNode', 'asc', 'mc',
];

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function computeTransits(natal: NatalChart, whenUTC: string): TransitAspect[] {
  const jdUT = julday(whenUTC);
  const aspects: TransitAspect[] = [];

  for (const transitId of TRANSIT_BODIES) {
    let transitLon: number;
    let transitSpeed: number;

    try {
      const raw = computeBody(transitId, jdUT);
      transitLon   = ((raw.longitude % 360) + 360) % 360;
      transitSpeed = raw.speedLongitude;
    } catch {
      continue;
    }

    for (const natalId of NATAL_TARGETS) {
      // Do NOT skip transitId === natalId: a transiting body conjunct its own
      // natal position is a "return" (Saturn return, Jupiter return, etc.) —
      // one of the most significant transit events, not a degenerate case.
      const natalBody = natal.western.bodies[natalId];
      if (!natalBody) continue;

      const natalLon = natalBody.longitude;
      const sep      = angularSeparation(transitLon, natalLon);

      for (const def of ASPECTS) {
        const orb       = getOrb(def.kind, transitId, natalId);
        const deviation = Math.abs(sep - def.angle);

        if (deviation <= orb) {
          const nextTransitLon = transitLon + transitSpeed;
          const currentArc     = angularSeparation(transitLon,      natalLon);
          const nextArc        = angularSeparation(nextTransitLon,   natalLon);
          const applying       = nextArc < currentArc;

          const daysToExact = Math.abs(transitSpeed) > 0.001
            ? deviation / Math.abs(transitSpeed)
            : 999;

          aspects.push({
            transitBody: transitId,
            natalBody:   natalId,
            kind:        def.kind,
            exactAngle:  def.angle,
            actualAngle: sep,
            orb:         deviation,
            applying,
            daysToExact,
          });
        }
      }
    }
  }

  return aspects;
}
