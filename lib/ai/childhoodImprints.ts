/**
 * childhoodImprints.ts — v2
 *
 * Mechanism-based childhood imprint scoring.
 * 8 distinct themes with evidence anchoring, deduplication, and a max 3-card cap.
 * Tropical and Vedic evidence tracked separately throughout.
 *
 * Safety contract:
 *  – Raw scores are internal and never exposed in UI.
 *  – Strength labels ("Noticeable imprint" etc.) replace scores in all output.
 *  – No theme claims events occurred. All language is symbolic and possibility-based.
 *  – A single placement cannot produce Strong or Defining strength alone.
 *  – Parentification requires explicit duty/service evidence (6th/10th involvement).
 *  – Lineage requires explicit lineage evidence (South Node, 4th ruler in 8th/12th).
 */

import type { NatalChart, BodyId, SignId, AspectKind, Aspect } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ImprStrength =
  | 'Subtle imprint'
  | 'Noticeable imprint'
  | 'Strong imprint'
  | 'Defining imprint';

export type ThemeId =
  | 'emotional-containment'
  | 'emotional-absorption'
  | 'crisis-power-secrets'
  | 'instability-unpredictability'
  | 'parentification'
  | 'voice-truth-silencing'
  | 'shame-authority'
  | 'lineage-ancestral';

export type EvidenceHit = {
  text: string;
  system: 'tropical' | 'vedic';
  weight: number;
};

export type ScoredTheme = {
  id: ThemeId;
  adultTitle: string;
  minorTitle: string;
  coreFeeling: string;
  adultSummary: string;
  minorSummary: string;
  protectiveAdaptation: string;
  integratedGift: string;
  reflectionPrompt: string;
  archetypes: string[];
  minorSupportResponse: string;
  antiProjection: string;
  keywords: string[];
  // Dynamic (from scoring)
  strength: ImprStrength;
  score: number;
  tropicalIndicators: string[];
  vedicIndicators: string[];
  hasVedicEvidence: boolean;
  systemNote: 'tropical-only' | 'tropical-and-vedic';
  tier: 'primary' | 'secondary' | 'background';
};

export type ChildhoodSnapshot = {
  primaryImprint: string;
  secondaryImprint: string | null;
  familyRole: string;
  lineageThread: string | null;
  coreUnmetNeed: string;
  protectiveAdaptation: string;
  integratedGift: string;
};

export type ChildhoodScoringResult = {
  primary: ScoredTheme | null;
  secondary: ScoredTheme[];
  background: ScoredTheme[];
  snapshot: ChildhoodSnapshot | null;
  hasVedicData: boolean;
  vedicNote: string;
  overallSystemNote: 'tropical-only' | 'tropical-and-vedic';
};

// ── Static theme definitions ──────────────────────────────────────────────────

type ThemeDef = Omit<
  ScoredTheme,
  'strength' | 'score' | 'tropicalIndicators' | 'vedicIndicators' | 'hasVedicEvidence' | 'systemNote' | 'tier'
>;

const THEME_DEFS: Record<ThemeId, ThemeDef> = {
  'emotional-containment': {
    id: 'emotional-containment',
    adultTitle: 'Emotional Containment',
    minorTitle: 'Needs Permission to Have Feelings',
    coreFeeling: 'I had to hold it together.',
    adultSummary: 'Saturn\'s relationship to your Moon and 4th house points toward an early pattern of emotional restraint — a family atmosphere where managing feelings carefully, delaying personal needs, or becoming composed and reliable felt necessary or expected. This is less about chaos and more about learning to carry weight quietly.',
    minorSummary: 'This child may hold their feelings back, manage emotions carefully, or seem mature beyond their years. They may need explicit permission to feel without consequence — to be messy, uncertain, or needing, without that feeling like a problem.',
    protectiveAdaptation: 'Developing emotional steadiness, self-sufficiency, and the ability to endure without visible distress.',
    integratedGift: 'Genuine emotional resilience, the capacity for long-term commitment, and the ability to hold steady without being swept away.',
    reflectionPrompt: 'When did you first learn that managing your emotions was more important than having them — and what would it feel like to let someone else hold that weight for a moment?',
    archetypes: ['The Stabilizer', 'The Caretaker'],
    minorSupportResponse: 'Name emotions aloud without requiring the child to manage them. Let them see you feel difficult feelings and recover. Make it safe to be uncertain, sad, or afraid without it being a problem to fix.',
    antiProjection: 'Emotional steadiness is a gift, not necessarily evidence of suppression. Use this as a prompt to ensure feelings are welcome — not to diagnose what has been withheld.',
    keywords: ['restraint', 'duty', 'emotional maturity', 'heaviness', 'self-control', 'delayed needs', 'composure'],
  },

  'emotional-absorption': {
    id: 'emotional-absorption',
    adultTitle: 'Emotional Absorption & Porosity',
    minorTitle: 'Needs Emotional Clarity and Gentle Boundaries',
    coreFeeling: 'I absorbed what no one said.',
    adultSummary: 'Neptune\'s presence in your 4th house or in aspect to the Moon points toward an early atmosphere of emotional permeability — a home environment where the unsaid carried more weight than what was spoken, where feelings diffused without clear ownership, and where it was difficult to know which emotional weather belonged to you and which you had absorbed from those around you.',
    minorSummary: 'This child may be deeply attuned to emotional undercurrents and the feelings of others, sometimes absorbing the room\'s atmosphere before understanding their own. They benefit from adults who name feelings clearly, hold their own emotional weight, and help the child identify what is theirs.',
    protectiveAdaptation: 'Retreating into imagination and inner life; becoming fluent in what others need while remaining unclear about one\'s own; developing a rich private world as a substitute for clear outer belonging.',
    integratedGift: 'Empathy of extraordinary depth, creative imagination, and the capacity to be genuinely present with another person\'s inner world without requiring it to be explained.',
    reflectionPrompt: 'When you absorb someone else\'s distress, can you locate the boundary between their feeling and your response — and what does it feel like when that boundary holds?',
    archetypes: ['The Invisible Child', 'The Peacemaker'],
    minorSupportResponse: 'Name your own feelings clearly in front of them, and name theirs. Help them distinguish: "That feeling belongs to me, not to you." Model gentle limits. Make it safe to say "I don\'t know what I feel right now."',
    antiProjection: 'High empathy and attunement are gifts, not damage. This is a prompt to provide emotional clarity — not to assume confusion has already caused harm.',
    keywords: ['absorption', 'porousness', 'emotional invisibility', 'hidden grief', 'private inner world', 'retreat', 'confusion about self vs. others'],
  },

  'crisis-power-secrets': {
    id: 'crisis-power-secrets',
    adultTitle: 'Crisis, Power & Secrets',
    minorTitle: 'Needs Honesty, Safety, and Simple Explanations',
    coreFeeling: 'I had to understand what was hidden.',
    adultSummary: 'Pluto\'s pressure on your Moon, Sun, or personal planets — or its presence in family-oriented houses — points toward an early environment where power dynamics, secrecy, or psychological intensity created a need for perceptiveness. You may have become adept at reading beneath the surface, locating what was not being said, or bracing for what might suddenly change.',
    minorSummary: 'This child may be unusually perceptive and may pick up on things adults believe they\'re hiding. They do best with age-appropriate honesty, calm explanations of difficult topics, and adults who avoid using them as emotional proxies or confidants.',
    protectiveAdaptation: 'Developing exceptional perceptiveness and environmental scanning; learning to manage intensity internally; becoming skilled at detecting power dynamics before others notice them.',
    integratedGift: 'Psychological acuity, the capacity to hold complexity without flinching, and the ability to perceive what others miss — skills that become genuine strengths when no longer needed for survival.',
    reflectionPrompt: 'Where do you still scan for threats that may no longer exist, and what would it feel like to let your guard rest for an hour?',
    archetypes: ['The Truth-Detector', 'The Protector'],
    minorSupportResponse: 'Offer simple, honest explanations rather than managed silence. Avoid drawing them into adult conflicts or emotional alliances. Validate what they perceive: "You\'re right that things feel tense." Then handle it yourself.',
    antiProjection: 'Perceptiveness is not evidence of harm — it may also reflect intellectual depth and sensitivity. Use this as a prompt toward transparency, not a diagnosis of what has been exposed.',
    keywords: ['secrecy', 'hidden truth', 'psychological intensity', 'taboo', 'power dynamics', 'survival perception', 'control', 'family shadow'],
  },

  'instability-unpredictability': {
    id: 'instability-unpredictability',
    adultTitle: 'Instability & Unpredictability',
    minorTitle: 'Needs Consistency and Repair',
    coreFeeling: 'I could not fully relax.',
    adultSummary: 'Uranus or Mars in strong relationship to your 4th house, Moon, or IC points toward an early domestic atmosphere with an unpredictable or volatile quality — an environment where it was difficult to settle fully because conditions shifted, emotional weather arrived without warning, or the ground felt uncertain beneath ordinary circumstances.',
    minorSummary: 'This child may be especially sensitive to shifts in atmosphere, raised voices, or disruptions to routine. Predictability and visible repair after conflict — "we disagreed and we\'re still okay" — are particularly nourishing for this child\'s sense of safety.',
    protectiveAdaptation: 'Developing alertness, adaptability, and a nervous-system prepared to respond quickly to change; never fully settling so as never to be caught off guard.',
    integratedGift: 'Exceptional flexibility, the capacity to adapt to sudden change without collapse, and a genuine tolerance for uncertainty when it is chosen rather than imposed.',
    reflectionPrompt: 'Where in your life do you still brace for disruption that isn\'t coming — and what would it feel like to let that readiness rest?',
    archetypes: ['The Protector', 'The Outsider'],
    minorSupportResponse: 'Maintain consistent routines, especially around transitions and meals. Repair conflict visibly: let the child see calm return. When change is unavoidable, explain it ahead of time with simple honesty.',
    antiProjection: 'Sensitivity to atmosphere is a natural human capacity, not evidence of what a child has survived. Use this as a prompt toward consistency, not a record of what has happened.',
    keywords: ['disruption', 'unpredictability', 'rupture', 'emotional inconsistency', 'nervous-system alertness', 'sudden change', 'needing to adapt quickly'],
  },

  'parentification': {
    id: 'parentification',
    adultTitle: 'Parentification & Role Reversal',
    minorTitle: 'Needs Permission to Be a Child',
    coreFeeling: 'I had to be useful, mature, or responsible.',
    adultSummary: 'Saturn\'s connection to your Moon and to the 6th or 10th house — the houses of duty, service, and public role — points toward an early pattern of role reversal or premature responsibility. The caretaking impulse became central before there was enough room to simply need care. Usefulness may have been the primary currency of belonging.',
    minorSummary: 'This child may try to be helpful, good, or easy at the cost of their own needs. They may feel responsible for adult moods or family harmony. They benefit from being explicitly released from the job of managing the atmosphere.',
    protectiveAdaptation: 'Learning to be indispensable; managing others\' emotions as a way of securing belonging; developing competence and reliability as a strategy for staying connected.',
    integratedGift: 'Exceptional reliability, natural leadership from genuine investment, and the capacity for long-term commitment when responsibility is chosen freely rather than assigned early.',
    reflectionPrompt: 'What would you stop doing if being needed stopped feeling like the primary proof you belong?',
    archetypes: ['The Caretaker', 'The Stabilizer'],
    minorSupportResponse: 'Offer age-appropriate responsibility — not emotional caretaking. Say explicitly: "That\'s not yours to worry about." Let them see adults manage their own feelings without needing help. Allow them to be messy, dependent, and young.',
    antiProjection: 'Helpfulness and conscientiousness are virtues. This is a prompt to make sure expectations are genuinely age-appropriate — not evidence of exploitation.',
    keywords: ['caretaker', 'mediator', 'family adult', 'emotional labor', 'usefulness', 'responsibility', 'being praised for maturity', 'difficulty needing care'],
  },

  'voice-truth-silencing': {
    id: 'voice-truth-silencing',
    adultTitle: 'Voice, Truth & Silencing',
    minorTitle: 'Needs to Be Heard Without Shame',
    coreFeeling: 'I knew things I could not safely say.',
    adultSummary: 'Mercury under significant planetary pressure — from Saturn, Pluto, Neptune, or Chiron — can reflect an early environment where expressing perception, asking direct questions, or naming what was happening came with a cost. Speech may have been regulated, truth managed, or the family narrative carefully maintained in ways that made honest communication feel risky.',
    minorSummary: 'This child may hesitate to speak their mind, qualify their observations, or test the adult\'s mood before saying what they really see. They need patient, shame-free listening — not just tolerance for what they say, but genuine interest in what they perceive.',
    protectiveAdaptation: 'Reading the audience before speaking; internal processing before external expression; qualifying observations to manage others\' reactions; becoming an interpreter of what cannot be said directly.',
    integratedGift: 'Precision with language, the capacity to hold complex truths simultaneously, and hard-won psychological insight from years of thinking carefully about what could and couldn\'t be said.',
    reflectionPrompt: 'When you speak, are you saying what you know — or what you believe is safe to say? And do those two things still need to be different?',
    archetypes: ['The Interpreter', 'The Truth-Detector'],
    minorSupportResponse: 'Welcome their observations without correction or defensiveness. Answer their questions honestly and age-appropriately. Never shame them for naming what they see. Their perception is a gift, not a problem.',
    antiProjection: 'A careful, considered child may be reflective by nature, not silenced by circumstance. Use this as a prompt toward open, shame-free communication — not a verdict about what has been suppressed.',
    keywords: ['speech', 'truth', 'silence', 'family secrets', 'being misunderstood', 'fear of saying what is real', 'interpreter', 'translator'],
  },

  'shame-authority': {
    id: 'shame-authority',
    adultTitle: 'Shame, Authority & Conditional Worth',
    minorTitle: 'Needs Encouragement Without Pressure',
    coreFeeling: 'I had to earn approval.',
    adultSummary: 'Saturn\'s hard aspects to your Sun or Venus — or its presence in houses of identity, public standing, or self-expression — can reflect an early environment where worth felt conditional on performance, achievement, or compliance with standards that kept shifting. Approval may have been available but not unconditional. Being praised for what you did may have created uncertainty about whether you were loved for who you were.',
    minorSummary: 'This child may work very hard for approval and feel disproportionately affected by criticism, even when gently offered. They need to hear clearly and often that they are valued for who they are — not only when they succeed, meet expectations, or make things easier.',
    protectiveAdaptation: 'Perfectionism; pre-emptive self-criticism to neutralize others\' criticism; achievement as a strategy for securing belonging; withholding authentic self-expression until success is guaranteed.',
    integratedGift: 'Exceptional discipline, a well-developed ethical seriousness, and the capacity for mastery that comes from having taken the long view — when self-worth is no longer the stake.',
    reflectionPrompt: 'What would you allow yourself to do, or to fail at, if the outcome had no effect on whether you were loved?',
    archetypes: ['The Achiever', 'The Pattern-Breaker'],
    minorSupportResponse: 'Celebrate character, effort, and growth — not only outcomes. Let them see you value them when nothing is being performed. Correct behavior gently and never personhood. Make failure a safe place to land.',
    antiProjection: 'High standards and conscientiousness are not shame — they may also reflect a genuinely achievement-oriented temperament. Use this as a prompt to ensure approval is never withheld as leverage.',
    keywords: ['approval', 'pressure', 'criticism', 'achievement', 'visibility', 'authority', 'conditional love', 'worthiness', 'performance'],
  },

  'lineage-ancestral': {
    id: 'lineage-ancestral',
    adultTitle: 'Lineage & Ancestral Pattern',
    minorTitle: 'Family Patterns to Parent Consciously',
    coreFeeling: 'This did not start with me.',
    adultSummary: 'The South Node, or the 4th ruler\'s placement in the 8th or 12th, points toward psychological material that entered your life not through your own experience alone but through what the family system was already carrying — survival strategies, emotional silences, inherited anxieties, or unspoken histories that shaped the atmosphere before you arrived.',
    minorSummary: 'Your family\'s own history of navigating difficulty, loss, or survival will inevitably shape the atmosphere this child grows into. The invitation is to notice which patterns you are passing forward consciously, and which may be arriving automatically.',
    protectiveAdaptation: 'Unconsciously re-enacting familiar emotional dynamics; carrying unexplained grief, anxiety, or emotional themes that feel old; taking on family roles that were assigned rather than chosen.',
    integratedGift: 'The pattern-breaker capacity: the ability to metabolize inherited material consciously and offer something genuinely different to the next generation — a rare and meaningful form of change.',
    reflectionPrompt: 'Which emotional patterns in your life feel unmistakably yours, and which feel like something that arrived before you had a choice in the matter?',
    archetypes: ['The Pattern-Breaker', 'The Outsider'],
    minorSupportResponse: 'This theme is primarily a reflection for you as a parent or caregiver: what do you want to do differently? Your own emotional history is always present in the room — the question is whether it is present consciously.',
    antiProjection: 'This speaks to inherited patterns available to shift — not a verdict about the child\'s fate, and not an indictment of the family.',
    keywords: ['inherited pattern', 'ancestral silence', 'family survival mentality', 'lineage memory', 'pattern-breaking', 'migration', 'cultural duty'],
  },
};

// ── Utility functions ─────────────────────────────────────────────────────────

const HARD: AspectKind[] = ['conjunction', 'opposition', 'square'];

const TRAD_RULER: Record<SignId, BodyId> = {
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
};

function cuspSign(lon: number): SignId {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

function findAsp(
  aspects: Aspect[],
  a: BodyId, b: BodyId,
  kinds: AspectKind[] = HARD,
  maxOrb = 8,
): Aspect | undefined {
  return aspects.find(asp =>
    ((asp.a === a && asp.b === b) || (asp.a === b && asp.b === a)) &&
    asp.orb <= maxOrb &&
    kinds.includes(asp.kind),
  );
}

function get4thRuler(chart: NatalChart): BodyId {
  return TRAD_RULER[cuspSign(chart.western.houses.cusps[3])];
}

function cap(s: string): string {
  const names: Partial<Record<string, string>> = {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
    pluto: 'Pluto', trueNode: 'N.Node', southNode: 'S.Node', chiron: 'Chiron',
    asc: 'ASC', mc: 'MC',
  };
  return names[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

function aspLabel(asp: Aspect): string {
  return `${cap(asp.a)}–${cap(asp.b)} ${asp.kind} (${asp.orb.toFixed(1)}°)`;
}

function computeStrength(hits: EvidenceHit[]): ImprStrength {
  const tropHits = hits.filter(h => h.system === 'tropical');
  const score = hits.reduce((s, h) => s + h.weight, 0);
  if (tropHits.length === 0) return 'Subtle imprint';
  if (tropHits.length < 2) {
    // Single indicator: cap at Noticeable
    return score <= 2 ? 'Subtle imprint' : 'Noticeable imprint';
  }
  if (score <= 2) return 'Subtle imprint';
  if (score <= 5) return 'Noticeable imprint';
  if (score <= 9) return 'Strong imprint';
  return 'Defining imprint';
}

// ── Per-theme scoring functions ───────────────────────────────────────────────
// Each returns EvidenceHit[]. Empty means theme does not activate.

function scoreEmotionalContainment(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const ruler4 = get4thRuler(chart);
  const hits: EvidenceHit[] = [];

  const moonSat = findAsp(aspects, 'moon', 'saturn');
  if (moonSat) hits.push({ text: aspLabel(moonSat), system: 'tropical', weight: 4 });

  if (bodies.saturn?.house === 4) hits.push({ text: 'Saturn in 4th house', system: 'tropical', weight: 3 });

  const satRuler4 = findAsp(aspects, 'saturn', ruler4);
  if (satRuler4) hits.push({ text: `Saturn–${cap(ruler4)} ${satRuler4.kind} (4th ruler)`, system: 'tropical', weight: 2 });

  if (bodies.moon?.sign === 'capricorn') hits.push({ text: 'Moon in Capricorn', system: 'tropical', weight: 2 });

  const sign4 = cuspSign(chart.western.houses.cusps[3]);
  if (sign4 === 'capricorn' || sign4 === 'cancer') {
    hits.push({ text: `${sign4.charAt(0).toUpperCase() + sign4.slice(1)} on IC`, system: 'tropical', weight: 1 });
  }

  // Vedic
  const vSat = chart.vedic.bodies.saturn;
  if (vSat?.house === 4) hits.push({ text: `Vedic Saturn in 4th house (sidereal ${vSat.sign})`, system: 'vedic', weight: 1 });
  const vMoon = chart.vedic.bodies.moon;
  if (vMoon && vSat && vSat.house === (((vMoon.house + 6) % 12) || 12)) {
    // Saturn 7th from Moon in Vedic whole-sign (opposition)
    hits.push({ text: `Vedic Saturn 7th from Moon (whole-sign)`, system: 'vedic', weight: 1 });
  }

  return hits;
}

function scoreEmotionalAbsorption(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const ruler4 = get4thRuler(chart);
  const hits: EvidenceHit[] = [];

  const moonNep = findAsp(aspects, 'moon', 'neptune');
  if (moonNep) hits.push({ text: aspLabel(moonNep), system: 'tropical', weight: 4 });

  if (bodies.moon?.house === 12) hits.push({ text: 'Moon in 12th house', system: 'tropical', weight: 3 });
  if (bodies.neptune?.house === 4) hits.push({ text: 'Neptune in 4th house', system: 'tropical', weight: 3 });

  const r4house = bodies[ruler4]?.house;
  if (r4house === 12) hits.push({ text: `4th ruler (${cap(ruler4)}) in 12th house`, system: 'tropical', weight: 3 });

  if (bodies.moon?.sign === 'pisces') hits.push({ text: 'Moon in Pisces', system: 'tropical', weight: 2 });
  if (bodies.moon?.house === 8) hits.push({ text: 'Moon in 8th house', system: 'tropical', weight: 2 });

  // Weaker: soft aspects or indirect indicators
  const venNep = findAsp(aspects, 'venus', 'neptune');
  if (venNep) hits.push({ text: aspLabel(venNep), system: 'tropical', weight: 1 });

  // Vedic
  const vMoon = chart.vedic.bodies.moon;
  const vKet = chart.vedic.bodies.southNode;
  if (vMoon?.house === 12) hits.push({ text: `Vedic Moon in 12th house (sidereal)`, system: 'vedic', weight: 1 });
  if (vKet?.house === 4 || vKet?.house === 12) {
    hits.push({ text: `Vedic Ketu in ${vKet.house}th house`, system: 'vedic', weight: 1 });
  }
  if (vMoon) {
    const nak = vMoon.nakshatra;
    const porousNakshatras = ['revati', 'uttaraBhadrapada', 'purvaAshadha', 'shravana', 'rohini', 'ardra'];
    if (porousNakshatras.includes(nak)) {
      hits.push({ text: `Vedic Moon in ${nak} nakshatra (emotional permeability themes)`, system: 'vedic', weight: 1 });
    }
  }

  return hits;
}

function scoreCrisisPowerSecrets(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const hits: EvidenceHit[] = [];

  const moonPlu = findAsp(aspects, 'moon', 'pluto');
  if (moonPlu) hits.push({ text: aspLabel(moonPlu), system: 'tropical', weight: 4 });

  const sunPlu = findAsp(aspects, 'sun', 'pluto');
  if (sunPlu) hits.push({ text: aspLabel(sunPlu), system: 'tropical', weight: 3 });

  const merPlu = findAsp(aspects, 'mercury', 'pluto');
  if (merPlu) hits.push({ text: aspLabel(merPlu), system: 'tropical', weight: 2 });

  const plutH = bodies.pluto?.house;
  if (plutH === 4 || plutH === 8) hits.push({ text: `Pluto in ${plutH}th house`, system: 'tropical', weight: 3 });
  else if (plutH === 12) hits.push({ text: `Pluto in 12th house`, system: 'tropical', weight: 2 });

  if (bodies.moon?.sign === 'scorpio') hits.push({ text: 'Moon in Scorpio', system: 'tropical', weight: 2 });

  const sign4 = cuspSign(chart.western.houses.cusps[3]);
  if (sign4 === 'scorpio') hits.push({ text: 'Scorpio on IC', system: 'tropical', weight: 1 });

  // Vedic
  const vRah = chart.vedic.bodies.trueNode;
  const vMars = chart.vedic.bodies.mars;
  if (vRah?.house === 4 || vRah?.house === 8) {
    hits.push({ text: `Vedic Rahu in ${vRah.house}th house`, system: 'vedic', weight: 1 });
  }
  if (vMars?.house === 4 || vMars?.house === 8) {
    hits.push({ text: `Vedic Mars in ${vMars.house}th house`, system: 'vedic', weight: 1 });
  }

  return hits;
}

function scoreInstabilityUnpredictability(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const ruler4 = get4thRuler(chart);
  const hits: EvidenceHit[] = [];

  if (bodies.uranus?.house === 4) hits.push({ text: 'Uranus in 4th house', system: 'tropical', weight: 4 });
  if (bodies.mars?.house === 4) hits.push({ text: 'Mars in 4th house', system: 'tropical', weight: 3 });

  const moonUra = findAsp(aspects, 'moon', 'uranus');
  if (moonUra) hits.push({ text: aspLabel(moonUra), system: 'tropical', weight: 3 });

  const moonMars = findAsp(aspects, 'moon', 'mars');
  if (moonMars) hits.push({ text: aspLabel(moonMars), system: 'tropical', weight: 3 });

  const uraRuler4 = findAsp(aspects, 'uranus', ruler4);
  if (uraRuler4) hits.push({ text: `Uranus–${cap(ruler4)} ${uraRuler4.kind} (4th ruler)`, system: 'tropical', weight: 2 });

  const marsRuler4 = findAsp(aspects, 'mars', ruler4);
  if (marsRuler4) hits.push({ text: `Mars–${cap(ruler4)} ${marsRuler4.kind} (4th ruler)`, system: 'tropical', weight: 2 });

  // Vedic
  const vRah = chart.vedic.bodies.trueNode;
  const vMars = chart.vedic.bodies.mars;
  if (vRah?.house === 4) hits.push({ text: `Vedic Rahu in 4th house`, system: 'vedic', weight: 2 });
  if (vMars?.house === 4) hits.push({ text: `Vedic Mars in 4th house`, system: 'vedic', weight: 1 });

  return hits;
}

function scoreParentification(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const ruler4 = get4thRuler(chart);
  const hits: EvidenceHit[] = [];

  // DUTY ELEMENT REQUIRED: Moon in 6/10, Saturn in 6/10/12, 4th ruler in 6/10, Saturn-MC
  const moonH = bodies.moon?.house;
  const satH = bodies.saturn?.house;
  const r4house = bodies[ruler4]?.house;
  const satMC = findAsp(aspects, 'saturn', 'mc', HARD, 6);

  const hasDutyElement = (
    moonH === 6 || moonH === 10 ||
    satH === 6 || satH === 10 || satH === 12 ||
    r4house === 6 || r4house === 10 ||
    !!satMC
  );

  // Without a duty/service element this theme does not fire
  if (!hasDutyElement) return [];

  const moonSat = findAsp(aspects, 'moon', 'saturn');
  if (moonSat) hits.push({ text: aspLabel(moonSat), system: 'tropical', weight: 3 });

  if (satH === 4) hits.push({ text: 'Saturn in 4th house', system: 'tropical', weight: 2 });
  if (satH === 6) hits.push({ text: 'Saturn in 6th house (duty/service)', system: 'tropical', weight: 3 });
  if (satH === 10) hits.push({ text: 'Saturn in 10th house (public duty)', system: 'tropical', weight: 3 });
  if (satH === 12) hits.push({ text: 'Saturn in 12th house (hidden labor)', system: 'tropical', weight: 2 });

  if (moonH === 6) hits.push({ text: 'Moon in 6th house', system: 'tropical', weight: 3 });
  if (moonH === 10) hits.push({ text: 'Moon in 10th house', system: 'tropical', weight: 3 });

  if (r4house === 6) hits.push({ text: `4th ruler (${cap(ruler4)}) in 6th house`, system: 'tropical', weight: 3 });
  if (r4house === 10) hits.push({ text: `4th ruler (${cap(ruler4)}) in 10th house`, system: 'tropical', weight: 3 });

  if (satMC) hits.push({ text: `Saturn–MC ${satMC.kind}`, system: 'tropical', weight: 2 });

  const sunSat = findAsp(aspects, 'sun', 'saturn');
  if (sunSat && hasDutyElement) hits.push({ text: aspLabel(sunSat), system: 'tropical', weight: 1 });

  if (bodies.moon?.sign === 'capricorn') hits.push({ text: 'Moon in Capricorn', system: 'tropical', weight: 1 });

  // Vedic
  const vSat = chart.vedic.bodies.saturn;
  if (vSat?.house === 6 || vSat?.house === 10) {
    hits.push({ text: `Vedic Saturn in ${vSat.house}th house`, system: 'vedic', weight: 1 });
  }

  return hits;
}

function scoreVoiceTruthSilencing(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const hits: EvidenceHit[] = [];

  const merSat = findAsp(aspects, 'mercury', 'saturn');
  if (merSat) hits.push({ text: aspLabel(merSat), system: 'tropical', weight: 4 });

  const merPlu = findAsp(aspects, 'mercury', 'pluto');
  if (merPlu) hits.push({ text: aspLabel(merPlu), system: 'tropical', weight: 3 });

  const merNep = findAsp(aspects, 'mercury', 'neptune');
  if (merNep) hits.push({ text: aspLabel(merNep), system: 'tropical', weight: 2 });

  const merChi = findAsp(aspects, 'mercury', 'chiron');
  if (merChi) hits.push({ text: aspLabel(merChi), system: 'tropical', weight: 2 });

  if (bodies.saturn?.house === 3) hits.push({ text: 'Saturn in 3rd house', system: 'tropical', weight: 3 });
  if (bodies.pluto?.house === 3) hits.push({ text: 'Pluto in 3rd house', system: 'tropical', weight: 3 });
  if (bodies.neptune?.house === 3) hits.push({ text: 'Neptune in 3rd house', system: 'tropical', weight: 2 });
  if (bodies.chiron?.house === 3) hits.push({ text: 'Chiron in 3rd house', system: 'tropical', weight: 2 });

  if (bodies.mercury?.sign === 'gemini' && bodies.chiron?.sign === 'gemini') {
    hits.push({ text: 'Mercury and Chiron both in Gemini', system: 'tropical', weight: 1 });
  }

  // Vedic
  const vMer = chart.vedic.bodies.mercury;
  const vSat = chart.vedic.bodies.saturn;
  if (vMer && vSat && (vMer.house === 2 || vMer.house === 3)) {
    if (vSat.house === vMer.house || vSat.house === (((vMer.house + 6) % 12) || 12)) {
      hits.push({ text: `Vedic Mercury in ${vMer.house}th house with Saturn influence`, system: 'vedic', weight: 1 });
    }
  }
  const vKet = chart.vedic.bodies.southNode;
  if (vKet && (vKet.house === 2 || vKet.house === 3)) {
    hits.push({ text: `Vedic Ketu in ${vKet.house}th house (speech/communication)`, system: 'vedic', weight: 1 });
  }

  return hits;
}

function scoreShameAuthority(chart: NatalChart): EvidenceHit[] {
  const { bodies, aspects } = chart.western;
  const hits: EvidenceHit[] = [];

  const sunSat = findAsp(aspects, 'sun', 'saturn');
  if (sunSat) hits.push({ text: aspLabel(sunSat), system: 'tropical', weight: 4 });

  const venSat = findAsp(aspects, 'venus', 'saturn');
  if (venSat) hits.push({ text: aspLabel(venSat), system: 'tropical', weight: 3 });

  const satH = bodies.saturn?.house;
  if (satH === 1) hits.push({ text: 'Saturn in 1st house', system: 'tropical', weight: 3 });
  if (satH === 5) hits.push({ text: 'Saturn in 5th house', system: 'tropical', weight: 2 });
  if (satH === 10) hits.push({ text: 'Saturn in 10th house', system: 'tropical', weight: 2 });

  if (bodies.chiron?.house === 10) hits.push({ text: 'Chiron in 10th house', system: 'tropical', weight: 3 });

  const satASC = findAsp(aspects, 'saturn', 'asc', HARD, 6);
  if (satASC) hits.push({ text: `Saturn–ASC ${satASC.kind}`, system: 'tropical', weight: 2 });

  const satMC = findAsp(aspects, 'saturn', 'mc', HARD, 6);
  if (satMC && satH !== 6 && satH !== 10 && satH !== 12) {
    // Only add here if not already captured in parentification
    hits.push({ text: `Saturn–MC ${satMC.kind}`, system: 'tropical', weight: 1 });
  }

  const sign4 = cuspSign(chart.western.houses.cusps[3]);
  if (sign4 === 'capricorn') hits.push({ text: 'Capricorn on IC', system: 'tropical', weight: 1 });

  // Vedic
  const vSun = chart.vedic.bodies.sun;
  const vSat = chart.vedic.bodies.saturn;
  if (vSun && vSat) {
    if (vSat.house === 1 || vSat.house === 9 || vSat.house === 10) {
      hits.push({ text: `Vedic Saturn in ${vSat.house}th house`, system: 'vedic', weight: 1 });
    }
    const sunSatOpVedic = vSat.house === (((vSun.house + 6) % 12) || 12);
    if (sunSatOpVedic) {
      hits.push({ text: `Vedic Saturn opposing Sun house (whole-sign)`, system: 'vedic', weight: 1 });
    }
  }

  return hits;
}

function scoreLineageAncestral(chart: NatalChart): EvidenceHit[] {
  const { bodies } = chart.western;
  const ruler4 = get4thRuler(chart);
  const r4house = bodies[ruler4]?.house;
  const hits: EvidenceHit[] = [];

  // STRONG triggers: at least one required
  const sNodeH = bodies.southNode?.house;
  const sNodeStrong = sNodeH === 4 || sNodeH === 8 || sNodeH === 12;
  const ruler4InDeep = r4house === 8 || r4house === 12;

  const moonIn12 = bodies.moon?.house === 12;
  const satIn4or12 = bodies.saturn?.house === 4 || bodies.saturn?.house === 12;
  const plutIn4or12 = bodies.pluto?.house === 4 || bodies.pluto?.house === 12;

  const h8Planets = (['sun','moon','mercury','venus','mars','jupiter','saturn'] as BodyId[])
    .filter(b => bodies[b]?.house === 8);
  const h8Stellium = h8Planets.length >= 3;

  const hasStrongTrigger = sNodeStrong || ruler4InDeep || (moonIn12 && (satIn4or12 || plutIn4or12)) || h8Stellium;

  // This theme requires at least one strong lineage trigger to activate at all
  if (!hasStrongTrigger) return [];

  if (sNodeStrong) {
    hits.push({ text: `South Node in ${sNodeH}th house`, system: 'tropical', weight: 5 });
  }
  if (ruler4InDeep) {
    hits.push({ text: `4th ruler (${cap(ruler4)}) in ${r4house}th house`, system: 'tropical', weight: 4 });
  }
  if (moonIn12 && satIn4or12) {
    hits.push({ text: 'Moon in 12th with Saturn in 4th/12th (lineage weight)', system: 'tropical', weight: 3 });
  }
  if (moonIn12 && plutIn4or12) {
    hits.push({ text: 'Moon in 12th with Pluto in 4th/12th (hidden history)', system: 'tropical', weight: 3 });
  }
  if (h8Stellium) {
    hits.push({ text: `${h8Planets.length}-planet stellium in 8th house`, system: 'tropical', weight: 3 });
  }
  if (satIn4or12 && !moonIn12) {
    hits.push({ text: `Saturn in ${bodies.saturn?.house}th house`, system: 'tropical', weight: 1 });
  }
  if (plutIn4or12 && !moonIn12) {
    hits.push({ text: `Pluto in ${bodies.pluto?.house}th house`, system: 'tropical', weight: 1 });
  }

  // Vedic
  const vKet = chart.vedic.bodies.southNode;
  if (vKet?.house === 4 || vKet?.house === 8 || vKet?.house === 12) {
    hits.push({ text: `Vedic Ketu in ${vKet.house}th house (ancestral residue)`, system: 'vedic', weight: 2 });
  }
  const vSat = chart.vedic.bodies.saturn;
  if (vSat?.house === 4 || vSat?.house === 12) {
    hits.push({ text: `Vedic Saturn in ${vSat.house}th house`, system: 'vedic', weight: 1 });
  }

  return hits;
}

// ── Scoring dispatch ──────────────────────────────────────────────────────────

const SCORERS: Record<ThemeId, (chart: NatalChart) => EvidenceHit[]> = {
  'emotional-containment':       scoreEmotionalContainment,
  'emotional-absorption':        scoreEmotionalAbsorption,
  'crisis-power-secrets':        scoreCrisisPowerSecrets,
  'instability-unpredictability': scoreInstabilityUnpredictability,
  'parentification':             scoreParentification,
  'voice-truth-silencing':       scoreVoiceTruthSilencing,
  'shame-authority':             scoreShameAuthority,
  'lineage-ancestral':           scoreLineageAncestral,
};

// ── Deduplication / tiering ───────────────────────────────────────────────────

type RawResult = { id: ThemeId; hits: EvidenceHit[]; score: number };

function tierThemes(raws: RawResult[]): Array<{ raw: RawResult; tier: 'primary' | 'secondary' | 'background' }> {
  const sorted = [...raws].filter(r => r.score > 0).sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return [];

  const claimed = new Set<string>(); // tropical evidence claimed by primary/secondary
  const tiered: Array<{ raw: RawResult; tier: 'primary' | 'secondary' | 'background' }> = [];
  let primaryCount = 0;
  let secondaryCount = 0;

  for (const raw of sorted) {
    const tropHitTexts = raw.hits.filter(h => h.system === 'tropical').map(h => h.text);
    const claimedCount = tropHitTexts.filter(t => claimed.has(t)).length;
    const overlapRatio = tropHitTexts.length > 0 ? claimedCount / tropHitTexts.length : 0;

    let tier: 'primary' | 'secondary' | 'background';

    if (primaryCount === 0) {
      tier = 'primary';
      primaryCount++;
    } else if (overlapRatio > 0.4 || secondaryCount >= 2) {
      tier = 'background';
    } else {
      tier = 'secondary';
      secondaryCount++;
    }

    if (tier !== 'background') {
      for (const t of tropHitTexts) claimed.add(t);
    }

    tiered.push({ raw, tier });
  }

  return tiered;
}

// ── Snapshot builder ──────────────────────────────────────────────────────────

function buildSnapshot(
  primary: ScoredTheme,
  secondary: ScoredTheme[],
): ChildhoodSnapshot {
  const def = THEME_DEFS[primary.id];
  const secDef = secondary[0] ? THEME_DEFS[secondary[0].id] : null;

  const lineage = secondary.find(t => t.id === 'lineage-ancestral');

  const archetypes = [...new Set([...def.archetypes, ...(secDef?.archetypes ?? [])])].slice(0, 2);

  return {
    primaryImprint: def.adultTitle.toLowerCase(),
    secondaryImprint: secDef ? secDef.adultTitle.toLowerCase() : null,
    familyRole: archetypes.join(' / '),
    lineageThread: lineage ? 'inherited family patterns and ancestral emotional residue' : null,
    coreUnmetNeed: deriveCoreNeed(primary.id),
    protectiveAdaptation: def.protectiveAdaptation,
    integratedGift: def.integratedGift.split(',')[0],
  };
}

function deriveCoreNeed(id: ThemeId): string {
  const needs: Record<ThemeId, string> = {
    'emotional-containment':       'permission to have and express feelings without consequence',
    'emotional-absorption':        'clear emotional boundaries and knowing what belongs to self',
    'crisis-power-secrets':        'safety, honesty, and freedom from having to interpret hidden dynamics',
    'instability-unpredictability': 'predictability, repair, and the ability to fully rest',
    'parentification':             'permission to have needs without carrying responsibility for others',
    'voice-truth-silencing':       'to speak what is true without managing the response',
    'shame-authority':             'worth that is unconditional and independent of performance',
    'lineage-ancestral':           'to inherit only what serves, and to choose consciously what to pass forward',
  };
  return needs[id];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function scoreChildhoodImprints(chart: NatalChart): ChildhoodScoringResult {
  // 1. Score all 8 themes
  const raws: RawResult[] = (Object.keys(SCORERS) as ThemeId[]).map(id => {
    const hits = SCORERS[id](chart);
    return { id, hits, score: hits.reduce((s, h) => s + h.weight, 0) };
  });

  // 2. Tier: primary, secondary (max 2), background
  const tiered = tierThemes(raws);

  if (tiered.length === 0) {
    return { primary: null, secondary: [], background: [], snapshot: null, hasVedicData: true, vedicNote: buildVedicNote(false), overallSystemNote: 'tropical-only' };
  }

  // 3. Build ScoredTheme objects
  const toScoredTheme = ({ raw, tier }: { raw: RawResult; tier: 'primary' | 'secondary' | 'background' }): ScoredTheme => {
    const def = THEME_DEFS[raw.id];
    const tropHits = raw.hits.filter(h => h.system === 'tropical');
    const vedHits  = raw.hits.filter(h => h.system === 'vedic');
    const hasVedic = vedHits.length > 0;
    return {
      ...def,
      strength: computeStrength(raw.hits),
      score: raw.score,
      tropicalIndicators: tropHits.map(h => h.text),
      vedicIndicators:    vedHits.map(h => h.text),
      hasVedicEvidence:   hasVedic,
      systemNote:         hasVedic ? 'tropical-and-vedic' : 'tropical-only',
      tier,
    };
  };

  const primaryRaw  = tiered.find(t => t.tier === 'primary')!;
  const secondaryRaw = tiered.filter(t => t.tier === 'secondary');
  const backgroundRaw = tiered.filter(t => t.tier === 'background');

  const primary   = toScoredTheme(primaryRaw);
  const secondary = secondaryRaw.map(toScoredTheme);
  const background = backgroundRaw.map(toScoredTheme);

  const hasAnyVedic = primary.hasVedicEvidence || secondary.some(t => t.hasVedicEvidence);
  const overallSystemNote: 'tropical-only' | 'tropical-and-vedic' = hasAnyVedic ? 'tropical-and-vedic' : 'tropical-only';

  return {
    primary,
    secondary,
    background,
    snapshot: buildSnapshot(primary, secondary),
    hasVedicData: true,
    vedicNote: buildVedicNote(hasAnyVedic),
    overallSystemNote,
  };
}

function buildVedicNote(hasVedicEvidence: boolean): string {
  if (hasVedicEvidence) {
    return 'Both the tropical (Western) and Vedic (sidereal) charts contributed indicators to this section. Vedic evidence is shown separately in each theme\'s Evidence section.';
  }
  return 'Vedic (sidereal) chart data is available for this chart. No significant Vedic indicators fired for the themes shown. The interpretation is based on tropical (Western) astrology.';
}

// ── Age utilities ─────────────────────────────────────────────────────────────

export function getAgeFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function isMinorChart(birthDate: string): boolean {
  return getAgeFromBirthDate(birthDate) < 18;
}
