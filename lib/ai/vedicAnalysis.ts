/**
 * vedicAnalysis.ts — Vedic (Jyotish) chart pattern-recognition engine.
 *
 * House-lord synthesis, Vedic dignities, graha drishti, yoga detection,
 * nakshatra psychology, and Vimshottari dasha activation. Produces a
 * structured VedicAnalysis object and formatted text block for the AI.
 */

import type { NatalChart, BodyId, SignId, NakshatraId } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import type { DashaResult } from '@/lib/astro/dashas';

// ── Sign utilities ─────────────────────────────────────────────────────────────

const signIdx = (s: SignId): number => SIGNS.indexOf(s);

/** Sign at house N (1-indexed) counting from lagna in whole-sign system. */
function houseSign(lagnaSign: SignId, h: number): SignId {
  return SIGNS[(signIdx(lagnaSign) + h - 1) % 12];
}

/** All house numbers (1-12) owned by bodyId for this lagna. */
function ownedHouses(bodyId: BodyId, lagnaSign: SignId): number[] {
  const result: number[] = [];
  for (let h = 1; h <= 12; h++) {
    if (VEDIC_RULER[houseSign(lagnaSign, h)] === bodyId) result.push(h);
  }
  return result;
}

// ── Vedic rulers, dignities, house groups ──────────────────────────────────────

const VEDIC_RULER: Record<SignId, BodyId> = {
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
};

const EXALT_SIGN: Partial<Record<BodyId, SignId>> = {
  sun: 'aries', moon: 'taurus', mercury: 'virgo', venus: 'pisces',
  mars: 'capricorn', jupiter: 'cancer', saturn: 'libra',
  trueNode: 'gemini', southNode: 'sagittarius',
};
const DEBIL_SIGN: Partial<Record<BodyId, SignId>> = {
  sun: 'libra', moon: 'scorpio', mercury: 'pisces', venus: 'virgo',
  mars: 'cancer', jupiter: 'capricorn', saturn: 'aries',
  trueNode: 'sagittarius', southNode: 'gemini',
};
const OWN_SIGNS: Partial<Record<BodyId, SignId[]>> = {
  sun: ['leo'], moon: ['cancer'],
  mercury: ['gemini', 'virgo'], venus: ['taurus', 'libra'],
  mars: ['aries', 'scorpio'], jupiter: ['sagittarius', 'pisces'],
  saturn: ['capricorn', 'aquarius'],
};
const MOOLATRIKONA: Partial<Record<BodyId, SignId>> = {
  sun: 'leo', moon: 'taurus', mercury: 'virgo', venus: 'libra',
  mars: 'aries', jupiter: 'sagittarius', saturn: 'aquarius',
};
// Simplified friend signs (for dignity classification)
const FRIEND_SIGNS: Partial<Record<BodyId, SignId[]>> = {
  sun:     ['aries', 'sagittarius', 'scorpio', 'pisces'],
  moon:    ['taurus', 'sagittarius', 'pisces', 'aries'],
  mercury: ['taurus', 'libra', 'capricorn', 'aquarius'],
  venus:   ['gemini', 'capricorn', 'aquarius', 'pisces'],
  mars:    ['leo', 'sagittarius', 'pisces', 'cancer'],
  jupiter: ['aries', 'scorpio', 'leo'],
  saturn:  ['taurus', 'libra', 'gemini', 'virgo'],
};

const KENDRA   = new Set([1, 4, 7, 10]);
const TRIKONA  = new Set([1, 5, 9]);
const DUSTHANA = new Set([6, 8, 12]);
const UPACHAYA = new Set([3, 6, 10, 11]);

// Degrees within which a planet is combust (near the Sun)
const COMBUST_DEG: Partial<Record<BodyId, number>> = {
  moon: 12, mercury: 14, venus: 10, mars: 17, jupiter: 11, saturn: 15,
};

// Dasha lord string → BodyId
const DASHA_BODY: Record<string, BodyId> = {
  sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn', rahu: 'trueNode', ketu: 'southNode',
};

// ── Labels ─────────────────────────────────────────────────────────────────────

const BL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', trueNode: 'Rahu', southNode: 'Ketu',
  chiron: 'Chiron', asc: 'Lagna',
};
function lbl(id: BodyId): string { return BL[id] ?? id; }
function cap(s: string): string  { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Nakshatra metadata ─────────────────────────────────────────────────────────

const NAK_KEY: Partial<Record<NakshatraId, { drive: string; shadow: string }>> = {
  ashwini:          { drive: 'swift initiation, healing impulse, urgency to act',                         shadow: 'impatience, incomplete follow-through' },
  bharani:          { drive: 'bearing intense experience, creative force, moral reckoning',               shadow: 'extremism, difficulty moderating desire' },
  krittika:         { drive: 'sharp discernment, purification, cutting to truth',                         shadow: 'harsh criticism, consuming relationships' },
  rohini:           { drive: 'beauty, sensory depth, creative fertility, steadfast loyalty',              shadow: 'possessiveness, resistance to change' },
  mrigashira:       { drive: 'curious seeking, gentle searching, restless intelligence',                  shadow: 'inability to settle, perpetual searching' },
  ardra:            { drive: 'transformation through storm, radical clearing, emotional intensity',       shadow: 'grief, turbulence, destructive episodes' },
  punarvasu:        { drive: 'renewal, return to innocence, restored optimism',                           shadow: 'difficulty learning from past, cyclical patterns' },
  pushya:           { drive: 'nourishing others, wisdom transmission, protective care',                   shadow: 'over-nurturing, control through giving' },
  ashlesha:         { drive: 'penetrating insight, coiled power, deep strategic knowing',                 shadow: 'manipulation, emotional venom when threatened' },
  magha:            { drive: 'ancestral power, dignity, claiming earned authority',                       shadow: 'pride, entitlement, ancestor fixation' },
  purvaPhalguni:    { drive: 'pleasure, creativity, prosperity, the right to rest',                       shadow: 'indulgence, avoiding difficulty' },
  uttaraPhalguni:   { drive: 'stable partnership, social contracts, earned recognition',                  shadow: 'dependence on validation, contractual rigidity' },
  hasta:            { drive: 'skilled craftsmanship, practical intelligence, healing hands',              shadow: 'cunning, manipulation through apparent helpfulness' },
  chitra:           { drive: 'brilliant creation, aesthetic vision, world-building',                      shadow: 'vanity, facade over substance' },
  swati:            { drive: 'independence, adaptability, movement, self-determination',                  shadow: 'instability, scattered focus, avoidance of roots' },
  vishakha:         { drive: 'purposeful striving, burning singular focus, achievement',                  shadow: 'obsessive ambition, ends-justify-means thinking' },
  anuradha:         { drive: 'friendship, devotional organization, loyal collaboration',                  shadow: 'jealousy, hidden rivalry, attachment to groups' },
  jyeshtha:         { drive: 'protective authority, elder knowledge, hidden power',                       shadow: 'control, guardedness, elder-sibling dynamics' },
  mula:             { drive: 'root investigation, dismantling to find truth, going to the core',          shadow: 'destructiveness, compulsion to undo what is stable' },
  purvaAshadha:     { drive: 'invincibility drive, purification, water-like persistence',                 shadow: 'premature certainty, stubbornness under pressure' },
  uttaraAshadha:    { drive: 'lasting achievement, irreversible forward movement, integrity',             shadow: 'inflexibility, inability to retreat when needed' },
  shravana:         { drive: 'deep listening, pattern recognition, connecting through learning',          shadow: 'rumination, susceptibility to others\' opinions' },
  dhanishta:        { drive: 'abundance, rhythmic gifts, communal contribution',                         shadow: 'materialism, marital friction' },
  shatabhisha:      { drive: 'healing through solitude, secret knowledge, mystery',                      shadow: 'reclusion, hidden fixations, social disconnection' },
  purvaBhadrapada:  { drive: 'fiery transformation, one-pointed intensity, otherworldly vision',         shadow: 'extremism, dark obsession, isolation' },
  uttaraBhadrapada: { drive: 'cosmic patience, serpentine depth, generational wisdom',                   shadow: 'withdrawal, slow-burning grief, difficulty in action' },
  revati:           { drive: 'compassionate completion, nourishing passage, universal love',              shadow: 'boundary dissolution, over-sensitivity, escapism' },
};

// ── Output types ───────────────────────────────────────────────────────────────

export type VedicDignity = 'exaltation' | 'moolatrikona' | 'own' | 'friendly' | 'neutral' | 'debilitation';
export type HouseGroup   = 'kendra' | 'trikona' | 'both' | 'dusthana' | 'upachaya' | 'neutral';
export type FunctionalRole = 'yogakaraka' | 'benefic' | 'malefic' | 'neutral';

export type LagnaAnalysis = {
  sign:             SignId;
  nakshatra:        NakshatraId | null;
  pada:             number | null;
  nakshatraLord:    BodyId | null;
  lord:             BodyId;
  lordSign:         SignId | null;
  lordHouse:        number | null;
  lordNakshatra:    NakshatraId | null;
  lordDignity:      VedicDignity | null;
  lordHouseGroup:   HouseGroup;
  planetsInLagna:   BodyId[];
  lordAspects:      string[];
  ownedHouseList:   number[];
};

export type MoonAnalysis = {
  sign:             SignId | null;
  nakshatra:        NakshatraId | null;
  pada:             number | null;
  nakshatraLord:    BodyId | null;
  house:            number | null;
  dignity:          VedicDignity | null;
  dispositor:       BodyId | null;
  dispositorSign:   SignId | null;
  dispositorHouse:  number | null;
  aspectingPlanets: BodyId[];
  hasKemadruma:     boolean;
};

export type PlanetStrength = {
  bodyId:         BodyId;
  dignity:        VedicDignity;
  houseGroup:     HouseGroup;
  isRetrograde:   boolean;
  isCombust:      boolean;
  functionalRole: FunctionalRole;
  score:          number;
};

export type VedicYoga = {
  name:           string;
  category:       'raja' | 'dhana' | 'dharma' | 'pancha-mahapurusha' | 'viparita' | 'parivartana' | 'chandra' | 'sun' | 'challenging' | 'general';
  description:    string;
  planets:        BodyId[];
  strength:       'strong' | 'moderate' | 'weak';
  affectedHouses: number[];
  note:           string;
};

export type VedicHouseLord = {
  house:            number;
  sign:             SignId;
  lord:             BodyId;
  lordSign:         SignId | null;
  lordHouse:        number | null;
  lordNakshatra:    NakshatraId | null;
  lordDignity:      VedicDignity | null;
  lordHouseGroup:   HouseGroup;
  occupants:        BodyId[];
  aspectingPlanets: BodyId[];
};

export type VedicTheme = {
  id:         string;
  label:      string;
  weight:     number;
  indicators: string[];
};

export type VedicAnalysis = {
  lagnaSign:       SignId;
  lagnaAnalysis:   LagnaAnalysis;
  moonAnalysis:    MoonAnalysis;
  sunHouse:        number | null;
  sunSign:         SignId | null;
  sunNakshatra:    NakshatraId | null;
  sunDignity:      VedicDignity | null;
  houseLords:      Partial<Record<number, VedicHouseLord>>;
  planetStrengths: Partial<Record<BodyId, PlanetStrength>>;
  yogas:           VedicYoga[];
  rahuHouse:       number | null;
  rahuSign:        SignId | null;
  rahuNakshatra:   NakshatraId | null;
  ketuHouse:       number | null;
  ketuSign:        SignId | null;
  ketuNakshatra:   NakshatraId | null;
  dominantThemes:  VedicTheme[];
  themeScores:     Record<string, { weight: number; indicators: string[] }>;
};

// ── Core helpers ───────────────────────────────────────────────────────────────

function getVedicDignity(bodyId: BodyId, sign: SignId): VedicDignity {
  if (DEBIL_SIGN[bodyId] === sign)         return 'debilitation';
  if (EXALT_SIGN[bodyId] === sign)         return 'exaltation';
  if (MOOLATRIKONA[bodyId] === sign)       return 'moolatrikona';
  if (OWN_SIGNS[bodyId]?.includes(sign))   return 'own';
  if (FRIEND_SIGNS[bodyId]?.includes(sign)) return 'friendly';
  return 'neutral';
}

function getHouseGroup(h: number): HouseGroup {
  const k = KENDRA.has(h), t = TRIKONA.has(h);
  if (k && t)  return 'both';
  if (k)       return 'kendra';
  if (t)       return 'trikona';
  if (DUSTHANA.has(h)) return 'dusthana';
  if (UPACHAYA.has(h)) return 'upachaya';
  return 'neutral';
}

/** Houses that planet in fromHouse aspects (Graha Drishti). */
function vedicAspects(fromHouse: number, bodyId: BodyId): Set<number> {
  const h = (off: number) => ((fromHouse - 1 + off) % 12) + 1;
  const s = new Set([h(6)]); // all planets: 7th from position
  if (bodyId === 'mars')    { s.add(h(3)); s.add(h(7)); }   // 4th, 8th
  if (bodyId === 'jupiter') { s.add(h(4)); s.add(h(8)); }   // 5th, 9th
  if (bodyId === 'saturn')  { s.add(h(2)); s.add(h(9)); }   // 3rd, 10th
  if (bodyId === 'trueNode' || bodyId === 'southNode') {
    s.add(h(4)); s.add(h(8)); // 5th, 9th (per many traditions)
  }
  return s;
}

function checkCombust(bodyId: BodyId, chart: NatalChart): boolean {
  if (bodyId === 'sun') return false;
  const sun = chart.vedic.bodies.sun, body = chart.vedic.bodies[bodyId];
  if (!sun || !body) return false;
  const diff = Math.abs(sun.longitudeSidereal - body.longitudeSidereal);
  return Math.min(diff, 360 - diff) <= (COMBUST_DEG[bodyId] ?? 0);
}

function getFunctionalRole(bodyId: BodyId, lagnaSign: SignId): FunctionalRole {
  const owned = ownedHouses(bodyId, lagnaSign);
  // Yogakaraka: single planet rules a non-lagna kendra (4,7,10) AND a non-lagna trikona (5,9)
  if (owned.some(h => [4,7,10].includes(h)) && owned.some(h => [5,9].includes(h))) return 'yogakaraka';
  // Trikona lord (1,5,9) without dusthana
  if (owned.some(h => TRIKONA.has(h)) && !owned.some(h => DUSTHANA.has(h))) return 'benefic';
  // Pure dusthana lord without trikona
  if (owned.some(h => DUSTHANA.has(h)) && !owned.some(h => TRIKONA.has(h)) && !owned.includes(1)) return 'malefic';
  return 'neutral';
}

function computeScore(bodyId: BodyId, chart: NatalChart, lagnaSign: SignId): number {
  const b = chart.vedic.bodies[bodyId];
  if (!b) return 0;
  let s = 5;
  const dig = getVedicDignity(bodyId, b.sign);
  if      (dig === 'exaltation')    s += 4;
  else if (dig === 'moolatrikona')  s += 3;
  else if (dig === 'own')           s += 2;
  else if (dig === 'friendly')      s += 1;
  else if (dig === 'debilitation')  s -= 3;
  const hg = getHouseGroup(b.house);
  if (hg === 'kendra' || hg === 'trikona' || hg === 'both') s += 2;
  else if (hg === 'upachaya') s += 1;
  else if (hg === 'dusthana') s -= 2;
  if (b.isRetrograde) s += 1;
  if (checkCombust(bodyId, chart)) s -= 2;
  const fr = getFunctionalRole(bodyId, lagnaSign);
  if (fr === 'yogakaraka') s += 2;
  else if (fr === 'benefic') s += 1;
  else if (fr === 'malefic') s -= 1;
  return Math.max(0, Math.min(10, s));
}

// Yoga association helpers
function sameHouse(a: BodyId, b: BodyId, chart: NatalChart): boolean {
  const ha = chart.vedic.bodies[a]?.house, hb = chart.vedic.bodies[b]?.house;
  return ha !== undefined && hb !== undefined && ha === hb;
}
function mutualAspect(a: BodyId, b: BodyId, chart: NatalChart): boolean {
  const ha = chart.vedic.bodies[a]?.house, hb = chart.vedic.bodies[b]?.house;
  if (!ha || !hb) return false;
  return vedicAspects(ha, a).has(hb) && vedicAspects(hb, b).has(ha);
}
function signExchange(a: BodyId, b: BodyId, chart: NatalChart): boolean {
  const sa = chart.vedic.bodies[a]?.sign, sb = chart.vedic.bodies[b]?.sign;
  return !!sa && !!sb && VEDIC_RULER[sa] === b && VEDIC_RULER[sb] === a;
}
function associated(a: BodyId, b: BodyId, chart: NatalChart): boolean {
  return sameHouse(a, b, chart) || mutualAspect(a, b, chart) || signExchange(a, b, chart);
}

function yogaStr(planets: BodyId[], chart: NatalChart): 'strong' | 'moderate' | 'weak' {
  const lagnaSign = chart.vedic.ascendantRashi;
  const scores = planets.map(id => {
    const b = chart.vedic.bodies[id]; if (!b) return 0;
    const dig = getVedicDignity(id, b.sign);
    let s = 0;
    if (dig === 'exaltation' || dig === 'moolatrikona') s += 3;
    else if (dig === 'own') s += 2;
    else if (dig === 'debilitation') s -= 2;
    if (KENDRA.has(b.house) || TRIKONA.has(b.house)) s += 1;
    if (DUSTHANA.has(b.house)) s -= 1;
    if (checkCombust(id, chart)) s -= 1;
    const fr = getFunctionalRole(id, lagnaSign);
    if (fr === 'yogakaraka') s += 1;
    return s;
  });
  const avg = scores.reduce((a,b) => a+b, 0) / (scores.length || 1);
  return avg >= 2 ? 'strong' : avg >= 0 ? 'moderate' : 'weak';
}

// ── Lagna analysis ─────────────────────────────────────────────────────────────

function buildLagnaAnalysis(chart: NatalChart): LagnaAnalysis {
  const lagnaSign = chart.vedic.ascendantRashi;
  const ascBody   = chart.vedic.bodies.asc;
  const lord      = VEDIC_RULER[lagnaSign];
  const lordBody  = chart.vedic.bodies[lord];

  const planetsInLagna: BodyId[] = (
    ['sun','moon','mercury','venus','mars','jupiter','saturn','trueNode','southNode'] as BodyId[]
  ).filter(id => chart.vedic.bodies[id]?.house === 1);

  const lordAspects: string[] = [];
  if (lordBody) {
    const MAIN: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','trueNode','southNode'];
    for (const other of MAIN) {
      if (other === lord) continue;
      const ob = chart.vedic.bodies[other];
      if (ob && vedicAspects(ob.house, other).has(lordBody.house)) {
        lordAspects.push(`${lbl(other)} aspects from H${ob.house}`);
      }
    }
  }

  return {
    sign:           lagnaSign,
    nakshatra:      ascBody?.nakshatra ?? null,
    pada:           ascBody?.nakshatraPada ?? null,
    nakshatraLord:  ascBody?.nakshatraLord ?? null,
    lord,
    lordSign:       lordBody?.sign ?? null,
    lordHouse:      lordBody?.house ?? null,
    lordNakshatra:  lordBody?.nakshatra ?? null,
    lordDignity:    lordBody ? getVedicDignity(lord, lordBody.sign) : null,
    lordHouseGroup: lordBody ? getHouseGroup(lordBody.house) : 'neutral',
    planetsInLagna,
    lordAspects: lordAspects.slice(0, 4),
    ownedHouseList: ownedHouses(lord, lagnaSign),
  };
}

// ── Moon analysis ──────────────────────────────────────────────────────────────

function buildMoonAnalysis(chart: NatalChart): MoonAnalysis {
  const m = chart.vedic.bodies.moon;
  if (!m) return { sign: null, nakshatra: null, pada: null, nakshatraLord: null, house: null, dignity: null, dispositor: null, dispositorSign: null, dispositorHouse: null, aspectingPlanets: [], hasKemadruma: false };

  const dispositor     = VEDIC_RULER[m.sign];
  const dispositorBody = chart.vedic.bodies[dispositor];

  // Planets aspecting Moon's house
  const MAIN: BodyId[] = ['sun','mercury','venus','mars','jupiter','saturn','trueNode','southNode'];
  const aspectingPlanets = MAIN.filter(id => {
    const b = chart.vedic.bodies[id];
    return b && vedicAspects(b.house, id).has(m.house);
  });

  // Kemadruma: no planet in 2nd or 12th house from Moon
  const moonH = m.house;
  const h2 = ((moonH - 1 + 1) % 12) + 1;
  const h12 = ((moonH - 1 + 11) % 12) + 1;
  const hasKemadruma = !MAIN.some(id => {
    const h = chart.vedic.bodies[id]?.house;
    return h === h2 || h === h12;
  });

  return {
    sign:            m.sign,
    nakshatra:       m.nakshatra,
    pada:            m.nakshatraPada,
    nakshatraLord:   m.nakshatraLord,
    house:           m.house,
    dignity:         getVedicDignity('moon', m.sign),
    dispositor,
    dispositorSign:  dispositorBody?.sign ?? null,
    dispositorHouse: dispositorBody?.house ?? null,
    aspectingPlanets,
    hasKemadruma,
  };
}

// ── House lord analysis (key houses) ──────────────────────────────────────────

function buildHouseLords(chart: NatalChart): Partial<Record<number, VedicHouseLord>> {
  const lagnaSign = chart.vedic.ascendantRashi;
  const KEY_HOUSES = [1, 2, 4, 5, 7, 9, 10, 11, 12];
  const result: Partial<Record<number, VedicHouseLord>> = {};
  const MAIN: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','trueNode','southNode'];

  for (const h of KEY_HOUSES) {
    const sign  = houseSign(lagnaSign, h);
    const lord  = VEDIC_RULER[sign];
    const lb    = chart.vedic.bodies[lord];

    const occupants = MAIN.filter(id => chart.vedic.bodies[id]?.house === h);
    const aspectingPlanets = MAIN.filter(id => {
      const b = chart.vedic.bodies[id];
      return b && b.house !== h && vedicAspects(b.house, id).has(h);
    });

    result[h] = {
      house:            h,
      sign,
      lord,
      lordSign:         lb?.sign ?? null,
      lordHouse:        lb?.house ?? null,
      lordNakshatra:    lb?.nakshatra ?? null,
      lordDignity:      lb ? getVedicDignity(lord, lb.sign) : null,
      lordHouseGroup:   lb ? getHouseGroup(lb.house) : 'neutral',
      occupants,
      aspectingPlanets,
    };
  }
  return result;
}

// ── Planetary strengths ────────────────────────────────────────────────────────

function buildPlanetStrengths(chart: NatalChart): Partial<Record<BodyId, PlanetStrength>> {
  const lagnaSign = chart.vedic.ascendantRashi;
  const SCORED: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','trueNode','southNode'];
  const result: Partial<Record<BodyId, PlanetStrength>> = {};
  for (const id of SCORED) {
    const b = chart.vedic.bodies[id];
    if (!b) continue;
    result[id] = {
      bodyId:         id,
      dignity:        getVedicDignity(id, b.sign),
      houseGroup:     getHouseGroup(b.house),
      isRetrograde:   !!b.isRetrograde,
      isCombust:      checkCombust(id, chart),
      functionalRole: getFunctionalRole(id, lagnaSign),
      score:          computeScore(id, chart, lagnaSign),
    };
  }
  return result;
}

// ── Yoga detection ─────────────────────────────────────────────────────────────

function detectYogas(chart: NatalChart): VedicYoga[] {
  const yogas: VedicYoga[] = [];
  const lagnaSign = chart.vedic.ascendantRashi;
  const b = chart.vedic.bodies;
  const lordOf = (h: number): BodyId => VEDIC_RULER[houseSign(lagnaSign, h)];

  // ── Pancha Mahapurusha ──────────────────────────────────────────────────────
  const mahapurusha: [BodyId, string, SignId[]][] = [
    ['mars',    'Ruchaka', ['aries','scorpio','capricorn']],
    ['mercury', 'Bhadra',  ['gemini','virgo']],
    ['jupiter', 'Hamsa',   ['sagittarius','pisces','cancer']],
    ['venus',   'Malavya', ['taurus','libra','pisces']],
    ['saturn',  'Sasa',    ['capricorn','aquarius','libra']],
  ];
  for (const [planet, name, signs] of mahapurusha) {
    const pb = b[planet];
    if (!pb) continue;
    if (KENDRA.has(pb.house) && signs.includes(pb.sign)) {
      const str = yogaStr([planet], chart);
      yogas.push({
        name: `${name} Yoga (Pancha Mahapurusha)`,
        category: 'pancha-mahapurusha',
        description: `${lbl(planet)} in ${cap(pb.sign)} in a kendra (H${pb.house}) — the ${name} yoga produces exceptional qualities associated with ${lbl(planet)}: ${name === 'Ruchaka' ? 'courage and leadership' : name === 'Bhadra' ? 'intelligence and eloquence' : name === 'Hamsa' ? 'wisdom and spiritual depth' : name === 'Malavya' ? 'grace, pleasure, and artistry' : 'discipline, longevity, and mastery'}`,
        planets: [planet],
        strength: str,
        affectedHouses: ownedHouses(planet, lagnaSign),
        note: `${lbl(planet)} rules ${ownedHouses(planet, lagnaSign).map(h => `H${h}`).join(' and ')}`,
      });
    }
  }

  // ── Gaja Kesari ─────────────────────────────────────────────────────────────
  const moon = b.moon, jup = b.jupiter;
  if (moon && jup) {
    const diff = ((jup.house - moon.house + 12) % 12);
    if ([0,3,6,9].includes(diff)) { // 1st, 4th, 7th, 10th from Moon
      yogas.push({
        name: 'Gaja Kesari Yoga',
        category: 'raja',
        description: `Jupiter in the ${['1st','4th','7th','10th'][[0,3,6,9].indexOf(diff)]} house from Moon — this yoga produces intelligence, reputation, and a quality of distinction that remains in the memory of those encountered`,
        planets: ['moon', 'jupiter'],
        strength: yogaStr(['moon','jupiter'], chart),
        affectedHouses: [moon.house, jup.house],
        note: `Moon H${moon.house} · Jupiter H${jup.house}`,
      });
    }
  }

  // ── Budha-Aditya ────────────────────────────────────────────────────────────
  const sun = b.sun, mer = b.mercury;
  if (sun && mer && sameHouse('sun', 'mercury', chart)) {
    const orb = Math.abs(sun.longitudeSidereal - mer.longitudeSidereal);
    if (Math.min(orb, 360 - orb) > 7) { // not too deeply combust
      yogas.push({
        name: 'Budha-Aditya Yoga',
        category: 'sun',
        description: `Sun and Mercury conjunct in H${sun.house} — sharp intelligence, communication skill, and mental clarity; the intellect is aligned with the core will rather than operating separately`,
        planets: ['sun','mercury'],
        strength: yogaStr(['sun','mercury'], chart),
        affectedHouses: [sun.house],
        note: `Orb ${Math.min(orb, 360-orb).toFixed(1)}°`,
      });
    }
  }

  // ── Chandra-Mangala ─────────────────────────────────────────────────────────
  if (moon && b.mars) {
    if (associated('moon', 'mars', chart)) {
      yogas.push({
        name: 'Chandra-Mangala Yoga',
        category: 'chandra',
        description: `Moon and Mars in strong association — emotional drive, entrepreneurial instinct, and capacity to act from feeling rather than deliberation; this is both a wealth-building and a volatility pattern`,
        planets: ['moon','mars'],
        strength: yogaStr(['moon','mars'], chart),
        affectedHouses: [moon.house, b.mars.house],
        note: sameHouse('moon','mars',chart) ? 'Conjunct' : mutualAspect('moon','mars',chart) ? 'Mutual aspect' : 'Exchange',
      });
    }
  }

  // ── Raja Yoga (kendra + trikona lord association) ───────────────────────────
  const kendraLords = [4,7,10].map(lordOf);
  const trikonaLords = [5,9].map(lordOf);
  const lagnaLord = lordOf(1);
  const seen = new Set<string>();

  for (const k of [...kendraLords, lagnaLord]) {
    for (const t of [...trikonaLords, lagnaLord]) {
      if (k === t) continue;
      if (!b[k] || !b[t]) continue;
      const key = [k,t].sort().join(',');
      if (seen.has(key)) continue;
      if (associated(k, t, chart)) {
        seen.add(key);
        const kH = ownedHouses(k, lagnaSign);
        const tH = ownedHouses(t, lagnaSign);
        const str = yogaStr([k, t], chart);
        if (str === 'weak') continue; // skip weak raja yogas to avoid noise
        yogas.push({
          name: 'Raja Yoga',
          category: 'raja',
          description: `${lbl(k)} (lord of ${kH.map(h=>`H${h}`).join('/')}) and ${lbl(t)} (lord of ${tH.map(h=>`H${h}`).join('/')}) in association — kendra-trikona lordship combination that elevates achievement, authority, and public recognition`,
          planets: [k, t],
          strength: str,
          affectedHouses: [...new Set([...kH, ...tH])],
          note: sameHouse(k,t,chart) ? `Conjunct in H${b[k]!.house}` : mutualAspect(k,t,chart) ? 'Mutual aspect' : 'Exchange',
        });
      }
    }
  }

  // ── Dharma-Karma Adhipati ───────────────────────────────────────────────────
  const l9 = lordOf(9), l10 = lordOf(10);
  if (l9 !== l10 && b[l9] && b[l10] && associated(l9, l10, chart)) {
    const k9 = [9, ...ownedHouses(l9, lagnaSign).filter(h => h !== 9)];
    const k10 = [10, ...ownedHouses(l10, lagnaSign).filter(h => h !== 10)];
    yogas.push({
      name: 'Dharma-Karma Adhipati Yoga',
      category: 'dharma',
      description: `${lbl(l9)} (9th lord, dharma) and ${lbl(l10)} (10th lord, karma) in association — career and life purpose are unusually well integrated; work becomes a vehicle for dharmic expression`,
      planets: [l9, l10],
      strength: yogaStr([l9, l10], chart),
      affectedHouses: [...new Set([...k9, ...k10])],
      note: `${lbl(l9)} H${b[l9]!.house} · ${lbl(l10)} H${b[l10]!.house}`,
    });
  }

  // ── Dhana Yoga (2nd + 11th lord association) ────────────────────────────────
  const l2 = lordOf(2), l11 = lordOf(11);
  if (b[l2] && b[l11] && associated(l2, l11, chart)) {
    yogas.push({
      name: 'Dhana Yoga',
      category: 'dhana',
      description: `${lbl(l2)} (2nd lord, accumulated wealth) and ${lbl(l11)} (11th lord, income and gains) in association — strong material acquisition pattern; wealth accumulation is a prominent life theme`,
      planets: [l2, l11],
      strength: yogaStr([l2, l11], chart),
      affectedHouses: [2, 11],
      note: `${lbl(l2)} H${b[l2]!.house} · ${lbl(l11)} H${b[l11]!.house}`,
    });
  }

  // ── Parivartana Yoga (sign exchange) ───────────────────────────────────────
  const MAIN: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn'];
  const seenPV = new Set<string>();
  for (let i = 0; i < MAIN.length; i++) {
    for (let j = i + 1; j < MAIN.length; j++) {
      const a = MAIN[i], bx = MAIN[j];
      if (!b[a] || !b[bx]) continue;
      const key = [a,bx].sort().join(',');
      if (!seenPV.has(key) && signExchange(a, bx, chart)) {
        seenPV.add(key);
        const aH = ownedHouses(a, lagnaSign);
        const bH = ownedHouses(bx, lagnaSign);
        yogas.push({
          name: 'Parivartana Yoga',
          category: 'parivartana',
          description: `${lbl(a)} in ${cap(b[a]!.sign)} and ${lbl(bx)} in ${cap(b[bx]!.sign)} — mutual sign exchange links H${aH.join('/')} and H${bH.join('/')} into a single operating system; these two life domains are deeply intertwined`,
          planets: [a, bx],
          strength: yogaStr([a, bx], chart),
          affectedHouses: [...new Set([...aH, ...bH])],
          note: `${lbl(a)} → ${cap(b[a]!.sign)}, ${lbl(bx)} → ${cap(b[bx]!.sign)}`,
        });
      }
    }
  }

  // ── Viparita Raja Yoga (dusthana lord in dusthana) ─────────────────────────
  for (const dh of [6,8,12]) {
    const dl = lordOf(dh);
    if (!b[dl]) continue;
    const dlHouse = b[dl]!.house;
    if (DUSTHANA.has(dlHouse) && dlHouse !== dh) {
      yogas.push({
        name: 'Viparita Raja Yoga',
        category: 'viparita',
        description: `${lbl(dl)} (${dh}th lord) placed in H${dlHouse} — the house of difficulty turns in on itself, converting obstacles into unexpected rise; setbacks and adversity become the actual mechanism of advancement`,
        planets: [dl],
        strength: yogaStr([dl], chart),
        affectedHouses: [dh, dlHouse],
        note: `${dh}th lord in H${dlHouse}`,
      });
    }
  }

  // ── Neecha Bhanga Raja Yoga ────────────────────────────────────────────────
  for (const [planet, debSign] of Object.entries(DEBIL_SIGN) as [BodyId, SignId][]) {
    const pb = b[planet];
    if (!pb || pb.sign !== debSign) continue;
    // Check if planet's sign-dispositor or exaltation-lord is in kendra
    const dispositor = VEDIC_RULER[debSign];
    const dispBody   = b[dispositor];
    const exaltLord  = Object.entries(EXALT_SIGN).find(([,s]) => s === debSign)?.[0] as BodyId | undefined;
    const exaltBody  = exaltLord ? b[exaltLord] : undefined;
    const isNeechaBhanga =
      (dispBody && (KENDRA.has(dispBody.house) || TRIKONA.has(dispBody.house))) ||
      (exaltBody && (KENDRA.has(exaltBody.house) || TRIKONA.has(exaltBody.house)));
    if (isNeechaBhanga) {
      yogas.push({
        name: 'Neecha Bhanga Raja Yoga',
        category: 'raja',
        description: `${lbl(planet)} is debilitated in ${cap(debSign)} but the debilitation is cancelled — the initial weakness becomes a source of compensatory strength after a period of struggle and refinement`,
        planets: [planet],
        strength: 'moderate',
        affectedHouses: ownedHouses(planet, lagnaSign),
        note: `${lbl(planet)} debil in ${cap(debSign)}; cancellation via ${dispBody && (KENDRA.has(dispBody.house) || TRIKONA.has(dispBody.house)) ? lbl(dispositor) + ' in kendra/trikona' : exaltLord ? lbl(exaltLord) + ' in kendra/trikona' : ''}`,
      });
    }
  }

  // ── Kemadruma (challenging — Moon isolated) ────────────────────────────────
  if (moon) {
    const h2 = ((moon.house - 1 + 1) % 12) + 1;
    const h12 = ((moon.house - 1 + 11) % 12) + 1;
    const noNeighbours = !MAIN.some(id => {
      const h = b[id]?.house;
      return h === h2 || h === h12;
    });
    if (noNeighbours && !MAIN.some(id => id !== 'moon' && b[id]?.house === moon.house)) {
      yogas.push({
        name: 'Kemadruma Yoga',
        category: 'challenging',
        description: `Moon has no planets in the 2nd or 12th house from it and no conjunct planets — the mind operates in relative isolation, without the ballast that neighbouring planets provide; emotional self-reliance is both the wound and the developed skill`,
        planets: ['moon'],
        strength: 'moderate',
        affectedHouses: [moon.house],
        note: 'No planets flanking Moon',
      });
    }
  }

  // Deduplicate by name+planet combo, keep max 10
  const unique = yogas.filter((y, i, arr) =>
    arr.findIndex(z => z.name === y.name && z.planets.join() === y.planets.join()) === i
  );
  return unique.slice(0, 10);
}

// ── Vedic theme scoring ────────────────────────────────────────────────────────

const VEDIC_THEME_LABELS: Record<string, string> = {
  dharma:         'Life Purpose & Dharmic Direction',
  karma:          'Career, Vocation & Public Role',
  artha:          'Wealth, Resources & Material Security',
  kama:           'Relationships, Partnership & Desire',
  moksha:         'Spirituality, Liberation & Inner Life',
  mind:           'Intellect, Communication & Learning',
  family:         'Home, Mother & Emotional Foundation',
  power:          'Authority, Leadership & Self-Sovereignty',
  transformation: 'Transformation, Depth & Hidden Dimensions',
  healing:        'Service, Health & Obstacles Overcome',
};

const HOUSE_THEME: Partial<Record<number, [string, number][]>> = {
  1:  [['power',1],['dharma',0.5]],
  2:  [['artha',1]],
  3:  [['mind',0.8]],
  4:  [['family',1.2],['moksha',0.5]],
  5:  [['dharma',0.8],['mind',0.5]],
  7:  [['kama',1.2]],
  8:  [['transformation',1.2],['moksha',0.7]],
  9:  [['dharma',1.5],['moksha',0.5]],
  10: [['karma',1.5],['power',0.8]],
  11: [['artha',0.8],['kama',0.5]],
  12: [['moksha',1.2],['transformation',0.5]],
};

function scoreVedicThemes(chart: NatalChart, analysis: Partial<VedicAnalysis>): Record<string, { weight: number; indicators: string[] }> {
  const scores: Record<string, { weight: number; indicators: string[] }> = {};
  const lagnaSign = chart.vedic.ascendantRashi;
  const bodies = chart.vedic.bodies;

  function add(theme: string, w: number, reason: string) {
    if (!scores[theme]) scores[theme] = { weight: 0, indicators: [] };
    scores[theme].weight = Math.round((scores[theme].weight + w) * 10) / 10;
    if (scores[theme].indicators.length < 6) scores[theme].indicators.push(reason);
  }

  const SCORED: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','trueNode','southNode'];

  // Planet in house → house theme
  for (const id of SCORED) {
    const pb = bodies[id];
    if (!pb) continue;
    const w = computeScore(id, chart, lagnaSign) / 10 * 2; // 0-2 based on strength
    for (const [theme, base] of HOUSE_THEME[pb.house] ?? []) {
      add(theme, base * w, `${lbl(id)} in H${pb.house}`);
    }
  }

  // Lagna lord placement
  const lagnaLord = VEDIC_RULER[lagnaSign];
  const ll = bodies[lagnaLord];
  if (ll) {
    for (const [theme, base] of HOUSE_THEME[ll.house] ?? []) {
      add(theme, base * 1.5, `Lagna lord (${lbl(lagnaLord)}) in H${ll.house}`);
    }
    add('power', computeScore(lagnaLord, chart, lagnaSign) / 5, `Lagna lord strength`);
  }

  // Moon nakshatra → themes
  const moonBody = bodies.moon;
  if (moonBody) {
    const nak = moonBody.nakshatra;
    const nakKey = NAK_KEY[nak];
    if (nakKey?.drive.includes('wealth') || nakKey?.drive.includes('abundance')) add('artha', 1.5, `Moon nakshatra ${nak}: wealth drive`);
    if (nakKey?.drive.includes('wisdom') || nakKey?.drive.includes('dharma') || nakKey?.drive.includes('spiritual')) add('dharma', 1.5, `Moon nakshatra ${nak}`);
    if (nakKey?.drive.includes('power') || nakKey?.drive.includes('authority')) add('power', 1.5, `Moon nakshatra ${nak}`);
    if (nakKey?.drive.includes('love') || nakKey?.drive.includes('pleasure') || nakKey?.drive.includes('partnership')) add('kama', 1.5, `Moon nakshatra ${nak}`);
    if (nakKey?.drive.includes('healing') || nakKey?.drive.includes('service')) add('healing', 1.5, `Moon nakshatra ${nak}`);
  }

  // Sun nakshatra/house
  const sunBody = bodies.sun;
  if (sunBody) {
    for (const [theme, base] of HOUSE_THEME[sunBody.house] ?? []) {
      add(theme, base * 1.2, `Sun in H${sunBody.house}`);
    }
  }

  // Yogas contribute to themes
  for (const yoga of (analysis.yogas ?? [])) {
    const w = yoga.strength === 'strong' ? 2.5 : yoga.strength === 'moderate' ? 1.5 : 0.8;
    if (yoga.category === 'raja')    { add('power', w, `${yoga.name}`); add('karma', w * 0.7, yoga.name); }
    if (yoga.category === 'dhana')   { add('artha', w * 1.5, yoga.name); }
    if (yoga.category === 'dharma')  { add('dharma', w, yoga.name); add('karma', w * 0.8, yoga.name); }
    if (yoga.category === 'chandra') { add('artha', w * 0.8, yoga.name); add('kama', w * 0.5, yoga.name); }
    if (yoga.category === 'viparita'){ add('transformation', w, yoga.name); add('power', w * 0.7, yoga.name); }
    if (yoga.category === 'parivartana') {
      for (const h of yoga.affectedHouses) {
        for (const [theme, base] of HOUSE_THEME[h] ?? []) add(theme, base * w * 0.6, yoga.name);
      }
    }
  }

  // Rahu/Ketu axis themes
  const rahu = bodies.trueNode, ketu = bodies.southNode;
  if (rahu) {
    for (const [theme, base] of HOUSE_THEME[rahu.house] ?? []) add(theme, base * 1.2, `Rahu in H${rahu.house}`);
  }
  if (ketu) {
    add('moksha', 1.5, `Ketu in H${ketu.house}`);
    if (ketu.house === 8 || ketu.house === 12) add('transformation', 1.2, `Ketu in H${ketu.house}`);
  }

  // Jupiter → dharma, 12th house → moksha
  const jup = bodies.jupiter;
  if (jup) {
    add('dharma', computeScore('jupiter', chart, lagnaSign) / 5, `Jupiter H${jup.house}`);
    if (jup.house === 12) add('moksha', 1.5, 'Jupiter in H12');
  }

  return scores;
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

export function analyzeVedicChart(chart: NatalChart): VedicAnalysis {
  const lagnaSign    = chart.vedic.ascendantRashi;
  const lagnaAnalysis = buildLagnaAnalysis(chart);
  const moonAnalysis  = buildMoonAnalysis(chart);
  const houseLords    = buildHouseLords(chart);
  const planetStrengths = buildPlanetStrengths(chart);
  const yogas         = detectYogas(chart);

  const sun = chart.vedic.bodies.sun;
  const rahu = chart.vedic.bodies.trueNode;
  const ketu = chart.vedic.bodies.southNode;

  const themeScores = scoreVedicThemes(chart, { yogas });
  const dominantThemes: VedicTheme[] = Object.entries(themeScores)
    .map(([id, data]) => ({ id, label: VEDIC_THEME_LABELS[id] ?? id, weight: data.weight, indicators: data.indicators }))
    .filter(t => t.weight >= 1.5)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  return {
    lagnaSign,
    lagnaAnalysis,
    moonAnalysis,
    sunHouse:     sun?.house ?? null,
    sunSign:      sun?.sign  ?? null,
    sunNakshatra: sun?.nakshatra ?? null,
    sunDignity:   sun ? getVedicDignity('sun', sun.sign) : null,
    houseLords,
    planetStrengths,
    yogas,
    rahuHouse:     rahu?.house ?? null,
    rahuSign:      rahu?.sign  ?? null,
    rahuNakshatra: rahu?.nakshatra ?? null,
    ketuHouse:     ketu?.house ?? null,
    ketuSign:      ketu?.sign  ?? null,
    ketuNakshatra: ketu?.nakshatra ?? null,
    dominantThemes,
    themeScores,
  };
}

// ── Formatter ──────────────────────────────────────────────────────────────────

export function formatVedicAnalysis(chart: NatalChart, analysis: VedicAnalysis, dasha?: DashaResult): string {
  const L: string[] = [];
  const line = (s = '') => L.push(s);
  const bodies = chart.vedic.bodies;

  line('══════════════════════════════════════════════════');
  line('VEDIC CHART ANALYSIS — PRE-COMPUTED SYNTHESIS (Jyotish)');
  line('══════════════════════════════════════════════════');
  line();

  // ── Lagna
  const la = analysis.lagnaAnalysis;
  line(`LAGNA: ${cap(la.sign)}${la.nakshatra ? ` · ${cap(la.nakshatra)} pada ${la.pada}` : ''}`);
  if (la.nakshatraLord) line(`  Lagna nakshatra lord: ${lbl(la.nakshatraLord)}`);
  const lordDig = la.lordDignity && la.lordDignity !== 'neutral' ? ` · ${la.lordDignity}` : '';
  line(`  Lagna lord: ${lbl(la.lord)} in ${la.lordSign ? cap(la.lordSign) : '?'} H${la.lordHouse ?? '?'}${lordDig} · ${la.lordHouseGroup}`);
  if (la.lordNakshatra) line(`  Lagna lord nakshatra: ${cap(la.lordNakshatra)}`);
  if (la.lordAspects.length) line(`  Aspects to lagna lord: ${la.lordAspects.join('; ')}`);
  if (la.planetsInLagna.length) line(`  Planets in 1st house: ${la.planetsInLagna.map(lbl).join(', ')}`);
  line(`  Lagna lord rules: ${la.ownedHouseList.map(h=>`H${h}`).join(', ')}`);
  line();

  // ── Moon
  const ma = analysis.moonAnalysis;
  if (ma.sign) {
    const moonDig = ma.dignity && ma.dignity !== 'neutral' ? ` · ${ma.dignity}` : '';
    line(`MOON (CHANDRA): ${cap(ma.sign)} H${ma.house}${moonDig}${ma.nakshatra ? ` · ${cap(ma.nakshatra)} pada ${ma.pada}` : ''}`);
    if (ma.nakshatraLord) line(`  Moon nakshatra lord: ${lbl(ma.nakshatraLord)}`);
    if (ma.dispositor) line(`  Dispositor: ${lbl(ma.dispositor)} in ${ma.dispositorSign ? cap(ma.dispositorSign) : '?'} H${ma.dispositorHouse ?? '?'}`);
    if (ma.aspectingPlanets.length) line(`  Planets aspecting Moon: ${ma.aspectingPlanets.map(lbl).join(', ')}`);
    if (ma.hasKemadruma) line(`  ⚠ Kemadruma condition — no planets flanking Moon`);
    const nakData = ma.nakshatra ? NAK_KEY[ma.nakshatra] : null;
    if (nakData) {
      line(`  Nakshatra drive: ${nakData.drive}`);
      line(`  Nakshatra shadow: ${nakData.shadow}`);
    }
    line();
  }

  // ── Sun
  if (analysis.sunSign) {
    const sunDig = analysis.sunDignity && analysis.sunDignity !== 'neutral' ? ` · ${analysis.sunDignity}` : '';
    line(`SUN (SURYA): ${cap(analysis.sunSign)} H${analysis.sunHouse}${sunDig}${analysis.sunNakshatra ? ` · ${cap(analysis.sunNakshatra)}` : ''}`);
    line();
  }

  // ── Planetary strengths
  const strongs  = Object.values(analysis.planetStrengths).filter(p => p && p.score >= 7) as PlanetStrength[];
  const moderate = Object.values(analysis.planetStrengths).filter(p => p && p.score >= 4 && p.score < 7) as PlanetStrength[];
  const weak     = Object.values(analysis.planetStrengths).filter(p => p && p.score < 4) as PlanetStrength[];
  const retro    = Object.values(analysis.planetStrengths).filter(p => p?.isRetrograde) as PlanetStrength[];
  const combust  = Object.values(analysis.planetStrengths).filter(p => p?.isCombust) as PlanetStrength[];
  const yogakarakas = Object.values(analysis.planetStrengths).filter(p => p?.functionalRole === 'yogakaraka') as PlanetStrength[];

  if (yogakarakas.length) line(`YOGAKARAKAS (rules kendra + trikona): ${yogakarakas.map(p => `${lbl(p.bodyId)} (H${bodies[p.bodyId]?.house})`).join(', ')}`);
  if (strongs.length)  line(`Strong planets (7-10): ${strongs.map(p=>`${lbl(p.bodyId)} ${p.dignity !== 'neutral' ? `[${p.dignity}]` : ''} H${bodies[p.bodyId]?.house}`).join(', ')}`);
  if (moderate.length) line(`Moderate (4-6): ${moderate.map(p=>lbl(p.bodyId)).join(', ')}`);
  if (weak.length)     line(`Challenged (0-3): ${weak.map(p=>`${lbl(p.bodyId)}${p.dignity === 'debilitation' ? ' [debil]' : ''}`).join(', ')}`);
  if (retro.length)    line(`Retrograde: ${retro.map(p=>lbl(p.bodyId)+'℞').join(', ')}`);
  if (combust.length)  line(`Combust: ${combust.map(p=>lbl(p.bodyId)).join(', ')}`);
  line();

  // ── Yogas
  if (analysis.yogas.length) {
    line('YOGAS DETECTED:');
    for (const y of analysis.yogas) {
      line(`  • ${y.name} [${y.strength}]: ${y.description.slice(0, 120)}${y.description.length > 120 ? '…' : ''}`);
      if (y.note) line(`    ${y.note}`);
    }
    line();
  }

  // ── Key house lords
  line('KEY HOUSE LORDS:');
  const KEY = [4, 5, 7, 9, 10, 12];
  const houseDesc: Record<number, string> = { 4:'home/mother/emotional roots', 5:'intelligence/creativity/past merit', 7:'marriage/partnership', 9:'dharma/fortune/teachers', 10:'career/karma/public role', 12:'liberation/foreign/retreat' };
  for (const h of KEY) {
    const hl = analysis.houseLords[h];
    if (!hl) continue;
    const dig = hl.lordDignity && hl.lordDignity !== 'neutral' ? ` [${hl.lordDignity}]` : '';
    const occ = hl.occupants.length ? ` · Occupants: ${hl.occupants.map(lbl).join(', ')}` : '';
    const asp = hl.aspectingPlanets.length ? ` · Aspected by: ${hl.aspectingPlanets.map(lbl).join(', ')}` : '';
    line(`  H${h} (${houseDesc[h]}): ${cap(hl.sign)} · Lord ${lbl(hl.lord)} in H${hl.lordHouse ?? '?'} ${hl.lordSign ? cap(hl.lordSign) : ''}${dig}${occ}${asp}`);
  }
  line();

  // ── Rahu/Ketu
  const rahu = bodies.trueNode, ketu = bodies.southNode;
  if (rahu && ketu) {
    line(`RAHU/KETU AXIS: Rahu ${cap(analysis.rahuSign ?? '')} H${analysis.rahuHouse}${analysis.rahuNakshatra ? ` · ${cap(analysis.rahuNakshatra)}` : ''} / Ketu ${cap(analysis.ketuSign ?? '')} H${analysis.ketuHouse}${analysis.ketuNakshatra ? ` · ${cap(analysis.ketuNakshatra)}` : ''}`);
    const rahuDisp = analysis.rahuSign ? lbl(VEDIC_RULER[analysis.rahuSign]) : null;
    const ketuDisp = analysis.ketuSign ? lbl(VEDIC_RULER[analysis.ketuSign]) : null;
    if (rahuDisp) line(`  Rahu dispositor: ${rahuDisp} H${bodies[VEDIC_RULER[analysis.rahuSign!]]?.house ?? '?'}`);
    if (ketuDisp) line(`  Ketu dispositor: ${ketuDisp} H${bodies[VEDIC_RULER[analysis.ketuSign!]]?.house ?? '?'}`);
    line();
  }

  // ── Dominant themes
  line('DOMINANT VEDIC THEMES — PRIMARY INTERPRETIVE FRAME:');
  line('Use these as organizing lens; do not interpret placements in isolation.');
  line();
  for (let i = 0; i < analysis.dominantThemes.length; i++) {
    const t = analysis.dominantThemes[i];
    line(`${i+1}. ${t.label.toUpperCase()} (score: ${t.weight})`);
    line(`   Convergence: ${t.indicators.slice(0,4).join(' + ')}`);
    if (i < analysis.dominantThemes.length - 1) line();
  }
  line();

  // ── Dasha (if provided)
  if (dasha) {
    line('CURRENT VIMSHOTTARI DASHA:');
    const maha     = dasha.mahadasha;
    const antar    = dasha.antardasha;
    const mahaId   = DASHA_BODY[maha.lord];
    const antarId  = DASHA_BODY[antar.lord];
    const mahaBody = mahaId ? bodies[mahaId] : undefined;
    const antarBody = antarId ? bodies[antarId] : undefined;
    const mahaOwned = mahaId ? ownedHouses(mahaId, chart.vedic.ascendantRashi).map(h=>`H${h}`).join('/') : '';
    const antarOwned = antarId ? ownedHouses(antarId, chart.vedic.ascendantRashi).map(h=>`H${h}`).join('/') : '';
    const mahaRoleStr = mahaId ? ` [${getFunctionalRole(mahaId, chart.vedic.ascendantRashi)}]` : '';
    line(`  Mahadasha: ${cap(maha.lord)} (until ${maha.endISO})${mahaRoleStr}`);
    if (mahaBody) {
      const dig = getVedicDignity(mahaId!, mahaBody.sign);
      line(`    ${lbl(mahaId!)} in ${cap(mahaBody.sign)} H${mahaBody.house}${dig !== 'neutral' ? ` [${dig}]` : ''} · ${mahaBody.nakshatra ? cap(mahaBody.nakshatra) : ''} · rules ${mahaOwned}`);
    }
    line(`  Antardasha: ${cap(antar.lord)} (until ${antar.endISO})`);
    if (antarBody) {
      const dig = getVedicDignity(antarId!, antarBody.sign);
      line(`    ${lbl(antarId!)} in ${cap(antarBody.sign)} H${antarBody.house}${dig !== 'neutral' ? ` [${dig}]` : ''} · ${antarBody.nakshatra ? cap(antarBody.nakshatra) : ''} · rules ${antarOwned}`);
    }
    line();
  }

  line('══════════════════════════════════════════════════');
  return L.join('\n');
}

// ── Per-section synthesis context injectors ────────────────────────────────────

/** Synthesis context prepended to a Vedic planet interpretation prompt. */
export function vedicBodyContext(bodyId: BodyId, chart: NatalChart, analysis: VedicAnalysis): string {
  const L: string[] = ['VEDIC SYNTHESIS CONTEXT:'];
  const b = chart.vedic.bodies[bodyId];
  const lagnaSign = chart.vedic.ascendantRashi;

  L.push(`Dominant themes: ${analysis.dominantThemes.slice(0,3).map(t=>`${t.label} (${t.weight})`).join(' · ')}`);

  // Functional role of this planet
  const fr = getFunctionalRole(bodyId, lagnaSign);
  const owned = ownedHouses(bodyId, lagnaSign);
  L.push(`${lbl(bodyId)} functional role: ${fr} · rules ${owned.map(h=>`H${h}`).join(', ')}`);

  // Dignity
  if (b) {
    const dig = getVedicDignity(bodyId, b.sign);
    if (dig !== 'neutral') L.push(`Dignity: ${dig} in ${cap(b.sign)}`);
    if (b.isRetrograde)    L.push(`Retrograde: energy internalised — slower but deeper manifestation`);
    if (checkCombust(bodyId, chart)) L.push(`Combust: within orb of Sun — expression partially subsumed by solar will`);
  }

  // Yogas involving this planet
  const itsYogas = analysis.yogas.filter(y => y.planets.includes(bodyId));
  if (itsYogas.length) {
    L.push('Yogas involving this planet:');
    itsYogas.forEach(y => L.push(`  • ${y.name} [${y.strength}] — ${y.note}`));
  }

  // Lagna lord relationship
  if (bodyId === analysis.lagnaAnalysis.lord) {
    L.push(`THIS IS THE LAGNA LORD — its condition governs the chart's overall life expression. Interpret with full weight.`);
  }

  // Moon dispositor chain
  if (bodyId === analysis.moonAnalysis.dispositor) {
    L.push(`This planet is the Moon's dispositor — it governs the quality and stability of the mind, emotions, and perception.`);
  }

  return L.join('\n');
}

/** Synthesis context for a house interpretation prompt. */
export function vedicHouseContext(houseNum: number, chart: NatalChart, analysis: VedicAnalysis): string {
  const L: string[] = ['VEDIC SYNTHESIS CONTEXT:'];
  L.push(`Dominant themes: ${analysis.dominantThemes.slice(0,3).map(t=>t.label).join(' · ')}`);

  const hl = analysis.houseLords[houseNum];
  if (hl) {
    const dig = hl.lordDignity && hl.lordDignity !== 'neutral' ? ` [${hl.lordDignity}]` : '';
    L.push(`H${houseNum} lord: ${lbl(hl.lord)} in H${hl.lordHouse ?? '?'} (${hl.lordHouseGroup})${dig}`);
    if (hl.occupants.length) L.push(`Occupants: ${hl.occupants.map(lbl).join(', ')}`);
    if (hl.aspectingPlanets.length) L.push(`Aspecting planets: ${hl.aspectingPlanets.map(lbl).join(', ')}`);
  }

  const hYogas = analysis.yogas.filter(y => y.affectedHouses.includes(houseNum));
  if (hYogas.length) {
    L.push('Yogas affecting this house:');
    hYogas.forEach(y => L.push(`  • ${y.name} [${y.strength}]`));
  }
  return L.join('\n');
}

/** Synthesis context for a dasha interpretation prompt. */
export function vedicDashaContext(chart: NatalChart, analysis: VedicAnalysis): string {
  const L: string[] = ['VEDIC SYNTHESIS CONTEXT:'];
  L.push(`Dominant themes: ${analysis.dominantThemes.slice(0,3).map(t=>t.label).join(' · ')}`);
  L.push(`Lagna lord: ${lbl(analysis.lagnaAnalysis.lord)} in ${cap(analysis.lagnaAnalysis.lordSign ?? '')} H${analysis.lagnaAnalysis.lordHouse} [${analysis.lagnaAnalysis.lordHouseGroup}]`);
  if (analysis.yogas.length) {
    const rajaYogas = analysis.yogas.filter(y => y.category === 'raja' || y.category === 'dharma');
    if (rajaYogas.length) L.push(`Active yogas: ${rajaYogas.map(y=>y.name).join(', ')}`);
  }
  return L.join('\n');
}
