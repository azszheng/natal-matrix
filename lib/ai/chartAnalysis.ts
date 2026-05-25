/**
 * chartAnalysis.ts — Weighted symbolic pattern-recognition engine.
 *
 * Pure synchronous functions over NatalChart data. Produces a ChartAnalysis
 * object that is formatted as a structured text block and prepended to every
 * AI request, giving the model a pre-digested view of dominant themes instead
 * of raw coordinate data.
 *
 * Extensibility: the raw `themeScores` map is exposed so a future
 * psychological-calibration layer can modify weights or inject indicators
 * without touching the astrology logic.
 */

import type { NatalChart, BodyId, SignId } from '@/lib/astro/types';

// ── Sign metadata ─────────────────────────────────────────────────────────────

export type ElementId  = 'fire' | 'earth' | 'air' | 'water';
export type ModalityId = 'cardinal' | 'fixed' | 'mutable';

const SIGN_ELEMENT: Record<SignId, ElementId> = {
  aries: 'fire',  taurus: 'earth',  gemini: 'air',       cancer: 'water',
  leo:   'fire',  virgo:  'earth',  libra:  'air',        scorpio: 'water',
  sagittarius: 'fire', capricorn: 'earth', aquarius: 'air', pisces: 'water',
};

const SIGN_MODALITY: Record<SignId, ModalityId> = {
  aries: 'cardinal',  taurus: 'fixed',    gemini: 'mutable',  cancer: 'cardinal',
  leo:   'fixed',     virgo:  'mutable',  libra:  'cardinal', scorpio: 'fixed',
  sagittarius: 'mutable', capricorn: 'cardinal', aquarius: 'fixed', pisces: 'mutable',
};

const TRAD_RULER: Record<SignId, BodyId> = {
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
};

// Planet weights for element/modality & theme scoring.
// Luminaries outweigh personal planets; outer planets carry background weight.
const BODY_W: Partial<Record<BodyId, number>> = {
  sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2,
  jupiter: 1.5, saturn: 1.5, uranus: 1, neptune: 1, pluto: 1,
  trueNode: 0.5, southNode: 0.5, chiron: 0.5,
};

const ANGULAR   = new Set([1, 4, 7, 10]);
const SUCCEDENT = new Set([2, 5, 8, 11]);

const SCORE_BODIES: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','trueNode','chiron'];
const TRACK_BODIES: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','trueNode','chiron'];

// ── Human-readable labels ─────────────────────────────────────────────────────

const BL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N.Node', southNode: 'S.Node', chiron: 'Chiron',
  blackMoonLilith: 'Lilith', asc: 'ASC', mc: 'MC', juno: 'Juno',
};

function lbl(id: BodyId): string { return BL[id] ?? id; }
function cap(s: string): string  { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Output types ──────────────────────────────────────────────────────────────

export type DominantTheme = {
  id:         string;
  label:      string;
  weight:     number;
  indicators: string[];
};

export type Stellium = {
  type:    'sign' | 'house';
  label:   string;
  planets: string[];
  bodyIds: BodyId[];
};

export type AstroConfiguration = {
  type:        'grand-trine' | 't-square' | 'grand-cross' | 'yod' | 'kite';
  planets:     string[];
  bodyIds:     BodyId[];
  element?:    ElementId;
  modality?:   ModalityId;
  description: string;
};

export type ChartAnalysis = {
  ascSign: SignId | null;
  chartRuler: {
    bodyId:             BodyId;
    label:              string;
    sign:               SignId;
    house:              number;
    dignity:            string | null;
    accidentalStrength: 'angular' | 'succedent' | 'cadent';
    aspects:            string[];
  } | null;
  sunMoonRelationship: {
    angle:            number;
    aspect:           string | null;
    phaseDescription: string;
  };
  elementBalance:  Record<ElementId,  { score: number; percent: number; planets: string[] }>;
  modalityBalance: Record<ModalityId, { score: number; percent: number; planets: string[] }>;
  dominantElement:  ElementId;
  weakestElement:   ElementId;
  dominantModality: ModalityId;
  hemisphereEmphasis: { north: number; south: number; east: number; west: number };
  chartShape:     string;
  stelliums:      Stellium[];
  configurations: AstroConfiguration[];
  angularPlanets: { bodyId: BodyId; label: string; sign: SignId; house: number }[];
  retrogrades:    BodyId[];
  criticalDegrees: { bodyId: BodyId; label: string; degree: number; type: 'ingress' | 'anaretic'; sign: SignId }[];
  dominantThemes:  DominantTheme[];
  themeScores:    Record<string, { weight: number; indicators: string[] }>;
};

// ── Chart Ruler ───────────────────────────────────────────────────────────────

function detectChartRuler(chart: NatalChart): ChartAnalysis['chartRuler'] {
  const ascSign = chart.western.bodies.asc?.sign;
  if (!ascSign) return null;
  const rulerId = TRAD_RULER[ascSign];
  const ruler   = chart.western.bodies[rulerId];
  if (!ruler) return null;

  const dignity    = chart.western.dignities[rulerId]?.label ?? null;
  const h          = ruler.house;
  const accidental: 'angular' | 'succedent' | 'cadent' =
    ANGULAR.has(h) ? 'angular' : SUCCEDENT.has(h) ? 'succedent' : 'cadent';

  const aspects = chart.western.aspects
    .filter(a => (a.a === rulerId || a.b === rulerId) && a.orb <= 6)
    .sort((x, y) => x.orb - y.orb).slice(0, 5)
    .map(a => {
      const other = a.a === rulerId ? a.b : a.a;
      return `${a.kind} ${lbl(other)} (${a.orb.toFixed(1)}°)`;
    });

  return { bodyId: rulerId, label: lbl(rulerId), sign: ruler.sign, house: h, dignity, accidentalStrength: accidental, aspects };
}

// ── Sun-Moon Relationship ─────────────────────────────────────────────────────

function sunMoonRelationship(chart: NatalChart): ChartAnalysis['sunMoonRelationship'] {
  const sun  = chart.western.bodies.sun;
  const moon = chart.western.bodies.moon;
  if (!sun || !moon) return { angle: 0, aspect: null, phaseDescription: 'Unknown' };

  const angle = ((moon.longitude - sun.longitude + 360) % 360);

  const phases: [number, string][] = [
    [22,  'New Moon — identity and emotion closely aligned; spontaneous self-expression; may lack self-reflective distance'],
    [67,  'Waxing Crescent — building phase; conscious effort to develop nascent drives; optimism tested by self-doubt'],
    [112, 'First Quarter — action phase; tension between will and instinct produces decisive growth through friction'],
    [157, 'Waxing Gibbous — refinement phase; strong drive to integrate self-expression; may be self-critical or perfectionistic'],
    [202, 'Full Moon — identity and emotional life in full illumination or tension; relationships are the primary mirror; heightened relational intensity'],
    [247, 'Waning Gibbous — impulse to transmit experience and hard-won wisdom; teaching and meaning-making orientation'],
    [292, 'Last Quarter — crisis of consciousness; re-examining beliefs and structures that no longer serve'],
    [361, 'Balsamic (Dark Moon) — completion and release; heightened inner sensitivity; old patterns being surrendered'],
  ];

  const phaseDescription = phases.find(([deg]) => angle < deg)?.[1] ?? 'Unknown phase';
  const asp = chart.western.aspects.find(a =>
    (a.a === 'sun' && a.b === 'moon') || (a.a === 'moon' && a.b === 'sun')
  );

  return { angle, aspect: asp?.kind ?? null, phaseDescription };
}

// ── Element & Modality Balance ─────────────────────────────────────────────────

function computeElementBalance(chart: NatalChart) {
  const scores: Record<ElementId, { score: number; planets: string[] }> = {
    fire: { score: 0, planets: [] }, earth: { score: 0, planets: [] },
    air:  { score: 0, planets: [] }, water: { score: 0, planets: [] },
  };

  const ascSign = chart.western.bodies.asc?.sign;
  if (ascSign) { scores[SIGN_ELEMENT[ascSign]].score += 2; scores[SIGN_ELEMENT[ascSign]].planets.push('ASC'); }

  for (const id of SCORE_BODIES) {
    const b = chart.western.bodies[id];
    if (!b) continue;
    const w = (BODY_W[id] ?? 0.5) + (ANGULAR.has(b.house) ? 0.5 : 0);
    scores[SIGN_ELEMENT[b.sign]].score += w;
    scores[SIGN_ELEMENT[b.sign]].planets.push(`${lbl(id)}(${cap(b.sign)})`);
  }

  const total = Object.values(scores).reduce((s, e) => s + e.score, 0) || 1;
  const balance = Object.fromEntries(
    (Object.entries(scores) as [ElementId, { score: number; planets: string[] }][])
      .map(([k, v]) => [k, { ...v, percent: Math.round(v.score / total * 100) }])
  ) as Record<ElementId, { score: number; percent: number; planets: string[] }>;

  const sorted = (Object.keys(scores) as ElementId[]).sort((a, b) => scores[b].score - scores[a].score);
  return { balance, dominant: sorted[0], weakest: sorted[3] };
}

function computeModalityBalance(chart: NatalChart) {
  const scores: Record<ModalityId, { score: number; planets: string[] }> = {
    cardinal: { score: 0, planets: [] }, fixed: { score: 0, planets: [] }, mutable: { score: 0, planets: [] },
  };

  const ascSign = chart.western.bodies.asc?.sign;
  if (ascSign) { scores[SIGN_MODALITY[ascSign]].score += 2; scores[SIGN_MODALITY[ascSign]].planets.push('ASC'); }

  for (const id of SCORE_BODIES) {
    const b = chart.western.bodies[id];
    if (!b) continue;
    scores[SIGN_MODALITY[b.sign]].score += BODY_W[id] ?? 0.5;
    scores[SIGN_MODALITY[b.sign]].planets.push(`${lbl(id)}(${cap(b.sign)})`);
  }

  const total = Object.values(scores).reduce((s, e) => s + e.score, 0) || 1;
  const balance = Object.fromEntries(
    (Object.entries(scores) as [ModalityId, { score: number; planets: string[] }][])
      .map(([k, v]) => [k, { ...v, percent: Math.round(v.score / total * 100) }])
  ) as Record<ModalityId, { score: number; percent: number; planets: string[] }>;

  const dominant = (Object.keys(scores) as ModalityId[]).sort((a, b) => scores[b].score - scores[a].score)[0];
  return { balance, dominant };
}

// ── Stelliums ─────────────────────────────────────────────────────────────────

function detectStelliums(chart: NatalChart): Stellium[] {
  const bySign:  Record<string, BodyId[]> = {};
  const byHouse: Record<number, BodyId[]> = {};

  for (const id of TRACK_BODIES) {
    const b = chart.western.bodies[id];
    if (!b) continue;
    (bySign[b.sign]    ??= []).push(id);
    (byHouse[b.house]  ??= []).push(id);
  }

  const result: Stellium[] = [];
  for (const [sign, ids] of Object.entries(bySign)) {
    if (ids.length >= 3) result.push({ type: 'sign', label: cap(sign), planets: ids.map(lbl), bodyIds: ids });
  }
  for (const [house, ids] of Object.entries(byHouse)) {
    if (ids.length >= 3) result.push({ type: 'house', label: `House ${house}`, planets: ids.map(lbl), bodyIds: ids });
  }
  return result;
}

// ── Major Configurations ──────────────────────────────────────────────────────

function detectConfigurations(chart: NatalChart): AstroConfiguration[] {
  const asps = chart.western.aspects;
  const configs: AstroConfiguration[] = [];

  const has = (a: BodyId, b: BodyId, kind: string, maxOrb = 8) =>
    asps.some(x => x.kind === kind && x.orb <= maxOrb &&
      ((x.a === a && x.b === b) || (x.a === b && x.b === a)));

  // ── Grand Trines ─────────────────────────────────────────────────────────
  const trines  = asps.filter(a => a.kind === 'trine' && a.orb <= 8);
  const seenGT  = new Set<string>();

  for (let i = 0; i < trines.length; i++) {
    for (let j = i + 1; j < trines.length; j++) {
      const t1 = trines[i], t2 = trines[j];
      const shared = ([t1.a, t1.b] as BodyId[]).find(p => [t2.a, t2.b].includes(p));
      if (!shared) continue;
      const p1 = (t1.a === shared ? t1.b : t1.a) as BodyId;
      const p2 = (t2.a === shared ? t2.b : t2.a) as BodyId;
      if (p1 === p2 || !has(p1, p2, 'trine')) continue;
      const key = [shared, p1, p2].sort().join(',');
      if (seenGT.has(key)) continue;
      seenGT.add(key);

      const trio = [shared, p1, p2] as BodyId[];
      const els  = trio.map(b => { const body = chart.western.bodies[b]; return body ? SIGN_ELEMENT[body.sign] : null; });
      const el   = els.every(e => e === els[0]) ? els[0] as ElementId : undefined;
      const details = trio.map(b => { const body = chart.western.bodies[b]; return `${lbl(b)}(${cap(body?.sign ?? '')} H${body?.house})`; }).join(' △ ');
      configs.push({ type: 'grand-trine', planets: trio.map(lbl), bodyIds: trio, element: el, description: `Grand${el ? ' ' + cap(el) : ''} Trine: ${details}` });
    }
  }

  // ── T-Squares ────────────────────────────────────────────────────────────
  const opps   = asps.filter(a => a.kind === 'opposition' && a.orb <= 8);
  const seenTS = new Set<string>();

  for (const opp of opps) {
    for (const apex of TRACK_BODIES) {
      if (apex === opp.a || apex === opp.b) continue;
      if (!has(apex, opp.a as BodyId, 'square') || !has(apex, opp.b as BodyId, 'square')) continue;
      const key = [opp.a, opp.b, apex].sort().join(',');
      if (seenTS.has(key)) continue;
      seenTS.add(key);
      const apexBody = chart.western.bodies[apex];
      const mod = apexBody ? SIGN_MODALITY[apexBody.sign] : undefined;
      const bodyA = chart.western.bodies[opp.a as BodyId];
      const bodyB = chart.western.bodies[opp.b as BodyId];
      configs.push({
        type: 't-square', bodyIds: [opp.a, opp.b, apex] as BodyId[],
        planets: [opp.a, opp.b, apex].map(id => lbl(id as BodyId)), modality: mod,
        description: `T-Square${mod ? ' (' + cap(mod) + ')' : ''}: ${lbl(opp.a as BodyId)}(H${bodyA?.house}) ☍ ${lbl(opp.b as BodyId)}(H${bodyB?.house}), apex ${lbl(apex)}(H${apexBody?.house} ${cap(apexBody?.sign ?? '')})`,
      });
    }
  }

  // ── Grand Crosses ─────────────────────────────────────────────────────────
  const seenGC = new Set<string>();
  for (let i = 0; i < opps.length; i++) {
    for (let j = i + 1; j < opps.length; j++) {
      const o1 = opps[i], o2 = opps[j];
      const planets = [o1.a, o1.b, o2.a, o2.b] as BodyId[];
      if (new Set(planets).size !== 4) continue;
      if (has(o1.a as BodyId, o2.a as BodyId, 'square') && has(o1.a as BodyId, o2.b as BodyId, 'square') &&
          has(o1.b as BodyId, o2.a as BodyId, 'square') && has(o1.b as BodyId, o2.b as BodyId, 'square')) {
        const key = [...planets].sort().join(',');
        if (seenGC.has(key)) continue;
        seenGC.add(key);
        const mods = planets.map(b => { const body = chart.western.bodies[b]; return body ? SIGN_MODALITY[body.sign] : null; });
        const mod  = mods.every(m => m === mods[0]) ? mods[0] as ModalityId : undefined;
        configs.push({ type: 'grand-cross', planets: planets.map(lbl), bodyIds: planets, modality: mod, description: `Grand Cross${mod ? ' (' + cap(mod) + ')' : ''}: ${planets.map(b => `${lbl(b)}(H${chart.western.bodies[b]?.house})`).join(' ☐ ')}` });
      }
    }
  }

  // ── Yods (Finger of God): tight orbs (≤3°) ───────────────────────────────
  const sextiles   = asps.filter(a => a.kind === 'sextile'  && a.orb <= 3);
  const quincunxes = asps.filter(a => a.kind === 'quincunx' && a.orb <= 3);
  const seenYod    = new Set<string>();
  const hasQ = (a: BodyId, b: BodyId) => quincunxes.some(q => (q.a === a && q.b === b) || (q.a === b && q.b === a));

  for (const sex of sextiles) {
    for (const apex of TRACK_BODIES) {
      if (apex === sex.a || apex === sex.b) continue;
      if (!hasQ(sex.a as BodyId, apex) || !hasQ(sex.b as BodyId, apex)) continue;
      const key = [sex.a, sex.b, apex].sort().join(',');
      if (seenYod.has(key)) continue;
      seenYod.add(key);
      const apexBody = chart.western.bodies[apex];
      configs.push({
        type: 'yod', bodyIds: [sex.a, sex.b, apex] as BodyId[],
        planets: [sex.a, sex.b, apex].map(id => lbl(id as BodyId)),
        description: `Yod: ${lbl(sex.a as BodyId)} ✶ ${lbl(sex.b as BodyId)}, both quincunx apex ${lbl(apex)}(H${apexBody?.house} ${cap(apexBody?.sign ?? '')})`,
      });
    }
  }

  // ── Kites: grand trine + one planet opposing one trine member ─────────────
  for (const gt of configs.filter(c => c.type === 'grand-trine')) {
    const triIds = gt.bodyIds;
    for (const handle of TRACK_BODIES) {
      if (triIds.includes(handle)) continue;
      const opposedTo = triIds.find(p => has(handle, p, 'opposition'));
      if (!opposedTo) continue;
      const others = triIds.filter(p => p !== opposedTo);
      if (others.every(p => has(handle, p, 'sextile'))) {
        configs.push({
          type: 'kite', bodyIds: [...triIds, handle], element: gt.element,
          planets: [...triIds, handle].map(lbl),
          description: `Kite: Grand Trine (${triIds.map(lbl).join(', ')}) with ${lbl(handle)} opposing ${lbl(opposedTo)} — trine gifts focused through ${lbl(handle)}`,
        });
        break;
      }
    }
  }

  return configs;
}

// ── Chart Shape ───────────────────────────────────────────────────────────────

function detectChartShape(chart: NatalChart): string {
  const lons = (['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'] as BodyId[])
    .map(id => chart.western.bodies[id]?.longitude)
    .filter((l): l is number => l !== undefined)
    .sort((a, b) => a - b);

  if (lons.length < 7) return 'Indeterminate';

  const gaps = lons.map((lon, i) => {
    const next = lons[(i + 1) % lons.length];
    return i === lons.length - 1 ? lons[0] + 360 - lon : next - lon;
  });
  const maxGap    = Math.max(...gaps);
  const spread    = 360 - maxGap;
  const secondGap = gaps.filter(g => g !== maxGap).reduce((a, b) => b > a ? b : a, 0);

  if (spread <= 120) return 'Bundle — all planets within 120°: intense concentration; specialist orientation; life force channeled into a narrow but deep domain';
  if (maxGap >= 180) {
    if (secondGap >= 55) return 'Bucket — main cluster with isolated handle planet(s): purposeful and goal-directed; the handle planet is the chart\'s primary lens and point of action';
    return 'Bowl — all planets in one hemisphere: self-contained focus; strong subjective orientation; what is absent in the empty half tends to be sought through others';
  }
  if (maxGap >= 90) {
    if (secondGap >= 55) return 'Seesaw — two opposing clusters: strong polarity consciousness; seeks synthesis of opposites; relationship-oriented; sees all sides but may struggle to commit';
    return 'Locomotive — planets span ~240° with a 120° empty arc: driven and purposeful; strong executive capacity; the leading planet sets the primary direction';
  }
  const significantGaps = gaps.filter(g => g >= 45).length;
  if (significantGaps >= 4) return 'Splash — planets widely distributed: versatile, wide-ranging interests and experience; may struggle to sustain depth in any single domain';
  return 'Fan — moderate distribution with some clustering: adaptable with identifiable core strengths; synthesizes breadth and focus';
}

// ── Supporting detections ─────────────────────────────────────────────────────

function detectAngularPlanets(chart: NatalChart): ChartAnalysis['angularPlanets'] {
  return TRACK_BODIES
    .map(id => ({ id, b: chart.western.bodies[id] }))
    .filter(({ b }) => b && ANGULAR.has(b.house))
    .map(({ id, b }) => ({ bodyId: id, label: lbl(id), sign: b!.sign, house: b!.house }));
}

function detectRetrogrades(chart: NatalChart): BodyId[] {
  return (['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron'] as BodyId[])
    .filter(id => chart.western.bodies[id]?.isRetrograde);
}

function detectCriticalDegrees(chart: NatalChart): ChartAnalysis['criticalDegrees'] {
  const tracked: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','trueNode','asc','mc'];
  return tracked.flatMap((id): ChartAnalysis['criticalDegrees'] => {
    const b = chart.western.bodies[id];
    if (!b) return [];
    if (b.signDegree < 1)   return [{ bodyId: id, label: lbl(id), degree: b.signDegree, type: 'ingress',  sign: b.sign }];
    if (b.signDegree >= 29) return [{ bodyId: id, label: lbl(id), degree: b.signDegree, type: 'anaretic', sign: b.sign }];
    return [];
  });
}

function detectHemisphereEmphasis(chart: NatalChart): ChartAnalysis['hemisphereEmphasis'] {
  let north = 0, south = 0, east = 0, west = 0;
  const tracked: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  for (const id of tracked) {
    const b = chart.western.bodies[id];
    if (!b) continue;
    if (b.house <= 6) north++; else south++;
    if ([10,11,12,1,2,3].includes(b.house)) east++; else west++;
  }
  const total = tracked.filter(id => chart.western.bodies[id]).length || 1;
  return { north: Math.round(north/total*100), south: Math.round(south/total*100), east: Math.round(east/total*100), west: Math.round(west/total*100) };
}

// ── Theme Scoring ─────────────────────────────────────────────────────────────

const THEME_LABELS: Record<string, string> = {
  depth:      'Psychological Depth & Shadow Work',
  power:      'Power, Control & Transformation',
  emotion:    'Emotional Depth & Family Roots',
  relating:   'Partnership & Relational Focus',
  mind:       'Intellect, Communication & Ideas',
  authority:  'Ambition, Mastery & Public Authority',
  creativity: 'Creativity & Self-Expression',
  spirit:     'Spiritual Life & Dissolution',
  identity:   'Identity Formation & Independence',
  healing:    'Healing, Service & Devotion',
};

// Sign → theme contributions. Each entry is [themeId, base weight at planet-weight=3].
const SIGN_THEME: Partial<Record<SignId, [string, number][]>> = {
  scorpio:     [['depth', 3],      ['power', 2]],
  capricorn:   [['authority', 3],  ['power', 1]],
  cancer:      [['emotion', 3]],
  pisces:      [['spirit', 3],     ['healing', 1]],
  libra:       [['relating', 3]],
  gemini:      [['mind', 3]],
  aquarius:    [['mind', 2.5],     ['identity', 1]],
  aries:       [['identity', 3]],
  leo:         [['creativity', 3]],
  virgo:       [['healing', 3],    ['mind', 1]],
  sagittarius: [['spirit', 2],     ['mind', 1]],
  taurus:      [['healing', 1.5]],
};

function scoreThemes(chart: NatalChart, ruler: ChartAnalysis['chartRuler']): Record<string, { weight: number; indicators: string[] }> {
  const scores: Record<string, { weight: number; indicators: string[] }> = {};

  function add(theme: string, w: number, reason: string) {
    if (!scores[theme]) scores[theme] = { weight: 0, indicators: [] };
    scores[theme].weight = Math.round((scores[theme].weight + w) * 10) / 10;
    if (scores[theme].indicators.length < 8) scores[theme].indicators.push(reason);
  }

  // Aspect weight: tighter = stronger; hard aspects get a small bonus
  function aspW(orb: number, hard = false): number {
    const base = orb < 1 ? 3 : orb < 2.5 ? 2 : orb < 5 ? 1.5 : 1;
    return parseFloat((base * (hard ? 1.1 : 0.9)).toFixed(1));
  }

  const { bodies, aspects, dignities } = chart.western;
  const sunSign  = bodies.sun?.sign;
  const moonSign = bodies.moon?.sign;
  const ascSign  = bodies.asc?.sign;

  // ── Sun / Moon / ASC sign themes (highest weight) ─────────────────────────

  function applySign(sign: SignId | undefined, planetWeight: number, label: string) {
    if (!sign) return;
    for (const [theme, base] of SIGN_THEME[sign] ?? []) {
      add(theme, (base / 3) * planetWeight, label);
    }
  }

  applySign(sunSign,  3, `Sun in ${cap(sunSign ?? '')}`);
  applySign(moonSign, 3, `Moon in ${cap(moonSign ?? '')}`);
  applySign(ascSign,  2, `${cap(ascSign ?? '')} ASC`);

  // ── All planets: sign and house contributions ─────────────────────────────

  const houseTheme: Record<number, [string, number][]> = {
    1:  [['identity', 1]],
    3:  [['mind', 0.9]],
    4:  [['emotion', 1]],
    5:  [['creativity', 1]],
    6:  [['healing', 0.8]],
    7:  [['relating', 1]],
    8:  [['depth', 1],     ['power', 0.7]],
    9:  [['spirit', 0.7],  ['mind', 0.5]],
    10: [['authority', 1]],
    12: [['spirit', 1],    ['depth', 0.7]],
  };

  for (const [id, body] of Object.entries(bodies) as [BodyId, typeof bodies[BodyId]][]) {
    if (!body || ['asc','mc','southNode','partOfFortune','vertex'].includes(id)) continue;
    const w   = BODY_W[id] ?? 0.3;
    const eff = w + (ANGULAR.has(body.house) ? 0.5 : 0);

    // Sign (skip Sun/Moon already handled, scale down others)
    if (!['sun','moon'].includes(id)) {
      for (const [theme, base] of SIGN_THEME[body.sign] ?? []) {
        add(theme, (base / 3) * eff * 0.55, `${lbl(id)} in ${cap(body.sign)}`);
      }
    }
    // House
    for (const [theme, base] of houseTheme[body.house] ?? []) {
      add(theme, base * eff, `${lbl(id)} in H${body.house}`);
    }
  }

  // ── Outer planet aspects to personal planets (high impact) ────────────────

  const outer:    BodyId[] = ['pluto','neptune','uranus','saturn','chiron'];
  const personal: BodyId[] = ['sun','moon','mercury','venus','mars','asc','mc'];

  for (const asp of aspects) {
    const outerB   = outer.includes(asp.a as BodyId)    ? asp.a : outer.includes(asp.b as BodyId)    ? asp.b : null;
    const personalB = personal.includes(asp.a as BodyId) ? asp.a : personal.includes(asp.b as BodyId) ? asp.b : null;
    if (!outerB || !personalB || asp.orb > 6) continue;

    const isHard = ['square','opposition','conjunction'].includes(asp.kind);
    const w      = aspW(asp.orb, isHard);
    const note   = `${lbl(outerB as BodyId)} ${asp.kind} ${lbl(personalB as BodyId)} (${asp.orb.toFixed(1)}°)`;

    if (outerB === 'pluto') { add('depth', w, note); if (isHard) add('power', w * 0.9, note); }
    if (outerB === 'saturn') {
      add('authority', w * 0.8, note);
      if (isHard) add('depth', w * 0.5, note);
      if (personalB === 'moon') add('emotion', w * 0.6, note);
    }
    if (outerB === 'neptune') { add('spirit', w * 0.9, note); if (isHard) add('healing', w * 0.5, note); }
    if (outerB === 'uranus')  { add('identity', w * 0.8, note); }
    if (outerB === 'chiron')  { add('healing', w * 0.9, note); if (['sun','moon','asc'].includes(personalB as string)) add('identity', w * 0.4, note); }
  }

  // ── Saturn-Pluto hard contact: exceptional intensity ──────────────────────
  const satPluto = aspects.find(a =>
    ((a.a === 'saturn' && a.b === 'pluto') || (a.a === 'pluto' && a.b === 'saturn')) &&
    ['conjunction','square','opposition'].includes(a.kind) && a.orb <= 8
  );
  if (satPluto) {
    const w = aspW(satPluto.orb, true);
    add('power', w * 1.2, `Saturn-Pluto ${satPluto.kind}`);
    add('depth', w * 0.8, `Saturn-Pluto ${satPluto.kind}`);
    add('authority', w * 0.5, `Saturn-Pluto ${satPluto.kind}`);
  }

  // ── Key single-planet placements ─────────────────────────────────────────
  const sat = bodies.saturn, jup = bodies.jupiter, ven = bodies.venus;
  const mar = bodies.mars,   mer = bodies.mercury,  nep = bodies.neptune;
  const plu = bodies.pluto,  moon = bodies.moon,     sun  = bodies.sun;

  if (sat?.house === 7)  add('relating',  2,   'Saturn in H7 (angular)');
  if (sat?.house === 10) add('authority', 2.5, 'Saturn in H10 (angular)');
  if (sat?.house === 4)  add('emotion',   1.5, 'Saturn in H4');
  if (jup?.house === 5)  add('creativity',2,   'Jupiter in H5');
  if (jup?.house === 7)  add('relating',  2,   'Jupiter in H7');
  if (jup?.house === 9)  add('spirit',    2,   'Jupiter in H9');
  if (ven?.house === 7)  add('relating',  2,   'Venus in H7');
  if (ven?.house === 5)  add('creativity',2,   'Venus in H5');
  if (mar?.house === 10) add('authority', 2,   'Mars in H10');
  if (mer?.house === 3)  add('mind',      2,   'Mercury in H3');
  if (nep?.sign === 'pisces') add('spirit', 1.5, 'Neptune in Pisces');
  if (plu?.house === 8)  add('depth',  2,   'Pluto in H8');
  if (plu?.house === 10) add('power',  2,   'Pluto in H10 (angular)');
  if (moon?.house === 4) add('emotion', 2.5, 'Moon in H4 (natural home)');
  if (moon?.house === 7) add('relating',2,   'Moon in H7');
  if (sun?.house === 10) add('authority',2,  'Sun in H10');

  // ── Dignity of chart ruler, Mercury, Venus ────────────────────────────────
  if (dignities.mercury?.label === 'domicile' || dignities.mercury?.label === 'exaltation') add('mind', 1.5, `Mercury ${dignities.mercury.label}`);
  if (dignities.venus?.label   === 'domicile' || dignities.venus?.label   === 'exaltation') add('relating', 1.5, `Venus ${dignities.venus.label}`);

  // ── North Node house/sign ─────────────────────────────────────────────────
  const node = bodies.trueNode;
  if (node) {
    const nodeH: Partial<Record<number, string>> = { 1:'identity', 4:'emotion', 5:'creativity', 7:'relating', 8:'depth', 10:'authority', 12:'spirit' };
    const nodeS: Partial<Record<SignId, string>> = { scorpio:'depth', pisces:'spirit', capricorn:'authority', libra:'relating', aquarius:'mind', aries:'identity' };
    const nh = nodeH[node.house]; if (nh) add(nh, 2, `N.Node in H${node.house}`);
    const ns = nodeS[node.sign];  if (ns) add(ns, 1.5, `N.Node in ${cap(node.sign)}`);
  }

  // ── Chart ruler house ─────────────────────────────────────────────────────
  if (ruler) {
    const rh: Partial<Record<number, string>> = { 4:'emotion', 5:'creativity', 7:'relating', 8:'depth', 9:'spirit', 10:'authority', 12:'spirit' };
    const rt = rh[ruler.house]; if (rt) add(rt, 2, `Chart ruler (${ruler.label}) in H${ruler.house}`);
    if (ANGULAR.has(ruler.house)) add('identity', 1.5, `Chart ruler angular (H${ruler.house})`);
    if (ruler.dignity === 'detriment' || ruler.dignity === 'fall') add('depth', 1, `Chart ruler in ${ruler.dignity}`);
  }

  // ── Water element dominance amplifies emotion/depth ───────────────────────
  const waterCount = SCORE_BODIES.filter(id => { const b = chart.western.bodies[id]; return b && ['cancer','scorpio','pisces'].includes(b.sign); }).length;
  const totalSB    = SCORE_BODIES.filter(id => chart.western.bodies[id]).length || 1;
  if (waterCount / totalSB > 0.4) {
    add('emotion', waterCount * 0.4, `Water dominance (${waterCount}/${totalSB} planets in water signs)`);
    add('depth',   waterCount * 0.3, 'Water emphasis');
  }

  // ── Retrograde count (internalization signal) ─────────────────────────────
  const retros = detectRetrogrades(chart).length;
  if (retros >= 3) add('depth', retros * 0.4, `${retros} retrograde planets`);

  return scores;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const ELEMENT_NOTE: Record<ElementId, string> = {
  fire:  'action-oriented, identity-driven; seeks meaning through experience; may rush or over-identify',
  earth: 'pragmatic, embodied, stability-seeking; grounds abstract in the concrete; may resist change',
  air:   'conceptual, relational; processes through language and analysis; may intellectualize emotion',
  water: 'intuitive, depth-seeking, receptive; processes through feeling; may struggle with detachment',
};

const ELEMENT_DEFICIT: Record<ElementId, string> = {
  fire:  'may need to cultivate spontaneity, confidence, and willingness to act without certainty',
  earth: 'may struggle with practical follow-through, grounding, or material security',
  air:   'may find it hard to name feelings analytically; benefit from objectivity and perspective',
  water: 'may lack intuitive attunement; tends to compensate through logic or control',
};

const MODALITY_NOTE: Record<ModalityId, string> = {
  cardinal: 'strong initiating drive; may struggle with follow-through once momentum is established',
  fixed:    'extraordinary endurance and depth; power through sustained focus; change comes via internal crisis',
  mutable:  'adaptable, versatile; may struggle with commitment or consistent direction',
};

// ── Formatter ─────────────────────────────────────────────────────────────────

export function formatChartAnalysis(chart: NatalChart, analysis: ChartAnalysis): string {
  const L: string[] = [];
  const line = (s = '') => L.push(s);
  const ascSign = cap(chart.western.bodies.asc?.sign ?? '');

  line('══════════════════════════════════════════════════');
  line('CHART PATTERN ANALYSIS — PRE-COMPUTED SYNTHESIS');
  line('══════════════════════════════════════════════════');
  line();

  if (analysis.chartRuler) {
    const r = analysis.chartRuler;
    line(`CHART RULER: ${r.label} [rules ${ascSign} ASC]`);
    line(`  ${cap(r.sign)}, House ${r.house} · ${r.accidentalStrength}${r.dignity ? ' · ' + r.dignity : ''}`);
    if (r.aspects.length) line(`  Key aspects: ${r.aspects.join(', ')}`);
    line();
  }

  const sm = analysis.sunMoonRelationship;
  line(`SUN-MOON: ${Math.round(sm.angle)}° apart${sm.aspect ? ' · ' + sm.aspect + ' in orb' : ' · no major aspect in orb'}`);
  line(`  ${sm.phaseDescription}`);
  line();

  const els: ElementId[] = ['fire','earth','air','water'];
  line(`ELEMENT BALANCE: ${els.map(e => `${cap(e)} ${analysis.elementBalance[e].percent}%`).join(' · ')}`);
  line(`  Dominant: ${cap(analysis.dominantElement)} — ${ELEMENT_NOTE[analysis.dominantElement]}`);
  if (analysis.elementBalance[analysis.weakestElement].percent < 12) {
    line(`  ⚠ Weak ${cap(analysis.weakestElement)} (${analysis.elementBalance[analysis.weakestElement].percent}%) — ${ELEMENT_DEFICIT[analysis.weakestElement]}`);
  }
  line();

  const mods: ModalityId[] = ['cardinal','fixed','mutable'];
  line(`MODALITY: ${mods.map(m => `${cap(m)} ${analysis.modalityBalance[m].percent}%`).join(' · ')}`);
  line(`  Dominant: ${cap(analysis.dominantModality)} — ${MODALITY_NOTE[analysis.dominantModality]}`);
  line();

  const h = analysis.hemisphereEmphasis;
  line(`HEMISPHERE: ${h.north}% below horizon (private) · ${h.south}% above (public) · ${h.east}% east (self-directed) · ${h.west}% west (other-directed)`);
  line();

  line(`CHART SHAPE: ${analysis.chartShape}`);
  line();

  if (analysis.stelliums.length) {
    line('STELLIUMS:');
    for (const s of analysis.stelliums) {
      line(`  • ${s.type === 'sign' ? 'Sign' : 'House'} stellium — ${s.label}: ${s.planets.join(', ')}`);
    }
    line();
  }

  if (analysis.configurations.length) {
    line('MAJOR CONFIGURATIONS:');
    for (const c of analysis.configurations) line(`  • ${c.description}`);
    line();
  }

  if (analysis.angularPlanets.length) {
    line(`ANGULAR PLANETS (high power): ${analysis.angularPlanets.map(p => `${p.label} H${p.house}`).join(' · ')}`);
    line();
  }

  if (analysis.retrogrades.length) {
    line(`RETROGRADES (${analysis.retrogrades.length}): ${analysis.retrogrades.map(id => lbl(id) + ' R').join(' · ')}`);
    if (analysis.retrogrades.length >= 3) line('  Strong internalization pattern — processing inward before outward expression is a core style.');
    line();
  }

  if (analysis.criticalDegrees.length) {
    line('CRITICAL DEGREES:');
    for (const cd of analysis.criticalDegrees) {
      line(`  • ${cd.label} at ${cd.type === 'anaretic' ? '29°' : '0°'} ${cap(cd.sign)} — ${cd.type === 'anaretic' ? 'urgent threshold; completion crisis' : 'raw initiatory expression'}`);
    }
    line();
  }

  line('DOMINANT THEMES — PRIMARY INTERPRETIVE FRAME:');
  line('Use these convergent patterns as the organizing lens. Do not treat any placement in isolation.');
  line();
  for (let i = 0; i < analysis.dominantThemes.length; i++) {
    const t = analysis.dominantThemes[i];
    line(`${i + 1}. ${t.label.toUpperCase()} (score: ${t.weight})`);
    line(`   Convergence: ${t.indicators.slice(0, 5).join(' + ')}`);
    if (i < analysis.dominantThemes.length - 1) line();
  }
  line();
  line('══════════════════════════════════════════════════');

  return L.join('\n');
}

// ── Per-section context injectors ─────────────────────────────────────────────

/** Synthesis context prepended to a planet/body interpretation prompt. */
export function bodyContext(bodyId: BodyId, chart: NatalChart, analysis: ChartAnalysis): string {
  const name = lbl(bodyId);
  const body = chart.western.bodies[bodyId];
  const L: string[] = ['SYNTHESIS CONTEXT:'];

  const topThemes = analysis.dominantThemes.slice(0, 4);
  if (topThemes.length) {
    L.push('Dominant chart themes (frame interpretation around these):');
    topThemes.forEach((t, i) => L.push(`  ${i+1}. ${t.label} (${t.weight}) — ${t.indicators.slice(0,3).join(', ')}`));
  }

  const itsStelliums = analysis.stelliums.filter(s => s.bodyIds.includes(bodyId));
  if (itsStelliums.length) L.push(`Stellium: ${name} is part of ${itsStelliums.map(s => s.label + ' stellium (with ' + s.planets.filter(p => p !== name).join(', ') + ')').join('; ')}`);

  const itsConfigs = analysis.configurations.filter(c => c.bodyIds.includes(bodyId));
  if (itsConfigs.length) { L.push('Configuration roles:'); itsConfigs.forEach(c => L.push(`  • ${c.description}`)); }

  if (body && ANGULAR.has(body.house)) L.push(`Angular placement (H${body.house}): high accidental power — this planet's themes are prominent and unavoidable in lived experience.`);

  if (analysis.chartRuler) {
    const r = analysis.chartRuler;
    if (bodyId === r.bodyId) {
      L.push(`This IS the chart ruler (rules ${cap(chart.western.bodies.asc?.sign ?? '')} ASC) — its condition is the single most important factor in the chart's overall expression.`);
    } else {
      const ra = chart.western.aspects.find(a => ((a.a === bodyId && a.b === r.bodyId) || (a.a === r.bodyId && a.b === bodyId)) && a.orb <= 6);
      if (ra) L.push(`Direct link to chart ruler (${r.label}): ${ra.kind} (${ra.orb.toFixed(1)}°)`);
      L.push(`Chart ruler: ${r.label} in ${cap(r.sign)} H${r.house} (${r.accidentalStrength}${r.dignity ? ', ' + r.dignity : ''})`);
    }
  }

  const cd = analysis.criticalDegrees.find(c => c.bodyId === bodyId);
  if (cd) L.push(`Critical degree: ${name} at ${cd.type === 'anaretic' ? '29°' : '0°'} ${cap(cd.sign)} — ${cd.type === 'anaretic' ? 'urgent completion pressure' : 'raw archetypal expression'}.`);
  if (body?.isRetrograde) L.push(`Retrograde: energy is internalized and revisional — develops inward before outward expression.`);

  return L.join('\n');
}

/** Synthesis context for a house interpretation prompt. */
export function houseContext(houseNum: number, chart: NatalChart, analysis: ChartAnalysis): string {
  const L: string[] = ['SYNTHESIS CONTEXT:'];
  L.push(`Dominant chart themes: ${analysis.dominantThemes.slice(0,3).map(t => t.label).join(' · ')}`);

  const houseConfigs = analysis.configurations.filter(c => c.bodyIds.some(id => chart.western.bodies[id]?.house === houseNum));
  if (houseConfigs.length) { L.push(`Configurations active in H${houseNum}:`); houseConfigs.forEach(c => L.push(`  • ${c.description}`)); }

  if (analysis.chartRuler) {
    const r = analysis.chartRuler;
    if (r.house === houseNum) L.push(`Chart ruler (${r.label}) is in this house — its themes are central to the chart's overall orientation.`);
    else L.push(`Chart ruler: ${r.label} in ${cap(r.sign)} H${r.house} (${r.accidentalStrength}${r.dignity ? ', ' + r.dignity : ''})`);
  }
  return L.join('\n');
}

/** Synthesis context for an aspect interpretation prompt. */
export function aspectContext(bodyA: BodyId, bodyB: BodyId, chart: NatalChart, analysis: ChartAnalysis): string {
  const L: string[] = ['SYNTHESIS CONTEXT:'];
  L.push(`Dominant chart themes: ${analysis.dominantThemes.slice(0,3).map(t => t.label).join(' · ')}`);

  const inConfig = analysis.configurations.filter(c => c.bodyIds.includes(bodyA) && c.bodyIds.includes(bodyB));
  if (inConfig.length) { L.push('This aspect is part of a larger pattern:'); inConfig.forEach(c => L.push(`  • ${c.description}`)); }

  if (analysis.chartRuler) {
    const r = analysis.chartRuler;
    L.push(`Chart ruler: ${r.label} in ${cap(r.sign)} H${r.house} (${r.accidentalStrength})`);
  }
  return L.join('\n');
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyzeChart(chart: NatalChart): ChartAnalysis {
  const chartRuler      = detectChartRuler(chart);
  const { balance: elementBalance, dominant: dominantElement, weakest: weakestElement } = computeElementBalance(chart);
  const { balance: modalityBalance, dominant: dominantModality }                        = computeModalityBalance(chart);
  const themeScores     = scoreThemes(chart, chartRuler);

  const dominantThemes: DominantTheme[] = Object.entries(themeScores)
    .map(([id, data]) => ({ id, label: THEME_LABELS[id] ?? id, weight: data.weight, indicators: data.indicators }))
    .filter(t => t.weight >= 2)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  return {
    ascSign:              chart.western.bodies.asc?.sign ?? null,
    chartRuler,
    sunMoonRelationship:  sunMoonRelationship(chart),
    elementBalance, modalityBalance, dominantElement, weakestElement, dominantModality,
    hemisphereEmphasis:   detectHemisphereEmphasis(chart),
    chartShape:           detectChartShape(chart),
    stelliums:            detectStelliums(chart),
    configurations:       detectConfigurations(chart),
    angularPlanets:       detectAngularPlanets(chart),
    retrogrades:          detectRetrogrades(chart),
    criticalDegrees:      detectCriticalDegrees(chart),
    dominantThemes, themeScores,
  };
}
