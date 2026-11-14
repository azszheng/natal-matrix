// ── Input ────────────────────────────────────────────────────────────────────

export type BirthInput = {
  name?: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm (24h, required)
  city: string;
  region: string;
  country: string;
};

export type ResolvedBirth = BirthInput & {
  lat: number;
  lng: number;
  timezone: string;   // IANA, e.g. "America/Los_Angeles"
  utc: string;        // ISO UTC
  julianDayUT: number;
};

// ── Signs & Nakshatras ───────────────────────────────────────────────────────

export type SignId =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export const SIGNS: SignId[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export type NakshatraId =
  | 'ashwini' | 'bharani' | 'krittika' | 'rohini' | 'mrigashira' | 'ardra'
  | 'punarvasu' | 'pushya' | 'ashlesha' | 'magha' | 'purvaPhalguni'
  | 'uttaraPhalguni' | 'hasta' | 'chitra' | 'swati' | 'vishakha' | 'anuradha'
  | 'jyeshtha' | 'mula' | 'purvaAshadha' | 'uttaraAshadha' | 'shravana'
  | 'dhanishta' | 'shatabhisha' | 'purvaBhadrapada' | 'uttaraBhadrapada'
  | 'revati';

export const NAKSHATRAS: NakshatraId[] = [
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra',
  'punarvasu', 'pushya', 'ashlesha', 'magha', 'purvaPhalguni',
  'uttaraPhalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha',
  'jyeshtha', 'mula', 'purvaAshadha', 'uttaraAshadha', 'shravana',
  'dhanishta', 'shatabhisha', 'purvaBhadrapada', 'uttaraBhadrapada', 'revati',
];

// ── Bodies ───────────────────────────────────────────────────────────────────

export type BodyId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'
  | 'uranus' | 'neptune' | 'pluto'
  | 'trueNode' | 'southNode'
  | 'chiron' | 'blackMoonLilith'
  | 'ceres' | 'juno' | 'vesta' | 'pallas'
  | 'partOfFortune' | 'vertex'
  | 'asc' | 'mc';

export type BodyPosition = {
  id: BodyId;
  longitude: number;        // ecliptic longitude 0–360, tropical
  latitude: number;
  distance: number;
  speedLongitude: number;   // deg/day; negative = retrograde
  declination: number;
  isRetrograde: boolean;
  sign: SignId;
  signDegree: number;       // 0–30 within sign
  house: number;            // 1–12, Placidus
};

export type VedicBodyPosition = {
  id: BodyId;
  longitudeSidereal: number;
  sign: SignId;
  signDegree: number;
  house: number;            // Whole Sign
  nakshatra: NakshatraId;
  nakshatraPada: 1 | 2 | 3 | 4;
  nakshatraLord: BodyId;
  isRetrograde: boolean;
};

// ── Houses ───────────────────────────────────────────────────────────────────

export type HouseCusps = {
  system: 'placidus';
  cusps: number[];  // length 12, tropical longitudes of cusps 1..12
  asc: number;
  mc: number;
  armc: number;
};

// ── Aspects ──────────────────────────────────────────────────────────────────

export type AspectKind =
  | 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx';

export type Aspect = {
  a: BodyId;
  b: BodyId;
  kind: AspectKind;
  exactAngle: number;
  actualAngle: number;
  orb: number;
  applying: boolean;
};

export type ProgressedAspect = {
  progressedBody: BodyId;
  natalBody: BodyId;
  kind: AspectKind;
  orb: number;
  applying: boolean;
};

export type ProgressedChart = {
  forDate: string;          // target date the user selected
  progressedDateISO: string; // symbolic date (birth + age days)
  bodies: Partial<Record<BodyId, BodyPosition>>;
  aspects: ProgressedAspect[];
};

export type TransitAspect = {
  transitBody: BodyId;
  natalBody: BodyId;
  kind: AspectKind;
  exactAngle: number;
  actualAngle: number;
  orb: number;
  applying: boolean;
  daysToExact: number; // days until (if applying) or since (if separating) exact
};

// ── Dignities ────────────────────────────────────────────────────────────────

export type DignityLabel = 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine' | null;

export type DignityInfo = {
  label: DignityLabel;
  traditionalRuler: BodyId;
  modernRuler?: BodyId;
};

// ── Sect (day/night chart) ───────────────────────────────────────────────────
//
// Traditional Western/Hellenistic sect. Western-only — do not import or
// apply this to Vedic interpretation. Vedic temporal strength (Kāla Bala,
// part of Ṣaḍbala) is a distinct, not-yet-implemented system; never
// silently translate one into the other.

export type ChartSect = 'day' | 'night';

export type SectStatus =
  | 'in-sect'       // planet's team matches the chart's sect
  | 'contrary-sect' // planet's team opposes the chart's sect
  | 'conditional'   // Mercury only — depends on oriental/occidental status
  | 'not-applicable'; // outer planets, angles, nodes, asteroids, Lilith

export type SectRole =
  | 'sect-luminary' | 'contrary-luminary'
  | 'benefic-of-sect' | 'benefic-contrary-sect'
  | 'malefic-of-sect' | 'malefic-contrary-sect'
  | 'mercury-diurnal' | 'mercury-nocturnal' | 'mercury-ambiguous'
  | 'outer-planet' | 'other';

export type SectInfo = {
  chartSect: ChartSect;

  sectLuminary: BodyId;      // 'sun' (day) or 'moon' (night)
  contraryLuminary: BodyId;

  beneficOfSect: BodyId;        // 'jupiter' (day) or 'venus' (night)
  beneficContrarySect: BodyId;

  maleficOfSect: BodyId;        // 'saturn' (day) or 'mars' (night)
  maleficContrarySect: BodyId;

  // Mercury is conditional: its own diurnal/nocturnal tendency (from
  // whether it rises before the Sun as a morning star, "oriental", or sets
  // after it as an evening star, "occidental") is compared against the
  // chart's sect. 'ambiguous' when Mercury sits too close to the Sun for
  // the orientation itself to be meaningfully determined.
  mercuryOrientation: 'oriental' | 'occidental' | 'ambiguous';
  mercurySect: 'diurnal' | 'nocturnal' | 'ambiguous';

  sunAltitudeDeg: number; // true (unrefracted) altitude at birth; sign determines day/night
};

export type PlanetSectCondition = {
  planet: BodyId;
  status: SectStatus;
  role: SectRole;
  interpretationTags: string[];
};

// ── Full Chart ───────────────────────────────────────────────────────────────

export type NatalChart = {
  input: ResolvedBirth;
  western: {
    bodies: Record<BodyId, BodyPosition>;
    houses: HouseCusps;
    aspects: Aspect[];
    dignities: Record<BodyId, DignityInfo>;
    sect: SectInfo;
    planetSect: Partial<Record<BodyId, PlanetSectCondition>>;
  };
  vedic: {
    ayanamsa: number;
    ayanamsaName: 'lahiri';
    bodies: Record<BodyId, VedicBodyPosition>;
    ascendantRashi: SignId;
  };
  meta: {
    computedAt: string;
    swephVersion: string;
  };
};

// ── Geocoding ────────────────────────────────────────────────────────────────

export type GeoResult = {
  displayName: string;
  lat: number;
  lng: number;
  country: string;
  countryCode: string;
  city: string;
  region: string;
};
