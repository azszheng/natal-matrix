/**
 * synastryPatterns.ts
 * Shared chart pattern detection — what both people carry independently.
 */

import type { NatalChart, BodyId, SignId, AspectKind } from './types';
import {
  type SharedPattern,
  type SynastryTheme,
  type SharedPatternType,
  type SalienceLevel,
} from './synastry';
import { getSalienceLevel, isPersonalPlanet, isNode, isOuterPlanet } from './synastryScoring';

// ── Display helpers ───────────────────────────────────────────────────────────

const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N.Node', chiron: 'Chiron', asc: 'ASC', mc: 'MC',
};

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function signLabel(s: SignId): string { return cap(s); }

function ordinal(n: number): string {
  if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd';
  return `${n}th`;
}

// ── Element & modality helpers ────────────────────────────────────────────────

const SIGN_ELEMENT: Record<SignId, 'fire' | 'earth' | 'air' | 'water'> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};

const SIGN_MODALITY: Record<SignId, 'cardinal' | 'fixed' | 'mutable'> = {
  aries: 'cardinal', cancer: 'cardinal', libra: 'cardinal', capricorn: 'cardinal',
  taurus: 'fixed', leo: 'fixed', scorpio: 'fixed', aquarius: 'fixed',
  gemini: 'mutable', virgo: 'mutable', sagittarius: 'mutable', pisces: 'mutable',
};

const PERSONAL_BODIES: BodyId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'asc', 'mc'];

function dominantElement(chart: NatalChart): ('fire' | 'earth' | 'air' | 'water') | null {
  const counts = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const id of PERSONAL_BODIES) {
    const b = chart.western.bodies[id];
    if (b) counts[SIGN_ELEMENT[b.sign]]++;
  }
  const max = Math.max(...Object.values(counts));
  if (max < 3) return null;
  const el = (Object.keys(counts) as Array<keyof typeof counts>).find(k => counts[k] === max);
  return el ?? null;
}

function dominantModality(chart: NatalChart): ('cardinal' | 'fixed' | 'mutable') | null {
  const counts = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const id of PERSONAL_BODIES) {
    const b = chart.western.bodies[id];
    if (b) counts[SIGN_MODALITY[b.sign]]++;
  }
  const max = Math.max(...Object.values(counts));
  if (max < 3) return null;
  const mod = (Object.keys(counts) as Array<keyof typeof counts>).find(k => counts[k] === max);
  return mod ?? null;
}

// ── Aspect pattern detection ──────────────────────────────────────────────────

const ASPECT_GROUPS: Record<string, AspectKind[]> = {
  hard: ['conjunction', 'opposition', 'square'],
  soft: ['trine', 'sextile'],
  all:  ['conjunction', 'opposition', 'square', 'trine', 'sextile', 'quincunx'],
};

function hasAspectBetween(chart: NatalChart, a: BodyId, b: BodyId): AspectKind | null {
  const asp = chart.western.aspects.find(
    x => ((x.a === a && x.b === b) || (x.a === b && x.b === a))
  );
  return asp ? asp.kind : null;
}

// ── Theme for shared patterns ─────────────────────────────────────────────────

function sharedPatternThemes(
  type: SharedPatternType,
  involvedBodies: BodyId[],
  involvedHouses: number[],
): SynastryTheme[] {
  const themes = new Set<SynastryTheme>();

  if (type === 'shared_family_signature' || involvedHouses.some(h => [4, 8].includes(h))) {
    themes.add('family_roots');
    themes.add('emotional_bond');
  }
  if (involvedHouses.includes(12) || involvedBodies.includes('neptune')) {
    themes.add('spiritual_unconscious');
  }
  if (involvedBodies.includes('pluto') || involvedBodies.includes('saturn')) {
    themes.add('growth_shadow');
  }
  if (involvedBodies.includes('moon')) {
    themes.add('emotional_bond');
  }
  if (involvedBodies.includes('venus') || involvedBodies.includes('mars')) {
    themes.add('attraction_chemistry');
  }
  if (involvedBodies.includes('mercury')) {
    themes.add('communication');
  }
  if (involvedBodies.includes('saturn')) {
    themes.add('commitment_stability');
  }
  if (isNode(involvedBodies[0] as BodyId) || type === 'shared_karmic_signature') {
    themes.add('karmic_development');
  }

  const priority: SynastryTheme[] = [
    'emotional_bond', 'family_roots', 'growth_shadow', 'attraction_chemistry',
    'karmic_development', 'commitment_stability', 'spiritual_unconscious',
    'communication', 'ease_support', 'identity_visibility',
  ];
  return priority.filter(t => themes.has(t)).slice(0, 3);
}

// ── Family relevance ──────────────────────────────────────────────────────────

function familyRelevance(
  involvedBodies: BodyId[],
  involvedHouses: number[],
): 'low' | 'moderate' | 'high' {
  const familyBodies: BodyId[] = ['moon', 'saturn', 'pluto', 'trueNode', 'chiron'];
  const familyHouses = [4, 8, 12];
  const bodyHit = involvedBodies.some(b => familyBodies.includes(b as BodyId));
  const houseHit = involvedHouses.some(h => familyHouses.includes(h));
  if (bodyHit && houseHit) return 'high';
  if (bodyHit || houseHit) return 'moderate';
  return 'low';
}

// ── Main export ───────────────────────────────────────────────────────────────

export function detectSharedPatterns(
  chartA: NatalChart,
  chartB: NatalChart,
  hasHouseData: boolean,
): SharedPattern[] {
  const patterns: SharedPattern[] = [];

  // 1. Same planet in same sign (personal planets)
  for (const bodyId of PERSONAL_BODIES) {
    const bA = chartA.western.bodies[bodyId];
    const bB = chartB.western.bodies[bodyId];
    if (!bA || !bB || bA.sign !== bB.sign) continue;

    const isGen = isOuterPlanet(bodyId as BodyId);
    const score = isGen ? 15 : isPersonalPlanet(bodyId as BodyId) ? 65 : 45;

    patterns.push({
      type: 'same_planet_sign',
      label: `Both have ${BODY_LABEL[bodyId] ?? cap(bodyId)} in ${signLabel(bA.sign)}`,
      description: `Both charts share ${BODY_LABEL[bodyId] ?? cap(bodyId)} in ${signLabel(bA.sign)}, pointing to a shared approach or sensitivity in this area.`,
      personAEvidence: [`${BODY_LABEL[bodyId]} in ${signLabel(bA.sign)} H${bA.house}`],
      personBEvidence: [`${BODY_LABEL[bodyId]} in ${signLabel(bB.sign)} H${bB.house}`],
      themes: sharedPatternThemes('same_planet_sign', [bodyId as BodyId], []),
      salienceScore: score,
      salienceLevel: getSalienceLevel(score),
      familyRelevance: familyRelevance([bodyId as BodyId], []),
      isGenerational: isGen,
    });
  }

  // 2. Same planet in same house (requires house data)
  if (hasHouseData) {
    for (const bodyId of PERSONAL_BODIES) {
      const bA = chartA.western.bodies[bodyId];
      const bB = chartB.western.bodies[bodyId];
      if (!bA || !bB || bA.house !== bB.house) continue;

      const house = bA.house;
      const score = [1, 4, 5, 7, 8, 10, 12].includes(house) ? 70 : 50;

      patterns.push({
        type: 'same_planet_house',
        label: `Both have ${BODY_LABEL[bodyId] ?? cap(bodyId)} in the ${ordinal(house)} house`,
        description: `Both charts place ${BODY_LABEL[bodyId] ?? cap(bodyId)} in the ${ordinal(house)} house, suggesting a shared life area of activation or focus.`,
        personAEvidence: [`${BODY_LABEL[bodyId]} in ${ordinal(house)} house (${signLabel(bA.sign)})`],
        personBEvidence: [`${BODY_LABEL[bodyId]} in ${ordinal(house)} house (${signLabel(bB.sign)})`],
        themes: sharedPatternThemes('same_planet_house', [bodyId as BodyId], [house]),
        salienceScore: score,
        salienceLevel: getSalienceLevel(score),
        familyRelevance: familyRelevance([bodyId as BodyId], [house]),
        isGenerational: false,
      });
    }
  }

  // 3. Shared aspect patterns (same two planets in aspect in both charts)
  const KEY_PAIRS: Array<[BodyId, BodyId, number]> = [
    ['sun',  'moon',     80], ['moon',    'saturn',  80],
    ['moon', 'pluto',    75], ['venus',   'pluto',   75],
    ['sun',  'saturn',   70], ['mercury', 'saturn',  65],
    ['mars', 'saturn',   65], ['venus',   'mars',    70],
    ['sun',  'venus',    65], ['moon',    'neptune', 65],
    ['venus','neptune',  60], ['mars',    'uranus',  60],
    ['moon', 'mars',     65], ['mercury', 'pluto',   60],
    ['saturn','trueNode',60], ['sun',     'pluto',   65],
    ['chiron','moon',    65], ['chiron',  'sun',     60],
  ];

  for (const [bA, bB, baseScore] of KEY_PAIRS) {
    const aspA = hasAspectBetween(chartA, bA, bB);
    const aspB = hasAspectBetween(chartB, bA, bB);
    if (!aspA || !aspB) continue;

    const labA = BODY_LABEL[bA] ?? cap(bA);
    const labB = BODY_LABEL[bB] ?? cap(bB);

    patterns.push({
      type: 'shared_aspect_pattern',
      label: `Both have ${labA}–${labB} aspects`,
      description: `Both charts carry a ${labA}–${labB} contact, suggesting a shared psychological dynamic in this area.`,
      personAEvidence: [`${labA} ${aspA} ${labB}`],
      personBEvidence: [`${labA} ${aspB} ${labB}`],
      themes: sharedPatternThemes('shared_aspect_pattern', [bA, bB], []),
      salienceScore: baseScore,
      salienceLevel: getSalienceLevel(baseScore),
      familyRelevance: familyRelevance([bA, bB], []),
      isGenerational: false,
    });
  }

  // 4. Shared element emphasis
  const elA = dominantElement(chartA);
  const elB = dominantElement(chartB);
  if (elA && elA === elB) {
    const score = 45;
    patterns.push({
      type: 'shared_element_emphasis',
      label: `Both have strong ${cap(elA)} emphasis`,
      description: `Both charts carry a dominant ${elA} element signature — a shared energetic orientation that may feel immediately recognizable.`,
      personAEvidence: [`Strong ${elA} emphasis`],
      personBEvidence: [`Strong ${elB} emphasis`],
      themes: sharedPatternThemes('shared_element_emphasis', [], []),
      salienceScore: score,
      salienceLevel: getSalienceLevel(score),
      familyRelevance: 'low',
      isGenerational: false,
    });
  }

  // 5. Shared family/8th/12th house emphasis (requires house data)
  if (hasHouseData) {
    const heavyHouses: Array<[number, string, number]> = [
      [4, 'family-root', 70], [8, '8th-house depth', 65], [12, '12th-house', 65],
    ];

    for (const [house, desc, baseScore] of heavyHouses) {
      const countA = PERSONAL_BODIES.filter(id => chartA.western.bodies[id]?.house === house).length;
      const countB = PERSONAL_BODIES.filter(id => chartB.western.bodies[id]?.house === house).length;
      if (countA < 2 || countB < 2) continue;

      const planetsA = PERSONAL_BODIES
        .filter(id => chartA.western.bodies[id]?.house === house)
        .map(id => BODY_LABEL[id] ?? cap(id));
      const planetsB = PERSONAL_BODIES
        .filter(id => chartB.western.bodies[id]?.house === house)
        .map(id => BODY_LABEL[id] ?? cap(id));

      patterns.push({
        type: 'shared_house_emphasis',
        label: `Both have ${ordinal(house)}-house emphasis`,
        description: `Both charts have multiple personal planets in the ${ordinal(house)} house, pointing to a shared ${desc} orientation.`,
        personAEvidence: planetsA.map(p => `${p} in ${ordinal(house)} house`),
        personBEvidence: planetsB.map(p => `${p} in ${ordinal(house)} house`),
        themes: sharedPatternThemes('shared_house_emphasis', [], [house]),
        salienceScore: baseScore,
        salienceLevel: getSalienceLevel(baseScore),
        familyRelevance: familyRelevance([], [house]),
        isGenerational: false,
      });
    }

    // 6. Shared Saturn-family-root signature
    const satA = chartA.western.bodies.saturn;
    const satB = chartB.western.bodies.saturn;
    if (satA && satB && satA.house === satB.house && [4, 8, 12, 10].includes(satA.house)) {
      const score = 75;
      patterns.push({
        type: 'shared_family_signature',
        label: `Both have Saturn in the ${ordinal(satA.house)} house`,
        description: `Both charts place Saturn in the ${ordinal(satA.house)} house — a shared pattern around responsibility, emotional containment, or family-root themes.`,
        personAEvidence: [`Saturn in ${ordinal(satA.house)} house (${signLabel(satA.sign)})`],
        personBEvidence: [`Saturn in ${ordinal(satB.house)} house (${signLabel(satB.sign)})`],
        themes: ['family_roots', 'commitment_stability', 'growth_shadow'],
        salienceScore: score,
        salienceLevel: getSalienceLevel(score),
        familyRelevance: 'high',
        isGenerational: false,
      });
    }
  }

  // Deduplicate (same label)
  const seen = new Set<string>();
  const unique = patterns.filter(p => {
    if (seen.has(p.label)) return false;
    seen.add(p.label);
    return true;
  });

  return unique.sort((a, b) => b.salienceScore - a.salienceScore);
}
