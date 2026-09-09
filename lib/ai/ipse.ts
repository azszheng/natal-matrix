/**
 * ipse.ts
 *
 * IPSE Profile — ranks four symbolic "intelligence style" domains
 * (Intellectual, Practical, Spiritual, Emotional) from a chart's Western
 * placements, with Vedic and harmonic ("Vibrational") data layered in only
 * when it's actually available and reliable.
 *
 * IMPORTANT: this describes symbolic chart EMPHASIS, never measured
 * intelligence, IQ, EQ, ability, giftedness, or worth. A domain ranked
 * last is a quieter symbolic current in this chart, not a deficit.
 *
 * Data sources reused rather than reinvented:
 * - Western: chart.western.* directly, plus analyzeChart() (chartAnalysis.ts)
 *   for chart ruler / stelliums, so this module doesn't duplicate that
 *   pattern-recognition logic.
 * - Vedic: analyzeVedicChart() (vedicAnalysis.ts) for planet strength, house
 *   lords, and yogas; computeVimshottariDasha() (dashas.ts) for current
 *   dasha timing. Used only when chart.vedic exists.
 * - Vibrational: a self-contained harmonic-resonance check over the same
 *   tropical longitudes already in chart.western.bodies — a "processing
 *   rhythm" refinement layer, capped at 15% of the final score, never
 *   dominant.
 *
 * Human Design and Gene Keys are deliberately NOT used for scoring here —
 * out of scope for this version, per product decision.
 */

import type { NatalChart, BodyId, SignId, AspectKind } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import { analyzeChart, type ChartAnalysis } from './chartAnalysis';
import { analyzeVedicChart, type VedicAnalysis, type PlanetStrength, type VedicYoga } from './vedicAnalysis';
import { computeVimshottariDasha, type DashaLord } from '@/lib/astro/dashas';
import { isMinorChart } from './childhoodImprints';
import type { InterpretMode } from './prompts';

// ── Public types ─────────────────────────────────────────────────────────────

export type IPSEDomainId = 'intellectual' | 'practical' | 'spiritual' | 'emotional';

export type IPSESystem = 'western' | 'vedic' | 'vibrational';

export type IPSEComponent =
  | 'planetProminence'
  | 'houseActivation'
  | 'aspectNetwork'
  | 'rulerCondition'
  | 'elementModePattern'
  | 'karakaStrength'
  | 'bhavaActivation'
  | 'lordCondition'
  | 'dashaRelevance'
  | 'nakshatraYogaSupport'
  | 'harmonicPattern';

export type IPSEPolarity = 'supportive' | 'challenging' | 'mixed' | 'transformational';

export type IPSELabel =
  | 'Quiet emphasis'
  | 'Subtle emphasis'
  | 'Moderate emphasis'
  | 'Strong emphasis'
  | 'Dominant emphasis';

export type IPSERankLabel = 'Dominant mode' | 'Supporting mode' | 'Background mode' | 'Quietest mode';

export type IPSEBalancePattern =
  | 'Balanced IPSE profile'
  | 'Intellect-led profile'
  | 'Practicality-led profile'
  | 'Spirit-led profile'
  | 'Emotion-led profile'
  | 'Dual-led profile'
  | 'Polarized profile'
  | 'Even but subtle profile';

export type IPSEEvidence = {
  id: string;
  system: IPSESystem;
  domain: IPSEDomainId;
  component: IPSEComponent;
  label: string;
  weight: number;       // 0-1 after display adjustment
  rawWeight?: number;    // 0-1 before adjustment
  polarity: IPSEPolarity;
  sourcePlanet?: BodyId;
  sourceHouse?: number;
  sourceAspect?: string;
  orb?: number;
  notes?: string;
};

export type IPSEDomainResult = {
  domain: IPSEDomainId;
  title: string;
  rank: number;
  score: number; // normalized 0-100 symbolic emphasis
  label: IPSELabel;
  rankLabel: IPSERankLabel;
  confidence: 'low' | 'moderate' | 'high';
  tone: IPSEPolarity;
  subtypes: string[];
  summary: string;
  strengths: string[];
  growthEdges: string[];
  integratedExpression: string;
  westernScore: number | null;
  vedicScore: number | null;
  vibrationalScore: number | null;
  westernEvidence: IPSEEvidence[];
  vedicEvidence: IPSEEvidence[];
  vibrationalEvidence: IPSEEvidence[];
};

export type IPSEProfile = {
  sectionTitle: string;
  sectionSubtitle: string;
  disclaimer: string;
  dominantDomain: IPSEDomainId;
  supportingDomain?: IPSEDomainId;
  balancePattern: IPSEBalancePattern;
  profileSummary: string;
  rankedDomains: IPSEDomainResult[];
  isMinor: boolean;
  dataCoverage: {
    western: boolean;
    vedic: boolean;
    vibrational: boolean;
  };
};

export type IPSEOptions = {
  includeVedic?: boolean;
  includeVibrational?: boolean;
  isMinor?: boolean;
  mode?: InterpretMode;
};

// ── Domain definitions ────────────────────────────────────────────────────────

type IPSEDomainDef = {
  title: string;
  coreMeaning: string;
  planets: Partial<Record<BodyId, number>>;
  houses: number[];
  signs: SignId[];
  aspects: Array<[BodyId, BodyId]>;
  subtypes: Record<string, string>;
};

const IPSE_DOMAINS: Record<IPSEDomainId, IPSEDomainDef> = {
  intellectual: {
    title: 'Intellectual',
    coreMeaning: 'Cognition, analysis, language, abstraction, research, learning, and pattern recognition.',
    planets: { mercury: 0.35, uranus: 0.18, jupiter: 0.15, saturn: 0.14, pluto: 0.1, sun: 0.05, moon: 0.03 },
    houses: [3, 5, 9, 10, 11],
    signs: ['gemini', 'virgo', 'aquarius', 'sagittarius', 'scorpio', 'capricorn'],
    aspects: [
      ['mercury', 'uranus'], ['mercury', 'saturn'], ['mercury', 'jupiter'],
      ['mercury', 'pluto'], ['mercury', 'neptune'], ['mercury', 'mars'], ['sun', 'mercury'],
    ],
    subtypes: {
      mercury_uranus: 'Systems thinker',
      mercury_saturn: 'Technical / rigorous thinker',
      mercury_jupiter: 'Philosophical synthesizer',
      mercury_pluto: 'Research-oriented investigator',
      mercury_neptune: 'Symbolic / imaginal thinker',
      mercury_mars: 'Tactical fast-processor',
    },
  },
  practical: {
    title: 'Practical',
    coreMeaning: 'Execution, discipline, embodiment, real-world problem-solving, work ethic, craft, and follow-through.',
    planets: { saturn: 0.3, mars: 0.25, mercury: 0.15, sun: 0.1, venus: 0.08, jupiter: 0.07, moon: 0.05 },
    houses: [2, 3, 6, 10, 11],
    signs: ['taurus', 'virgo', 'capricorn', 'aries', 'scorpio'],
    aspects: [
      ['mars', 'saturn'], ['mercury', 'saturn'], ['sun', 'saturn'],
      ['mars', 'mercury'], ['venus', 'saturn'], ['jupiter', 'saturn'], ['mars', 'jupiter'],
    ],
    subtypes: {
      mars_saturn: 'Endurance builder',
      mercury_saturn: 'Planner / systems implementer',
      sun_saturn: 'Responsible achiever',
      mars_mercury: 'Tactical problem-solver',
      venus_saturn: 'Resource manager',
      jupiter_saturn: 'Strategist',
      mars_jupiter: 'Initiator',
    },
  },
  spiritual: {
    title: 'Spiritual',
    coreMeaning: 'Meaning-making, symbolism, intuition, mysticism, existential inquiry, altered states, and transpersonal awareness.',
    planets: { jupiter: 0.25, neptune: 0.25, moon: 0.15, pluto: 0.12, saturn: 0.08, uranus: 0.08, sun: 0.07 },
    houses: [4, 5, 8, 9, 12],
    signs: ['pisces', 'sagittarius', 'scorpio', 'cancer'],
    aspects: [
      ['jupiter', 'neptune'], ['moon', 'neptune'], ['mercury', 'neptune'], ['sun', 'neptune'],
      ['jupiter', 'pluto'], ['moon', 'pluto'], ['uranus', 'neptune'], ['saturn', 'neptune'],
    ],
    subtypes: {
      jupiter_neptune: 'Mystic / idealist',
      moon_neptune: 'Intuitive empath',
      mercury_neptune: 'Symbolist',
      sun_neptune: 'Spiritual identity seeker',
      jupiter_pluto: 'Transformational seeker',
      moon_pluto: 'Ancestral / occult feeler',
      uranus_neptune: 'Visionary',
      saturn_neptune: 'Contemplative practitioner',
    },
  },
  emotional: {
    title: 'Emotional',
    coreMeaning: 'Empathy, attachment, affective depth, relational attunement, emotional perception, and self-awareness.',
    planets: { moon: 0.3, venus: 0.2, mercury: 0.15, neptune: 0.12, pluto: 0.1, jupiter: 0.08, saturn: 0.05 },
    houses: [4, 5, 7, 8, 12],
    signs: ['cancer', 'scorpio', 'pisces', 'libra', 'taurus'],
    aspects: [
      ['moon', 'venus'], ['moon', 'mercury'], ['moon', 'neptune'], ['moon', 'pluto'],
      ['venus', 'neptune'], ['venus', 'pluto'], ['moon', 'saturn'], ['venus', 'saturn'],
    ],
    subtypes: {
      moon_venus: 'Relational harmonizer',
      moon_mercury: 'Emotional translator',
      moon_neptune: 'Empath / sensitive absorber',
      moon_pluto: 'Depth-feeler',
      venus_neptune: 'Compassionate romantic',
      venus_pluto: 'Intimacy-oriented',
      moon_saturn: 'Emotionally contained protector',
      venus_saturn: 'Loyal bond-builder',
    },
  },
};

const DOMAIN_IDS: IPSEDomainId[] = ['intellectual', 'practical', 'spiritual', 'emotional'];

// ── Small local helpers ────────────────────────────────────────────────────────

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
function isAngularHouse(house: number | undefined): boolean {
  return house !== undefined && ANGULAR_HOUSES.has(house);
}

function angularSep(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

const TRAD_RULER: Record<SignId, BodyId> = {
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
};

function getHouseSign(chart: NatalChart, houseNumber: number): SignId {
  const lon = chart.western.houses.cusps[houseNumber - 1];
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
}

function getHouseRuler(chart: NatalChart, houseNumber: number): BodyId {
  return TRAD_RULER[getHouseSign(chart, houseNumber)];
}

// Planets that occupy a "house" in a meaningful sense — deliberately
// excludes asc/mc, whose own house is always 1 / 10 by construction for
// every chart, which would make "activated" tautologically true every time
// (the same class of bug fixed elsewhere this session for synastry/harmonics).
const HOUSE_TRACKABLE_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode', 'chiron',
];

function getPlanetsInHouse(chart: NatalChart, houseNumber: number): BodyId[] {
  return HOUSE_TRACKABLE_BODIES.filter(id => chart.western.bodies[id]?.house === houseNumber);
}

function findAspect(chart: NatalChart, a: BodyId, b: BodyId) {
  return chart.western.aspects.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
}

function isConjunctAngle(chart: NatalChart, id: BodyId, orbDeg: number): boolean {
  const planet = chart.western.bodies[id];
  const asc = chart.western.bodies.asc?.longitude;
  const mc = chart.western.bodies.mc?.longitude;
  if (!planet || asc === undefined || mc === undefined) return false;
  const ic = (mc + 180) % 360;
  const dsc = (asc + 180) % 360;
  return [asc, mc, ic, dsc].some(angle => angularSep(planet.longitude, angle) <= orbDeg);
}

function isDomicileOrExalted(chart: NatalChart, id: BodyId): boolean {
  const label = chart.western.dignities[id]?.label;
  return label === 'domicile' || label === 'exaltation';
}

function isInDetrimentOrFall(chart: NatalChart, id: BodyId): boolean {
  const label = chart.western.dignities[id]?.label;
  return label === 'detriment' || label === 'fall';
}

function hasTightAspectToLuminaryOrAngle(chart: NatalChart, id: BodyId, orbDeg: number): boolean {
  const targets: BodyId[] = ['sun', 'moon', 'asc', 'mc'];
  return chart.western.aspects.some(asp => {
    const other = asp.a === id ? asp.b : asp.b === id ? asp.a : null;
    return other !== null && targets.includes(other) && asp.orb <= orbDeg;
  });
}

function hasSupportiveAspect(chart: NatalChart, id: BodyId): boolean {
  return chart.western.aspects.some(a => (a.a === id || a.b === id) && (a.kind === 'trine' || a.kind === 'sextile'));
}

function hasChallengingButMotivatingAspect(chart: NatalChart, id: BodyId): boolean {
  return chart.western.aspects.some(a => (a.a === id || a.b === id) && (a.kind === 'square' || a.kind === 'opposition'));
}

function inferPlanetPolarity(chart: NatalChart, id: BodyId): IPSEPolarity {
  const dignity = chart.western.dignities[id]?.label;
  if (dignity === 'domicile' || dignity === 'exaltation') return 'supportive';
  if (dignity === 'detriment' || dignity === 'fall') return 'challenging';
  return 'mixed';
}

function inferAspectPolarity(kind: AspectKind): IPSEPolarity {
  if (kind === 'trine' || kind === 'sextile') return 'supportive';
  if (kind === 'square' || kind === 'opposition' || kind === 'quincunx') return 'challenging';
  return 'mixed';
}

function inferVedicPolarity(strength: PlanetStrength | undefined): IPSEPolarity {
  if (!strength) return 'mixed';
  if (strength.dignity === 'exaltation' || strength.dignity === 'own' || strength.dignity === 'moolatrikona') return 'supportive';
  if (strength.dignity === 'debilitation') return 'challenging';
  return 'mixed';
}

function countPlanetsInSigns(chart: NatalChart, signs: SignId[]): number {
  return HOUSE_TRACKABLE_BODIES.filter(id => {
    const p = chart.western.bodies[id];
    return p && signs.includes(p.sign);
  }).length;
}

function hasWesternChartData(chart: NatalChart | null | undefined): boolean {
  return !!chart?.western?.bodies?.sun && !!chart.western.houses?.cusps?.length;
}

function hasPlanetaryLongitudes(chart: NatalChart): boolean {
  return typeof chart.western.bodies.sun?.longitude === 'number';
}

type ComponentResult = { score: number; evidence: IPSEEvidence[] };

// ── Western: planet prominence ────────────────────────────────────────────────

function scorePlanetProminence(chart: NatalChart, analysis: ChartAnalysis, id: BodyId): number {
  const planet = chart.western.bodies[id];
  if (!planet) return 0;

  let score = 0;
  if (isAngularHouse(planet.house)) score += 0.25;
  if (isConjunctAngle(chart, id, 5)) score += 0.25;
  if (analysis.chartRuler?.bodyId === id) score += 0.2;
  if (isDomicileOrExalted(chart, id)) score += 0.2;
  if (hasTightAspectToLuminaryOrAngle(chart, id, 3)) score += 0.15;
  if (analysis.stelliums.some(s => s.bodyIds.includes(id))) score += 0.15;
  if (isInDetrimentOrFall(chart, id)) score -= 0.05;

  return clamp01(score);
}

function computePlanetProminenceComponent(
  chart: NatalChart, analysis: ChartAnalysis, domainId: IPSEDomainId, def: IPSEDomainDef,
): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  let total = 0;
  let maxPossible = 0;

  for (const [planetName, domainWeight] of Object.entries(def.planets) as Array<[BodyId, number]>) {
    const prominence = scorePlanetProminence(chart, analysis, planetName);
    total += prominence * domainWeight;
    maxPossible += domainWeight;

    if (prominence >= 0.35) {
      const weight = prominence * domainWeight;
      evidence.push({
        id: `western-${domainId}-planet-${planetName}`,
        system: 'western', domain: domainId, component: 'planetProminence',
        label: `${cap(planetName)} is prominent in the chart`,
        weight, rawWeight: weight,
        polarity: inferPlanetPolarity(chart, planetName),
        sourcePlanet: planetName,
      });
    }
  }

  return { score: clamp01(total / Math.max(maxPossible, 0.001)), evidence };
}

// ── Western: house activation ─────────────────────────────────────────────────

function computeHouseActivationComponent(
  chart: NatalChart, analysis: ChartAnalysis, domainId: IPSEDomainId, def: IPSEDomainDef,
): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  const houseScores: number[] = [];

  for (const houseNumber of def.houses) {
    const planets = getPlanetsInHouse(chart, houseNumber);
    let score = 0;
    for (const p of planets) score += (p === 'sun' || p === 'moon') ? 0.35 : 0.18;
    if (planets.length >= 3) score += 0.3;
    if (analysis.chartRuler?.house === houseNumber) score += 0.25;
    if (chart.western.bodies.trueNode?.house === houseNumber || chart.western.bodies.southNode?.house === houseNumber) {
      score += 0.15;
    }
    score = clamp01(score);
    houseScores.push(score);

    if (score >= 0.25) {
      evidence.push({
        id: `western-${domainId}-house-${houseNumber}`,
        system: 'western', domain: domainId, component: 'houseActivation',
        label: `House ${houseNumber} is activated`,
        weight: score, rawWeight: score, polarity: 'mixed', sourceHouse: houseNumber,
      });
    }
  }

  const topTwo = [...houseScores].sort((a, b) => b - a).slice(0, 2);
  const normalized = topTwo.length > 0 ? topTwo.reduce((a, b) => a + b, 0) / topTwo.length : 0;
  return { score: clamp01(normalized), evidence };
}

// ── Western: aspect network ───────────────────────────────────────────────────

const ASPECT_TYPE_WEIGHT: Record<AspectKind, number> = {
  conjunction: 1.0, opposition: 0.85, square: 0.8, trine: 0.7, sextile: 0.55, quincunx: 0.4,
};

function orbStrength(orb: number, maxOrb = 6): number {
  if (orb > maxOrb) return 0;
  return Math.pow(1 - orb / maxOrb, 1.5);
}

function computeAspectNetworkComponent(chart: NatalChart, domainId: IPSEDomainId, def: IPSEDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  let total = 0;
  let hits = 0;

  for (const [a, b] of def.aspects) {
    const aspect = findAspect(chart, a, b);
    if (!aspect) continue;

    const typeWeight = ASPECT_TYPE_WEIGHT[aspect.kind] ?? 0.4;
    const strength = orbStrength(aspect.orb, 6);
    const score = clamp01(typeWeight * strength);
    if (score <= 0) continue;

    total += score;
    hits += 1;

    evidence.push({
      id: `western-${domainId}-aspect-${a}-${b}-${aspect.kind}`,
      system: 'western', domain: domainId, component: 'aspectNetwork',
      label: `${cap(a)} ${aspect.kind} ${cap(b)}`,
      weight: score, rawWeight: score,
      polarity: inferAspectPolarity(aspect.kind),
      sourcePlanet: a, sourceAspect: aspect.kind, orb: aspect.orb,
    });
  }

  const score = hits === 0 ? 0 : clamp01(total / Math.min(hits, 3));
  return { score, evidence };
}

// ── Western: ruler condition ──────────────────────────────────────────────────

function computeRulerConditionComponent(chart: NatalChart, domainId: IPSEDomainId, def: IPSEDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  const scores: number[] = [];

  for (const houseNumber of def.houses) {
    const rulerName = getHouseRuler(chart, houseNumber);
    const ruler = chart.western.bodies[rulerName];
    if (!ruler) continue;

    let score = 0;
    if (isAngularHouse(ruler.house)) score += 0.25;
    if (def.houses.includes(ruler.house)) score += 0.25;
    if (isDomicileOrExalted(chart, rulerName)) score += 0.25;
    if (hasSupportiveAspect(chart, rulerName)) score += 0.15;
    if (hasChallengingButMotivatingAspect(chart, rulerName)) score += 0.1;

    score = clamp01(score);
    scores.push(score);

    if (score >= 0.25) {
      evidence.push({
        id: `western-${domainId}-ruler-${houseNumber}-${rulerName}`,
        system: 'western', domain: domainId, component: 'rulerCondition',
        label: `Ruler of house ${houseNumber} (${cap(rulerName)}) is relevant to this domain`,
        weight: score, rawWeight: score,
        polarity: inferPlanetPolarity(chart, rulerName),
        sourcePlanet: rulerName, sourceHouse: houseNumber,
      });
    }
  }

  const topTwo = [...scores].sort((a, b) => b - a).slice(0, 2);
  const score = topTwo.length > 0 ? topTwo.reduce((a, b) => a + b, 0) / topTwo.length : 0;
  return { score: clamp01(score), evidence };
}

// ── Western: element / mode flavor (low weight) ───────────────────────────────

function computeElementModeComponent(chart: NatalChart, domainId: IPSEDomainId, def: IPSEDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  const signHits = countPlanetsInSigns(chart, def.signs);
  const weighted = Math.min(signHits * 0.08, 0.4);

  if (weighted >= 0.16) {
    evidence.push({
      id: `western-${domainId}-sign-flavor`,
      system: 'western', domain: domainId, component: 'elementModePattern',
      label: 'Supporting sign emphasis flavors this domain',
      weight: weighted, rawWeight: weighted, polarity: 'mixed',
    });
  }

  return { score: clamp01(weighted), evidence };
}

// ── Western assembly ───────────────────────────────────────────────────────────

const WESTERN_COMPONENT_WEIGHTS = {
  planetProminence: 0.3, houseActivation: 0.2, aspectNetwork: 0.25, rulerCondition: 0.15, elementModePattern: 0.1,
};

function computeWesternScore(
  chart: NatalChart, analysis: ChartAnalysis, domainId: IPSEDomainId, def: IPSEDomainDef,
): { score: number; evidence: IPSEEvidence[] } {
  const planet = computePlanetProminenceComponent(chart, analysis, domainId, def);
  const house = computeHouseActivationComponent(chart, analysis, domainId, def);
  const aspect = computeAspectNetworkComponent(chart, domainId, def);
  const ruler = computeRulerConditionComponent(chart, domainId, def);
  const element = computeElementModeComponent(chart, domainId, def);

  const score01 =
    planet.score * WESTERN_COMPONENT_WEIGHTS.planetProminence +
    house.score * WESTERN_COMPONENT_WEIGHTS.houseActivation +
    aspect.score * WESTERN_COMPONENT_WEIGHTS.aspectNetwork +
    ruler.score * WESTERN_COMPONENT_WEIGHTS.rulerCondition +
    element.score * WESTERN_COMPONENT_WEIGHTS.elementModePattern;

  return {
    score: Math.round(clamp01(score01) * 100),
    evidence: [...planet.evidence, ...house.evidence, ...aspect.evidence, ...ruler.evidence, ...element.evidence],
  };
}

// ── Vedic domain mappings ──────────────────────────────────────────────────────

type VedicDomainDef = { karakas: BodyId[]; houses: number[]; lords: number[]; dashas: DashaLord[] };

const VEDIC_IPSE: Record<IPSEDomainId, VedicDomainDef> = {
  intellectual: { karakas: ['mercury', 'jupiter'], houses: [2, 3, 5, 9, 10, 11], lords: [2, 3, 5, 9], dashas: ['mercury', 'jupiter'] },
  practical: { karakas: ['saturn', 'mars', 'mercury', 'sun'], houses: [2, 3, 6, 10, 11], lords: [3, 6, 10, 11], dashas: ['saturn', 'mars', 'mercury', 'sun'] },
  spiritual: { karakas: ['jupiter', 'southNode', 'moon'], houses: [4, 5, 8, 9, 12], lords: [5, 8, 9, 12], dashas: ['jupiter', 'ketu', 'moon'] },
  emotional: { karakas: ['moon', 'venus'], houses: [4, 7, 8, 12], lords: [4, 7, 8, 12], dashas: ['moon', 'venus'] },
};

const DASHA_LORD_TO_BODY: Record<DashaLord, BodyId> = {
  sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn', rahu: 'trueNode', ketu: 'southNode',
};

function strengthRank(s: VedicYoga['strength']): number { return s === 'strong' ? 3 : s === 'moderate' ? 2 : 1; }

// ── Vedic: karaka strength ─────────────────────────────────────────────────────
// Reuses analyzeVedicChart()'s own 0-10 planet-strength score (already folds
// in dignity, house group, retrograde, combustion, and functional role)
// rather than re-deriving dignity/strength rules from scratch.

function computeVedicKarakaStrength(chart: NatalChart, analysis: VedicAnalysis, domainId: IPSEDomainId, def: VedicDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  const scores: number[] = [];

  for (const planetName of def.karakas) {
    const strength = analysis.planetStrengths[planetName];
    const vBody = chart.vedic.bodies[planetName];
    if (!strength || !vBody) continue;

    let score = strength.score / 10;
    if (def.houses.includes(vBody.house)) score += 0.15;
    score = clamp01(score);
    scores.push(score);

    if (score >= 0.25) {
      evidence.push({
        id: `vedic-${domainId}-karaka-${planetName}`,
        system: 'vedic', domain: domainId, component: 'karakaStrength',
        label: `${cap(planetName)} is a relevant Vedic karaka for this domain`,
        weight: score, rawWeight: score,
        polarity: inferVedicPolarity(strength), sourcePlanet: planetName,
      });
    }
  }

  const topTwo = [...scores].sort((a, b) => b - a).slice(0, 2);
  const score = topTwo.length > 0 ? topTwo.reduce((a, b) => a + b, 0) / topTwo.length : 0;
  return { score: clamp01(score), evidence };
}

// ── Vedic: bhava activation ────────────────────────────────────────────────────

const VEDIC_TRACKABLE_BODIES: BodyId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'trueNode', 'southNode'];

function computeVedicBhavaActivation(chart: NatalChart, domainId: IPSEDomainId, def: VedicDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  const scores: number[] = [];

  for (const houseNumber of def.houses) {
    const planets = VEDIC_TRACKABLE_BODIES.filter(id => chart.vedic.bodies[id]?.house === houseNumber);
    let score = 0;
    for (const p of planets) {
      if (p === 'sun' || p === 'moon') score += 0.25;
      else if (p === 'trueNode' || p === 'southNode') score += 0.2;
      else score += 0.15;
    }
    score = clamp01(score);
    scores.push(score);

    if (score >= 0.2) {
      evidence.push({
        id: `vedic-${domainId}-bhava-${houseNumber}`,
        system: 'vedic', domain: domainId, component: 'bhavaActivation',
        label: `Vedic house ${houseNumber} is activated`,
        weight: score, rawWeight: score, polarity: 'mixed', sourceHouse: houseNumber,
      });
    }
  }

  const topTwo = [...scores].sort((a, b) => b - a).slice(0, 2);
  const score = topTwo.length > 0 ? topTwo.reduce((a, b) => a + b, 0) / topTwo.length : 0;
  return { score: clamp01(score), evidence };
}

// ── Vedic: house lord condition ────────────────────────────────────────────────

function computeVedicLordCondition(analysis: VedicAnalysis, domainId: IPSEDomainId, def: VedicDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  const scores: number[] = [];

  for (const houseNumber of def.lords) {
    const hl = analysis.houseLords[houseNumber];
    if (!hl || hl.lordHouse == null) continue;

    let score = 0;
    if (hl.lordDignity === 'exaltation' || hl.lordDignity === 'own' || hl.lordDignity === 'moolatrikona') score += 0.3;
    if (hl.lordHouseGroup === 'kendra' || hl.lordHouseGroup === 'trikona' || hl.lordHouseGroup === 'both') score += 0.25;
    if (def.houses.includes(hl.lordHouse)) score += 0.2;
    if (hl.lordHouseGroup === 'upachaya' && domainId === 'practical') score += 0.15;
    if ([4, 8, 12].includes(hl.lordHouse) && domainId === 'spiritual') score += 0.15;
    if (hl.aspectingPlanets.length > 0) score += 0.1;

    score = clamp01(score);
    scores.push(score);

    if (score >= 0.25) {
      evidence.push({
        id: `vedic-${domainId}-lord-${houseNumber}-${hl.lord}`,
        system: 'vedic', domain: domainId, component: 'lordCondition',
        label: `Vedic ${houseNumber}th lord (${cap(hl.lord)}) supports this domain`,
        weight: score, rawWeight: score,
        polarity: hl.lordDignity === 'exaltation' || hl.lordDignity === 'own' ? 'supportive'
          : hl.lordDignity === 'debilitation' ? 'challenging' : 'mixed',
        sourcePlanet: hl.lord, sourceHouse: houseNumber,
      });
    }
  }

  const topTwo = [...scores].sort((a, b) => b - a).slice(0, 2);
  const score = topTwo.length > 0 ? topTwo.reduce((a, b) => a + b, 0) / topTwo.length : 0;
  return { score: clamp01(score), evidence };
}

// ── Vedic: dasha relevance ─────────────────────────────────────────────────────

function computeVedicDashaRelevance(chart: NatalChart, domainId: IPSEDomainId, def: VedicDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];

  let dasha;
  try {
    dasha = computeVimshottariDasha(chart, new Date().toISOString());
  } catch {
    return { score: 0, evidence };
  }

  let score = 0;
  if (def.dashas.includes(dasha.mahadasha.lord)) score += 0.4;
  if (def.dashas.includes(dasha.antardasha.lord)) score += 0.25;

  const mahaHouse = chart.vedic.bodies[DASHA_LORD_TO_BODY[dasha.mahadasha.lord]]?.house;
  const antarHouse = chart.vedic.bodies[DASHA_LORD_TO_BODY[dasha.antardasha.lord]]?.house;
  if (mahaHouse !== undefined && def.houses.includes(mahaHouse)) score += 0.2;
  if (antarHouse !== undefined && def.houses.includes(antarHouse)) score += 0.15;

  score = clamp01(score);

  if (score > 0) {
    evidence.push({
      id: `vedic-${domainId}-dasha-current`,
      system: 'vedic', domain: domainId, component: 'dashaRelevance',
      label: 'Current dasha timing activates this domain',
      weight: score, rawWeight: score, polarity: 'mixed',
      notes: `${dasha.mahadasha.lord} / ${dasha.antardasha.lord}`,
    });
  }

  return { score, evidence };
}

// ── Vedic: yoga support ────────────────────────────────────────────────────────
// Deliberately does NOT add a nakshatra-flavor sub-score: there is no
// citable, non-arbitrary nakshatra-to-IPSE-domain mapping in this codebase's
// existing Vedic engine, and inventing one would mean fabricating
// astrological correspondences rather than reusing real computed data.
// Yogas ARE real, already-computed data with real planet/house associations,
// so they're used, capped, and only when genuinely relevant.

function computeVedicYogaSupport(domainId: IPSEDomainId, analysis: VedicAnalysis, def: VedicDomainDef): ComponentResult {
  const evidence: IPSEEvidence[] = [];
  let score = 0;

  const relevant = analysis.yogas
    .filter(y => y.planets.some(p => def.karakas.includes(p)) || y.affectedHouses.some(h => def.houses.includes(h)))
    .sort((a, b) => strengthRank(b.strength) - strengthRank(a.strength))
    .slice(0, 2);

  for (const yoga of relevant) {
    const yogaScore = Math.min((strengthRank(yoga.strength) / 3) * 0.25, 0.25);
    score += yogaScore;
    evidence.push({
      id: `vedic-${domainId}-yoga-${yoga.name}`,
      system: 'vedic', domain: domainId, component: 'nakshatraYogaSupport',
      label: `${yoga.name} supports this domain`,
      weight: yogaScore, rawWeight: yogaScore,
      polarity: yoga.category === 'challenging' ? 'challenging' : 'supportive',
      notes: yoga.description,
    });
  }

  return { score: clamp01(score), evidence };
}

// ── Vedic assembly ─────────────────────────────────────────────────────────────

const VEDIC_COMPONENT_WEIGHTS = {
  karakaStrength: 0.3, bhavaActivation: 0.25, lordCondition: 0.2, dashaRelevance: 0.15, nakshatraYogaSupport: 0.1,
};

function computeVedicScore(
  chart: NatalChart, analysis: VedicAnalysis, domainId: IPSEDomainId,
): { score: number; evidence: IPSEEvidence[] } {
  const def = VEDIC_IPSE[domainId];

  const karaka = computeVedicKarakaStrength(chart, analysis, domainId, def);
  const bhava = computeVedicBhavaActivation(chart, domainId, def);
  const lord = computeVedicLordCondition(analysis, domainId, def);
  const dasha = computeVedicDashaRelevance(chart, domainId, def);
  const yoga = computeVedicYogaSupport(domainId, analysis, def);

  const score01 =
    karaka.score * VEDIC_COMPONENT_WEIGHTS.karakaStrength +
    bhava.score * VEDIC_COMPONENT_WEIGHTS.bhavaActivation +
    lord.score * VEDIC_COMPONENT_WEIGHTS.lordCondition +
    dasha.score * VEDIC_COMPONENT_WEIGHTS.dashaRelevance +
    yoga.score * VEDIC_COMPONENT_WEIGHTS.nakshatraYogaSupport;

  return {
    score: Math.round(clamp01(score01) * 100),
    evidence: [...karaka.evidence, ...bhava.evidence, ...lord.evidence, ...dasha.evidence, ...yoga.evidence],
  };
}

// ── Vibrational (harmonic) refinement layer ───────────────────────────────────
// Self-contained: checks whether two domain-relevant planets' tropical
// longitudes sit near ANY division of a given harmonic (not just an exact
// conjunction), across a small, fixed set of harmonics. This is a narrower,
// "processing rhythm" refinement — separate in purpose from the full
// Vibrational Astrology section (lib/astro/vibrational.ts), so it doesn't
// reuse that module directly, but the underlying math (multiply/mod 360) is
// the same well-established harmonic-astrology principle.

const IPSE_HARMONICS = [5, 7, 8, 9, 10, 11, 12, 13, 16, 24];

const VIBRATIONAL_PAIRS: Record<IPSEDomainId, Array<[BodyId, BodyId]>> = {
  intellectual: [['mercury', 'uranus'], ['mercury', 'saturn'], ['mercury', 'jupiter'], ['mercury', 'pluto'], ['mercury', 'neptune'], ['mercury', 'mars']],
  practical: [['mars', 'saturn'], ['mercury', 'saturn'], ['sun', 'saturn'], ['mars', 'mercury'], ['venus', 'saturn'], ['jupiter', 'saturn']],
  spiritual: [['jupiter', 'neptune'], ['moon', 'neptune'], ['mercury', 'neptune'], ['jupiter', 'pluto'], ['uranus', 'neptune'], ['saturn', 'neptune'], ['moon', 'pluto']],
  emotional: [['moon', 'venus'], ['moon', 'mercury'], ['moon', 'neptune'], ['moon', 'pluto'], ['venus', 'neptune'], ['venus', 'pluto'], ['moon', 'saturn']],
};

function distanceToNearestHarmonic(separation: number, harmonic: number): number {
  const angle = 360 / harmonic;
  let min = Infinity;
  for (let k = 0; k <= harmonic; k++) {
    min = Math.min(min, angularSep(separation, k * angle));
  }
  return min;
}

function harmonicOrbMax(harmonic: number): number {
  return Math.max(0.5, Math.min(2.5, 6 / Math.sqrt(harmonic)));
}

function harmonicStrength(lonA: number, lonB: number, harmonic: number): number {
  const separation = angularSep(lonA, lonB);
  const distance = distanceToNearestHarmonic(separation, harmonic);
  const orb = harmonicOrbMax(harmonic);
  if (distance > orb) return 0;
  return Math.pow(1 - distance / orb, 2);
}

function computeVibrationalScore(chart: NatalChart, domainId: IPSEDomainId): { score: number; evidence: IPSEEvidence[] } {
  const pairs = VIBRATIONAL_PAIRS[domainId];
  const evidence: IPSEEvidence[] = [];
  let total = 0;
  let hits = 0;

  for (const [a, b] of pairs) {
    const planetA = chart.western.bodies[a];
    const planetB = chart.western.bodies[b];
    if (!planetA || !planetB) continue;

    for (const harmonic of IPSE_HARMONICS) {
      const strength = harmonicStrength(planetA.longitude, planetB.longitude, harmonic);
      if (strength < 0.45) continue;

      const score = Math.min(strength, 1);
      total += score;
      hits += 1;

      evidence.push({
        id: `vibrational-${domainId}-${a}-${b}-h${harmonic}`,
        system: 'vibrational', domain: domainId, component: 'harmonicPattern',
        label: `${cap(a)}-${cap(b)} ${harmonic}th harmonic pattern`,
        weight: score, rawWeight: score, polarity: 'mixed',
        sourcePlanet: a, notes: `Harmonic ${harmonic}`,
      });
    }
  }

  const score01 = hits === 0 ? 0 : clamp01(total / Math.min(hits, 4));
  return {
    score: Math.round(score01 * 100),
    evidence: evidence.sort((a, b) => b.weight - a.weight).slice(0, 6),
  };
}

// ── Combine systems ────────────────────────────────────────────────────────────

function combineIPSEScores(western: number | null, vedic: number | null, vibrational: number | null): number {
  const hw = typeof western === 'number';
  const hv = typeof vedic === 'number';
  const hb = typeof vibrational === 'number';

  if (hw && hv && hb) return Math.round(western! * 0.6 + vedic! * 0.25 + vibrational! * 0.15);
  if (hw && hv) return Math.round(western! * 0.7 + vedic! * 0.3);
  if (hw && hb) return Math.round(western! * 0.8 + vibrational! * 0.2);
  if (hw) return Math.round(western!);
  if (hv && hb) return Math.round(vedic! * 0.75 + vibrational! * 0.25);
  if (hv) return Math.round(vedic!);
  if (hb) return Math.round(vibrational!);
  return 0;
}

// ── Evidence uniqueness (display-only weighting, does not affect scores) ─────

function evidenceSourceKey(e: IPSEEvidence): string {
  return [e.system, e.sourcePlanet ?? '', e.sourceHouse ?? '', e.sourceAspect ?? '', e.component, e.notes ?? ''].join('|');
}

function applyEvidenceUniquenessPenalty(byDomain: Record<IPSEDomainId, IPSEEvidence[]>): Record<IPSEDomainId, IPSEEvidence[]> {
  const counts = new Map<string, number>();
  for (const list of Object.values(byDomain)) {
    const seen = new Set(list.map(evidenceSourceKey));
    for (const key of seen) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const adjusted = {} as Record<IPSEDomainId, IPSEEvidence[]>;
  for (const [domain, list] of Object.entries(byDomain) as Array<[IPSEDomainId, IPSEEvidence[]]>) {
    adjusted[domain] = list
      .map(e => {
        const count = counts.get(evidenceSourceKey(e)) ?? 1;
        const penalty = Math.sqrt(count);
        return { ...e, rawWeight: e.rawWeight ?? e.weight, weight: e.weight / penalty };
      })
      .sort((a, b) => b.weight - a.weight);
  }
  return adjusted;
}

// ── Labels, tone, confidence ───────────────────────────────────────────────────

function scoreToIPSELabel(score: number): IPSELabel {
  if (score >= 75) return 'Dominant emphasis';
  if (score >= 60) return 'Strong emphasis';
  if (score >= 45) return 'Moderate emphasis';
  if (score >= 25) return 'Subtle emphasis';
  return 'Quiet emphasis';
}

function rankToLabel(rank: number): IPSERankLabel {
  if (rank === 1) return 'Dominant mode';
  if (rank === 2) return 'Supporting mode';
  if (rank === 3) return 'Background mode';
  return 'Quietest mode';
}

function rankToMinorLabel(rank: number): string {
  if (rank === 1) return 'Most visible growth mode';
  if (rank === 2) return 'Supporting growth mode';
  if (rank === 3) return 'Developing mode';
  return 'Less emphasized right now';
}

function computeTone(evidence: IPSEEvidence[]): IPSEPolarity {
  let supportive = 0, challenging = 0, transformational = 0, mixed = 0;

  for (const e of evidence) {
    if (e.polarity === 'supportive') supportive += e.weight;
    else if (e.polarity === 'challenging') challenging += e.weight;
    else if (e.polarity === 'transformational') transformational += e.weight;
    else mixed += e.weight;
  }

  const total = supportive + challenging + transformational + mixed;
  if (total <= 0) return 'mixed';
  if (transformational / total >= 0.35) return 'transformational';
  if (supportive / total >= 0.55) return 'supportive';
  if (challenging / total >= 0.45) return 'challenging';
  return 'mixed';
}

function computeConfidence(domain: Pick<IPSEDomainResult, 'westernEvidence' | 'vedicEvidence' | 'vibrationalEvidence'>): 'low' | 'moderate' | 'high' {
  const evidenceCount = domain.westernEvidence.length + domain.vedicEvidence.length + domain.vibrationalEvidence.length;
  const systems = [domain.westernEvidence.length > 0, domain.vedicEvidence.length > 0, domain.vibrationalEvidence.length > 0].filter(Boolean).length;

  if (evidenceCount >= 6 && systems >= 2) return 'high';
  if (evidenceCount >= 3) return 'moderate';
  return 'low';
}

// ── Subtypes ───────────────────────────────────────────────────────────────────

function normalizeSubtypeKey(domainId: IPSEDomainId, e: IPSEEvidence): string {
  if (!e.label) return '';
  const label = e.label.toLowerCase();
  for (const key of Object.keys(IPSE_DOMAINS[domainId].subtypes)) {
    const [a, b] = key.split('_');
    if (label.includes(a) && label.includes(b)) return key;
  }
  return '';
}

const SUBTYPE_FALLBACK: Record<IPSEDomainId, string[]> = {
  intellectual: ['Pattern-recognition oriented'],
  practical: ['Applied problem-solver'],
  spiritual: ['Meaning-oriented seeker'],
  emotional: ['Relationally perceptive'],
};

function generateSubtypes(domainId: IPSEDomainId, evidence: IPSEEvidence[]): string[] {
  const subtypeScores = new Map<string, number>();

  for (const e of evidence) {
    const key = normalizeSubtypeKey(domainId, e);
    const subtype = key ? IPSE_DOMAINS[domainId].subtypes[key] : undefined;
    if (!subtype) continue;
    subtypeScores.set(subtype, (subtypeScores.get(subtype) ?? 0) + e.weight);
  }

  const sorted = [...subtypeScores.entries()].sort((a, b) => b[1] - a[1]).map(([subtype]) => subtype);
  return sorted.length > 0 ? sorted.slice(0, 3) : SUBTYPE_FALLBACK[domainId];
}

// ── Balance pattern ────────────────────────────────────────────────────────────

function computeBalancePattern(ranked: IPSEDomainResult[]): IPSEBalancePattern {
  const [top, second, third, fourth] = ranked;

  const topGap = top.score - second.score;
  const totalSpread = top.score - fourth.score;
  const topTwoGap = second.score - third.score;

  if (totalSpread <= 15) return 'Balanced IPSE profile';
  if (top.score < 45 && totalSpread <= 20) return 'Even but subtle profile';
  if (topGap <= 8 && topTwoGap >= 12) return 'Dual-led profile';
  if (top.score >= 60 && second.score >= 55 && third.score < 45 && totalSpread >= 25) return 'Polarized profile';

  if (topGap >= 10) {
    if (top.domain === 'intellectual') return 'Intellect-led profile';
    if (top.domain === 'practical') return 'Practicality-led profile';
    if (top.domain === 'spiritual') return 'Spirit-led profile';
    if (top.domain === 'emotional') return 'Emotion-led profile';
  }

  return 'Balanced IPSE profile';
}

// ── Copy: strengths / growth edges / integrated expression ───────────────────

const DOMAIN_COPY: Record<IPSEDomainId, { strengths: string[]; growthEdges: string[]; integratedExpression: string }> = {
  intellectual: {
    strengths: ['Pattern recognition', 'Conceptual analysis', 'Learning through language, systems, or abstraction'],
    growthEdges: ['Over-analysis', 'Living in the mind instead of the body', 'Needing to understand everything before trusting experience'],
    integratedExpression: 'A mind that can perceive complexity, organize insight, and translate ideas into wisdom.',
  },
  practical: {
    strengths: ['Execution', 'Discipline', 'Real-world problem-solving'],
    growthEdges: ['Over-control', 'Defining worth through productivity', 'Difficulty resting before the work is complete'],
    integratedExpression: 'The ability to turn insight into structure, practice, and tangible results.',
  },
  spiritual: {
    strengths: ['Meaning-making', 'Symbolic perception', 'Sensitivity to mystery, purpose, and transpersonal patterns'],
    growthEdges: ['Escapism', 'Confusing intuition with projection', 'Searching for meaning while avoiding ordinary reality'],
    integratedExpression: 'A grounded connection to meaning, intuition, and the larger patterns of life.',
  },
  emotional: {
    strengths: ['Empathy', 'Relational perception', 'Emotional depth and self-awareness'],
    growthEdges: ['Emotional overwhelm', "Absorbing other people's feelings", 'Confusing intensity with intimacy'],
    integratedExpression: 'Emotional wisdom that can feel deeply without losing clarity or selfhood.',
  },
};

// ── Summary generation (deterministic; safe to surface as-is) ────────────────

// Varied by rank (not just domain name) so the four domain cards don't read
// as the same sentence with nouns swapped. The "this isn't a measure of
// ability" framing is stated once, prominently, at the section level
// (IPSEProfile.disclaimer) — repeating it verbatim in all four cards was
// the main source of the repetitiveness, so here it only resurfaces where
// it matters most: the quietest/least-emphasized mode, where a reader is
// likeliest to misread "quieter" as "weaker."

function generateDomainSummary(domain: IPSEDomainResult, isMinor: boolean): string {
  const subtypeText = domain.subtypes.join(', ');
  const title = domain.title;

  if (isMinor) {
    switch (domain.rank) {
      case 1:
        return `${title} is currently the most visible way this child seems to learn, feel, and grow — showing up through ${subtypeText}. Use this as a support cue, not a fixed description of who they are.`;
      case 2:
        return `${title} shows up as a steady supporting mode, often working alongside their more visible pattern above — through ${subtypeText}.`;
      case 3:
        return `${title} appears as a developing mode right now, expressed through ${subtypeText} when the moment calls for it.`;
      default:
        return `${title} is less emphasized in this reading, though that can shift with time, environment, and experience — it may still show up through ${subtypeText} in quieter ways. This does not measure ability or potential.`;
    }
  }

  switch (domain.rank) {
    case 1:
      return `${title} leads your IPSE Profile — the most emphasized of the four modes in this chart. It shows up through ${subtypeText}, and it's likely one of the most natural ways you meet life, learn, and grow.`;
    case 2:
      return `${title} runs close behind as a strong supporting current, often working alongside your dominant mode. Look for it through ${subtypeText} — a mode you can lean on even when it isn't leading.`;
    case 3:
      return `${title} sits further in the background here — present but quieter, expressed through ${subtypeText} when called on. A background mode isn't absent, just less symbolically emphasized in this particular chart.`;
    default:
      return `${title} is the quietest of the four modes in this chart, showing up through ${subtypeText} in subtler ways. This reflects symbolic emphasis only — not a limit on what you can develop or access.`;
  }
}

function generateIPSEProfileSummary(ranked: IPSEDomainResult[], balancePattern: IPSEBalancePattern, isMinor: boolean): string {
  const [top, second, , low] = ranked;

  if (isMinor) {
    return `This child's profile currently appears most expressive through ${top.title.toLowerCase()} patterns, with ${second.title.toLowerCase()} as a supporting mode. This should be used as a gentle support map, not a fixed description of who the child is or what they can become.`;
  }

  switch (balancePattern) {
    case 'Intellect-led profile':
      return `Your IPSE pattern is intellect-led, with ${second.title.toLowerCase()} as the strongest supporting mode. You may naturally process life through analysis, language, systems, research, or pattern recognition. The growth edge is integrating insight with ${low.title.toLowerCase()} development.`;
    case 'Practicality-led profile':
      return `Your IPSE pattern is practicality-led, with ${second.title.toLowerCase()} as the strongest supporting mode. You may naturally process life through action, structure, implementation, discipline, or real-world problem-solving. The growth edge is making space for the quieter ${low.title.toLowerCase()} mode.`;
    case 'Spirit-led profile':
      return `Your IPSE pattern is spirit-led, with ${second.title.toLowerCase()} as the strongest supporting mode. You may naturally process life through meaning, symbolism, intuition, existential inquiry, or transpersonal awareness. The growth edge is grounding insight through the quieter ${low.title.toLowerCase()} mode.`;
    case 'Emotion-led profile':
      return `Your IPSE pattern is emotion-led, with ${second.title.toLowerCase()} as the strongest supporting mode. You may naturally process life through feeling, empathy, relational perception, and emotional pattern recognition. The growth edge is balancing sensitivity with the quieter ${low.title.toLowerCase()} mode.`;
    case 'Dual-led profile':
      return `Your IPSE pattern is dual-led, with ${top.title.toLowerCase()} and ${second.title.toLowerCase()} working closely together. These two modes may form the core of how you perceive, decide, learn, and grow.`;
    case 'Polarized profile':
      return `Your IPSE pattern is polarized, with ${top.title.toLowerCase()} and ${second.title.toLowerCase()} much more emphasized than the other two modes. This can create strong specialization, with growth coming from consciously developing the quieter modes.`;
    case 'Even but subtle profile':
      return 'Your IPSE profile is even but subtle, suggesting no single mode overwhelmingly dominates the chart. These capacities may develop through life experience, environment, practice, and choice rather than one obvious chart signature.';
    case 'Balanced IPSE profile':
    default:
      return 'Your IPSE profile is relatively balanced, suggesting that intellectual, practical, spiritual, and emotional modes all have meaningful symbolic presence in the chart. Your growth path may involve integration rather than specialization.';
  }
}

// ── Fallback (no usable Western data) ─────────────────────────────────────────

function createIPSEFallbackProfile(isMinor: boolean): IPSEProfile {
  return {
    sectionTitle: isMinor ? 'Learning & Growth Style' : 'IPSE Profile',
    sectionSubtitle: isMinor
      ? "Supportive insight into a child's natural learning, feeling, and growth patterns — not a measure of ability or potential."
      : 'A symbolic map of your intellectual, practical, spiritual, and emotional intelligence styles.',
    disclaimer: isMinor
      ? "This profile is for supportive reflection only. It does not measure intelligence, ability, personality, or potential. Children should never be labeled, limited, compared, or judged based on a chart. A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation."
      : 'IPSE reflects symbolic chart emphasis, not measured intelligence, fixed ability, or personal worth.',
    dominantDomain: 'intellectual',
    supportingDomain: undefined,
    balancePattern: 'Balanced IPSE profile',
    profileSummary: 'Not enough chart data is available yet to compute an IPSE Profile.',
    rankedDomains: [],
    isMinor,
    dataCoverage: { western: false, vedic: false, vibrational: false },
  };
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function computeIPSEProfile(chart: NatalChart, options: IPSEOptions = {}): IPSEProfile {
  const isMinor = options.isMinor ?? isMinorChart(chart.input.date);
  const hasWestern = hasWesternChartData(chart);

  if (!hasWestern) return createIPSEFallbackProfile(isMinor);

  let vedicAnalysis: VedicAnalysis | null = null;
  const wantsVedic = options.includeVedic !== false;
  if (wantsVedic && chart.vedic) {
    try { vedicAnalysis = analyzeVedicChart(chart); } catch { vedicAnalysis = null; }
  }
  const hasVedic = vedicAnalysis !== null;

  const hasVibrational = options.includeVibrational !== false && hasPlanetaryLongitudes(chart);

  const analysis = analyzeChart(chart);

  const preliminary: IPSEDomainResult[] = DOMAIN_IDS.map(domainId => {
    const def = IPSE_DOMAINS[domainId];

    const western = computeWesternScore(chart, analysis, domainId, def);
    const vedic = hasVedic ? computeVedicScore(chart, vedicAnalysis!, domainId) : null;
    const vibrational = hasVibrational ? computeVibrationalScore(chart, domainId) : null;

    const finalScore = combineIPSEScores(western.score, vedic?.score ?? null, vibrational?.score ?? null);

    const allEvidence = [...western.evidence, ...(vedic?.evidence ?? []), ...(vibrational?.evidence ?? [])]
      .sort((a, b) => b.weight - a.weight);

    return {
      domain: domainId,
      title: def.title,
      rank: 0,
      score: finalScore,
      label: scoreToIPSELabel(finalScore),
      rankLabel: 'Background mode',
      confidence: 'low',
      tone: computeTone(allEvidence),
      subtypes: generateSubtypes(domainId, allEvidence),
      summary: '',
      strengths: DOMAIN_COPY[domainId].strengths,
      growthEdges: DOMAIN_COPY[domainId].growthEdges,
      integratedExpression: DOMAIN_COPY[domainId].integratedExpression,
      westernScore: western.score,
      vedicScore: vedic?.score ?? null,
      vibrationalScore: vibrational?.score ?? null,
      westernEvidence: western.evidence,
      vedicEvidence: vedic?.evidence ?? [],
      vibrationalEvidence: vibrational?.evidence ?? [],
    };
  });

  const ranked = preliminary
    .sort((a, b) => b.score - a.score)
    .map((result, index) => {
      const rank = index + 1;
      const rankLabel = (isMinor ? rankToMinorLabel(rank) : rankToLabel(rank)) as IPSERankLabel;
      const updated: IPSEDomainResult = { ...result, rank, rankLabel };
      updated.confidence = computeConfidence(updated);
      updated.summary = generateDomainSummary(updated, isMinor);
      return updated;
    });

  // Evidence-uniqueness adjustment is display-only — applied after ranking so
  // it never perturbs the score/rank order, only how evidence is sorted
  // when shown to the user.
  const evidenceByDomain = applyEvidenceUniquenessPenalty({
    intellectual: ranked.find(r => r.domain === 'intellectual')!.westernEvidence
      .concat(ranked.find(r => r.domain === 'intellectual')!.vedicEvidence)
      .concat(ranked.find(r => r.domain === 'intellectual')!.vibrationalEvidence),
    practical: ranked.find(r => r.domain === 'practical')!.westernEvidence
      .concat(ranked.find(r => r.domain === 'practical')!.vedicEvidence)
      .concat(ranked.find(r => r.domain === 'practical')!.vibrationalEvidence),
    spiritual: ranked.find(r => r.domain === 'spiritual')!.westernEvidence
      .concat(ranked.find(r => r.domain === 'spiritual')!.vedicEvidence)
      .concat(ranked.find(r => r.domain === 'spiritual')!.vibrationalEvidence),
    emotional: ranked.find(r => r.domain === 'emotional')!.westernEvidence
      .concat(ranked.find(r => r.domain === 'emotional')!.vedicEvidence)
      .concat(ranked.find(r => r.domain === 'emotional')!.vibrationalEvidence),
  });
  for (const result of ranked) {
    const adjusted = evidenceByDomain[result.domain];
    result.westernEvidence = adjusted.filter(e => e.system === 'western');
    result.vedicEvidence = adjusted.filter(e => e.system === 'vedic');
    result.vibrationalEvidence = adjusted.filter(e => e.system === 'vibrational');
  }

  const balancePattern = computeBalancePattern(ranked);
  const profileSummary = generateIPSEProfileSummary(ranked, balancePattern, isMinor);

  return {
    sectionTitle: isMinor ? 'Learning & Growth Style' : 'IPSE Profile',
    sectionSubtitle: isMinor
      ? "Supportive insight into a child's natural learning, feeling, and growth patterns — not a measure of ability or potential."
      : 'A symbolic map of your intellectual, practical, spiritual, and emotional intelligence styles.',
    disclaimer: isMinor
      ? "This profile is for supportive reflection only. It does not measure intelligence, ability, personality, or potential. Children should never be labeled, limited, compared, or judged based on a chart. A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation."
      : 'IPSE reflects symbolic chart emphasis, not measured intelligence, fixed ability, or personal worth.',
    dominantDomain: ranked[0].domain,
    supportingDomain: ranked[1]?.domain,
    balancePattern,
    profileSummary,
    rankedDomains: ranked,
    isMinor,
    dataCoverage: { western: hasWestern, vedic: hasVedic, vibrational: hasVibrational },
  };
}
