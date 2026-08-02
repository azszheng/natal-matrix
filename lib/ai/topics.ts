/**
 * topics.ts — Client-safe topic-based interpretation layer.
 *
 * Pure synchronous computation over NatalChart data. No sweph imports.
 * Scores each of the 14 life-area topics from actual chart indicators
 * (houses, rulers, aspects, dignity, stelliums, nodes) and builds
 * topic-specific AI prompts grounded only in supported factors.
 *
 * Vedic factors are layered in as a secondary, corroborating signal —
 * same house numbers (Western and Vedic houses carry the same life-area
 * significations; only the cusping math differs), scored at reduced
 * weight, and kept in a separate anchor list so a topic with no genuine
 * Vedic support (no relevant yoga, no notably strong/placed house lord)
 * simply gets none. Nothing is invented to force a Vedic angle.
 */

import type { NatalChart, BodyId, SignId } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import type { InterpretSection } from './prompts';
import { analyzeVedicChart, type VedicAnalysis } from './vedicAnalysis';

// ── Public types ──────────────────────────────────────────────────────────────

export type TopicId =
  | 'self-identity' | 'emotional-needs' | 'love-partnership'
  | 'marriage-patterns' | 'career-public' | 'family-roots'
  | 'money-security' | 'creativity-joy' | 'sexuality-intimacy'
  | 'mind-communication' | 'spirituality' | 'shadow-growth'
  | 'health-work' | 'belonging-community';

export type RelevanceLabel =
  | 'Major chart theme' | 'Strong influence' | 'Moderate influence'
  | 'Subtle influence' | 'Not heavily emphasized';

export type ScoredTopic = {
  id: TopicId;
  title: string;
  subtitle: string;
  relevanceScore: number;
  relevanceLabel: RelevanceLabel;
  chartAnchors: string[];    // up to 5 Western indicators for display
  vedicAnchors: string[];    // up to 4 corroborating Vedic indicators, if any
};

// ── Internal definitions ──────────────────────────────────────────────────────

type TopicDef = {
  id: TopicId;
  title: string;
  subtitle: string;
  houses: number[];
  keyPlanets: BodyId[];
  supportingSigns: SignId[];
  includeNodes: boolean;
};

const TOPICS: TopicDef[] = [
  {
    id: 'self-identity',
    title: 'Self & Identity',
    subtitle: '1st house · Sun · ASC · chart ruler · Aries · Leo',
    houses: [1],
    keyPlanets: ['sun', 'asc', 'mars'],
    supportingSigns: ['aries', 'leo'],
    includeNodes: false,
  },
  {
    id: 'emotional-needs',
    title: 'Emotional Needs',
    subtitle: '4th house · Moon · IC · Cancer · Pisces',
    houses: [4],
    keyPlanets: ['moon'],
    supportingSigns: ['cancer', 'pisces', 'taurus'],
    includeNodes: false,
  },
  {
    id: 'love-partnership',
    title: 'Love & Partnership',
    subtitle: '7th house · 5th house · Venus · Juno · Libra · Taurus',
    houses: [7, 5],
    keyPlanets: ['venus', 'juno', 'mars'],
    supportingSigns: ['libra', 'taurus', 'leo'],
    includeNodes: false,
  },
  {
    id: 'marriage-patterns',
    title: 'Marriage Patterns',
    subtitle: '7th house · 8th house · Juno · Saturn · Venus',
    houses: [7, 8],
    keyPlanets: ['juno', 'venus', 'saturn'],
    supportingSigns: ['libra', 'capricorn', 'scorpio'],
    includeNodes: false,
  },
  {
    id: 'career-public',
    title: 'Career & Public Role',
    subtitle: '10th house · MC · Saturn · 6th house · Capricorn',
    houses: [10, 6],
    keyPlanets: ['saturn', 'sun', 'mc'],
    supportingSigns: ['capricorn', 'leo', 'aquarius'],
    includeNodes: false,
  },
  {
    id: 'family-roots',
    title: 'Family & Roots',
    subtitle: '4th house · Moon · IC · 3rd house · Cancer',
    houses: [4, 3],
    keyPlanets: ['moon', 'saturn'],
    supportingSigns: ['cancer', 'capricorn'],
    includeNodes: false,
  },
  {
    id: 'money-security',
    title: 'Money & Security',
    subtitle: '2nd house · 8th house · Venus · Jupiter · Taurus',
    houses: [2, 8],
    keyPlanets: ['venus', 'jupiter', 'saturn'],
    supportingSigns: ['taurus', 'capricorn', 'scorpio'],
    includeNodes: false,
  },
  {
    id: 'creativity-joy',
    title: 'Creativity & Joy',
    subtitle: '5th house · Sun · Venus · Jupiter · Leo',
    houses: [5],
    keyPlanets: ['sun', 'venus', 'jupiter'],
    supportingSigns: ['leo', 'libra', 'sagittarius', 'aries'],
    includeNodes: false,
  },
  {
    id: 'sexuality-intimacy',
    title: 'Sexuality & Intimacy',
    subtitle: '8th house · Mars · Pluto · Venus · Scorpio',
    houses: [8],
    keyPlanets: ['mars', 'pluto', 'venus'],
    supportingSigns: ['scorpio', 'aries'],
    includeNodes: false,
  },
  {
    id: 'mind-communication',
    title: 'Mind & Communication',
    subtitle: '3rd house · Mercury · Uranus · Gemini · Virgo',
    houses: [3],
    keyPlanets: ['mercury', 'uranus'],
    supportingSigns: ['gemini', 'virgo', 'aquarius'],
    includeNodes: false,
  },
  {
    id: 'spirituality',
    title: 'Spirituality & Inner Life',
    subtitle: '9th house · 12th house · Jupiter · Neptune · North Node',
    houses: [9, 12],
    keyPlanets: ['jupiter', 'neptune', 'trueNode'],
    supportingSigns: ['sagittarius', 'pisces'],
    includeNodes: true,
  },
  {
    id: 'shadow-growth',
    title: 'Shadow & Growth',
    subtitle: '8th house · 12th house · Pluto · Chiron · South Node',
    houses: [8, 12],
    keyPlanets: ['pluto', 'chiron', 'southNode', 'saturn'],
    supportingSigns: ['scorpio', 'capricorn', 'pisces'],
    includeNodes: true,
  },
  {
    id: 'health-work',
    title: 'Health, Work & Daily Rhythm',
    subtitle: '6th house · Mercury · Saturn · Mars · Virgo',
    houses: [6],
    keyPlanets: ['mercury', 'saturn', 'mars'],
    supportingSigns: ['virgo', 'capricorn'],
    includeNodes: false,
  },
  {
    id: 'belonging-community',
    title: 'Belonging & Community',
    subtitle: '11th house · Saturn · Uranus · Jupiter · Aquarius',
    houses: [11],
    keyPlanets: ['saturn', 'uranus', 'jupiter'],
    supportingSigns: ['aquarius', 'sagittarius'],
    includeNodes: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const ANGULAR   = new Set([1, 4, 7, 10]);
const SUCCEDENT = new Set([2, 5, 8, 11]);

const TRAD_RULER: Record<SignId, BodyId> = {
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
};

const PLANET_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', southNode: 'South Node',
  chiron: 'Chiron', juno: 'Juno', asc: 'ASC', mc: 'MC',
};

const PLANET_W: Partial<Record<BodyId, number>> = {
  sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2,
  jupiter: 1.5, saturn: 1.5, uranus: 1, neptune: 1, pluto: 1,
  trueNode: 1, southNode: 1, chiron: 1, juno: 0.5,
};

// Bodies for which we do NOT score "in-house" (angles are always in their house)
const SKIP_HOUSE_SCORE = new Set<BodyId>(['asc', 'mc', 'partOfFortune', 'vertex']);

const SCORE_BODIES: BodyId[] = [
  'sun','moon','mercury','venus','mars','jupiter','saturn',
  'uranus','neptune','pluto','trueNode','chiron',
];

// Classical Vedic grahas only — Uranus/Neptune/Pluto/Chiron have no
// traditional dignity/yoga rules and are excluded from Vedic scoring.
const VEDIC_SCORE_BODIES: BodyId[] = [
  'sun','moon','mercury','venus','mars','jupiter','saturn','trueNode','southNode',
];

const VEDIC_STRONG_DIGNITY = new Set(['exaltation', 'moolatrikona', 'own']);
const VEDIC_STRONG_HOUSE   = new Set(['kendra', 'trikona', 'both']);
const YOGA_STRENGTH_W: Record<string, number> = { strong: 2, moderate: 1.2, weak: 0.6 };

function lbl(id: BodyId): string  { return PLANET_LABEL[id] ?? id; }
function cap(s: string): string   { return s.charAt(0).toUpperCase() + s.slice(1); }

function signFromLon(lon: number): SignId {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

function ordinal(n: number): string {
  if (n === 11 || n === 12) return `${n}th`;
  const d = n % 10;
  if (d === 1) return `${n}st`;
  if (d === 2) return `${n}nd`;
  if (d === 3) return `${n}rd`;
  return `${n}th`;
}

// ── Stellium detection ────────────────────────────────────────────────────────

function detectStelliums(chart: NatalChart): Map<number, BodyId[]> {
  const byHouse = new Map<number, BodyId[]>();
  for (const id of SCORE_BODIES) {
    const b = chart.western.bodies[id];
    if (!b) continue;
    if (!byHouse.has(b.house)) byHouse.set(b.house, []);
    byHouse.get(b.house)!.push(id);
  }
  const out = new Map<number, BodyId[]>();
  for (const [h, ids] of byHouse) {
    if (ids.length >= 3) out.set(h, ids);
  }
  return out;
}

// ── Core scoring ──────────────────────────────────────────────────────────────

function computeScore(
  chart: NatalChart,
  def: TopicDef,
  stelliums: Map<number, BodyId[]>,
  vedic: VedicAnalysis,
): { score: number; anchors: string[]; vedicAnchors: string[] } {
  let score = 0;
  const anchors: string[] = [];
  const vedicAnchors: string[] = [];
  const seenA  = new Set<string>();
  const seenVA = new Set<string>();

  const bodies    = chart.western.bodies;
  const dignities = chart.western.dignities;
  const aspects   = chart.western.aspects;
  const cusps     = chart.western.houses.cusps;
  const vBodies   = chart.vedic.bodies;

  function addA(s: string) {
    if (!seenA.has(s) && anchors.length < 5) { seenA.add(s); anchors.push(s); }
  }
  function addVA(s: string) {
    if (!seenVA.has(s) && vedicAnchors.length < 4) { seenVA.add(s); vedicAnchors.push(s); }
  }

  // 1. Planets in primary houses
  for (const [idStr, body] of Object.entries(bodies) as [BodyId, typeof bodies[BodyId]][]) {
    const id = idStr as BodyId;
    if (!body || SKIP_HOUSE_SCORE.has(id)) continue;
    if (!def.houses.includes(body.house)) continue;
    const w = (PLANET_W[id] ?? 0.3) + (ANGULAR.has(body.house) ? 0.5 : 0);
    score += w;
    addA(`${lbl(id)} in the ${ordinal(body.house)} house`);
  }

  // 2. Stelliums in primary houses
  for (const h of def.houses) {
    const stl = stelliums.get(h);
    if (stl) {
      score += 4;
      addA(`Stellium in ${ordinal(h)} house: ${stl.map(lbl).join(', ')}`);
    }
  }

  // 3. Nodes in primary houses (topic-conditional)
  if (def.includeNodes) {
    const nn = bodies['trueNode'];
    const sn = bodies['southNode'];
    if (nn && def.houses.includes(nn.house)) { score += 2;   addA(`North Node in ${ordinal(nn.house)} house`); }
    if (sn && def.houses.includes(sn.house)) { score += 1.5; addA(`South Node in ${ordinal(sn.house)} house`); }
  }

  // 4. Key planet: dignity and angularity
  for (const pid of def.keyPlanets) {
    const b = bodies[pid];
    if (!b) continue;
    const dig = dignities[pid]?.label;
    if (dig === 'domicile')   { score += 2;   addA(`${lbl(pid)} in domicile (${cap(b.sign)})`); }
    else if (dig === 'exaltation') { score += 1.5; addA(`${lbl(pid)} exalted in ${cap(b.sign)}`); }
    if (ANGULAR.has(b.house) && !def.houses.includes(b.house)) {
      score += 1;
      addA(`${lbl(pid)} angular in ${ordinal(b.house)} house`);
    }
  }

  // 5. Tight aspects involving key planets
  for (const asp of aspects) {
    if (asp.orb > 6) continue;
    const aIsKey = def.keyPlanets.includes(asp.a as BodyId);
    const bIsKey = def.keyPlanets.includes(asp.b as BodyId);
    if (!aIsKey && !bIsKey) continue;
    score += asp.orb <= 2 ? 2 : 1;
    if (asp.orb <= 3.5) {
      addA(`${lbl(asp.a as BodyId)}-${lbl(asp.b as BodyId)} ${asp.kind} (${asp.orb.toFixed(1)}°)`);
    }
  }

  // 6. House ruler of each primary house
  for (const h of def.houses) {
    const cuspLon = cusps[h - 1];
    if (cuspLon === undefined) continue;
    const cuspSign  = signFromLon(cuspLon);
    const rulerId   = TRAD_RULER[cuspSign];
    const ruler     = bodies[rulerId];
    if (!ruler) continue;
    if (ANGULAR.has(ruler.house)) {
      score += 2;
      addA(`${ordinal(h)} house ruler (${lbl(rulerId)}) in ${ordinal(ruler.house)} (angular)`);
    } else if (SUCCEDENT.has(ruler.house)) {
      score += 1;
    }
  }

  // 7. Chart ruler in one of the primary houses
  const ascSign = bodies['asc']?.sign;
  if (ascSign) {
    const chartRulerId = TRAD_RULER[ascSign];
    const chartRuler   = bodies[chartRulerId];
    if (chartRuler && def.houses.includes(chartRuler.house)) {
      score += 2;
      addA(`Chart ruler (${lbl(chartRulerId)}) in ${ordinal(chartRuler.house)} house`);
    }
  }

  // 8. Sign emphasis (each planet in a supporting sign adds a small flat weight)
  for (const [idStr, body] of Object.entries(bodies) as [BodyId, typeof bodies[BodyId]][]) {
    if (!body || SKIP_HOUSE_SCORE.has(idStr as BodyId)) continue;
    if (def.supportingSigns.includes(body.sign)) score += 0.4;
  }

  // 9. Vedic — classical grahas in the same primary houses (whole sign).
  // Weighted at half of the Western equivalent: a corroborating signal,
  // not a second vote. House numbers carry the same life-area meaning in
  // both systems, only the cusping math differs — sidereal placement can
  // land a planet here even when its Western counterpart didn't.
  for (const id of VEDIC_SCORE_BODIES) {
    const vb = vBodies[id];
    if (!vb || !def.houses.includes(vb.house)) continue;
    const w = ((PLANET_W[id] ?? 0.3) / 2);
    score += w;
    addVA(`Vedic: ${lbl(id)} in H${vb.house} (${cap(vb.sign)})`);
  }

  // 10. Vedic — house lord of each primary house: strength and placement.
  for (const h of def.houses) {
    const hl = vedic.houseLords[h];
    if (!hl) continue;
    if (hl.lordDignity && VEDIC_STRONG_DIGNITY.has(hl.lordDignity)) {
      score += 1.5;
      addVA(`Vedic: H${h} lord (${lbl(hl.lord)}) ${hl.lordDignity} in ${hl.lordSign ? cap(hl.lordSign) : ''}`.trim());
    }
    if (VEDIC_STRONG_HOUSE.has(hl.lordHouseGroup)) {
      score += 1.5;
      addVA(`Vedic: H${h} lord (${lbl(hl.lord)}) placed in H${hl.lordHouse} (${hl.lordHouseGroup})`);
    }
  }

  // 11. Vedic — yogas whose affected houses overlap this topic's houses.
  for (const yoga of vedic.yogas) {
    if (!yoga.affectedHouses.some(h => def.houses.includes(h))) continue;
    score += YOGA_STRENGTH_W[yoga.strength] ?? 0.6;
    addVA(`Vedic yoga: ${yoga.name} (${yoga.strength})`);
  }

  return { score: Math.round(score * 10) / 10, anchors, vedicAnchors };
}

// ── Relevance label ───────────────────────────────────────────────────────────

function scoreToLabel(score: number): RelevanceLabel {
  if (score >= 14) return 'Major chart theme';
  if (score >= 9)  return 'Strong influence';
  if (score >= 5)  return 'Moderate influence';
  if (score >= 2)  return 'Subtle influence';
  return 'Not heavily emphasized';
}

// ── AI prompt builder ─────────────────────────────────────────────────────────

function buildTopicPrompt(def: TopicDef, anchors: string[], vedicAnchors: string[], label: RelevanceLabel): string {
  const weak = label === 'Subtle influence' || label === 'Not heavily emphasized';
  const anchorBlock = anchors.length > 0
    ? anchors.map(a => `• ${a}`).join('\n')
    : '• No dominant indicators identified for this topic';

  const weakNote = weak
    ? `\nIMPORTANT FRAMING: This is not one of the loudest areas of this chart. Open the interpretation by acknowledging this honestly — something like "This is not one of the louder areas of your chart, but what IS present suggests..." Do not overstate what the chart supports.\n`
    : '';

  const vedicBlock = vedicAnchors.length > 0
    ? `\nVEDIC (SIDEREAL) CHART INDICATORS FOR THIS TOPIC:\n${vedicAnchors.map(a => `• ${a}`).join('\n')}\n`
    : '';

  const vedicNote = vedicAnchors.length > 0
    ? `\nVEDIC USE: The Vedic indicators above are real, chart-derived corroboration from the sidereal system — not decoration. Weave in the one or two most telling ones naturally, inside the sections below, wherever they sharpen or add a genuine nuance to what the Western indicators already show. Do not give Vedic astrology its own separate paragraph, and do not force all of it in — use only what earns its place. If a Vedic and Western indicator point the same direction, that convergence is worth naming plainly.`
    : `\nVEDIC USE: No Vedic indicators were found for this topic — do not mention Vedic/sidereal astrology, nakshatras, or house lords anywhere in this interpretation.`;

  return `Interpret this person's ${def.title} through their natal chart.

RELEVANCE: ${label}

CHART INDICATORS FOR THIS TOPIC:
${anchorBlock}
${vedicBlock}
TRADITIONAL ASTROLOGY SCOPE: ${def.subtitle}
${weakNote}${vedicNote}

Write a rich psychological interpretation of ${def.title} for this person, grounded only in the indicators listed above. Every paragraph must trace back to a specific chart factor — no generic sign or house descriptions.

Cover in flowing prose (no headers, no bullet points, no section labels):
1. What this looks like for THIS person specifically — what these particular indicators create together, not the sign or house in the abstract
2. How this shows up in real life — specific behavioral patterns, relational dynamics, internal experiences (use "In practice..." or "You may notice this when...")
3. Shadow/protective expression — how this pattern appears under stress, in early self-protection, or when unconscious (use "In its protective form..." or "Under stress, this tends to...")
4. Integrated/mature expression — the conscious, evolved version (use "As this matures..." or "When integrated...")
5. Chart basis — in 2-3 sentences, name which specific factors most define this topic for them and why they matter together

Close with a single, genuine open question the person can sit with — something that emerges from what was actually found in their chart, not a generic reflection prompt.`.trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeTopics(chart: NatalChart): ScoredTopic[] {
  const stelliums = detectStelliums(chart);
  const vedic = analyzeVedicChart(chart);

  return TOPICS
    .map(def => {
      const { score, anchors, vedicAnchors } = computeScore(chart, def, stelliums, vedic);
      const relevanceLabel = scoreToLabel(score);
      return {
        id: def.id,
        title: def.title,
        subtitle: def.subtitle,
        relevanceScore: score,
        relevanceLabel,
        chartAnchors: anchors,
        vedicAnchors,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function topicToSection(topic: ScoredTopic, chart: NatalChart): InterpretSection {
  const def = TOPICS.find(d => d.id === topic.id)!;
  const stelliums = detectStelliums(chart);
  const vedic = analyzeVedicChart(chart);
  const { anchors, vedicAnchors } = computeScore(chart, def, stelliums, vedic);
  const prompt = buildTopicPrompt(def, anchors, vedicAnchors, topic.relevanceLabel);

  return {
    type: 'topic',
    label: topic.title,
    prompt,
    frontTitle: topic.title,
    anchor: `${topic.relevanceLabel} · ${topic.subtitle}`,
  };
}
