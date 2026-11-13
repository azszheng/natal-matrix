import type { NatalChart, BodyId, BodyPosition, ProgressedChart, ProgressedAspect, AspectKind } from './types';
import { SIGNS } from './types';
import { COMPUTED_BODIES } from './constants';
import { computeBody, julday } from './sweph';

const PROG_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'trueNode',
];

const NATAL_TARGETS: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'trueNode', 'asc', 'mc',
];

// Tight 1° orb for all progression aspects (standard practice)
const PROG_ORB = 1.0;

const ASPECT_ANGLES: { kind: AspectKind; angle: number }[] = [
  { kind: 'conjunction', angle: 0   },
  { kind: 'opposition',  angle: 180 },
  { kind: 'trine',       angle: 120 },
  { kind: 'square',      angle: 90  },
  { kind: 'sextile',     angle: 60  },
  { kind: 'quincunx',    angle: 150 },
];

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function signFromLon(lon: number): { sign: (typeof SIGNS)[number]; signDegree: number } {
  const normalized = ((lon % 360) + 360) % 360;
  return { sign: SIGNS[Math.floor(normalized / 30)], signDegree: normalized % 30 };
}

export function computeSecondaryProgressions(natal: NatalChart, whenUTC: string): ProgressedChart {
  const birthJdUT = natal.input.julianDayUT;
  const whenJdUT  = julday(whenUTC);

  // 1 day per year
  const ageInYears     = (whenJdUT - birthJdUT) / 365.25;
  const progressedJdUT = birthJdUT + ageInYears;

  // Symbolic progressed date (birth date + ageInYears days)
  // Convert progressedJdUT back to a calendar date
  const progressedMs      = (progressedJdUT - 2440587.5) * 86400000; // JD → Unix ms
  const progressedDateISO = new Date(progressedMs).toISOString().slice(0, 10);

  // Compute progressed body positions
  const bodies: Partial<Record<BodyId, BodyPosition>> = {};

  for (const id of PROG_BODIES) {
    try {
      const raw = computeBody(id, progressedJdUT);
      const lon = ((raw.longitude % 360) + 360) % 360;
      const { sign, signDegree } = signFromLon(lon);
      bodies[id] = {
        id,
        longitude:      lon,
        latitude:       raw.latitude,
        distance:       raw.distance,
        speedLongitude: raw.speedLongitude,
        declination:    raw.latitude,
        isRetrograde:   raw.speedLongitude < 0,
        sign,
        signDegree,
        house: 0, // house not computed for progressions
      };
    } catch {
      continue;
    }
  }

  // Compute progressed → natal aspects
  const aspects: ProgressedAspect[] = [];

  for (const progId of PROG_BODIES) {
    const progBody = bodies[progId];
    if (!progBody) continue;

    for (const natalId of NATAL_TARGETS) {
      // Do NOT skip progId === natalId: a progressed body conjunct its own
      // natal position is a real, significant event (e.g. the progressed
      // Lunar return around age 27), not a degenerate self-aspect.
      const natalBody = natal.western.bodies[natalId];
      if (!natalBody) continue;

      const sep = angularSeparation(progBody.longitude, natalBody.longitude);

      for (const def of ASPECT_ANGLES) {
        const deviation = Math.abs(sep - def.angle);
        if (deviation <= PROG_ORB) {
          const nextProgLon = progBody.longitude + progBody.speedLongitude;
          const currentArc  = angularSeparation(progBody.longitude, natalBody.longitude);
          const nextArc     = angularSeparation(nextProgLon,        natalBody.longitude);
          const applying    = nextArc < currentArc;

          aspects.push({ progressedBody: progId, natalBody: natalId, kind: def.kind, orb: deviation, applying });
        }
      }
    }
  }

  aspects.sort((a, b) => a.orb - b.orb);

  return { forDate: whenUTC, progressedDateISO, bodies, aspects };
}
