import type { NatalChart, BodyId, AspectKind, SignId } from './types';
import { ASPECTS, getOrb } from './constants';

// ── Themes & Salience ─────────────────────────────────────────────────────────

export type SynastryTheme =
  | 'emotional_bond'
  | 'attraction_chemistry'
  | 'communication'
  | 'commitment_stability'
  | 'growth_shadow'
  | 'ease_support'
  | 'karmic_development'
  | 'creative_play'
  | 'conflict_activation'
  | 'identity_visibility'
  | 'family_roots'
  | 'spiritual_unconscious';

export type SalienceLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'background';

export type RelationshipContext =
  | 'romantic'
  | 'friendship'
  | 'family'
  | 'parent_child'
  | 'sibling'
  | 'professional'
  | 'general';

// ── Core aspect type ──────────────────────────────────────────────────────────

export type SynastryAspect = {
  bodyA: BodyId;
  bodyB: BodyId;
  kind: AspectKind;
  exactAngle: number;
  orb: number;
  maxOrb: number;
  signA?: SignId;
  houseA?: number;
  lonA?: number;
  signB?: SignId;
  houseB?: number;
  lonB?: number;
  salienceScore: number;
  salienceLevel: SalienceLevel;
  themes: SynastryTheme[];
  isGenerational: boolean;
};

// ── House overlay type ────────────────────────────────────────────────────────

export type SynastryHouseOverlay = {
  planetOwner: 'A' | 'B';
  planet: BodyId;
  planetSign: SignId;
  planetLon: number;
  house: number;
  salienceScore: number;
  salienceLevel: SalienceLevel;
  themes: SynastryTheme[];
  label: string;
};

// ── Shared pattern types ──────────────────────────────────────────────────────

export type SharedPatternType =
  | 'same_planet_sign'
  | 'same_planet_house'
  | 'shared_aspect_pattern'
  | 'shared_sign_emphasis'
  | 'shared_house_emphasis'
  | 'shared_element_emphasis'
  | 'shared_family_signature'
  | 'shared_karmic_signature';

export type SharedPattern = {
  type: SharedPatternType;
  label: string;
  description: string;
  personAEvidence: string[];
  personBEvidence: string[];
  themes: SynastryTheme[];
  salienceScore: number;
  salienceLevel: SalienceLevel;
  familyRelevance: 'low' | 'moderate' | 'high';
  isGenerational: boolean;
};

// ── Theme summary type ────────────────────────────────────────────────────────

export type SynastryThemeSummary = {
  theme: SynastryTheme;
  score: number;
  salienceLevel: SalienceLevel;
  topAspects: SynastryAspect[];
  topOverlays: SynastryHouseOverlay[];
  topPatterns: SharedPattern[];
};

// ── Full synastry result ──────────────────────────────────────────────────────

export type SynastryResult = {
  aspects: SynastryAspect[];
  overlays: SynastryHouseOverlay[];
  patterns: SharedPattern[];
  themes: SynastryThemeSummary[];
  hasHouseData: boolean;
  chartA: NatalChart;
  chartB: NatalChart;
};

// ── Bodies used in synastry ───────────────────────────────────────────────────

export const SYNASTRY_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'trueNode', 'chiron', 'asc', 'mc',
];

// ── Raw geometry (no scoring — consumed by synastryScoring.ts) ────────────────

function angularSep(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export type RawSynastryAspect = Omit<
  SynastryAspect,
  'salienceScore' | 'salienceLevel' | 'themes' | 'isGenerational'
>;

export function computeSynastryRaw(
  chartA: NatalChart,
  chartB: NatalChart,
): RawSynastryAspect[] {
  const aspects: RawSynastryAspect[] = [];

  for (const idA of SYNASTRY_BODIES) {
    const bodyA = chartA.western.bodies[idA];
    if (!bodyA) continue;

    for (const idB of SYNASTRY_BODIES) {
      const bodyB = chartB.western.bodies[idB];
      if (!bodyB) continue;

      const sep = angularSep(bodyA.longitude, bodyB.longitude);

      for (const def of ASPECTS) {
        const maxOrb    = getOrb(def.kind, idA, idB);
        const deviation = Math.abs(sep - def.angle);
        if (deviation <= maxOrb) {
          aspects.push({
            bodyA: idA, bodyB: idB,
            kind: def.kind, exactAngle: def.angle,
            orb: deviation, maxOrb,
            signA: bodyA.sign, houseA: bodyA.house, lonA: bodyA.longitude,
            signB: bodyB.sign, houseB: bodyB.house, lonB: bodyB.longitude,
          });
        }
      }
    }
  }

  return aspects;
}

// computeSynastry (enriched) is exported from synastryScoring.ts
