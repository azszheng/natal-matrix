// Pure data — no server-only imports. Safe for client components.
//
// Grounding facts for the Human Design AI interpretation layer (see
// lib/ai/humanDesignPrompts.ts). These are short, original keynotes used to
// anchor the model's output in real chart data — the model still writes the
// actual prose. Original phrasing throughout; not sourced from or quoting
// any single published Human Design or Gene Keys text.

import type { HdType, HdAuthority, HdPlanetId, CenterId } from './humandesign-constants';

// ── Type signature (the positive alignment feedback for each Type) ──────────
export const TYPE_SIGNATURE: Record<HdType, string> = {
  'Generator':             'Satisfaction',
  'Manifesting Generator': 'Satisfaction / Peace',
  'Manifestor':            'Peace',
  'Projector':             'Success',
  'Reflector':             'Surprise',
};

// ── Authority: explanation + a concrete decision-making practice ────────────
export const AUTHORITY_MEANING: Record<HdAuthority, { explanation: string; practice: string }> = {
  'Sacral': {
    explanation: 'A pre-verbal body response — expansion/energy toward a "yes," contraction/flatness toward a "no" — that fires before the mind finishes its sentence.',
    practice: 'Ask simple yes/no questions about a real, specific option and notice whether the body responds with energy, openness, or a clear lack of it.',
  },
  'Emotional': {
    explanation: 'Clarity that only arrives after riding the emotional wave through both a high and a low — there is no reliable truth at either peak.',
    practice: 'Sleep on the decision and notice whether it still feels clear once the emotional intensity of the moment has passed.',
  },
  'Splenic': {
    explanation: 'A quiet, once-only instinctive knowing, rooted in present-moment survival intelligence rather than pattern or memory.',
    practice: 'Notice the very first quiet instinct, before fear stories or mental debate get a chance to build a case.',
  },
  'Ego-Manifested': {
    explanation: 'Decisions anchored in genuine will and desire, with a motor connected directly to expression — capacity, not obligation, is the test.',
    practice: 'Before committing, ask plainly: do I actually want this, and do I have the will to see it through?',
  },
  'Ego-Projected': {
    explanation: 'Decisions anchored in genuine will and desire, without a direct motor-to-throat connection — the want has to be voiced and recognized to land.',
    practice: 'Before committing, ask plainly: do I actually want this, and do I have the will to see it through?',
  },
  'Self-Projected': {
    explanation: 'Identity and direction that clarify out loud — the truth of a decision emerges in what gets spontaneously said, not in silent thought.',
    practice: 'Talk the decision through with a trusted listener and notice which option sounds most like your own voice, not the most reasonable one.',
  },
  'Mental / Environmental': {
    explanation: 'No fixed inner bodily authority — clarity instead comes from the right environment and the right conversations, sampled over time.',
    practice: 'Discuss the decision in more than one environment and with more than one person, without asking any of them to make the choice for you.',
  },
  'Lunar': {
    explanation: 'A Reflector\'s clarity is not available on demand — it forms gradually across roughly one full lunar cycle of sampling moods, days, and environments.',
    practice: 'Track how the decision feels day to day across a full lunar cycle rather than forcing certainty immediately.',
  },
};

// ── Centers: role + what each definition state actually means ───────────────
export const CENTER_MEANING: Record<CenterId, { role: string; definedMeaning: string; openMeaning: string }> = {
  head: {
    role: 'inspiration and mental pressure — the source of questions and the drive to think',
    definedMeaning: 'a consistent, self-generated stream of questions and mental pressure, independent of who is around',
    openMeaning: 'no fixed source of mental pressure of its own — it amplifies and absorbs the questions and inspiration in the surrounding environment',
  },
  ajna: {
    role: 'conceptualizing and forming opinions — turning raw inspiration into thought',
    definedMeaning: 'a consistent way of processing and holding opinions, fixed enough to feel like a reliable way of thinking',
    openMeaning: 'flexible, absorbing thinking styles from others rather than holding one fixed way of processing — genuine open-mindedness, not confusion',
  },
  throat: {
    role: 'communication, action, and manifestation — the center everything else must pass through to become visible',
    definedMeaning: 'a reliable, always-on channel for speaking and acting, whether or not it is connected to a motor',
    openMeaning: 'no fixed voice of its own — expression and visibility become inconsistent, more available in some settings and people than others',
  },
  g: {
    role: 'identity, direction, and love — the sense of self and where one is headed',
    definedMeaning: 'a fixed, stable sense of identity and direction that holds steady across circumstances',
    openMeaning: 'identity and direction that shift depending on people, places, and roles — flexibility about who one is, not a lack of self',
  },
  heart: {
    role: 'willpower, ego, and material resources — the capacity to make and keep commitments',
    definedMeaning: 'consistent, reliable willpower for the things it genuinely commits to',
    openMeaning: 'inconsistent access to willpower — a real risk of over-proving worth or overcommitting to be seen as capable',
  },
  sacral: {
    role: 'sustainable life-force energy and the body\'s yes/no response',
    definedMeaning: 'consistent access to generative, sustainable energy, with a reliable body-based yes/no',
    openMeaning: 'no fixed engine of its own — it amplifies the work-energy in the room, with real risk of not knowing when enough is enough',
  },
  spleen: {
    role: 'instinct, intuition, and body awareness — survival intelligence tuned to the present moment',
    definedMeaning: 'a consistent, quiet stream of instinctive knowing about health, safety, and what belongs',
    openMeaning: 'heightened sensitivity to fear, health, and safety cues in the environment, without a fixed instinctive filter of its own',
  },
  solarPlexus: {
    role: 'emotions, feeling, and desire — the wave that turns raw experience into mood and longing',
    definedMeaning: 'a defined emotional wave that cycles through highs and lows on its own timeline',
    openMeaning: 'high responsiveness to the emotional field of others — absorbing and amplifying moods that are not originally its own',
  },
  root: {
    role: 'pressure, stress, and adrenaline — the drive to get things done and move on',
    definedMeaning: 'a consistent, manageable hum of pressure to act and complete things',
    openMeaning: 'inconsistent pressure that spikes under stress from the environment, with risk of chronic rushing or forced urgency',
  },
};

// ── Gate keynotes — one short, original theme line per gate (1-64) ──────────
export const GATE_KEYNOTE: Record<number, { name: string; theme: string }> = {
  1:  { name: 'Self-Expression',   theme: 'pure individual creative identity, wanting to be recognized as genuinely unique' },
  2:  { name: 'The Direction',     theme: 'a receptive sense of direction — knowing which way to move without needing to explain how' },
  3:  { name: 'Innovation',        theme: 'energy for beginnings — ordering initial chaos into a workable new structure' },
  4:  { name: 'Formulization',     theme: 'a mental drive to find workable, logical answers to confusion or doubt' },
  5:  { name: 'Fixed Rhythms',     theme: 'steady patterns and rituals that regulate energy, timing, and waiting' },
  6:  { name: 'Friction',          theme: 'emotional gatekeeping — deciding when intimacy or conflict is let in' },
  7:  { name: 'The Role',          theme: 'quiet leadership through personal example rather than force' },
  8:  { name: 'Contribution',      theme: 'individual style and creative self-expression, offered outward to be noticed' },
  9:  { name: 'Focus',             theme: 'sustained concentration on small details until they accumulate into something real' },
  10: { name: 'Behavior',          theme: 'self-love expressed through authentic behavior and personal conduct' },
  11: { name: 'Ideas',             theme: 'generating and gathering ideas, ready to be offered outward as possibility' },
  12: { name: 'Caution',           theme: 'expression tied to mood — waiting for the right emotional moment to speak' },
  13: { name: 'The Listener',      theme: 'holding space for others\' experience — collecting stories and secrets' },
  14: { name: 'Power Skills',      theme: 'resourcefulness and competence directed toward a larger purpose' },
  15: { name: 'Extremes',          theme: 'acceptance of the full range of human rhythm and behavior' },
  16: { name: 'Skills',            theme: 'enthusiasm and skill refined over time into confident, talented expression' },
  17: { name: 'Opinion',           theme: 'forming logical opinions and organizing facts into a coherent case' },
  18: { name: 'Correction',        theme: 'an instinct to notice what isn\'t working and improve it' },
  19: { name: 'Wanting',           theme: 'sensitivity to what is needed for belonging and resource security' },
  20: { name: 'The Now',           theme: 'immediate, in-the-moment expression tied directly to present awareness' },
  21: { name: 'Control',           theme: 'the will to manage material resources and one\'s own domain' },
  22: { name: 'Openness',          theme: 'emotionally attuned grace and social sensitivity' },
  23: { name: 'Assimilation',      theme: 'individual insight distilled into simple, digestible words' },
  24: { name: 'Return',            theme: 'circling back on a thought or realization until real insight breaks through' },
  25: { name: 'Innocence',         theme: 'a universal love and spirit that operates independent of personal preference' },
  26: { name: 'The Egoist',        theme: 'persuasive memory and pride, used to get others to trust and buy in' },
  27: { name: 'Nourishment',       theme: 'the instinct to care for and provision for others' },
  28: { name: 'The Game Player',   theme: 'an instinctive drive to find meaning, even through risk or struggle' },
  29: { name: 'Perseverance',      theme: 'commitment — the capacity to say a full-bodied yes and stay with it' },
  30: { name: 'Feelings',          theme: 'desire and longing that fuels imagination and the hunger for experience' },
  31: { name: 'Leadership',        theme: 'influence through being heard — speaking on behalf of a collective' },
  32: { name: 'Continuity',        theme: 'an instinct for what will endure and what is worth preserving' },
  33: { name: 'Retreat',           theme: 'withdrawing to process experience privately before sharing it as wisdom' },
  34: { name: 'Power',             theme: 'raw, self-contained life-force that doesn\'t need external permission' },
  35: { name: 'Change',            theme: 'restlessness for new experience — a hunger to feel more of life' },
  36: { name: 'Crisis',            theme: 'an emotional hunger for new, intense experience to grow through' },
  37: { name: 'Friendship',        theme: 'an emotional need for agreements, warmth, and belonging within family or community' },
  38: { name: 'The Fighter',       theme: 'pressure to struggle for what genuinely matters, resisting what doesn\'t' },
  39: { name: 'Provocation',       theme: 'pressure to provoke a reaction that reveals what is real underneath' },
  40: { name: 'Aloneness',         theme: 'needing solitude to recover before willingly giving to others again' },
  41: { name: 'Fantasy',           theme: 'the pressure of longing and imagination that starts new experience cycles' },
  42: { name: 'Growth',            theme: 'energy for completing cycles once they have naturally run their course' },
  43: { name: 'Insight',           theme: 'sudden individual knowing that doesn\'t need external proof' },
  44: { name: 'Alertness',         theme: 'instinctive recognition of patterns from the past, for better or worse' },
  45: { name: 'Gatherer',          theme: 'gathering and directing resources on behalf of a group' },
  46: { name: 'Determination',     theme: 'love of the physical body and being in the right place at the right time' },
  47: { name: 'Realization',       theme: 'sifting through memory and mental data until sudden clarity surfaces' },
  48: { name: 'Depth',             theme: 'an instinctive well of knowledge and skill, alongside a fear of not having a solution ready' },
  49: { name: 'Principles',        theme: 'emotional sensitivity to fairness, rejection, and the terms of belonging' },
  50: { name: 'Values',            theme: 'an instinctive sense of the rules that keep a group or family safe' },
  51: { name: 'Shock',             theme: 'initiating through sudden disruption — the drive to be first' },
  52: { name: 'Stillness',         theme: 'pressure to be still and focused rather than reactive' },
  53: { name: 'Beginnings',        theme: 'pressure to start new cycles, even without a clear finish in sight' },
  54: { name: 'Ambition',          theme: 'the drive to rise, transform circumstances, and improve one\'s position' },
  55: { name: 'Spirit',            theme: 'emotional depth and mood as the raw material of creative or spiritual richness' },
  56: { name: 'Stimulation',       theme: 'storytelling that hooks attention through shared experience' },
  57: { name: 'Intuitive Clarity', theme: 'in-the-moment sensing of what is safe, healthy, or true right now' },
  58: { name: 'Vitality',          theme: 'the pressure of joyful aliveness — a drive to correct and improve what exists' },
  59: { name: 'Sexuality',         theme: 'a drive to break down barriers and create intimate bonding' },
  60: { name: 'Acceptance',        theme: 'the pressure of limitation — working creatively within real constraints' },
  61: { name: 'Inner Truth',       theme: 'pressure to know the unknowable — a private, deep curiosity about hidden truth' },
  62: { name: 'Detail',            theme: 'precise naming of facts and details in ordinary language' },
  63: { name: 'Doubt',             theme: 'doubt after things resolve — testing whether a pattern will actually hold' },
  64: { name: 'Confusion',         theme: 'mental pressure to make sense of past experience and turn it into meaning' },
};

// ── Profile lines: name + core theme (used for both single-line and combined
//    profile prompts) ─────────────────────────────────────────────────────────
export const PROFILE_LINE_MEANING: Record<number, { name: string; theme: string }> = {
  1: { name: 'Investigator', theme: 'builds security through research and knowledge; fears not knowing enough; becomes a grounded expert by going to the root of things' },
  2: { name: 'Hermit',       theme: 'carries natural, effortless talent that others recognize before the person does; needs real solitude to let it surface without pressure' },
  3: { name: 'Martyr',       theme: 'learns through direct trial and error; treats mistakes as curriculum rather than failure; earns practical wisdom nothing else can teach' },
  4: { name: 'Opportunist',  theme: 'moves through life via relationships and trusted networks; influence and opportunity arrive through people, not cold outreach' },
  5: { name: 'Heretic',      theme: 'gets projected onto as a practical problem-solver; carries a wide, sometimes unearned reputation; leads through visible, real-world solutions' },
  6: { name: 'Role Model',   theme: 'moves through three life phases — trial (like a 3rd line), a withdrawal and integration period, then living as an example others watch and learn from' },
};

// ── HD planets: interpretive frame + a governing phrase for gate prompts ────
export const PLANET_FRAME: Record<HdPlanetId, { role: string; phrase: string }> = {
  sun: {
    role: 'core vitality and central life-force expression — what the person most consistently radiates',
    phrase: 'This gate is part of your core life-force expression.',
  },
  earth: {
    role: 'grounding and embodiment — what stabilizes and balances the Sun\'s theme',
    phrase: 'This gate shows what grounds and stabilizes your main life-force theme.',
  },
  moon: {
    role: 'emotional and subconscious motivation — a quiet pull that keeps returning attention to the same territory',
    phrase: 'This gate describes a quiet motivation that keeps pulling your attention.',
  },
  northNode: {
    role: 'future direction and the growth environment the person is maturing into',
    phrase: 'This gate points toward the field of experience you are growing into.',
  },
  southNode: {
    role: 'familiar early-life pattern and default orientation — the comfort zone being matured out of',
    phrase: 'This gate describes a familiar pattern that may shape your early orientation to life.',
  },
  mercury: {
    role: 'communication, teaching, and thinking style — what the person is here to name or articulate',
    phrase: 'This gate influences how your mind communicates, names, teaches, or processes experience.',
  },
  venus: {
    role: 'values, attraction, and relational standards — what is loved, protected, or sought in relationship',
    phrase: 'This gate shapes what you value, protect, love, or seek in relationship.',
  },
  mars: {
    role: 'a raw learning edge — reactive or immature at first, but a real growth edge that matures through direct experience',
    phrase: 'This gate may begin as a raw or reactive pattern, but it becomes powerful as it matures.',
  },
  jupiter: {
    role: 'expansion, principles, and growth through generosity and integrity',
    phrase: 'This gate expands when you live it with generosity, integrity, and clear principles.',
  },
  saturn: {
    role: 'discipline, responsibility, and the place life asks for grounded maturity',
    phrase: 'This gate shows where life asks for maturity, accountability, and grounded responsibility.',
  },
  uranus: {
    role: 'individuality, disruption, and unconventional or future-facing expression',
    phrase: 'This gate may express in unconventional, future-facing, or nonconforming ways.',
  },
  neptune: {
    role: 'mystery, longing, and idealization — a subtler, harder-to-pin-down current',
    phrase: 'This gate may feel dreamlike, spiritual, elusive, or difficult to fully define.',
  },
  pluto: {
    role: 'transformation and depth — an unconscious intensity that compounds over time',
    phrase: 'This gate becomes a deep transformational force over time.',
  },
};

// ── Line-of-the-gate modifiers (1-6): how the specific line colors the gate ──
export const LINE_FRAME: Record<number, { theme: string; question: string }> = {
  1: { theme: 'foundation, research, and security through knowing — with a fear of not knowing enough', question: 'What foundation does this gate need before it can be trusted?' },
  2: { theme: 'a natural, unforced gift that others call out before the person fully sees it themselves', question: 'What is natural here, and how might others recognize it before the person does?' },
  3: { theme: 'trial and error — adaptation and lived experience turning into practical wisdom', question: 'What does this gate learn only through direct, lived experience?' },
  4: { theme: 'relationships and networks — influence and opportunity that move through trust', question: 'How does this gate move through relationships and trusted connections?' },
  5: { theme: 'projection and being expected to deliver a practical solution', question: 'What projection lands here, and what practical solution can genuinely emerge from it?' },
  6: { theme: 'maturation — perspective and embodied wisdom that develop across a lifetime', question: 'How does this gate mature and change across the person\'s life?' },
};

// ── Type -> practical role in strategy/decision-making, used for the
//    Practical Experiments section ───────────────────────────────────────────
export const TYPE_EXPERIMENT_SEED: Record<HdType, string> = {
  'Generator':             'placing themselves around real options and tracking body-level energy before committing',
  'Manifesting Generator': 'noticing where they skip steps or pivot mid-course, and treating that as valid process rather than failure',
  'Manifestor':            'practicing informing others before acting, and protecting unstructured space to initiate',
  'Projector':             'noticing when guidance is actually invited versus offered unprompted, and resting deliberately between invitations',
  'Reflector':             'tracking how a decision feels across different days, people, and environments before concluding anything',
};
