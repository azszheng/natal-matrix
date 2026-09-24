/**
 * lib/ipse/western.ts
 *
 * Western astrology is the primary IPSE engine (per spec section 13).
 * This is the STYLE-detection layer: a small, finite vocabulary of
 * indicator shapes (aspect / house placement / house emphasis / sign
 * placement / sign emphasis / affliction), each style defined by 3-5 of
 * them drawn from its most astrologically central patterns.
 *
 * This indicator engine and its 27-style catalog are carried forward from
 * the prior IPSE implementation essentially unchanged -- it was empirically
 * balance-tested this session (a synthetic sample with properly varying
 * aspect angles, not just house/sign placement) and already encodes two
 * hard-won correctness fixes:
 *   - a style needs at least one *specific* hit (aspect/house/sign), not
 *     just a generic house-emphasis cluster or "aspected by anything"
 *     affliction check, before it can cross the selection threshold
 *     (GENERIC_INDICATOR_KINDS) -- otherwise two unrelated planets
 *     coincidentally sharing a house was enough to name a style.
 *   - fluency/friction-style ratios need Laplace smoothing so a single
 *     data point can't swing a ratio to an extreme (applied in the domain
 *     analyzers, not here).
 */

import type { NatalChart, BodyId, SignId, AspectKind } from '@/lib/astro/types';
import type { AstroFactor, Polarity } from './types';
import { aspectStrength, findAspect } from './evidence';

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function clamp0100(n: number): number { return Math.round(Math.max(0, Math.min(100, n))); }

const TRACKED_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode', 'chiron',
];

const HARD_ASPECTS: AspectKind[] = ['square', 'opposition'];

export type WesternIndicator =
  | { k: 'aspect'; a: BodyId; b: BodyId; hard?: boolean }
  | { k: 'afflicted'; planet: BodyId }
  | { k: 'houseP'; planet: BodyId; house: number }
  | { k: 'houseEmph'; house: number }
  | { k: 'signP'; planet: BodyId; sign: SignId }
  | { k: 'signEmph'; signs: SignId[] };

const GENERIC_INDICATOR_KINDS: WesternIndicator['k'][] = ['houseEmph', 'afflicted'];

function isDomicileOrExalted(chart: NatalChart, id: BodyId): boolean {
  const label = chart.western.dignities[id]?.label;
  return label === 'domicile' || label === 'exaltation';
}
function isInDetrimentOrFall(chart: NatalChart, id: BodyId): boolean {
  const label = chart.western.dignities[id]?.label;
  return label === 'detriment' || label === 'fall';
}

function evalIndicator(chart: NatalChart, ind: WesternIndicator): { hit: boolean; strength: number; label: string; polarity: Polarity; sourcePlanet?: BodyId; sourceHouse?: number } {
  switch (ind.k) {
    case 'aspect': {
      const asp = findAspect(chart, ind.a, ind.b);
      if (!asp) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      if (ind.hard !== undefined) {
        const isHard = HARD_ASPECTS.includes(asp.kind);
        if (ind.hard !== isHard) return { hit: false, strength: 0, label: '', polarity: 'mixed' };
      }
      const strength = aspectStrength(asp.orb, 6);
      const polarity: Polarity = asp.kind === 'trine' || asp.kind === 'sextile' ? 'supportive'
        : HARD_ASPECTS.includes(asp.kind) ? 'challenging' : 'mixed';
      return { hit: true, strength, polarity, label: `${cap(ind.a)} ${asp.kind} ${cap(ind.b)}`, sourcePlanet: ind.a };
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
      const polarity: Polarity = isDomicileOrExalted(chart, ind.planet) ? 'supportive' : isInDetrimentOrFall(chart, ind.planet) ? 'challenging' : 'mixed';
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

export type StyleDef = { id: string; label: string; westernIndicators: WesternIndicator[]; vibrationalPair?: [BodyId, BodyId] };

const A = (a: BodyId, b: BodyId, hard?: boolean): WesternIndicator => ({ k: 'aspect', a, b, hard });
const H = (planet: BodyId, house: number): WesternIndicator => ({ k: 'houseP', planet, house });
const HE = (house: number): WesternIndicator => ({ k: 'houseEmph', house });
const S = (planet: BodyId, sign: SignId): WesternIndicator => ({ k: 'signP', planet, sign });
const SE = (...signs: SignId[]): WesternIndicator => ({ k: 'signEmph', signs });
const AFF = (planet: BodyId): WesternIndicator => ({ k: 'afflicted', planet });

export const IPSE_STYLE_CATALOG: Record<'intellectual' | 'practical' | 'spiritual' | 'emotional', StyleDef[]> = {
  intellectual: [
    { id: 'investigativeAnalyst', label: 'Investigative Analyst', vibrationalPair: ['mercury', 'pluto'], westernIndicators: [A('mercury', 'pluto'), H('mercury', 8), HE(8), S('mercury', 'scorpio')] },
    { id: 'systemsThinker', label: 'Systems Thinker', vibrationalPair: ['mercury', 'uranus'], westernIndicators: [A('mercury', 'uranus'), S('mercury', 'aquarius'), HE(11)] },
    { id: 'deliberativeReasoner', label: 'Deliberative Reasoner', vibrationalPair: ['mercury', 'saturn'], westernIndicators: [A('mercury', 'saturn'), S('mercury', 'capricorn'), S('mercury', 'virgo'), HE(6)] },
    { id: 'conceptualSynthesizer', label: 'Conceptual Synthesizer', vibrationalPair: ['mercury', 'jupiter'], westernIndicators: [A('mercury', 'jupiter'), H('mercury', 9), HE(9)] },
    { id: 'intuitivePatternReader', label: 'Intuitive Pattern-Reader', vibrationalPair: ['mercury', 'neptune'], westernIndicators: [A('mercury', 'neptune'), H('mercury', 12), S('mercury', 'pisces'), HE(12)] },
    { id: 'rapidAssociativeThinker', label: 'Rapid Associative Thinker', vibrationalPair: ['mercury', 'mars'], westernIndicators: [A('mercury', 'mars'), S('mercury', 'aries'), HE(3)] },
  ],
  practical: [
    { id: 'strategicExecutor', label: 'Strategic Executor', vibrationalPair: ['mars', 'saturn'], westernIndicators: [A('mars', 'saturn', false), A('sun', 'saturn'), HE(10), SE('capricorn')] },
    { id: 'systemsBuilder', label: 'Systems Builder', vibrationalPair: ['mercury', 'saturn'], westernIndicators: [A('mercury', 'saturn'), H('mercury', 6), HE(6)] },
    { id: 'crisisPerformer', label: 'Crisis Performer', vibrationalPair: ['mars', 'pluto'], westernIndicators: [A('mars', 'pluto'), H('mars', 8), S('mars', 'scorpio'), HE(8)] },
    { id: 'structuredSustainer', label: 'Structured Sustainer', vibrationalPair: ['venus', 'saturn'], westernIndicators: [HE(2), A('venus', 'saturn'), SE('taurus')] },
    { id: 'pressureDrivenBuilder', label: 'Pressure-Driven Builder', vibrationalPair: ['mars', 'saturn'], westernIndicators: [AFF('saturn'), A('mars', 'saturn', true), H('saturn', 6)] },
    { id: 'adaptiveImproviser', label: 'Adaptive Improviser', vibrationalPair: ['mars', 'jupiter'], westernIndicators: [A('mars', 'jupiter'), H('jupiter', 11), S('mars', 'sagittarius'), HE(11)] },
  ],
  spiritual: [
    { id: 'experientialMystic', label: 'Experiential Mystic', vibrationalPair: ['moon', 'neptune'], westernIndicators: [A('moon', 'neptune'), H('neptune', 12), SE('pisces')] },
    { id: 'symbolicInterpreter', label: 'Symbolic Interpreter', vibrationalPair: ['mercury', 'pluto'], westernIndicators: [A('mercury', 'pluto'), HE(8), SE('scorpio')] },
    { id: 'philosophicalSeeker', label: 'Philosophical Seeker', vibrationalPair: ['mercury', 'jupiter'], westernIndicators: [H('jupiter', 9), A('mercury', 'jupiter'), SE('sagittarius')] },
    { id: 'archetypalThinker', label: 'Archetypal Thinker', vibrationalPair: ['uranus', 'neptune'], westernIndicators: [A('uranus', 'neptune'), A('jupiter', 'neptune')] },
    { id: 'contemplativeObserver', label: 'Contemplative Observer', vibrationalPair: ['saturn', 'neptune'], westernIndicators: [A('saturn', 'neptune'), H('saturn', 12), HE(12)] },
    { id: 'existentialInvestigator', label: 'Existential Investigator', vibrationalPair: ['moon', 'pluto'], westernIndicators: [A('moon', 'pluto'), H('southNode', 4), H('southNode', 8), HE(4)] },
    { id: 'rationalSpiritualist', label: 'Rational Spiritualist', vibrationalPair: ['jupiter', 'saturn'], westernIndicators: [A('jupiter', 'saturn'), H('saturn', 9), S('jupiter', 'capricorn'), HE(9)] },
    { id: 'skepticalSeeker', label: 'Skeptical Seeker', vibrationalPair: ['sun', 'uranus'], westernIndicators: [A('sun', 'uranus'), H('uranus', 9), S('sun', 'aquarius')] },
  ],
  emotional: [
    { id: 'relationalEmpath', label: 'Relational Empath', vibrationalPair: ['moon', 'neptune'], westernIndicators: [A('moon', 'neptune'), H('moon', 12), SE('pisces', 'cancer', 'scorpio')] },
    { id: 'somaticAffectiveProcessor', label: 'Somatic-Affective Processor', vibrationalPair: ['moon', 'pluto'], westernIndicators: [A('moon', 'pluto'), A('venus', 'pluto'), HE(8)] },
    { id: 'cognitiveEmotionalProcessor', label: 'Cognitive Emotional Processor', vibrationalPair: ['moon', 'mercury'], westernIndicators: [A('moon', 'mercury'), H('mercury', 4), H('moon', 3)] },
    { id: 'diplomaticRegulator', label: 'Diplomatic Regulator', vibrationalPair: ['moon', 'venus'], westernIndicators: [A('moon', 'venus'), H('venus', 7), SE('libra')] },
    { id: 'protectiveRegulator', label: 'Protective Regulator', vibrationalPair: ['moon', 'saturn'], westernIndicators: [A('moon', 'saturn'), A('venus', 'saturn'), H('saturn', 4)] },
    { id: 'boundaryOrientedRegulator', label: 'Boundary-Oriented Regulator', vibrationalPair: ['venus', 'neptune'], westernIndicators: [A('moon', 'neptune', true), A('venus', 'neptune', true), H('neptune', 7), HE(7)] },
    { id: 'internalIntegrator', label: 'Internal Integrator', vibrationalPair: ['mars', 'moon'], westernIndicators: [A('sun', 'moon'), A('mars', 'moon'), S('moon', 'capricorn')] },
  ],
};

export type ScoredStyle = { id: string; label: string; score: number; polarity: Polarity; evidence: AstroFactor[] };

export function computeStyleScores(chart: NatalChart, domain: keyof typeof IPSE_STYLE_CATALOG): ScoredStyle[] {
  return IPSE_STYLE_CATALOG[domain].map(style => {
    const evidence: AstroFactor[] = [];
    let total = 0, hits = 0;
    let hasSpecificHit = false;

    for (const ind of style.westernIndicators) {
      const r = evalIndicator(chart, ind);
      if (!r.hit) continue;
      total += r.strength; hits += 1;
      if (!GENERIC_INDICATOR_KINDS.includes(ind.k)) hasSpecificHit = true;
      evidence.push({ label: r.label, system: 'western', weight: r.strength, polarity: r.polarity, sourcePlanet: r.sourcePlanet, sourceHouse: r.sourceHouse });
    }

    const score = (hits === 0 || !hasSpecificHit) ? 0 : clamp0100((total / (hits + 1)) * 130);
    const supportive = evidence.filter(e => e.polarity === 'supportive').reduce((s, e) => s + e.weight, 0);
    const challenging = evidence.filter(e => e.polarity === 'challenging').reduce((s, e) => s + e.weight, 0);
    const polarity: Polarity = challenging > supportive * 1.3 ? 'challenging' : supportive > challenging * 1.3 ? 'supportive' : 'mixed';

    return { id: style.id, label: style.label, score, polarity, evidence };
  });
}

export { aspectStrength };
