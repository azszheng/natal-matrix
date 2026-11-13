import type { BodyId, AspectKind, NakshatraId } from './types';

// ── sweph body number mapping ────────────────────────────────────────────────

export const SWEPH_BODY: Partial<Record<BodyId, number>> = {
  sun:           0,
  moon:          1,
  mercury:       2,
  venus:         3,
  mars:          4,
  jupiter:       5,
  saturn:        6,
  uranus:        7,
  neptune:       8,
  pluto:         9,
  trueNode:      11,
  blackMoonLilith: 12, // SE_MEAN_APOG
  chiron:        15,
  ceres:         17,
  pallas:        18,
  juno:          19,
  vesta:         20,
};

// Bodies computed by sweph.calc_ut (excludes derived points)
export const COMPUTED_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'blackMoonLilith',
  'chiron', 'ceres', 'pallas', 'juno', 'vesta',
];

// All bodies in display order
export const ALL_BODIES: BodyId[] = [
  ...COMPUTED_BODIES,
  'southNode', 'partOfFortune', 'vertex', 'asc', 'mc',
];

// ── Aspect definitions ───────────────────────────────────────────────────────

export type AspectDef = {
  kind: AspectKind;
  angle: number;
  orbLuminaries: number;  // orb when Sun or Moon is involved
  orbDefault: number;
};

export const ASPECTS: AspectDef[] = [
  { kind: 'conjunction', angle:   0, orbLuminaries: 10, orbDefault: 8 },
  { kind: 'opposition',  angle: 180, orbLuminaries: 10, orbDefault: 8 },
  { kind: 'trine',       angle: 120, orbLuminaries:  8, orbDefault: 7 },
  { kind: 'square',      angle:  90, orbLuminaries:  8, orbDefault: 7 },
  { kind: 'sextile',     angle:  60, orbLuminaries:  6, orbDefault: 5 },
  { kind: 'quincunx',    angle: 150, orbLuminaries:  3, orbDefault: 3 },
];

const LUMINARIES: Set<BodyId> = new Set(['sun', 'moon']);

export function getOrb(kind: AspectKind, a: BodyId, b: BodyId): number {
  const def = ASPECTS.find((d) => d.kind === kind)!;
  return LUMINARIES.has(a) || LUMINARIES.has(b) ? def.orbLuminaries : def.orbDefault;
}

// ── Nakshatra lords (Vimshottari) ────────────────────────────────────────────

export const NAKSHATRA_LORD: Record<NakshatraId, BodyId> = {
  ashwini:           'southNode',  // Ketu
  bharani:           'venus',
  krittika:          'sun',
  rohini:            'moon',
  mrigashira:        'mars',
  ardra:             'trueNode',   // Rahu
  punarvasu:         'jupiter',
  pushya:            'saturn',
  ashlesha:          'mercury',
  magha:             'southNode',  // Ketu
  purvaPhalguni:     'venus',
  uttaraPhalguni:    'sun',
  hasta:             'moon',
  chitra:            'mars',
  swati:             'trueNode',   // Rahu
  vishakha:          'jupiter',
  anuradha:          'saturn',
  jyeshtha:          'mercury',
  mula:              'southNode',  // Ketu
  purvaAshadha:      'venus',
  uttaraAshadha:     'sun',
  shravana:          'moon',
  dhanishta:         'mars',
  shatabhisha:       'trueNode',   // Rahu
  purvaBhadrapada:   'jupiter',
  uttaraBhadrapada:  'saturn',
  revati:            'mercury',
};

// Vimshottari dasha lengths in years
export const DASHA_YEARS: Record<BodyId, number> = {
  trueNode:  7,   // Ketu
  venus:    20,
  sun:       6,
  moon:     10,
  mars:      7,
  // Rahu also uses trueNode key — handled specially in dashas.ts
  jupiter:  16,
  saturn:   19,
  mercury:  17,
  // placeholders for bodies with no dasha period
  southNode: 0, blackMoonLilith: 0, chiron: 0, ceres: 0, pallas: 0,
  juno: 0, vesta: 0, partOfFortune: 0, vertex: 0, asc: 0, mc: 0,
  uranus: 0, neptune: 0, pluto: 0,
};
