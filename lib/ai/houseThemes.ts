/**
 * houseThemes.ts — Front-facing house translation layer + activation scoring.
 *
 * Keeps the user-visible language (friendly titles) and the activation
 * logic (which houses to surface) decoupled from the AI prompt builders.
 *
 * The scoring system rates each house by how much chart energy concentrates
 * there. Heavily activated houses surface first; quiet houses stay background.
 *
 * Extensibility note: a future questionnaire layer can inject bonus scores
 * for houses the user flags as life-area priorities without touching this file.
 */

import type { NatalChart, BodyId } from '@/lib/astro/types';
import type { ChartAnalysis } from './chartAnalysis';

// ── Front-facing title translation map ───────────────────────────────────────

// What the user sees as the section header — plain, emotionally legible.
export const HOUSE_FRONT_TITLES: Record<number, string> = {
  1:  'How You Enter the World',
  2:  'What Makes You Feel Secure',
  3:  'How You Think & Communicate',
  4:  'Your Emotional Foundation',
  5:  'Where You Come Alive',
  6:  'How You Function Day to Day',
  7:  'How You Bond & Mirror Others',
  8:  'Where You Merge & Transform',
  9:  'What Expands Your World',
  10: 'What You Become Known For',
  11: 'Where You Belong & Contribute',
  12: 'What Lives Beneath the Surface',
};

// The traditional astrological meaning — shown as a subtitle under the title.
export const HOUSE_MEANINGS: Record<number, string> = {
  1:  'identity, body, appearance, first impressions, instinctive self-expression',
  2:  'money, values, self-worth, stability, resources, embodiment',
  3:  'mind, speech, learning, siblings, local environment, writing, perception',
  4:  'home, family, roots, childhood imprinting, private self, emotional base',
  5:  'creativity, romance, play, pleasure, children, performance, self-expression',
  6:  'routines, work habits, health, service, discipline, daily responsibilities',
  7:  'partnership, attraction, commitment, projection, one-on-one relationships',
  8:  'intimacy, shared resources, sexuality, trust, power, fear, shadow, transformation',
  9:  'belief, higher learning, travel, spirituality, philosophy, worldview',
  10: 'career, reputation, visibility, public role, authority, long-term achievement',
  11: 'friendships, community, networks, audience, ideals, social contribution',
  12: 'subconscious patterns, solitude, dreams, spirituality, hidden fears, retreat',
};

// ── Axis translation map ──────────────────────────────────────────────────────

export type HouseAxisInfo = {
  houses: [number, number];
  front: string;
  traditional: string;
};

export const HOUSE_AXES: HouseAxisInfo[] = [
  { houses: [1, 7],  front: 'Self vs Relationship',          traditional: 'identity, autonomy, projection, partnership' },
  { houses: [2, 8],  front: 'Security vs Surrender',         traditional: 'self-worth, money, control, intimacy, shared resources, trust' },
  { houses: [3, 9],  front: 'Mind vs Meaning',               traditional: 'information, communication, learning, belief, philosophy, worldview' },
  { houses: [4, 10], front: 'Private Self vs Public Role',   traditional: 'home, family, emotional roots, career, reputation, visibility' },
  { houses: [5, 11], front: 'Personal Joy vs Collective Belonging', traditional: 'creativity, romance, play, audience, community, contribution' },
  { houses: [6, 12], front: 'Daily Life vs Inner Life',      traditional: 'routines, health, service, solitude, spirituality, subconscious patterns' },
];

// ── House activation scoring ──────────────────────────────────────────────────

export type ScoredHouse = {
  house: number;
  score: number;
  frontTitle: string;
  anchor: string;        // "5th House — creativity, romance, play…"
  reasons: string[];
};

// Planets that add weight to a house even without being Sun/Moon/chart ruler
const WEIGHT_PLANETS: BodyId[] = ['saturn', 'pluto', 'uranus', 'neptune', 'trueNode', 'southNode'];

/**
 * Scores each house by how much chart energy concentrates there.
 * Returns all 12 houses sorted descending by score.
 *
 * Scoring factors (from the spec):
 * +3  Sun, Moon, chart ruler, or MC ruler in the house
 * +4  stellium in the house (3+ planets, from analysis)
 * +1  angular house (1, 4, 7, 10) baseline bonus
 * +1  Saturn, Pluto, Uranus, Neptune, or Nodes in the house
 * +0.5 each additional planet beyond the first
 * +0.8 each tight aspect (orb < 3°) involving a planet in the house
 */
export function scoreHouseActivation(chart: NatalChart, analysis: ChartAnalysis): ScoredHouse[] {
  const bodies = chart.western.bodies;

  const scores: ScoredHouse[] = Array.from({ length: 12 }, (_, i) => ({
    house:      i + 1,
    score:      0,
    frontTitle: HOUSE_FRONT_TITLES[i + 1],
    anchor:     `${ordLabel(i + 1)} House — ${HOUSE_MEANINGS[i + 1]}`,
    reasons:    [],
  }));

  function add(house: number, pts: number, reason: string) {
    if (house < 1 || house > 12) return;
    scores[house - 1].score   += pts;
    scores[house - 1].reasons.push(reason);
  }

  // Luminaries and chart ruler — highest weight
  if (bodies.sun?.house)  add(bodies.sun.house,  3, 'Sun here');
  if (bodies.moon?.house) add(bodies.moon.house, 3, 'Moon here');
  if (analysis.chartRuler?.house) {
    add(analysis.chartRuler.house, 3, `Chart ruler (${analysis.chartRuler.label}) here`);
  }

  // Stelliums detected by the analysis engine
  for (const s of analysis.stelliums) {
    if (s.type === 'house') {
      const m = s.label.match(/House (\d+)/);
      if (m) add(parseInt(m[1]), 4, `Stellium: ${s.planets.join(', ')}`);
    }
  }

  // Angular house baseline bonus
  for (const h of [1, 4, 7, 10]) add(h, 1, 'Angular house');

  // Outer planets and nodes
  for (const id of WEIGHT_PLANETS) {
    const b = bodies[id as keyof typeof bodies];
    if (b?.house) add(b.house, 1, `${id} here`);
  }

  // Multiple planets in the same house (+0.5 per additional planet)
  const houseCounts: Record<number, number> = {};
  for (const [id, b] of Object.entries(bodies) as [BodyId, typeof bodies[BodyId]][]) {
    if (!b || id === 'asc' || id === 'mc') continue;
    houseCounts[b.house] = (houseCounts[b.house] ?? 0) + 1;
  }
  for (const [h, count] of Object.entries(houseCounts)) {
    if (count > 1) add(parseInt(h), (count - 1) * 0.5, `${count} planets total`);
  }

  // Tight aspects (orb < 3°) through a planet in that house
  for (const asp of chart.western.aspects) {
    if (asp.orb > 3) continue;
    const bA = bodies[asp.a as keyof typeof bodies];
    const bB = bodies[asp.b as keyof typeof bodies];
    if (bA?.house) add(bA.house, 0.8, `tight ${asp.kind} (${asp.a})`);
    if (bB?.house) add(bB.house, 0.8, `tight ${asp.kind} (${asp.b})`);
  }

  return scores.sort((a, b) => b.score - a.score);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ordLabel(n: number): string {
  if (n === 11 || n === 12) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}
