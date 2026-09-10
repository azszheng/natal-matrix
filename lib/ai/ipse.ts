/**
 * ipse.ts
 *
 * IPSE Style Profile — describes STYLES of symbolic intelligence within four
 * domains (Intellectual, Practical, Spiritual/Meaning, Emotional/Relational).
 * This is deliberately NOT a ranking of "how smart" someone is: it never
 * claims to measure IQ, EQ, ability, giftedness, morality, or spiritual
 * attainment. A "quieter" style is a quieter symbolic current, not a
 * deficit.
 *
 * Architecture — each system has ONE job, per product spec. They are never
 * merged into one opaque score:
 *
 *   Western      = primary psychological style detection (which style,
 *                  how strongly emphasized)
 *   Vedic        = functional support/friction, house-lord routing, dasha
 *                  timing, nakshatra flavor -- a REFINEMENT lens on top of
 *                  the Western-detected style, not an independent score
 *   Vibrational  = harmonic talent/frequency subtype -- adds a "hidden
 *                  resonance" tag to a style, small capped contribution
 *   Human Design = access pattern / conditioning / consistency lens --
 *                  whether a style is reliably available, conditioned by
 *                  others, or environment/timing-dependent. Modifies
 *                  fluency/friction only, never orientation.
 *   Gene Keys    = NOT implemented in this pass (explicitly out of scope
 *                  per product decision) -- the lens always reports
 *                  unavailable rather than fabricating shadow/gift text.
 *
 * Data sources reused rather than duplicated: analyzeVedicChart() for
 * planet strength/house lords/yogas, computeVimshottariDasha() for current
 * dasha timing. Human Design data is NOT stored on NatalChart in this
 * codebase -- it's a separate computation (computeHumanDesignChart, in a
 * server-only module) that the UI already fetches independently. So this
 * module takes an already-computed HdChart via options, rather than
 * expecting chart.humanDesign to exist.
 */

import type { NatalChart, BodyId, SignId, AspectKind } from '@/lib/astro/types';
import { analyzeVedicChart, type VedicAnalysis } from './vedicAnalysis';
import { computeVimshottariDasha, type DashaLord } from '@/lib/astro/dashas';
import { isMinorChart } from './childhoodImprints';
import type { InterpretMode } from './prompts';
import type { HdChart, CenterId } from '@/lib/astro/humandesign-constants';
import { GATE_CENTER } from '@/lib/astro/humandesign-constants';

// ── Public types ─────────────────────────────────────────────────────────────

export type IPSEDomainId = 'intellectual' | 'practical' | 'spiritual' | 'emotional';

export type IPSESystem = 'western' | 'vedic' | 'vibrational' | 'humanDesign' | 'geneKeys' | 'selfReport';

export type IPSEStyleTone =
  | 'supportive' | 'challenging' | 'mixed' | 'transformational'
  | 'pressure-driven' | 'porous' | 'conditioned' | 'fluid';

export type IPSEAccessPattern =
  | 'consistent access' | 'conditioned access' | 'pressure-driven access'
  | 'environment-dependent access' | 'burst-based access'
  | 'relationally activated access' | 'reflective access' | 'unknown';

export type IPSELayerAvailability = {
  western: boolean;
  vedic: boolean;
  vibrational: boolean;
  humanDesign: boolean;
  geneKeys: boolean;
  selfReport: boolean;
};

export type IPSEEvidenceComponent =
  | 'planet' | 'house' | 'aspect' | 'ruler' | 'dignity' | 'element' | 'modality'
  | 'karaka' | 'bhava' | 'houseLord' | 'dasha' | 'nakshatra' | 'yoga' | 'harmonic'
  | 'definedCenter' | 'openCenter' | 'authority' | 'type' | 'profile' | 'definition'
  | 'channel' | 'geneKey' | 'selfReport';

export type IPSEEvidence = {
  id: string;
  system: IPSESystem;
  domain: IPSEDomainId;
  styleId?: string;
  component: IPSEEvidenceComponent;
  label: string;
  interpretation: string;
  weight: number; // 0-1, display weight after uniqueness adjustment
  rawWeight?: number;
  polarity: 'supportive' | 'challenging' | 'mixed' | 'transformational' | 'conditioning' | 'amplifying' | 'integrating';
  sourcePlanet?: BodyId;
  sourceHouse?: number;
  sourceAspect?: string;
  orb?: number;
  notes?: string;
};

export type IPSEStyleResult = {
  id: string;
  label: string;
  score: number; // 0-100 style salience -- symbolic emphasis, not ability
  tone: IPSEStyleTone;
  evidence: IPSEEvidence[];
};

export type VedicIPSELens = {
  available: boolean;
  summary: string;
  houseLordRouting?: string;
  supportFriction?: string;
  timing?: string;
  nakshatraFlavor?: string;
  evidence: IPSEEvidence[];
};

export type VibrationalIPSELens = {
  available: boolean;
  summary: string;
  harmonicSignature?: string;
  subtypes: string[];
  evidence: IPSEEvidence[];
};

export type HumanDesignIPSELens = {
  available: boolean;
  accessPattern: IPSEAccessPattern;
  summary: string;
  consistencyFactors: string[];
  conditioningFactors: string[];
  decisionSupport: string;
  growthEdge: string;
  discrepancyNote?: string;
  evidence: IPSEEvidence[];
};

export type GeneKeysIPSELens = {
  available: boolean;
  summary: string;
  shadow?: string;
  gift?: string;
  integrationPrompt?: string;
  evidence: IPSEEvidence[];
};

// Kept for future use (questionnaire infra doesn't exist in this app yet) --
// not wired into scoring or UI in this pass.
export type IPSESelfReport = {
  intellectual?: number;
  practical?: number;
  spiritual?: number;
  emotional?: number;
};

export type IPSEDomainCard = {
  domain: IPSEDomainId;
  title: string;
  subtitle: string;

  primaryStyle: IPSEStyleResult | null;
  secondaryStyles: IPSEStyleResult[];

  orientationScore: number; // 0-100 symbolic emphasis
  fluencyScore: number;     // 0-100 ease/coherence of expression
  frictionScore: number;    // 0-100 pressure/complexity/conditioning
  styleConfidence: 'low' | 'moderate' | 'high';

  expressionTone: IPSEStyleTone;
  accessPattern: IPSEAccessPattern;

  summary: string;
  strengths: string[];
  growthEdges: string[];
  integratedExpression: string;

  westernEvidence: IPSEEvidence[];
  vedicLens: VedicIPSELens;
  vibrationalLens: VibrationalIPSELens;
  humanDesignLens: HumanDesignIPSELens;
  geneKeysLens: GeneKeysIPSELens;
};

export type IPSEOverallPattern =
  | 'intellect-led' | 'practicality-led' | 'spirit-led' | 'emotion-led'
  | 'dual-led' | 'blended' | 'polarized' | 'subtle';

export type IPSEStyleProfile = {
  sectionTitle: string;
  sectionSubtitle: string;
  disclaimer: string;
  isMinor: boolean;
  dataCoverage: IPSELayerAvailability;
  overallPattern: IPSEOverallPattern;
  profileSummary: string;
  domainCards: IPSEDomainCard[];
};

export type IPSEOptions = {
  mode?: InterpretMode;
  isMinor?: boolean;
  includeVedic?: boolean;
  includeVibrational?: boolean;
  includeHumanDesign?: boolean;
  includeGeneKeys?: boolean;
  humanDesign?: HdChart | null;
};

// ── Small local helpers (shared math/lookups) ─────────────────────────────────

function clamp0100(n: number): number { return Math.round(Math.max(0, Math.min(100, n))); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function ordinal(n: number): string {
  if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd';
  return `${n}th`;
}

function angularSep(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Bodies tracked for house/sign emphasis. South Node is included for
// placement checks but never paired with True Node (see natal.ts: they're
// always exactly 180 deg apart by construction, a tautology already fixed
// elsewhere this session).
const TRACKED_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode', 'chiron',
];

function findAspect(chart: NatalChart, a: BodyId, b: BodyId) {
  return chart.western.aspects.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
}

const HARD_ASPECTS: AspectKind[] = ['square', 'opposition'];

function isDomicileOrExalted(chart: NatalChart, id: BodyId): boolean {
  const label = chart.western.dignities[id]?.label;
  return label === 'domicile' || label === 'exaltation';
}
function isInDetrimentOrFall(chart: NatalChart, id: BodyId): boolean {
  const label = chart.western.dignities[id]?.label;
  return label === 'detriment' || label === 'fall';
}

function hasWesternChartData(chart: NatalChart | null | undefined): boolean {
  return !!chart?.western?.bodies?.sun && !!chart.western.houses?.cusps?.length;
}
function hasPlanetaryLongitudes(chart: NatalChart): boolean {
  return typeof chart.western.bodies.sun?.longitude === 'number';
}

// ── Western indicator vocabulary ──────────────────────────────────────────────
// A small, finite set of indicator "shapes" -- this is what "adapt indicator
// names to the codebase" means here: rather than transcribing ~150 loosely
// redundant string codes from the spec verbatim, each style is defined by
// 3-5 indicators drawn from its most astrologically central patterns (the
// ones the spec itself calls out as "Important patterns" / anchors), each
// evaluated against real chart data through one of these shapes.

type WesternIndicator =
  | { k: 'aspect'; a: BodyId; b: BodyId; hard?: boolean }
  | { k: 'afflicted'; planet: BodyId }
  | { k: 'houseP'; planet: BodyId; house: number }
  | { k: 'houseEmph'; house: number }
  | { k: 'signP'; planet: BodyId; sign: SignId }
  | { k: 'signEmph'; signs: SignId[] };

function evalWesternIndicator(chart: NatalChart, ind: WesternIndicator): { hit: boolean; strength: number; label: string; polarity: IPSEEvidence['polarity']; sourcePlanet?: BodyId; sourceHouse?: number; sourceAspect?: string; orb?: number } {
  switch (ind.k) {
    case 'aspect': {
      const asp = findAspect(chart, ind.a, ind.b);
      if (!asp) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      if (ind.hard !== undefined) {
        const isHard = HARD_ASPECTS.includes(asp.kind);
        if (ind.hard !== isHard) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      }
      const maxOrb = 6;
      const strength = clamp01(1 - Math.min(asp.orb, maxOrb) / maxOrb);
      const polarity: IPSEEvidence['polarity'] = asp.kind === 'trine' || asp.kind === 'sextile' ? 'supportive'
        : HARD_ASPECTS.includes(asp.kind) ? 'challenging' : 'mixed';
      return {
        hit: true, strength, polarity,
        label: `${cap(ind.a)} ${asp.kind} ${cap(ind.b)}`,
        sourcePlanet: ind.a, sourceAspect: asp.kind, orb: asp.orb,
      };
    }
    case 'afflicted': {
      const hit = chart.western.aspects.some(a => (a.a === ind.planet || a.b === ind.planet) && HARD_ASPECTS.includes(a.kind));
      return hit
        ? { hit: true, strength: 0.6, label: `${cap(ind.planet)} carries hard-aspect pressure`, polarity: 'challenging', sourcePlanet: ind.planet }
        : { hit: false, strength: 0, label: '', polarity: 'mixed' };
    }
    case 'houseP': {
      const p = chart.western.bodies[ind.planet];
      if (!p || p.house !== ind.house) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      return { hit: true, strength: 0.7, label: `${cap(ind.planet)} in house ${ind.house}`, polarity: 'mixed', sourcePlanet: ind.planet, sourceHouse: ind.house };
    }
    case 'houseEmph': {
      const count = TRACKED_BODIES.filter(b => chart.western.bodies[b]?.house === ind.house).length;
      if (count < 2) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      return { hit: true, strength: clamp01(0.4 + count * 0.15), label: `House ${ind.house} carries concentrated emphasis`, polarity: 'mixed', sourceHouse: ind.house };
    }
    case 'signP': {
      const p = chart.western.bodies[ind.planet];
      if (!p || p.sign !== ind.sign) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      const polarity: IPSEEvidence['polarity'] = isDomicileOrExalted(chart, ind.planet) ? 'supportive' : isInDetrimentOrFall(chart, ind.planet) ? 'challenging' : 'mixed';
      return { hit: true, strength: 0.6, label: `${cap(ind.planet)} in ${cap(ind.sign)}`, polarity, sourcePlanet: ind.planet };
    }
    case 'signEmph': {
      const count = TRACKED_BODIES.filter(b => { const p = chart.western.bodies[b]; return p && ind.signs.includes(p.sign); }).length;
      const expected = TRACKED_BODIES.length * (ind.signs.length / 12);
      const excess = count - expected;
      if (excess <= 0.5) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      return { hit: true, strength: clamp01(excess / 3), label: `Above-chance emphasis in ${ind.signs.map(cap).join('/')}`, polarity: 'mixed' };
    }
  }
}

// ── Style definitions ──────────────────────────────────────────────────────────

type StyleDef = {
  id: string;
  label: string;
  westernIndicators: WesternIndicator[];
  vibrationalPair?: [BodyId, BodyId];
};

type DomainDef = {
  title: string;
  subtitle: string;
  styles: StyleDef[];
};

const A = (a: BodyId, b: BodyId, hard?: boolean): WesternIndicator => ({ k: 'aspect', a, b, hard });
const H = (planet: BodyId, house: number): WesternIndicator => ({ k: 'houseP', planet, house });
const HE = (house: number): WesternIndicator => ({ k: 'houseEmph', house });
const S = (planet: BodyId, sign: SignId): WesternIndicator => ({ k: 'signP', planet, sign });
const SE = (...signs: SignId[]): WesternIndicator => ({ k: 'signEmph', signs });
const AFF = (planet: BodyId): WesternIndicator => ({ k: 'afflicted', planet });

const IPSE_STYLE_DEFINITIONS: Record<IPSEDomainId, DomainDef> = {
  intellectual: {
    title: 'Intellectual Style',
    subtitle: 'How the mind analyzes, learns, interprets, and recognizes patterns.',
    styles: [
      { id: 'researchInvestigator', label: 'Research-oriented investigator', vibrationalPair: ['mercury', 'pluto'], westernIndicators: [A('mercury', 'pluto'), H('mercury', 8), HE(8), S('mercury', 'scorpio')] },
      { id: 'systemsThinker', label: 'Systems thinker', vibrationalPair: ['mercury', 'uranus'], westernIndicators: [A('mercury', 'uranus'), S('mercury', 'aquarius'), HE(11)] },
      { id: 'technicalRigorousThinker', label: 'Technical / rigorous thinker', vibrationalPair: ['mercury', 'saturn'], westernIndicators: [A('mercury', 'saturn'), S('mercury', 'capricorn'), S('mercury', 'virgo'), HE(6)] },
      { id: 'philosophicalSynthesizer', label: 'Philosophical synthesizer', vibrationalPair: ['mercury', 'jupiter'], westernIndicators: [A('mercury', 'jupiter'), H('mercury', 9), HE(9)] },
      { id: 'symbolicImaginalThinker', label: 'Symbolic / imaginal thinker', vibrationalPair: ['mercury', 'neptune'], westernIndicators: [A('mercury', 'neptune'), H('mercury', 12), S('mercury', 'pisces'), HE(12)] },
      { id: 'tacticalFastProcessor', label: 'Tactical fast-processor', vibrationalPair: ['mercury', 'mars'], westernIndicators: [A('mercury', 'mars'), S('mercury', 'aries'), HE(3)] },
    ],
  },
  practical: {
    title: 'Practical Style',
    subtitle: 'How intelligence becomes action, structure, skill, execution, and real-world problem-solving.',
    styles: [
      { id: 'strategicExecutor', label: 'Strategic executor', vibrationalPair: ['mars', 'saturn'], westernIndicators: [A('mars', 'saturn', false), A('sun', 'saturn'), HE(10), SE('capricorn')] },
      { id: 'systemsImplementer', label: 'Systems implementer', vibrationalPair: ['mercury', 'saturn'], westernIndicators: [A('mercury', 'saturn'), H('mercury', 6), HE(6)] },
      { id: 'crisisManager', label: 'Crisis manager', vibrationalPair: ['mars', 'pluto'], westernIndicators: [A('mars', 'pluto'), H('mars', 8), S('mars', 'scorpio'), HE(8)] },
      { id: 'resourceManager', label: 'Resource manager', vibrationalPair: ['venus', 'saturn'], westernIndicators: [HE(2), A('venus', 'saturn'), SE('taurus')] },
      { id: 'pressureDrivenBuilder', label: 'Pressure-driven builder', vibrationalPair: ['mars', 'saturn'], westernIndicators: [AFF('saturn'), A('mars', 'saturn', true), H('saturn', 6)] },
    ],
  },
  spiritual: {
    title: 'Spiritual / Meaning Style',
    subtitle: 'How intelligence searches for meaning, symbols, mystery, transcendence, and existential truth.',
    styles: [
      { id: 'mysticReceiver', label: 'Mystic / intuitive receiver', vibrationalPair: ['moon', 'neptune'], westernIndicators: [A('moon', 'neptune'), H('neptune', 12), SE('pisces')] },
      { id: 'occultInvestigator', label: 'Occult investigator', vibrationalPair: ['mercury', 'pluto'], westernIndicators: [A('mercury', 'pluto'), HE(8), SE('scorpio')] },
      { id: 'philosophicalSeeker', label: 'Philosophical seeker', vibrationalPair: ['mercury', 'jupiter'], westernIndicators: [H('jupiter', 9), A('mercury', 'jupiter'), SE('sagittarius')] },
      { id: 'visionary', label: 'Visionary', vibrationalPair: ['uranus', 'neptune'], westernIndicators: [A('uranus', 'neptune'), A('jupiter', 'neptune')] },
      { id: 'contemplativePractitioner', label: 'Contemplative practitioner', vibrationalPair: ['saturn', 'neptune'], westernIndicators: [A('saturn', 'neptune'), H('saturn', 12), HE(12)] },
      { id: 'ancestralKarmicProcessor', label: 'Ancestral / karmic processor', vibrationalPair: ['moon', 'pluto'], westernIndicators: [A('moon', 'pluto'), H('southNode', 4), H('southNode', 8), HE(4)] },
      { id: 'rationalMeaningMaker', label: 'Rational / humanist meaning-maker', vibrationalPair: ['jupiter', 'saturn'], westernIndicators: [A('jupiter', 'saturn'), H('saturn', 9), S('jupiter', 'capricorn'), HE(9)] },
    ],
  },
  emotional: {
    title: 'Emotional / Relational Style',
    subtitle: 'How intelligence feels, bonds, reads atmosphere, protects, and understands relational dynamics.',
    styles: [
      { id: 'empathicAbsorber', label: 'Empathic absorber', vibrationalPair: ['moon', 'neptune'], westernIndicators: [A('moon', 'neptune'), H('moon', 12), SE('pisces', 'cancer', 'scorpio')] },
      { id: 'depthFeeler', label: 'Depth-feeler', vibrationalPair: ['moon', 'pluto'], westernIndicators: [A('moon', 'pluto'), A('venus', 'pluto'), HE(8)] },
      { id: 'emotionalTranslator', label: 'Emotional translator', vibrationalPair: ['moon', 'mercury'], westernIndicators: [A('moon', 'mercury'), H('mercury', 4), H('moon', 3)] },
      { id: 'relationalHarmonizer', label: 'Relational harmonizer', vibrationalPair: ['moon', 'venus'], westernIndicators: [A('moon', 'venus'), H('venus', 7), SE('libra')] },
      { id: 'loyalProtector', label: 'Loyal protector', vibrationalPair: ['moon', 'saturn'], westernIndicators: [A('moon', 'saturn'), A('venus', 'saturn'), H('saturn', 4)] },
      { id: 'boundaryLearner', label: 'Boundary learner', vibrationalPair: ['venus', 'neptune'], westernIndicators: [A('moon', 'neptune', true), A('venus', 'neptune', true), H('neptune', 7), HE(7)] },
    ],
  },
};

// ── Vibrational (harmonic) refinement ─────────────────────────────────────────

const IPSE_HARMONICS = [5, 7, 8, 9, 10, 11, 12, 13, 16, 24];

function distanceToNearestHarmonic(separation: number, harmonic: number): number {
  const angle = 360 / harmonic;
  let min = Infinity;
  for (let k = 0; k <= harmonic; k++) min = Math.min(min, angularSep(separation, k * angle));
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

function bestHarmonicHit(chart: NatalChart, a: BodyId, b: BodyId): { harmonic: number; strength: number } | null {
  const pa = chart.western.bodies[a];
  const pb = chart.western.bodies[b];
  if (!pa || !pb) return null;
  let best: { harmonic: number; strength: number } | null = null;
  for (const h of IPSE_HARMONICS) {
    const strength = harmonicStrength(pa.longitude, pb.longitude, h);
    if (strength >= 0.45 && (!best || strength > best.strength)) best = { harmonic: h, strength };
  }
  return best;
}

// ── Western style detection ────────────────────────────────────────────────────

function computeWesternStyles(chart: NatalChart, domain: IPSEDomainId): IPSEStyleResult[] {
  const def = IPSE_STYLE_DEFINITIONS[domain];

  return def.styles.map(style => {
    const evidence: IPSEEvidence[] = [];
    let total = 0;
    let hits = 0;

    for (const ind of style.westernIndicators) {
      const result = evalWesternIndicator(chart, ind);
      if (!result.hit) continue;
      total += result.strength;
      hits += 1;
      evidence.push({
        id: `western-${domain}-${style.id}-${evidence.length}`,
        system: 'western', domain, styleId: style.id, component: ind.k === 'aspect' ? 'aspect' : ind.k === 'afflicted' ? 'aspect' : (ind.k === 'houseP' || ind.k === 'houseEmph') ? 'house' : 'planet',
        label: result.label,
        interpretation: '',
        weight: result.strength, rawWeight: result.strength,
        polarity: result.polarity,
        sourcePlanet: result.sourcePlanet, sourceHouse: result.sourceHouse, sourceAspect: result.sourceAspect, orb: result.orb,
      });
    }

    // Vibrational refinement: a hidden harmonic resonance on this style's
    // anchor pair adds a small, capped nudge and its own evidence -- it
    // never dominates, per section 9 ("mostly for subtypes, not broad
    // scoring"). Actual availability gating happens by the caller
    // (computeIPSEStyleProfile) via includeVibrational.
    if (style.vibrationalPair) {
      const hit = bestHarmonicHit(chart, style.vibrationalPair[0], style.vibrationalPair[1]);
      if (hit) {
        const bonus = hit.strength * 15; // small, capped nudge -- never the primary driver
        total += bonus / 70; // scaled into the same additive units as western hits
        evidence.push({
          id: `vibrational-${domain}-${style.id}`,
          system: 'vibrational', domain, styleId: style.id, component: 'harmonic',
          label: `${cap(style.vibrationalPair[0])}-${cap(style.vibrationalPair[1])} ${hit.harmonic}th harmonic resonance`,
          interpretation: '',
          weight: hit.strength, rawWeight: hit.strength, polarity: 'mixed',
          sourcePlanet: style.vibrationalPair[0], notes: `Harmonic ${hit.harmonic}`,
        });
      }
    }

    // Normalize: a style with 0 hits scores 0; each additional hit adds
    // diminishing marginal value (bounded, not a runaway sum).
    const score = hits === 0 ? 0 : clamp0100((total / (hits + 1)) * 130);

    const supportive = evidence.filter(e => e.polarity === 'supportive').reduce((s, e) => s + e.weight, 0);
    const challenging = evidence.filter(e => e.polarity === 'challenging').reduce((s, e) => s + e.weight, 0);
    const tone: IPSEStyleTone = challenging > supportive * 1.3 ? 'challenging' : supportive > challenging * 1.3 ? 'supportive' : 'mixed';

    return { id: style.id, label: style.label, score, tone, evidence };
  });
}

// ── Primary / secondary style selection ───────────────────────────────────────

const FALLBACK_STYLE: Record<IPSEDomainId, string> = {
  intellectual: 'Pattern-recognition oriented',
  practical: 'Applied problem-solver',
  spiritual: 'Meaning-oriented seeker',
  emotional: 'Relationally perceptive',
};

function selectDomainStyles(styles: IPSEStyleResult[]): { primaryStyle: IPSEStyleResult | null; secondaryStyles: IPSEStyleResult[] } {
  const sorted = styles.filter(s => s.score >= 20).sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return { primaryStyle: null, secondaryStyles: [] };
  const primary = sorted[0];
  const secondary = sorted.slice(1).filter(s => s.score >= 30 || primary.score - s.score <= 12).slice(0, 2);
  return { primaryStyle: primary, secondaryStyles: secondary };
}

// ── Vedic domain lens ──────────────────────────────────────────────────────────

type VedicDomainMap = { karakas: BodyId[]; houses: number[]; importantLords: number[]; dashas: DashaLord[] };

const VEDIC_IPSE_MAP: Record<IPSEDomainId, VedicDomainMap> = {
  intellectual: { karakas: ['mercury', 'jupiter'], houses: [2, 3, 5, 9, 10, 11], importantLords: [2, 3, 5, 9], dashas: ['mercury', 'jupiter'] },
  practical: { karakas: ['saturn', 'mars', 'mercury', 'sun'], houses: [2, 3, 6, 10, 11], importantLords: [3, 6, 10, 11], dashas: ['saturn', 'mars', 'mercury', 'sun'] },
  spiritual: { karakas: ['jupiter', 'southNode', 'moon'], houses: [4, 5, 8, 9, 12], importantLords: [5, 8, 9, 12], dashas: ['jupiter', 'ketu', 'moon'] },
  emotional: { karakas: ['moon', 'venus'], houses: [4, 7, 8, 12], importantLords: [4, 7, 8, 12], dashas: ['moon', 'venus'] },
};

const DASHA_LORD_TO_BODY: Record<DashaLord, BodyId> = {
  sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn', rahu: 'trueNode', ketu: 'southNode',
};

function computeVedicIPSELens(chart: NatalChart, domain: IPSEDomainId): VedicIPSELens {
  if (!chart.vedic) return { available: false, summary: '', evidence: [] };

  let analysis: VedicAnalysis;
  try { analysis = analyzeVedicChart(chart); } catch { return { available: false, summary: '', evidence: [] }; }

  const map = VEDIC_IPSE_MAP[domain];
  const evidence: IPSEEvidence[] = [];

  // Karaka strength -- real, already-computed 0-10 planet strength score.
  const karakaNotes: string[] = [];
  for (const planet of map.karakas) {
    const strength = analysis.planetStrengths[planet];
    if (!strength) continue;
    if (strength.score >= 6) {
      karakaNotes.push(`${cap(planet)} is functionally strong`);
      evidence.push({
        id: `vedic-${domain}-karaka-${planet}`, system: 'vedic', domain, component: 'karaka',
        label: `${cap(planet)} karaka strength`, interpretation: `${cap(planet)} is well-supported in this chart, lending functional support to this domain.`,
        weight: strength.score / 10, rawWeight: strength.score / 10,
        polarity: strength.dignity === 'debilitation' ? 'challenging' : 'supportive', sourcePlanet: planet,
      });
    } else if (strength.score <= 3) {
      karakaNotes.push(`${cap(planet)} is functionally pressured`);
      evidence.push({
        id: `vedic-${domain}-karaka-${planet}-weak`, system: 'vedic', domain, component: 'karaka',
        label: `${cap(planet)} karaka pressure`, interpretation: `${cap(planet)} carries more friction than support here.`,
        weight: (10 - strength.score) / 10, rawWeight: (10 - strength.score) / 10,
        polarity: 'challenging', sourcePlanet: planet,
      });
    }
  }

  // House-lord routing -- which life areas this intelligence is routed through.
  const routedHouses: string[] = [];
  let lordSupportive = 0, lordChallenging = 0;
  for (const houseNum of map.importantLords) {
    const hl = analysis.houseLords[houseNum];
    if (!hl || hl.lordHouse == null) continue;
    const strong = hl.lordDignity === 'exaltation' || hl.lordDignity === 'own' || hl.lordDignity === 'moolatrikona';
    const weak = hl.lordDignity === 'debilitation';
    if (strong) lordSupportive++;
    if (weak) lordChallenging++;
    routedHouses.push(`${ordinal(houseNum)} house routed through ${cap(hl.lord)} in house ${hl.lordHouse}`);
    evidence.push({
      id: `vedic-${domain}-lord-${houseNum}`, system: 'vedic', domain, component: 'houseLord',
      label: `${ordinal(houseNum)} lord (${cap(hl.lord)}) in house ${hl.lordHouse}`,
      interpretation: strong ? 'This routing supports the domain functionally.' : weak ? 'This routing adds friction or delay to the domain.' : 'This routing is a neutral channel for the domain.',
      weight: strong ? 0.6 : weak ? 0.5 : 0.3, rawWeight: strong ? 0.6 : weak ? 0.5 : 0.3,
      polarity: strong ? 'supportive' : weak ? 'challenging' : 'mixed', sourcePlanet: hl.lord, sourceHouse: houseNum,
    });
  }

  // Dasha timing -- is this domain currently activated? A dasha lord match
  // is meaningful on its own; it's stronger still when that lord is also
  // placed in one of this domain's own houses (timing AND routing align).
  let timing: string | undefined;
  try {
    const dasha = computeVimshottariDasha(chart, new Date().toISOString());
    const mahaActive = map.dashas.includes(dasha.mahadasha.lord);
    const antarActive = map.dashas.includes(dasha.antardasha.lord);
    if (mahaActive || antarActive) {
      const mahaHouse = chart.vedic.bodies[DASHA_LORD_TO_BODY[dasha.mahadasha.lord]]?.house;
      const houseAligned = mahaHouse !== undefined && map.houses.includes(mahaHouse);
      timing = `Currently activated by the ${cap(dasha.mahadasha.lord)}${antarActive ? `/${cap(dasha.antardasha.lord)}` : ''} dasha period${houseAligned ? `, and ${cap(dasha.mahadasha.lord)}'s own house placement (house ${mahaHouse}) routes directly through this domain` : ''}.`;
      evidence.push({
        id: `vedic-${domain}-dasha`, system: 'vedic', domain, component: 'dasha',
        label: 'Current dasha activation', interpretation: timing,
        weight: (mahaActive && antarActive ? 0.7 : 0.4) + (houseAligned ? 0.2 : 0),
        rawWeight: (mahaActive && antarActive ? 0.7 : 0.4) + (houseAligned ? 0.2 : 0),
        polarity: 'mixed', notes: `${dasha.mahadasha.lord}/${dasha.antardasha.lord}`,
      });
    }
  } catch { /* dasha computation unavailable for this chart */ }

  // Yoga support -- real, already-computed yogas relevant to this domain.
  const yogaNotes: string[] = [];
  // Requires either a genuine karaka overlap, or at least two shared
  // houses (not just one) -- a single shared house number between a
  // yoga's affected houses and a domain's 4-6-house list is common enough
  // by sheer combinatorics to match almost any yoga to almost any domain
  // regardless of whether that yoga's planets have anything to do with it
  // (verified against a real chart: this single-house-overlap version
  // surfaced the same two yogas as "relevant" to all four domains).
  const relevantYogas = analysis.yogas.filter(y =>
    y.planets.some(p => map.karakas.includes(p)) ||
    y.affectedHouses.filter(h => map.houses.includes(h)).length >= 2,
  ).slice(0, 2);
  for (const yoga of relevantYogas) {
    yogaNotes.push(yoga.name);
    evidence.push({
      id: `vedic-${domain}-yoga-${yoga.name}`, system: 'vedic', domain, component: 'yoga',
      label: yoga.name, interpretation: yoga.description,
      weight: yoga.strength === 'strong' ? 0.7 : yoga.strength === 'moderate' ? 0.5 : 0.3,
      rawWeight: yoga.strength === 'strong' ? 0.7 : yoga.strength === 'moderate' ? 0.5 : 0.3,
      polarity: yoga.category === 'challenging' ? 'challenging' : 'supportive',
    });
  }

  // Nakshatra flavor -- Moon's nakshatra, since it's the most universally
  // meaningful one across all four domains without needing a fabricated
  // nakshatra-to-domain correspondence table.
  const moonNak = analysis.moonAnalysis.nakshatra;
  const nakshatraFlavor = moonNak ? `Moon in ${moonNak} adds emotional/instinctual flavor to how this domain is processed.` : undefined;

  const supportFriction = lordSupportive > lordChallenging
    ? 'House-lord routing leans supportive for this domain.'
    : lordChallenging > lordSupportive
      ? 'House-lord routing carries real friction, delay, or burden for this domain.'
      : 'House-lord routing is mixed for this domain.';

  const summaryParts = [...karakaNotes.slice(0, 1), ...routedHouses.slice(0, 1)].filter(Boolean);
  const summary = summaryParts.length > 0
    ? `Vedic refinement: ${summaryParts.join('; ')}.${yogaNotes.length ? ` ${yogaNotes.join(', ')} also relevant.` : ''}`
    : 'Vedic data is available but shows no strongly differentiating signal for this domain.';

  return {
    available: true,
    summary,
    houseLordRouting: routedHouses.join('; ') || undefined,
    supportFriction,
    timing,
    nakshatraFlavor,
    evidence,
  };
}

// ── Vibrational domain lens (summary/subtypes, separate from per-style nudge) ─

function computeVibrationalIPSELens(chart: NatalChart, domain: IPSEDomainId, styles: IPSEStyleResult[]): VibrationalIPSELens {
  if (!hasPlanetaryLongitudes(chart)) return { available: false, summary: '', subtypes: [], evidence: [] };

  const evidence = styles.flatMap(s => s.evidence.filter(e => e.system === 'vibrational')).sort((a, b) => b.weight - a.weight).slice(0, 6);
  const subtypes = [...new Set(evidence.map(e => {
    const styleDef = IPSE_STYLE_DEFINITIONS[domain].styles.find(s => s.id === e.styleId);
    return styleDef?.label;
  }).filter((x): x is string => !!x))].slice(0, 3);

  return {
    available: true,
    summary: evidence.length > 0
      ? `Harmonic analysis adds a resonance signature around ${subtypes.join(', ') || 'this domain'}.`
      : 'No strong harmonic resonance detected for this domain -- the Western/Vedic signal stands on its own.',
    harmonicSignature: evidence[0]?.label,
    subtypes,
    evidence,
  };
}

// ── Human Design domain lens ───────────────────────────────────────────────────

const HD_CENTERS_BY_DOMAIN: Record<IPSEDomainId, CenterId[]> = {
  intellectual: ['head', 'ajna', 'throat'],
  practical: ['sacral', 'root', 'heart'],
  spiritual: ['head', 'ajna', 'g', 'solarPlexus', 'spleen'],
  emotional: ['solarPlexus', 'g', 'heart', 'spleen'],
};

function computeHumanDesignIPSELens(
  hdChart: HdChart | null | undefined, domain: IPSEDomainId, orientationScore: number,
): HumanDesignIPSELens {
  if (!hdChart) {
    return { available: false, accessPattern: 'unknown', summary: '', consistencyFactors: [], conditioningFactors: [], decisionSupport: '', growthEdge: '', evidence: [] };
  }

  const evidence: IPSEEvidence[] = [];
  const centers = HD_CENTERS_BY_DOMAIN[domain];
  const defined = centers.filter(c => hdChart.definedCenters.includes(c));
  const open = centers.filter(c => !hdChart.definedCenters.includes(c));

  const consistencyFactors: string[] = [];
  const conditioningFactors: string[] = [];

  for (const c of defined) {
    consistencyFactors.push(`Defined ${CENTER_LABEL[c]}`);
    evidence.push({ id: `hd-${domain}-defined-${c}`, system: 'humanDesign', domain, component: 'definedCenter', label: `Defined ${CENTER_LABEL[c]}`, interpretation: `Consistent, reliable access through the ${CENTER_LABEL[c]} center.`, weight: 0.6, rawWeight: 0.6, polarity: 'supportive' });
  }
  for (const c of open) {
    conditioningFactors.push(`Open ${CENTER_LABEL[c]}`);
    evidence.push({ id: `hd-${domain}-open-${c}`, system: 'humanDesign', domain, component: 'openCenter', label: `Open ${CENTER_LABEL[c]}`, interpretation: `Receptive, conditionable access through the ${CENTER_LABEL[c]} center -- amplifies or absorbs what's around it rather than generating it consistently.`, weight: 0.5, rawWeight: 0.5, polarity: 'conditioning' });
  }

  // A defined channel spanning two of this domain's centers is a stable,
  // reliable pathway -- checked generically via GATE_CENTER rather than a
  // hardcoded channel-name list, so it's always accurate to the real data.
  const domainChannels = hdChart.definedChannels.filter(ch => {
    const ca = GATE_CENTER.get(ch.a); const cb = GATE_CENTER.get(ch.b);
    return ca && cb && centers.includes(ca) && centers.includes(cb);
  });
  for (const ch of domainChannels) {
    consistencyFactors.push(`${ch.name} channel`);
    evidence.push({ id: `hd-${domain}-channel-${ch.name}`, system: 'humanDesign', domain, component: 'channel', label: `${ch.name} channel defined`, interpretation: `A stable pathway connecting centers relevant to this domain.`, weight: 0.5, rawWeight: 0.5, polarity: 'supportive' });
  }

  evidence.push({ id: `hd-${domain}-type`, system: 'humanDesign', domain, component: 'type', label: `${hdChart.type} type`, interpretation: `Strategy: ${hdChart.strategy}.`, weight: 0.3, rawWeight: 0.3, polarity: 'mixed' });

  // Access pattern -- how reliably this domain's intelligence is available.
  let accessPattern: IPSEAccessPattern;
  if (domain === 'practical') {
    if (hdChart.type === 'Projector' || hdChart.type === 'Reflector') accessPattern = 'environment-dependent access';
    else if (!hdChart.definedCenters.includes('sacral') && !hdChart.definedCenters.includes('root')) accessPattern = 'burst-based access';
    else accessPattern = 'consistent access';
  } else if (domain === 'emotional') {
    accessPattern = hdChart.authority === 'Emotional' ? 'reflective access' : !hdChart.definedCenters.includes('solarPlexus') ? 'relationally activated access' : 'consistent access';
  } else if (defined.length === 0) {
    accessPattern = 'conditioned access';
  } else if (defined.length === centers.length) {
    accessPattern = 'consistent access';
  } else {
    accessPattern = 'conditioned access';
  }

  const decisionSupport = hdChart.authority === 'Emotional'
    ? 'Decisions in this domain benefit from waiting through an emotional wave before committing.'
    : hdChart.authority === 'Sacral'
      ? 'Decisions in this domain benefit from a body-level yes/no response rather than mental deliberation.'
      : hdChart.authority === 'Splenic'
        ? 'Decisions in this domain benefit from trusting the first instinctive read, in the moment.'
        : `Decisions in this domain benefit from honoring this design's ${hdChart.authority} authority rather than overriding it mentally.`;

  // Discrepancy note -- flags when astrology emphasis and HD access diverge,
  // per spec section 10's discrepancy examples.
  let discrepancyNote: string | undefined;
  if (orientationScore >= 55 && open.length === centers.length) {
    if (domain === 'practical') discrepancyNote = 'The astrology points to practical emphasis or responsibility, while Human Design suggests consistent output may be conditional. Practical intelligence may express best through correct timing, response, recognition, or environment rather than constant force.';
    else if (domain === 'emotional') discrepancyNote = "The astrology points to emotional sensitivity, while Human Design suggests emotional amplification through others. The growth edge is learning which feelings are yours and which belong to the room.";
    else if (domain === 'intellectual') discrepancyNote = 'The astrology points to mental emphasis, while Human Design suggests the mind may be highly receptive and conditioned by questions or opinions around you. The gift is flexibility; the trap is chasing certainty.';
    else if (domain === 'spiritual') discrepancyNote = 'The astrology points to meaning-seeking, while Human Design suggests identity and belief may be fluid or environment-sensitive. The growth edge is choosing environments that clarify rather than distort your direction.';
  }

  const growthEdge = domain === 'practical' && accessPattern !== 'consistent access'
    ? 'Not confusing pressure or conditioning with a lack of capacity.'
    : domain === 'emotional' && accessPattern === 'relationally activated access'
      ? 'Learning which feelings are self-generated versus absorbed from others.'
      : domain === 'intellectual' && accessPattern === 'conditioned access'
        ? 'Treating mental flexibility as a gift rather than chasing false certainty.'
        : 'Letting this design\'s natural access pattern set the pace, rather than forcing constant output.';

  return {
    available: true,
    accessPattern,
    summary: `${defined.length > 0 ? `Defined access through ${consistencyFactors.slice(0, 2).join(', ')}` : `Open, conditionable access (${conditioningFactors.slice(0, 2).join(', ')})`} shapes how this domain's intelligence actually shows up day to day.`,
    consistencyFactors,
    conditioningFactors,
    decisionSupport,
    growthEdge,
    discrepancyNote,
    evidence,
  };
}

const CENTER_LABEL: Record<CenterId, string> = {
  head: 'Head', ajna: 'Ajna', throat: 'Throat', g: 'G Center', heart: 'Heart/Ego',
  sacral: 'Sacral', spleen: 'Spleen', solarPlexus: 'Solar Plexus', root: 'Root',
};

// ── Gene Keys lens (not implemented this pass -- always unavailable) ─────────

function computeGeneKeysIPSELens(): GeneKeysIPSELens {
  return { available: false, summary: '', evidence: [] };
}

// ── Orientation / fluency / friction combination ──────────────────────────────
// Western sets the baseline for all three. Vedic modifies all three within
// small caps (refinement, not a second vote). Vibrational nudges
// orientation only, capped small. Human Design modifies fluency/friction
// only -- it describes access and conditioning, never how much a style is
// symbolically emphasized in the chart.

const VEDIC_ORIENTATION_CAP = 12;
const VEDIC_FLUENCY_CAP = 18;
const VEDIC_FRICTION_CAP = 18;
const VIBRATIONAL_ORIENTATION_CAP = 8;
const HD_FLUENCY_CAP = 12;
const HD_FRICTION_CAP = 18;

function combineDomainSignals(
  westernStyles: IPSEStyleResult[], vedicLens: VedicIPSELens, vibrationalLens: VibrationalIPSELens, hdLens: HumanDesignIPSELens,
): { orientationScore: number; fluencyScore: number; frictionScore: number } {
  const top3 = [...westernStyles].sort((a, b) => b.score - a.score).slice(0, 3);
  let orientation = top3.length ? top3.reduce((s, x, i) => s + x.score * (i === 0 ? 0.6 : i === 1 ? 0.25 : 0.15), 0) : 0;

  const allEvidence = westernStyles.flatMap(s => s.evidence.filter(e => e.system === 'western'));
  const supportive = allEvidence.filter(e => e.polarity === 'supportive').reduce((s, e) => s + e.weight, 0);
  const challenging = allEvidence.filter(e => e.polarity === 'challenging').reduce((s, e) => s + e.weight, 0);
  const totalW = supportive + challenging || 1;
  let fluency = clamp0100(50 + (supportive / totalW - 0.5) * 80);
  let friction = clamp0100(50 + (challenging / totalW - 0.5) * 80);

  if (vedicLens.available) {
    const vSupport = vedicLens.evidence.filter(e => e.polarity === 'supportive').reduce((s, e) => s + e.weight, 0);
    const vChallenge = vedicLens.evidence.filter(e => e.polarity === 'challenging').reduce((s, e) => s + e.weight, 0);
    orientation += clamp0100((vSupport - vChallenge) * 10) * (VEDIC_ORIENTATION_CAP / 100);
    fluency += Math.min(vSupport * 10, VEDIC_FLUENCY_CAP);
    friction += Math.min(vChallenge * 10, VEDIC_FRICTION_CAP);
  }

  if (vibrationalLens.available && vibrationalLens.evidence.length > 0) {
    const vibStrength = vibrationalLens.evidence.reduce((s, e) => s + e.weight, 0) / vibrationalLens.evidence.length;
    orientation += Math.min(vibStrength * VIBRATIONAL_ORIENTATION_CAP, VIBRATIONAL_ORIENTATION_CAP);
  }

  if (hdLens.available) {
    const consistent = hdLens.accessPattern === 'consistent access';
    const conditioned = hdLens.accessPattern === 'conditioned access' || hdLens.accessPattern === 'relationally activated access';
    if (consistent) fluency += HD_FLUENCY_CAP * 0.7;
    if (conditioned) friction += HD_FRICTION_CAP * 0.6;
    if (hdLens.accessPattern === 'pressure-driven access' || hdLens.accessPattern === 'burst-based access') friction += HD_FRICTION_CAP * 0.5;
  }

  return { orientationScore: clamp0100(orientation), fluencyScore: clamp0100(fluency), frictionScore: clamp0100(friction) };
}

function inferExpressionTone(orientation: number, fluency: number, friction: number, hdLens: HumanDesignIPSELens): IPSEStyleTone {
  if (hdLens.available && (hdLens.accessPattern === 'conditioned access' || hdLens.accessPattern === 'relationally activated access')) return 'conditioned';
  if (friction >= 65 && friction > fluency) return 'pressure-driven';
  if (fluency >= 65 && fluency > friction) return 'fluid';
  if (orientation >= 55 && Math.abs(fluency - friction) < 15) return 'mixed';
  if (fluency > friction) return 'supportive';
  if (friction > fluency) return 'challenging';
  return 'mixed';
}

function computeConfidence(westernEvidenceCount: number, vedicAvailable: boolean, hdAvailable: boolean): 'low' | 'moderate' | 'high' {
  const systems = 1 + (vedicAvailable ? 1 : 0) + (hdAvailable ? 1 : 0);
  if (westernEvidenceCount >= 4 && systems >= 2) return 'high';
  if (westernEvidenceCount >= 2) return 'moderate';
  return 'low';
}

// ── Domain copy ────────────────────────────────────────────────────────────────

const IPSE_DOMAIN_COPY: Record<IPSEDomainId, { strengths: string[]; growthEdges: string[]; integratedExpression: string }> = {
  intellectual: {
    strengths: ['Pattern recognition', 'Conceptual analysis', 'Learning through systems, language, or abstraction', 'Ability to translate complexity into insight'],
    growthEdges: ['Over-analysis', 'Mental pressure', 'Needing certainty too quickly', 'Living in the mind instead of embodied experience'],
    integratedExpression: 'A mind that can perceive complexity, organize insight, and translate ideas into wisdom.',
  },
  practical: {
    strengths: ['Execution', 'Discipline', 'Real-world problem-solving', 'Turning insight into structure, skill, or tangible results'],
    growthEdges: ['Confusing pressure with capacity', 'Over-control', 'Inconsistent follow-through when energy is misused', 'Defining worth through productivity'],
    integratedExpression: 'The ability to turn perception into practice, structure, and meaningful real-world action.',
  },
  spiritual: {
    strengths: ['Meaning-making', 'Symbolic perception', 'Sensitivity to mystery, purpose, and transpersonal patterns', 'Capacity for existential reflection'],
    growthEdges: ['Escapism', 'Confusing intuition with projection', 'Over-spiritualizing ordinary problems', 'Searching for meaning while avoiding embodiment'],
    integratedExpression: 'A grounded connection to meaning, intuition, and the larger patterns of life.',
  },
  emotional: {
    strengths: ['Empathy', 'Relational perception', 'Emotional depth', 'Sensitivity to unspoken dynamics'],
    growthEdges: ['Emotional overwhelm', "Absorbing other people's feelings", 'Confusing intensity with intimacy', 'Feeling deeply without enough regulation or boundaries'],
    integratedExpression: 'Emotional wisdom that can feel deeply, relate clearly, and remain connected to self.',
  },
};

// Style-specific copy -- keyed by style id, not domain. Without this, every
// person whose primary style falls under (say) "Spiritual / Meaning Style"
// saw identical strengths/growth-edges/integrated-expression text regardless
// of whether their actual style was a Mystic Receiver or an Occult
// Investigator -- the two most differentiating fields in the whole card
// were silently domain-level, not style-level. Falls back to
// IPSE_DOMAIN_COPY only when no style clears the selection threshold.
type StyleCopy = { strengths: string[]; growthEdges: string[]; integratedExpression: string };

const IPSE_STYLE_COPY: Record<string, StyleCopy> = {
  // Intellectual
  researchInvestigator: {
    strengths: ['Investigative persistence', 'Comfort with complexity and hidden layers', 'Ability to trace root causes others miss'],
    growthEdges: ['Getting lost in research instead of concluding', 'Over-skepticism', 'Difficulty explaining findings simply'],
    integratedExpression: 'A mind that can go deep without getting lost, surfacing hidden patterns and translating them into usable insight.',
  },
  systemsThinker: {
    strengths: ['Seeing how parts connect into a whole', 'Innovative, non-linear problem-solving', 'Comfort with abstraction and future-oriented ideas'],
    growthEdges: ['Impatience with slow or conventional process', 'Detaching from practical constraints', 'Restlessness once a system is understood'],
    integratedExpression: 'A mind that can map complex systems and translate structural insight into workable innovation.',
  },
  technicalRigorousThinker: {
    strengths: ['Precision and methodical follow-through', 'Comfort with detail and structure', 'Reliable, well-tested conclusions'],
    growthEdges: ['Perfectionism or over-caution', 'Difficulty moving forward without full certainty', "Rigidity when a rule doesn't fit the situation"],
    integratedExpression: 'A mind that builds understanding carefully, layer by layer, into something dependable.',
  },
  philosophicalSynthesizer: {
    strengths: ['Big-picture synthesis across ideas', 'Generosity of interpretation', 'Ability to find meaning in complexity'],
    growthEdges: ['Overgeneralizing from limited evidence', 'Avoiding necessary detail', 'Restlessness with narrow or repetitive tasks'],
    integratedExpression: 'A mind that weaves broad understanding into a coherent, meaningful worldview.',
  },
  symbolicImaginalThinker: {
    strengths: ['Metaphor and symbolic pattern recognition', 'Imaginative, associative thinking', 'Sensitivity to what is unspoken or implied'],
    growthEdges: ['Difficulty with strict logic or literalism', 'Blurring fact and impression', 'Retreating into imagination instead of engaging directly'],
    integratedExpression: 'A mind that translates the intangible into image and story, making the abstract felt and understandable.',
  },
  tacticalFastProcessor: {
    strengths: ['Quick, decisive thinking under pressure', 'Sharp, efficient communication', 'Comfort improvising in real time'],
    growthEdges: ['Impulsive conclusions', 'Impatience with deliberation or nuance', 'Combative communication under stress'],
    integratedExpression: 'A mind that thinks on its feet, converting quick perception into fast, effective action.',
  },
  // Practical
  strategicExecutor: {
    strengths: ['Long-range planning', 'Disciplined follow-through', 'Reliability under responsibility'],
    growthEdges: ['Over-control or rigidity', 'Difficulty delegating', 'Defining self-worth through achievement'],
    integratedExpression: 'The capacity to hold a long-term structure and execute it with discipline over time.',
  },
  systemsImplementer: {
    strengths: ['Turning plans into working processes', 'Attention to procedural detail', 'Consistency in routine execution'],
    growthEdges: ['Over-reliance on process at the expense of flexibility', 'Frustration when systems are ignored', 'Difficulty improvising outside the plan'],
    integratedExpression: 'The ability to translate an idea into a working, repeatable process.',
  },
  crisisManager: {
    strengths: ['Composure under pressure', 'Willingness to confront hard problems directly', 'Resourcefulness in high-stakes moments'],
    growthEdges: ['Difficulty relaxing outside of crisis', 'Attraction to intensity or conflict', 'Burnout from operating at constant alert'],
    integratedExpression: 'The ability to meet real pressure directly and act effectively when it matters most.',
  },
  resourceManager: {
    strengths: ['Careful stewardship of time, money, or materials', 'Patience for incremental, steady progress', 'Practical realism'],
    growthEdges: ['Over-caution or resistance to risk', 'Difficulty parting with resources or control', 'Undervaluing intangible or long-shot opportunities'],
    integratedExpression: 'The steady hand that builds security and stability through consistent, careful management.',
  },
  pressureDrivenBuilder: {
    strengths: ['Endurance through difficulty', 'Willingness to carry real responsibility', 'Growth forged through consistent effort'],
    growthEdges: ['Confusing pressure with capacity', 'Delaying rest until "earned"', 'Difficulty trusting ease when it appears'],
    integratedExpression: 'The strength built through sustained effort -- most powerful once pressure and capacity are no longer confused.',
  },
  // Spiritual
  mysticReceiver: {
    strengths: ['Openness to intuitive, non-ordinary perception', 'Compassion and imaginative empathy', 'Comfort with mystery and the unknown'],
    growthEdges: ['Difficulty distinguishing intuition from wishful thinking', 'Escapism or avoidance of ordinary demands', 'Diffuse boundaries between self and surroundings'],
    integratedExpression: 'A receptive awareness that can hold mystery while staying grounded in daily life.',
  },
  occultInvestigator: {
    strengths: ['Comfort exploring taboo, hidden, or intense subjects', 'Psychological depth and insight', 'Willingness to face what others avoid'],
    growthEdges: ['Preoccupation with darkness or crisis', 'Difficulty trusting surface-level explanations', 'Intensity that can overwhelm lighter contexts'],
    integratedExpression: 'The capacity to face hidden or difficult material and return with usable understanding.',
  },
  philosophicalSeeker: {
    strengths: ['Genuine curiosity about meaning and belief', 'Optimism and expansiveness', 'Ability to find purpose across different contexts'],
    growthEdges: ['Restlessness or dissatisfaction with the ordinary', 'Over-idealizing distant beliefs or places', 'Preaching rather than exploring'],
    integratedExpression: 'A search for meaning that stays curious rather than dogmatic, and grounded rather than escapist.',
  },
  visionary: {
    strengths: ['Original, future-oriented insight', 'Comfort breaking from convention', 'Ability to imagine what does not yet exist'],
    growthEdges: ['Difficulty landing ideas in the present', 'Impatience with slower, incremental change', 'Isolation from those who do not share the vision'],
    integratedExpression: 'The capacity to sense what is emerging and bring it into a form others can recognize.',
  },
  contemplativePractitioner: {
    strengths: ['Discipline in reflective or spiritual practice', 'Patience with slow, internal development', 'Comfort with solitude'],
    growthEdges: ['Withdrawal from ordinary responsibility', 'Rigid or joyless discipline', 'Delaying life while "still preparing"'],
    integratedExpression: 'A grounded, disciplined practice that deepens meaning without requiring retreat from life.',
  },
  ancestralKarmicProcessor: {
    strengths: ['Sensitivity to inherited or generational patterns', 'Capacity to process and metabolize old material', 'Loyalty to lineage or history'],
    growthEdges: ['Carrying weight that was not consciously chosen', "Difficulty separating one's own path from inherited expectations", 'Repeating familiar patterns instead of examining them'],
    integratedExpression: 'The capacity to consciously process inherited patterns rather than silently carry or repeat them.',
  },
  rationalMeaningMaker: {
    strengths: ['Building a durable ethical or philosophical framework through direct experience', 'Comfort finding purpose in responsibility, craft, or care rather than doctrine', 'Skepticism that filters out untested belief'],
    growthEdges: ['Dismissing intuition or the unexplained too quickly', 'Mistaking structure for the whole of meaning', 'Difficulty naming what feels sacred without proof'],
    integratedExpression: 'A sense of purpose built through lived responsibility and tested principle, open enough to leave room for what cannot yet be explained.',
  },
  // Emotional
  empathicAbsorber: {
    strengths: ["Deep attunement to others' emotional states", 'Compassion and gentle presence', 'Sensitivity to unspoken atmosphere'],
    growthEdges: ['Absorbing emotions that are not one\'s own', 'Difficulty maintaining clear boundaries', 'Emotional exhaustion in crowded or intense environments'],
    integratedExpression: 'A permeable sensitivity that can stay compassionate without losing track of what belongs to whom.',
  },
  depthFeeler: {
    strengths: ['Capacity for intense, transformative emotional bonds', 'Comfort with intensity others avoid', 'Perceptiveness about hidden emotional undercurrents'],
    growthEdges: ['Confusing intensity with intimacy', 'Difficulty with lighter or more casual connection', 'Power struggles in close relationships'],
    integratedExpression: 'Emotional depth that can transform a bond without needing to control it.',
  },
  emotionalTranslator: {
    strengths: ['Ability to name and articulate feelings clearly', 'Bridging emotional and verbal understanding', 'Helping others make sense of what they feel'],
    growthEdges: ['Intellectualizing feelings instead of experiencing them', 'Overexplaining in emotionally charged moments', 'Restlessness with unspoken or ambiguous feelings'],
    integratedExpression: 'The capacity to put feeling into words without flattening what it actually feels like.',
  },
  relationalHarmonizer: {
    strengths: ['Natural diplomacy and social ease', 'Genuine warmth in relationships', 'Skill at reading and easing tension'],
    growthEdges: ['Avoiding necessary conflict', "Losing personal preference to keep the peace", "Over-adapting to others' expectations"],
    integratedExpression: 'The ability to create real harmony without sacrificing honesty or self.',
  },
  loyalProtector: {
    strengths: ['Steady, dependable emotional presence', 'Discretion and containment under pressure', 'Deep, enduring loyalty'],
    growthEdges: ['Difficulty asking for support in return', 'Guardedness that limits vulnerability', "Carrying others' burdens silently"],
    integratedExpression: 'A contained strength that protects others while still allowing itself to be known.',
  },
  boundaryLearner: {
    strengths: ['Deep compassion and permeability', 'Willingness to stay open despite difficulty', 'Growth through direct relational experience'],
    growthEdges: ['Blurred or inconsistent boundaries', 'Idealizing others before knowing them well', 'Difficulty distinguishing compassion from self-sacrifice'],
    integratedExpression: "Compassion that stays open while learning, over time, where one's self ends and another's begins.",
  },
};

function refineGrowthEdgesByEvidence(base: string[], hdLens: HumanDesignIPSELens): string[] {
  if (hdLens.available && hdLens.growthEdge) return [hdLens.growthEdge, ...base.slice(0, 2)];
  return base;
}

// ── Summary generation (deterministic) ────────────────────────────────────────

function generateDomainSummary(
  domain: IPSEDomainId, selected: { primaryStyle: IPSEStyleResult | null; secondaryStyles: IPSEStyleResult[] },
  vedicLens: VedicIPSELens, hdLens: HumanDesignIPSELens, isMinor: boolean,
): string {
  const title = IPSE_STYLE_DEFINITIONS[domain].title;
  const primaryLabel = selected.primaryStyle?.label ?? FALLBACK_STYLE[domain];

  if (isMinor) {
    const parts = [`${title} currently shows up through ${primaryLabel.toLowerCase()}.`];
    if (hdLens.available) parts.push(hdLens.summary);
    parts.push('Use this as a support cue, not a fixed label.');
    return parts.join(' ');
  }

  const parts = [`${title} appears primarily as a ${primaryLabel}.`];
  if (selected.secondaryStyles.length > 0) {
    parts.push(`Secondary styles include ${selected.secondaryStyles.map(s => s.label).join(' and ')}.`);
  }
  parts.push('This does not measure ability; it describes a symbolic processing style.');
  if (vedicLens.available) parts.push(vedicLens.summary);
  if (hdLens.available) {
    parts.push(hdLens.summary);
    if (hdLens.discrepancyNote) parts.push(hdLens.discrepancyNote);
  }
  return parts.join(' ');
}

function computeOverallPattern(domainCards: IPSEDomainCard[]): IPSEOverallPattern {
  const sorted = [...domainCards].sort((a, b) => b.orientationScore - a.orientationScore);
  const [top, second, , fourth] = sorted;
  const topGap = top.orientationScore - second.orientationScore;
  const spread = top.orientationScore - fourth.orientationScore;

  if (spread <= 15) return 'blended';
  if (topGap <= 8) return 'dual-led';
  if (spread >= 35) return 'polarized';
  if (top.orientationScore < 45) return 'subtle';
  if (topGap >= 15) {
    if (top.domain === 'intellectual') return 'intellect-led';
    if (top.domain === 'practical') return 'practicality-led';
    if (top.domain === 'spiritual') return 'spirit-led';
    if (top.domain === 'emotional') return 'emotion-led';
  }
  return 'blended';
}

const PATTERN_LABEL: Record<IPSEOverallPattern, string> = {
  'intellect-led': 'Intellect-led, with the next-strongest style offering support.',
  'practicality-led': 'Practicality-led, with the next-strongest style offering support.',
  'spirit-led': 'Spirit-led, with the next-strongest style offering support.',
  'emotion-led': 'Emotion-led, with the next-strongest style offering support.',
  'dual-led': 'Dual-led -- two styles work closely together rather than one leading alone.',
  blended: 'Blended rather than dominated by one mode -- all four styles have meaningful presence.',
  polarized: 'Polarized -- two styles are much more emphasized than the other two.',
  subtle: 'Subtle overall -- no single style strongly dominates; these capacities may develop through lived experience more than one obvious chart signature.',
};

function generateOverallSummary(domainCards: IPSEDomainCard[], pattern: IPSEOverallPattern, isMinor: boolean): string {
  if (isMinor) {
    const top = [...domainCards].sort((a, b) => b.orientationScore - a.orientationScore)[0];
    return `This child's profile currently appears most expressive through ${top.title.toLowerCase()} patterns. This should be used as a gentle support map, not a fixed description of who they are or what they can become.`;
  }
  return `Overall pattern: ${PATTERN_LABEL[pattern]}`;
}

// ── Fallback (no usable Western data) ─────────────────────────────────────────

function createFallbackProfile(isMinor: boolean, dataCoverage: IPSELayerAvailability): IPSEStyleProfile {
  return {
    sectionTitle: isMinor ? 'Learning & Growth Style' : 'IPSE Style Profile',
    sectionSubtitle: isMinor
      ? "Supportive insight into a child's natural learning, feeling, and growth patterns — not a measure of ability or potential."
      : 'A symbolic map of how your intelligence expresses through thought, action, meaning, and emotion.',
    disclaimer: isMinor
      ? 'This profile is for supportive reflection only. It does not measure intelligence, ability, personality, or potential. Children should never be labeled, limited, compared, or judged based on a chart. A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation.'
      : 'IPSE reflects symbolic intelligence style and processing patterns, not measured ability, fixed potential, or personal worth.',
    isMinor,
    dataCoverage,
    overallPattern: 'blended',
    profileSummary: 'Not enough chart data is available yet to compute an IPSE Style Profile.',
    domainCards: [],
  };
}

// ── Main entry point ───────────────────────────────────────────────────────────

const DOMAIN_IDS: IPSEDomainId[] = ['intellectual', 'practical', 'spiritual', 'emotional'];

export function computeIPSEStyleProfile(chart: NatalChart, options: IPSEOptions = {}): IPSEStyleProfile {
  const isMinor = options.isMinor ?? isMinorChart(chart.input.date);

  const dataCoverage: IPSELayerAvailability = {
    western: hasWesternChartData(chart),
    vedic: Boolean(options.includeVedic !== false && chart.vedic),
    vibrational: Boolean(options.includeVibrational !== false && hasPlanetaryLongitudes(chart)),
    humanDesign: Boolean(options.includeHumanDesign !== false && options.humanDesign),
    geneKeys: false, // not implemented this pass, per product decision
    selfReport: false, // no questionnaire infra in this app yet
  };

  if (!dataCoverage.western) return createFallbackProfile(isMinor, dataCoverage);

  const domainCards: IPSEDomainCard[] = DOMAIN_IDS.map(domain => {
    const westernStyles = computeWesternStyles(chart, domain);
    const selected = selectDomainStyles(westernStyles);

    const vedicLens = dataCoverage.vedic ? computeVedicIPSELens(chart, domain) : { available: false, summary: '', evidence: [] };
    const vibrationalLens = dataCoverage.vibrational ? computeVibrationalIPSELens(chart, domain, westernStyles) : { available: false, summary: '', subtypes: [], evidence: [] };
    const combined0 = combineDomainSignals(westernStyles, vedicLens, vibrationalLens, { available: false, accessPattern: 'unknown', summary: '', consistencyFactors: [], conditioningFactors: [], decisionSupport: '', growthEdge: '', evidence: [] });
    const humanDesignLens = dataCoverage.humanDesign
      ? computeHumanDesignIPSELens(options.humanDesign, domain, combined0.orientationScore)
      : { available: false, accessPattern: 'unknown' as IPSEAccessPattern, summary: '', consistencyFactors: [], conditioningFactors: [], decisionSupport: '', growthEdge: '', evidence: [] };
    const geneKeysLens = computeGeneKeysIPSELens();

    const combined = combineDomainSignals(westernStyles, vedicLens, vibrationalLens, humanDesignLens);
    const expressionTone = inferExpressionTone(combined.orientationScore, combined.fluencyScore, combined.frictionScore, humanDesignLens);
    const westernEvidence = westernStyles.flatMap(s => s.evidence.filter(e => e.system === 'western'));

    // Style-specific copy when a primary style was identified; domain-level
    // generic copy only for the no-clear-style fallback case. When a
    // secondary style is also present, one of its strengths/growth-edges is
    // folded in so two people sharing the same primary style but different
    // secondary styles still read as distinguishable.
    const primaryCopy = selected.primaryStyle ? IPSE_STYLE_COPY[selected.primaryStyle.id] : undefined;
    const secondaryCopy = selected.secondaryStyles[0] ? IPSE_STYLE_COPY[selected.secondaryStyles[0].id] : undefined;
    const baseStrengths = primaryCopy?.strengths ?? IPSE_DOMAIN_COPY[domain].strengths;
    const baseGrowthEdges = primaryCopy?.growthEdges ?? IPSE_DOMAIN_COPY[domain].growthEdges;
    const strengths = secondaryCopy ? [...baseStrengths, secondaryCopy.strengths[0]] : baseStrengths;
    const growthEdges = secondaryCopy ? [...baseGrowthEdges, secondaryCopy.growthEdges[0]] : baseGrowthEdges;

    return {
      domain,
      title: IPSE_STYLE_DEFINITIONS[domain].title,
      subtitle: IPSE_STYLE_DEFINITIONS[domain].subtitle,
      primaryStyle: selected.primaryStyle,
      secondaryStyles: selected.secondaryStyles,
      orientationScore: combined.orientationScore,
      fluencyScore: combined.fluencyScore,
      frictionScore: combined.frictionScore,
      styleConfidence: computeConfidence(westernEvidence.length, vedicLens.available, humanDesignLens.available),
      expressionTone,
      accessPattern: humanDesignLens.accessPattern,
      summary: generateDomainSummary(domain, selected, vedicLens, humanDesignLens, isMinor),
      strengths,
      growthEdges: refineGrowthEdgesByEvidence(growthEdges, humanDesignLens),
      integratedExpression: primaryCopy?.integratedExpression ?? IPSE_DOMAIN_COPY[domain].integratedExpression,
      westernEvidence,
      vedicLens,
      vibrationalLens,
      humanDesignLens,
      geneKeysLens,
    };
  });

  const overallPattern = computeOverallPattern(domainCards);

  return {
    sectionTitle: isMinor ? 'Learning & Growth Style' : 'IPSE Style Profile',
    sectionSubtitle: isMinor
      ? "Supportive insight into a child's natural learning, feeling, and growth patterns — not a measure of ability or potential."
      : 'A symbolic map of how your intelligence expresses through thought, action, meaning, and emotion.',
    disclaimer: isMinor
      ? 'This profile is for supportive reflection only. It does not measure intelligence, ability, personality, or potential. Children should never be labeled, limited, compared, or judged based on a chart. A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation.'
      : 'IPSE reflects symbolic intelligence style and processing patterns, not measured ability, fixed potential, or personal worth.',
    isMinor,
    dataCoverage,
    overallPattern,
    profileSummary: generateOverallSummary(domainCards, overallPattern, isMinor),
    domainCards,
  };
}
