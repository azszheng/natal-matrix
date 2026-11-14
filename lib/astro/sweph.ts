import path from 'path';
import type { BodyId, HouseCusps } from './types';
import { SWEPH_BODY } from './constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swephModule = require('sweph');
const sw = swephModule.default ?? swephModule.sweph ?? swephModule;
const c = swephModule.constants ?? sw;

const SEFLG_SPEED  = c.SEFLG_SPEED  ?? 256;
const SEFLG_SWIEPH = c.SEFLG_SWIEPH ?? 2;
const SE_SIDM_LAHIRI = c.SE_SIDM_LAHIRI ?? 1;
const SE_ECL2HOR = c.SE_ECL2HOR ?? 0;

let initialised = false;

function init() {
  if (initialised) return;
  sw.set_ephe_path(path.join(process.cwd(), 'public', 'ephemeris'));
  sw.set_sid_mode(SE_SIDM_LAHIRI, 0, 0);
  initialised = true;
}

export type RawBody = {
  longitude: number;
  latitude: number;
  distance: number;
  speedLongitude: number;
  speedLatitude: number;
  speedDistance: number;
};

export function computeBody(bodyId: BodyId, jdUT: number): RawBody {
  init();
  const swBody = SWEPH_BODY[bodyId];
  if (swBody === undefined) throw new Error(`No sweph constant for body: ${bodyId}`);

  const flags = SEFLG_SPEED | SEFLG_SWIEPH;
  const result = sw.calc_ut(jdUT, swBody, flags);

  if (result.flag < 0) {
    throw new Error(`sweph.calc_ut failed for ${bodyId}: ${result.error}`);
  }

  const [longitude, latitude, distance, speedLongitude, speedLatitude, speedDistance] = result.data;
  return { longitude, latitude, distance, speedLongitude, speedLatitude, speedDistance };
}

export function computeHouses(jdUT: number, lat: number, lng: number): HouseCusps {
  init();
  const result = sw.houses(jdUT, lat, lng, 'P'); // Placidus

  if (result.flag < 0) {
    throw new Error(`sweph.houses failed: ${result.error ?? 'unknown error'}`);
  }

  const { houses, points } = result.data;
  // points: [0]=asc, [1]=mc, [2]=armc, [3]=vertex, [4]=equatorialAsc, [5..7]=co-ascendants
  return {
    system: 'placidus',
    cusps: houses,      // 12 values, cusps[0] = cusp 1
    asc:   points[0],
    mc:    points[1],
    armc:  points[2],
  };
}

// True (unrefracted) altitude of a body above the local horizon, from its
// already-computed ecliptic coordinates. Used for chart sect (day/night)
// determination, where the astrologically correct test is the body's true
// geometric position, not its apparent (refracted) visibility.
export function eclipticToTrueAltitude(
  jdUT: number,
  lat: number,
  lng: number,
  eclLongitude: number,
  eclLatitude: number,
  distance: number,
): number {
  init();
  const result = sw.azalt(jdUT, SE_ECL2HOR, [lng, lat, 0], 0, 0, [eclLongitude, eclLatitude, distance]);
  const [, trueAltitude] = result as [number, number, number];
  return trueAltitude;
}

export function getAyanamsaLahiri(jdUT: number): number {
  init();
  return sw.get_ayanamsa_ut(jdUT) as number;
}

export function getSwephVersion(): string {
  init();
  return sw.version() as string;
}

export function julday(utcIso: string): number {
  init();
  const d = new Date(utcIso);
  const year  = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day   = d.getUTCDate();
  const hour  = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  return sw.julday(year, month, day, hour, 1) as number; // 1 = Gregorian
}
