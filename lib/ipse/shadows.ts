/**
 * lib/ipse/shadows.ts
 *
 * Every shadow must derive from an actual strength or tension (spec section
 * 11) -- never a generic negative trait bolted on independently. A shadow
 * is generated FROM the same planetary factor that produced a strength (a
 * strong Saturn's discipline can tip into rigidity), or from a contrary-to-
 * sect / hard-aspected condition (a planet under real pressure is more
 * likely to express through its harder register).
 */

import type { BodyId } from '@/lib/astro/types';
import type { AstroFactor, ConfidenceLevel, IPSEDomainId, PlanetCondition, ShadowTrait } from './types';

type ShadowSpec = { strength: string; shadow: string };

// One entry per planet: the strength this planet's emphasis lends, and the
// shadow that same emphasis can tip into under pressure. Deliberately not
// exhaustive of every possible nuance -- these are the well-established
// archetypal pairs the spec itself calls out.
const PLANET_SHADOW: Partial<Record<BodyId, ShadowSpec[]>> = {
  mercury: [
    { strength: 'rapid conceptual association', shadow: 'mental overstimulation, or jumping between ideas before any of them land' },
    { strength: 'quick verbal processing', shadow: 'difficulty tolerating slower, more deliberate people or processes' },
  ],
  mars: [
    { strength: 'decisiveness and initiative', shadow: 'impatience, overactivation, or unnecessary conflict when things move too slowly' },
  ],
  saturn: [
    { strength: 'discipline and follow-through', shadow: 'rigidity, overcontrol, or excessive self-denial once a standard is set' },
  ],
  jupiter: [
    { strength: 'breadth of perspective and synthesis', shadow: 'overgeneralizing from limited evidence, or chasing too many possibilities at once' },
  ],
  neptune: [
    { strength: 'intuition and imaginative sensitivity', shadow: 'projection, or difficulty verifying an impression against evidence' },
  ],
  pluto: [
    { strength: 'investigative depth and intensity', shadow: 'obsession, rumination, or difficulty disengaging once fixated' },
  ],
  uranus: [
    { strength: 'originality and independence', shadow: 'restlessness with anything that feels routine, or disruption for its own sake' },
  ],
  venus: [
    { strength: 'relational attunement', shadow: "over-adapting to others' expectations at the expense of personal preference" },
  ],
  moon: [
    { strength: 'emotional receptivity', shadow: 'porous boundaries, or absorbing what belongs to someone else' },
  ],
  sun: [
    { strength: 'self-directed identity', shadow: 'defining worth through visible achievement or recognition' },
  ],
};

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// Confidence rises with the number of independent factors pointing the same
// direction: dignity, sect, and hard-aspect pressure are each one vote.
function shadowConfidence(condition: PlanetCondition): ConfidenceLevel {
  let votes = 0;
  if (condition.dignity === 'detriment' || condition.dignity === 'fall') votes++;
  if (condition.sectStatus === 'contrary_to_sect') votes++;
  if (condition.hardAspects.length >= 2) votes++;
  if (condition.hardAspects.length >= 1) votes++;
  if (votes >= 3) return 'high';
  if (votes >= 1) return 'moderate';
  return 'low';
}

export function generatePlanetShadow(planet: BodyId, condition: PlanetCondition, domain: IPSEDomainId): ShadowTrait | null {
  const specs = PLANET_SHADOW[planet];
  if (!specs) return null;
  // Prefer whichever entry the chart itself supports evidence for; default
  // to the first if the planet has no hard aspects to anchor a specific one.
  const spec = specs[0];

  const sourceFactors: AstroFactor[] = [
    { label: `${cap(planet)} ${condition.dignity}`, system: 'western', weight: 0.5, polarity: 'mixed', sourcePlanet: planet },
  ];
  if (condition.sectStatus === 'contrary_to_sect') {
    sourceFactors.push({ label: `${cap(planet)} contrary to sect`, system: 'western', weight: 0.4, polarity: 'challenging', sourcePlanet: planet });
  }
  for (const h of condition.hardAspects.slice(0, 2)) {
    sourceFactors.push({ label: `${cap(planet)} ${h.kind} ${cap(h.other)}`, system: 'western', weight: 0.5, polarity: 'challenging', sourcePlanet: planet });
  }

  const counterEvidence: AstroFactor[] = condition.easyAspects.slice(0, 2).map(a => ({
    label: `${cap(planet)} ${a.kind} ${cap(a.other)}`, system: 'western', weight: 0.4, polarity: 'supportive', sourcePlanet: planet,
  }));

  return {
    trait: cap(spec.shadow),
    domain,
    sourceFactors,
    confidence: shadowConfidence(condition),
    counterEvidence,
  };
}

// Two genuinely contradictory strengths should be preserved as a live
// tension, not averaged into neutrality (spec section 12).
export function describeContradiction(strengthA: string, strengthB: string): string {
  return `Your chart holds both at once: ${strengthA} and ${strengthB} -- not a contradiction to resolve, but two real currents that alternate depending on the moment.`;
}
