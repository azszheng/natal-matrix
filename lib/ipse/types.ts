/**
 * lib/ipse/types.ts
 *
 * Shared types for the IPSE (Intellectual / Practical / Spiritual / Emotional)
 * engine. IPSE is NOT an intelligence test or a psychometric score -- it
 * describes STYLES of processing, where they flow easily, what interferes
 * with their expression, and the conditions under which they work best.
 *
 * Pipeline (see generate-profile.ts):
 *   chart -> extractIPSEEvidence -> calculateSectContext ->
 *   analyze{Intellectual,Practical,Spiritual,Emotional} -> detectShadows ->
 *   detectCompensators -> crossDomainSynthesis -> generateNarrative -> UI
 *
 * Computation is deterministic. The optional AI-expanded interpretation
 * (lib/ai/ipsePrompts.ts) narrates ONLY from the structured evidence this
 * module produces -- it never invents chart factors.
 */

import type { BodyId, SignId, NatalChart } from '@/lib/astro/types';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import type { InterpretMode } from '@/lib/ai/prompts';

export type IPSEDomainId = 'intellectual' | 'practical' | 'spiritual' | 'emotional';
export type IPSEShortCode = 'I' | 'P' | 'S' | 'E';

export type IPSESystem = 'western' | 'vedic' | 'vibrational' | 'humanDesign';

export type Polarity = 'supportive' | 'challenging' | 'mixed';

// ── Sect ─────────────────────────────────────────────────────────────────────

export type Sect = 'day' | 'night';

export type SectContext = {
  sect: Sect;
  luminaryOfSect: 'sun' | 'moon';
  luminaryContrary: 'sun' | 'moon';
  beneficOfSect: 'jupiter' | 'venus';
  maleficOfSect: 'saturn' | 'mars';
  beneficContrary: 'venus' | 'jupiter';
  maleficContrary: 'mars' | 'saturn';
};

export type SectStatus = 'in_sect' | 'contrary_to_sect' | 'neutral';

// ── Evidence ─────────────────────────────────────────────────────────────────

export type AstroFactor = {
  label: string; // "Mercury square Uranus (2.1 deg orb)"
  system: IPSESystem;
  weight: number; // 0-1, internal only -- never shown raw to the user
  polarity: Polarity;
  sourcePlanet?: BodyId;
  sourceHouse?: number;
};

export type PlanetCondition = {
  planet: BodyId;
  sign: SignId;
  house: number;
  angularity: 'angular' | 'succedent' | 'cadent';
  dignity: 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine';
  sectStatus: SectStatus;
  dispositor: BodyId;
  dispositorCondition: 'strong' | 'moderate' | 'weak' | null; // null if chain loops back immediately (domicile)
  hardAspects: { other: BodyId; kind: string; orb: number }[];
  easyAspects: { other: BodyId; kind: string; orb: number }[];
  // A single continuous 0-1 "how functionally accessible is this planet"
  // figure derived from dignity + sect + aspects + dispositor -- used
  // internally to drive capacity/expression, never surfaced as a raw number.
  accessibility: number;
};

// ── Style ────────────────────────────────────────────────────────────────────

export type CapacityLevel = 'emphasized' | 'moderate' | 'mixed' | 'less_emphasized';
export type ExpressionEase = 'natural' | 'conditional' | 'effortful' | 'variable';
export type ConfidenceLevel = 'low' | 'moderate' | 'high';

export type StyleTrait = {
  id: string;
  label: string;
  strength: CapacityLevel;
  evidence: AstroFactor[];
};

export type InterpretationTrait = {
  text: string;
  confidence: ConfidenceLevel;
  sourceFactors: AstroFactor[];
};

export type ShadowTrait = {
  trait: string;
  domain: IPSEDomainId;
  sourceFactors: AstroFactor[];
  confidence: ConfidenceLevel;
  counterEvidence: AstroFactor[];
};

export type Compensator = {
  weakFactor: string;
  compensatingFactor: string;
  narrative: string;
};

// ── Practical Intelligence execution engine ───────────────────────────────────

export type FacetResult = {
  level: CapacityLevel;
  evidence: AstroFactor[];
};

export type PracticalFacets = {
  appliedJudgment: FacetResult;
  initiation: FacetResult;
  persistence: FacetResult;
  organization: FacetResult;
  completion: FacetResult;
  adaptability: FacetResult;
  resourcefulness: FacetResult;
  pressurePerformance: FacetResult;
};

export type ExecutionStyle =
  | 'balanced' | 'strong_initiator' | 'strong_sustainer' | 'selective_executor'
  | 'adaptive_executor' | 'crisis_executor' | 'friction_heavy' | 'externally_structured';

export type ExecutionProfile = {
  facets: PracticalFacets;
  overallStyle: ExecutionStyle;
  narrative: string;
};

export type EmotionalFacets = {
  selfAwareness: FacetResult;
  emotionalDifferentiation: FacetResult;
  regulation: FacetResult;
  empathy: FacetResult;
  boundaries: FacetResult;
  interpersonalAttunement: FacetResult;
};

// ── Astrological basis (advanced / "Why?" panel) ──────────────────────────────

export type AstroBasis = {
  keyPlanets: { planet: BodyId; sign: SignId; house: number; dignity: string; sect: SectStatus }[];
  aspects: string[];
  houses: number[];
  dispositorChains: { planet: BodyId; chain: BodyId[] }[];
  vedic?: string;
  vibrational?: string;
  humanDesign?: string;
};

// ── Domain profile (the unit the UI renders) ──────────────────────────────────

export type IPSEDomainProfile = {
  domain: IPSEDomainId;
  shortCode: IPSEShortCode;
  domainLabel: string; // "Intellectual Intelligence"
  definition: string;

  capacity: {
    level: CapacityLevel;
    confidence: ConfidenceLevel;
    evidence: AstroFactor[];
  };

  profileStyleLabel: string; // combined headline, e.g. "Systems-Oriented Investigative Thinker"
  styles: StyleTrait[];

  strengths: InterpretationTrait[];
  styleDescription: string;

  expression: {
    ease: ExpressionEase;
    description: string;
  };

  shadows: ShadowTrait[];
  compensators: Compensator[];
  optimalConditions: string[];

  crossDomainNote?: string;
  synthesis: string;

  basis: AstroBasis;

  executionProfile?: ExecutionProfile; // practical domain only
};

export type IPSEOverallPattern =
  | 'intellect-led' | 'practicality-led' | 'spirit-led' | 'emotion-led'
  | 'dual-led' | 'blended' | 'polarized' | 'subtle';

export type IPSELayerAvailability = {
  western: boolean;
  vedic: boolean;
  vibrational: boolean;
  humanDesign: boolean;
};

export type IPSEProfile = {
  sectionTitle: string;
  sectionSubtitle: string;
  intro: string;
  disclaimer: string;
  isMinor: boolean;
  dataCoverage: IPSELayerAvailability;
  sect: SectContext | null;
  overallPattern: IPSEOverallPattern;
  profileSummary: string;
  domains: IPSEDomainProfile[];
  crossDomainSynthesis: string[];
};

export type IPSEOptions = {
  mode?: InterpretMode;
  isMinor?: boolean;
  includeVedic?: boolean;
  includeVibrational?: boolean;
  includeHumanDesign?: boolean;
  humanDesign?: HdChart | null;
};

export type ChartInput = NatalChart;
