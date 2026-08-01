/**
 * synastryOverlays.ts
 * House overlay calculation: where each person's planets land in the other person's houses.
 */

import type { NatalChart, BodyId, SignId } from './types';
import {
  SYNASTRY_BODIES,
  type SynastryHouseOverlay,
  type SalienceLevel,
  type SynastryTheme,
} from './synastry';
import { getSalienceLevel } from './synastryScoring';

// ── Planet overlay weights ────────────────────────────────────────────────────

const OVERLAY_PLANET_WEIGHT: Partial<Record<BodyId, number>> = {
  sun:      1.0,
  moon:     1.0,
  venus:    0.95,
  mars:     0.95,
  mercury:  0.85,
  saturn:   0.85,
  trueNode: 0.8,
  asc:      0.75,
  mc:       0.75,
  jupiter:  0.75,
  chiron:   0.65,
  uranus:   0.45,
  neptune:  0.45,
  pluto:    0.5,
};

// Higher-salience houses for relationship readings
const HOUSE_WEIGHTS: Record<number, number> = {
  1:  0.9,
  2:  0.55,
  3:  0.55,
  4:  0.9,
  5:  0.85,
  6:  0.5,
  7:  1.0,
  8:  0.9,
  9:  0.55,
  10: 0.8,
  11: 0.6,
  12: 0.85,
};

// ── House from longitude ──────────────────────────────────────────────────────

function houseFromLongitude(lon: number, cusps: number[]): number {
  // Placidus cusps: cusps[0] = cusp of house 1, ..., cusps[11] = cusp of house 12
  const norm = ((lon % 360) + 360) % 360;
  for (let h = 0; h < 12; h++) {
    const start = ((cusps[h] % 360) + 360) % 360;
    const end   = ((cusps[(h + 1) % 12] % 360) + 360) % 360;
    if (start <= end) {
      if (norm >= start && norm < end) return h + 1;
    } else {
      // wraps 0°
      if (norm >= start || norm < end) return h + 1;
    }
  }
  return 1;
}

// ── Theme classification for overlays ────────────────────────────────────────

function overlayThemes(planet: BodyId, house: number): SynastryTheme[] {
  const themes = new Set<SynastryTheme>();

  const houseMap: Record<number, SynastryTheme[]> = {
    1:  ['identity_visibility', 'attraction_chemistry'],
    2:  ['ease_support'],
    3:  ['communication'],
    4:  ['emotional_bond', 'family_roots', 'karmic_development'],
    5:  ['attraction_chemistry', 'creative_play'],
    6:  ['commitment_stability'],
    7:  ['attraction_chemistry', 'commitment_stability', 'identity_visibility'],
    8:  ['growth_shadow', 'attraction_chemistry', 'karmic_development'],
    9:  ['ease_support'],
    10: ['identity_visibility', 'commitment_stability'],
    11: ['ease_support'],
    12: ['spiritual_unconscious', 'growth_shadow', 'karmic_development'],
  };

  for (const t of (houseMap[house] ?? [])) themes.add(t);

  // Planet-level adjustments
  if (planet === 'moon') { themes.add('emotional_bond'); }
  if (planet === 'saturn') { themes.add('commitment_stability'); }
  if (planet === 'pluto') { themes.add('growth_shadow'); }
  if (planet === 'neptune') { themes.add('spiritual_unconscious'); }
  if (planet === 'venus' || planet === 'mars') { themes.add('attraction_chemistry'); }
  if (planet === 'trueNode') { themes.add('karmic_development'); }
  if (planet === 'jupiter') { themes.add('ease_support'); }
  if (planet === 'chiron') { themes.add('growth_shadow'); }

  // Saturn in emotional houses → family roots
  if (planet === 'saturn' && [4, 8, 12].includes(house)) {
    themes.add('family_roots');
  }
  // Moon in 12th → spiritual
  if (planet === 'moon' && house === 12) {
    themes.add('spiritual_unconscious');
  }

  const priority: SynastryTheme[] = [
    'emotional_bond', 'attraction_chemistry', 'commitment_stability',
    'growth_shadow', 'ease_support', 'karmic_development',
    'identity_visibility', 'creative_play', 'family_roots',
    'spiritual_unconscious', 'communication', 'conflict_activation',
  ];
  return priority.filter(t => themes.has(t)).slice(0, 3);
}

// ── Label builder ─────────────────────────────────────────────────────────────

const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', chiron: 'Chiron', asc: 'ASC', mc: 'MC',
};

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function buildLabel(planetOwner: 'A' | 'B', planet: BodyId, house: number): string {
  const who = planetOwner === 'A' ? 'Person A' : 'Person B';
  const other = planetOwner === 'A' ? 'Person B' : 'Person A';
  return `${who}'s ${BODY_LABEL[planet] ?? planet} in ${other}'s ${ordinal(house)} house`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeSynastryOverlays(
  chartA: NatalChart,
  chartB: NatalChart,
): SynastryHouseOverlay[] {
  const overlays: SynastryHouseOverlay[] = [];
  const cuspA = chartA.western.houses?.cusps;
  const cuspB = chartB.western.houses?.cusps;
  if (!cuspA || !cuspB) return overlays;

  const directions: Array<{ owner: 'A' | 'B'; chart: NatalChart; otherCusps: number[] }> = [
    { owner: 'A', chart: chartA, otherCusps: cuspB },
    { owner: 'B', chart: chartB, otherCusps: cuspA },
  ];

  for (const { owner, chart, otherCusps } of directions) {
    for (const bodyId of SYNASTRY_BODIES) {
      const body = chart.western.bodies[bodyId];
      if (!body) continue;

      const house = houseFromLongitude(body.longitude, otherCusps);
      const planetW = OVERLAY_PLANET_WEIGHT[bodyId] ?? 0.4;
      const houseW  = HOUSE_WEIGHTS[house] ?? 0.5;
      const salienceScore = Math.min(Math.round(planetW * houseW * 100), 100);
      const salienceLevel = getSalienceLevel(salienceScore);
      const themes = overlayThemes(bodyId, house);

      overlays.push({
        planetOwner: owner,
        planet:      bodyId,
        planetSign:  body.sign,
        planetLon:   body.longitude,
        house,
        salienceScore,
        salienceLevel,
        themes,
        label: buildLabel(owner, bodyId, house),
      });
    }
  }

  return overlays.sort((a, b) => b.salienceScore - a.salienceScore);
}
