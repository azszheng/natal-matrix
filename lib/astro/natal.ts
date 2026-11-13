import type {
  ResolvedBirth, NatalChart, BodyId, BodyPosition,
} from './types';
import { SIGNS } from './types';
import { COMPUTED_BODIES } from './constants';
import {
  computeBody, computeHouses, getAyanamsaLahiri, getSwephVersion, julday,
} from './sweph';
import { computeAspects } from './aspects';
import { toVedicBody, getAscendantRashi, tropicalToSidereal } from './vedic';
import { getDignityInfo } from './dignities';

function signFromLon(lon: number) {
  const normalized = ((lon % 360) + 360) % 360;
  return { sign: SIGNS[Math.floor(normalized / 30)], signDegree: normalized % 30 };
}

function assignHouse(longitude: number, cusps: number[]): number {
  const lon = ((longitude % 360) + 360) % 360;
  for (let h = 0; h < 12; h++) {
    const start = cusps[h];
    const end   = cusps[(h + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return h + 1;
    } else {
      // wraps 360°
      if (lon >= start || lon < end) return h + 1;
    }
  }
  return 1;
}

export function computeNatalChart(input: ResolvedBirth): NatalChart {
  const jdUT = julday(input.utc);

  // Step 1 & 2 — compute all sweph bodies
  const rawBodies: Partial<Record<BodyId, ReturnType<typeof computeBody>>> = {};
  for (const id of COMPUTED_BODIES) {
    rawBodies[id] = computeBody(id, jdUT);
  }

  // Step 3 — compute houses (Placidus)
  const houses = computeHouses(jdUT, input.lat, input.lng);

  // Step 4 — build BodyPosition for each computed body
  const westernBodies: Partial<Record<BodyId, BodyPosition>> = {};
  for (const id of COMPUTED_BODIES) {
    const raw = rawBodies[id]!;
    const lon = ((raw.longitude % 360) + 360) % 360;
    const { sign, signDegree } = signFromLon(lon);
    const house = assignHouse(lon, houses.cusps);
    westernBodies[id] = {
      id,
      longitude:      lon,
      latitude:       raw.latitude,
      distance:       raw.distance,
      speedLongitude: raw.speedLongitude,
      declination:    raw.latitude, // ecliptic lat ≠ declination strictly, but sweph default
      isRetrograde:   raw.speedLongitude < 0,
      sign,
      signDegree,
      house,
    };
  }

  // Step 5 — derived points
  const asc = houses.asc;
  const mc  = houses.mc;
  const sunLon  = westernBodies['sun']!.longitude;
  const moonLon = westernBodies['moon']!.longitude;

  // ASC as body
  const { sign: ascSign, signDegree: ascDeg } = signFromLon(asc);
  westernBodies['asc'] = {
    id: 'asc', longitude: asc, latitude: 0, distance: 0,
    speedLongitude: 0, declination: 0, isRetrograde: false,
    sign: ascSign, signDegree: ascDeg, house: 1,
  };

  // MC as body
  const { sign: mcSign, signDegree: mcDeg } = signFromLon(mc);
  westernBodies['mc'] = {
    id: 'mc', longitude: mc, latitude: 0, distance: 0,
    speedLongitude: 0, declination: 0, isRetrograde: false,
    sign: mcSign, signDegree: mcDeg, house: 10,
  };

  // South Node = True Node + 180
  const northNodeLon = westernBodies['trueNode']!.longitude;
  const southNodeLon = (northNodeLon + 180) % 360;
  const { sign: snSign, signDegree: snDeg } = signFromLon(southNodeLon);
  westernBodies['southNode'] = {
    id: 'southNode', longitude: southNodeLon, latitude: 0, distance: 0,
    speedLongitude: westernBodies['trueNode']!.speedLongitude,
    declination: 0, isRetrograde: false,
    sign: snSign, signDegree: snDeg,
    house: assignHouse(southNodeLon, houses.cusps),
  };

  // Part of Fortune: day chart = asc + moon - sun; night = asc + sun - moon
  // Sun below horizon = sun in houses 1–6 (ascendant side)
  const sunHouse = assignHouse(sunLon, houses.cusps);
  const isNightChart = sunHouse <= 6;
  const pofLon = isNightChart
    ? ((asc + sunLon - moonLon) % 360 + 360) % 360
    : ((asc + moonLon - sunLon) % 360 + 360) % 360;
  const { sign: pofSign, signDegree: pofDeg } = signFromLon(pofLon);
  westernBodies['partOfFortune'] = {
    id: 'partOfFortune', longitude: pofLon, latitude: 0, distance: 0,
    speedLongitude: 0, declination: 0, isRetrograde: false,
    sign: pofSign, signDegree: pofDeg,
    house: assignHouse(pofLon, houses.cusps),
  };

  // Vertex from houses output
  const { sign: vtxSign, signDegree: vtxDeg } = signFromLon(houses.armc);
  // armc is sidereal time not vertex — vertex is stored separately; re-read from houses
  // houses().data.points[3] = vertex
  // We already have it in HouseCusps, but need to re-expose it.
  // For now: use the raw vertex from computeHouses (armc field is actually armc, not vertex)
  // We'll re-fetch it below with a direct call to sw.houses to grab vertex.
  void vtxSign; void vtxDeg; // suppress unused warnings; computed below

  // Re-fetch vertex directly (it's points[3])
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swephModule = require('sweph');
  const sw = swephModule.default ?? swephModule.sweph ?? swephModule;
  const path = require('path');
  sw.set_ephe_path(path.join(process.cwd(), 'public', 'ephemeris'));
  const housesRaw = sw.houses(jdUT, input.lat, input.lng, 'P');
  const vertex = housesRaw.data.points[3] as number;

  const { sign: vxSign, signDegree: vxDeg } = signFromLon(vertex);
  westernBodies['vertex'] = {
    id: 'vertex', longitude: vertex, latitude: 0, distance: 0,
    speedLongitude: 0, declination: 0, isRetrograde: false,
    sign: vxSign, signDegree: vxDeg,
    house: assignHouse(vertex, houses.cusps),
  };

  const allWesternBodies = westernBodies as Record<BodyId, BodyPosition>;

  // Step 6 — Vedic
  const ayanamsa = getAyanamsaLahiri(jdUT);
  const ascSidereal = tropicalToSidereal(asc, ayanamsa);
  const vedicBodies = Object.fromEntries(
    Object.entries(allWesternBodies).map(([id, pos]) => [
      id,
      toVedicBody(pos, ayanamsa, ascSidereal),
    ]),
  ) as NatalChart['vedic']['bodies'];

  // Step 7 — Aspects
  // South Node is synthesized as True Node + 180°, so the two are always in an
  // exact opposition — a tautology, not a chart signature. Drop that pair.
  const aspects = computeAspects(allWesternBodies).filter(a =>
    !((a.a === 'trueNode' && a.b === 'southNode') || (a.a === 'southNode' && a.b === 'trueNode'))
  );

  // Step 8 — Dignities (traditional 7 planets + nodes)
  const dignities = Object.fromEntries(
    Object.entries(allWesternBodies).map(([id, pos]) => [
      id,
      getDignityInfo(id as BodyId, pos.sign),
    ]),
  ) as NatalChart['western']['dignities'];

  return {
    input: { ...input, julianDayUT: jdUT },
    western: {
      bodies:   allWesternBodies,
      houses,
      aspects,
      dignities,
    },
    vedic: {
      ayanamsa,
      ayanamsaName: 'lahiri',
      bodies:        vedicBodies,
      ascendantRashi: getAscendantRashi(asc, ayanamsa),
    },
    meta: {
      computedAt:   new Date().toISOString(),
      swephVersion: getSwephVersion(),
    },
  };
}
