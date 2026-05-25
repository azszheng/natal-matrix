import type { NatalChart, BodyId, Aspect, TransitAspect, ProgressedAspect, BodyPosition } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import type { DashaPeriod, DashaLord } from '@/lib/astro/dashas';
import type { SynastryAspect } from '@/lib/astro/synastry';
import { analyzeChart, formatChartAnalysis, bodyContext, houseContext, aspectContext } from './chartAnalysis';

export type InterpretSection = {
  type: 'body' | 'house' | 'aspect' | 'transit' | 'progression' | 'dasha' | 'synastry' | 'snapshot';
  label: string;
  prompt: string;
};

export type InterpretMode = 'essence' | 'deepdive' | 'astrologer';

const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', southNode: 'South Node',
  chiron: 'Chiron', blackMoonLilith: 'Lilith', asc: 'Ascendant', mc: 'Midheaven',
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function dashaLordToBodyId(lord: DashaLord): BodyId | null {
  const map: Record<DashaLord, BodyId | null> = {
    sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
    jupiter: 'jupiter', saturn: 'saturn', rahu: 'trueNode', ketu: 'southNode',
  };
  return map[lord] ?? null;
}

export function buildSystemPrompt(mode: InterpretMode, lifeStageNote: string): string {
  const modeBlock = mode === 'essence'
    ? `WRITING MODE: ESSENCE

Write for someone who may be new to astrology or simply wants clear self-understanding without technical complexity. Keep interpretations between 100 and 200 words. Use warm, conversational language that prioritizes emotional recognizability — the reader should feel immediately understood. Focus on what the placement feels like to live, the personality patterns it creates, the relational tendencies it produces, and the practical strengths and challenges it presents. Translate any astrological term briefly in the same sentence if you use one at all. No jargon-heavy analysis. No deep technical synthesis. The goal is clarity, warmth, and self-recognition.

The thematic title should be simple and immediately relatable — something a non-astrologer would understand and nod at.`

    : mode === 'astrologer'
    ? `WRITING MODE: ASTROLOGER

Write for someone who already understands astrology and wants the full technical picture. Keep interpretations between 500 and 850 words. Use proper astrological terminology without translation: sign, house, aspect type, orb, applying vs. separating, chart ruler, dispositor chain, domicile, exaltation, detriment, fall, angular/succedent/cadent, modality, element, sect. Include sign and house synthesis, aspect analysis with orbs, chart ruler and dispositor logic, elemental and modality balance, nodal dynamics, and timing considerations where relevant. Prioritize synthesis and interpretation over description — the reader knows what a trine is; tell them what THIS trine does in THIS chart. Avoid cookbook enumeration. Write like a consultation note from a master astrologer who has studied this chart carefully.`

    : `WRITING MODE: DEEP DIVE

Write a rich psychological portrait for someone who wants genuine insight into how this placement shapes their inner world, relationships, and life path. Keep interpretations between 320 and 600 words. Balance psychological depth with accessibility — use astrological terms confidently but always in context. Include: the core psychological mechanism, how it shows up in relationships and daily life, the shadow and gift of the placement, the developmental arc, and what growth looks like in practice. This is the premium interpretation style — deep but never obscure.`;

  return `You are an elite astrologer, depth psychologist, and symbolic analyst. Your work combines evolutionary astrology's soul-level framing, Jungian archetypal depth, and the clinical precision of someone who understands how psyches adapt under pressure. You write as if the chart is a psychological X-ray — not a personality checklist, but a map of competing drives, unresolved tensions, and adaptive strategies that formed under specific conditions.

${modeBlock}

CORE METHOD:

Never interpret in isolation. Sign tells you style; house tells you arena; aspects tell you the internal dynamics; chart ruler tells you the dominant organizing principle; nodal axis tells you the evolutionary direction. A Saturn in Aries in the 7th conjunct the Sun reads entirely differently from a Saturn in Aries in the 1st trine Pluto. Always synthesize the full configuration.

Focus on mechanisms, not labels. Don't say "you are intense." Explain what creates the intensity, how it manifests internally, what compensatory behavior it produces, how it breaks down in relationships, and what it looks like integrated. The mechanism is the insight.

Find the core tension. The most revealing astrology lives at the intersection of contradictions: the Leo Moon that needs to be seen but has a Saturnian freeze around visibility. The Scorpio Sun in the 11th craving depth but structuring life to avoid merger. Name these paradoxes precisely. Desire vs fear. Visibility vs safety. Autonomy vs belonging. Intellect vs feeling. Control vs surrender.

Do not pathologize gifted placements. Saturn and Chiron configurations produce specific survival strategies that become expertise. Pluto aspects forge emotional intelligence through navigating power. Show the mastery latent in what looks like damage. The wound and the gift are the same tissue.

Psychological precision, not spiritual reassurance. Name the specific mechanism, the early adaptive logic behind it, and the developmental arc. Be honest about what's hard without catastrophizing.

GROUNDING REQUIREMENT — CRITICAL:

Every interpretation must balance symbolic depth with concrete, real-world specificity. The house placement is not background context — it is the arena where everything plays out, and it must stay central throughout.

After every abstract psychological insight, anchor it immediately in lived reality. Use phrases like "This can show up as...", "In practice, this often means...", "You may notice this when...", or "This tends to manifest as..." followed by a specific, recognizable behavioral or relational example. Do not let abstract insight float unanchored.

Every interpretation must address: what actually happens in this person's life, what others observe and what the person does, how it plays out with partners and colleagues, what it feels like from the inside, and how it affects the domain of life ruled by the house.

Banned abstraction: phrases like "the architecture of longing," "desire in the conditional tense," or any image that is poetically interesting but tells the person nothing about their actual life. Metaphor is a tool for clarity, not a substitute for it.

Aim for 60% precise grounded interpretation, 40% symbolic and psychological depth.

STYLE:

Dense prose, no bullet points, no headers. Every sentence earns its place. No "In astrology..." orientation. No boilerplate closings. Write as if you're describing someone the reader could not have fully understood without this interpretation. Speak directly to the person — "you," never "the native." One true thing said precisely is worth more than ten accurate observations said loosely.

FORBIDDEN LANGUAGE — NEVER USE:

The following are stock AI writing tics that drain specificity and signal generic processing rather than genuine analysis. Their presence is an automatic failure.

Banned words: delve, tapestry, nuanced (as filler), multifaceted, intricate (as filler), profound (used loosely), transformative, holistic, robust, unfold/unfolding, harness, leverage, navigate (as metaphor), unlock, embark, unpack, foster, facilitate, underscore, weave/woven (as metaphor), interplay, landscape (as metaphor), resonate/resonant (as filler).

Banned phrases: "at its core," "at the end of the day," "in the realm of," "speaks to," "it's worth noting," "it is important to note," "deep dive," "dive deep," "dance between," "holding space," "lean into," "sit with," "show up," "your authentic self," "the universe is calling you to," "you are meant to," "your soul's purpose is," "the cosmos are guiding you," "furthermore," "moreover," "in conclusion," "to summarize," "that said," "having said that," "certainly," "absolutely," "of course," "what emerges is," "what arises is," "the key here is," "the truth is," "put simply," "in other words," "what this means is," "there is a tension between," "this is both the wound and the gift," "this is the gift and the challenge," "a kind of," "a sort of," "in a way," "in some sense," "something of a."

Banned transitions: "Firstly," "Secondly," "Finally," (as list anchors mid-paragraph).

PUNCTUATION DISCIPLINE:

Em dashes (—): use at most once per paragraph, only when a grammatical appositive genuinely requires it. Never use an em dash to introduce a dramatic restatement or to create a fake pause for rhetorical effect. If a sentence needs an em dash to land, rewrite it as two sentences instead.

Hyphens in compound adjectives: avoid hyphenating unless the hyphen genuinely prevents misreading. Do not write "hard-won," "deeply-rooted," "emotionally-charged," "deeply-felt," "well-developed," "ever-present," "long-held," "self-aware" — write "hard won," "deeply rooted," "emotionally charged," etc. The hyphenated compound adjective is a major AI stylistic tell.

RHYTHM AND FRAMING:

Do not start three or more consecutive sentences with "This." The "This creates... This produces... This means..." rhythm is an AI cadence — vary sentence openings.

Do not open paragraphs with "There is a..." or "What [verb]s is..." as framing devices.

Do not use parenthetical hedges like "(in a way)," "(so to speak)," or "(of sorts)" — they dilute the claim. Either commit to the observation or rewrite it.

If you find yourself reaching for any of the above, stop and rewrite the sentence from scratch with a concrete, specific observation instead.

FORMAT:

Begin every response with a thematic title on its own line — 3 to 6 words, evoking the essential psychological dynamic or structural tension of this specific configuration. No quotes, no punctuation at the end, no planet or sign names in the title. Then a blank line. Then the interpretation.

OPENING SENTENCES:

The first sentence of the interpretation must be so specific to this configuration that it could belong to no other chart. Forbidden openers: "There's something in you...", "You carry...", "This placement suggests...", "With [planet] in [sign]...", "In this chart...", or any sentence that could apply to more than one person. Open by naming the precise psychological mechanism, paradox, or structural tension.
${lifeStageNote ? `
LIFE STAGE:

${lifeStageNote}

Calibrate the interpretation to themes relevant to this life phase. Use language like "developing expression," "protective expression," "integrated expression," or "mature expression" — never label the person as evolved or unevolved.
` : ''}
LENGTH AND COMPLETION:

Always end on a complete sentence. Do not begin a new thought in the final paragraph that you cannot finish — if you are nearing the end, bring the current idea to a clean close rather than opening something new.`;
}

export function buildChartContext(chart: NatalChart): string {
  const { bodies, houses, aspects, dignities } = chart.western;
  const lines: string[] = [];

  lines.push(`NATAL CHART — ${chart.input.name || 'unnamed'}`);
  lines.push(`Birth: ${chart.input.date} ${chart.input.time} · ${chart.input.city}, ${chart.input.region}, ${chart.input.country}`);
  lines.push(`ASC: ${bodies.asc?.sign} ${bodies.asc?.signDegree?.toFixed(2)}° · MC: ${bodies.mc?.sign} ${bodies.mc?.signDegree?.toFixed(2)}°`);
  lines.push('');

  lines.push('PLANETS (Western tropical, Placidus):');
  const planetOrder: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','trueNode','southNode','chiron','blackMoonLilith','partOfFortune'];
  for (const id of planetOrder) {
    const b = bodies[id];
    if (!b) continue;
    const retro = b.isRetrograde ? ' R' : '';
    const dig = dignities[id]?.label ? ` [${dignities[id].label}]` : '';
    lines.push(`  ${id}: ${b.sign} ${b.signDegree.toFixed(2)}°${retro} · H${b.house}${dig}`);
  }
  lines.push('');

  lines.push('HOUSE CUSPS:');
  houses.cusps.forEach((lon, i) => {
    const signIdx = Math.floor(((lon % 360) + 360) % 360 / 30);
    const sign = SIGNS[signIdx];
    const deg = ((lon % 360) + 360) % 360 % 30;
    lines.push(`  H${i+1}: ${sign} ${deg.toFixed(2)}°`);
  });
  lines.push('');

  lines.push('ASPECTS:');
  for (const asp of aspects.slice(0, 30)) {
    lines.push(`  ${asp.a} ${asp.kind} ${asp.b} (orb ${asp.orb.toFixed(1)}° ${asp.applying ? 'applying' : 'separating'})`);
  }
  lines.push('');

  lines.push(`Vedic ASC rashi: ${chart.vedic.ascendantRashi} · Ayanamsa: ${chart.vedic.ayanamsa.toFixed(2)}°`);

  const analysis = analyzeChart(chart);
  lines.push('');
  lines.push(formatChartAnalysis(chart, analysis));

  return lines.join('\n');
}

export function buildBodySection(bodyId: BodyId, chart: NatalChart): InterpretSection {
  const body = chart.western.bodies[bodyId];
  if (!body) return { type: 'body', label: bodyId, prompt: `Interpret ${bodyId} in this chart.` };

  const retro    = body.isRetrograde ? ' retrograde' : '';
  const dig      = chart.western.dignities[bodyId]?.label;
  const digNote  = dig ? ` (${dig})` : '';

  const bodyAspects = chart.western.aspects
    .filter(a => a.a === bodyId || a.b === bodyId)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5)
    .map(a => {
      const other = a.a === bodyId ? a.b : a.a;
      const otherName = BODY_LABEL[other] ?? other;
      return `${a.kind} ${otherName} (${a.orb.toFixed(1)}°)`;
    });

  const aspLine = bodyAspects.length > 0
    ? ` Aspects: ${bodyAspects.join(', ')}.`
    : '';

  const name = BODY_LABEL[bodyId] ?? bodyId;
  const analysis = analyzeChart(chart);
  const synthCtx = bodyContext(bodyId, chart, analysis);

  return {
    type: 'body',
    label: `${cap(bodyId)} in ${cap(body.sign)} · House ${body.house}`,
    prompt: `${synthCtx}

Interpret ${name}${retro} in ${body.sign}${digNote}, House ${body.house}.${aspLine}

Draw on the full chart in context. Synthesize sign + house + aspects + the nodal axis + any elemental or modality patterns you observe. What does this configuration mechanically produce in the person's psychology — not what it symbolizes in the abstract, but what internal dynamic it actually creates? What is the core tension or polarity at work: the desire structure and the fear structure, the drive toward expression and the defense against it?

Trace the compensatory arc: what adaptive strategy does this placement produce, how does that strategy serve the person, and where does it break down — in relationships, in ambition, in the body, in the inner life? Show the mechanism that links the placement to the pattern.

Do not explain what the placement means in general. Reveal what it does in this specific chart. Weight the interpretation toward the dominant themes identified in the synthesis context.`,
  };
}

export function buildHouseSection(houseNum: number, chart: NatalChart): InterpretSection {
  const cuspLon  = chart.western.houses.cusps[houseNum - 1];
  const signIdx  = Math.floor(((cuspLon % 360) + 360) % 360 / 30);
  const sign     = SIGNS[signIdx];

  const planetsIn = Object.entries(chart.western.bodies)
    .filter(([, b]) => b.house === houseNum && !['asc', 'mc'].includes(b.id))
    .map(([id]) => BODY_LABEL[id as BodyId] ?? id);

  const planetsNote = planetsIn.length > 0
    ? ` Planets currently living in this house: ${planetsIn.join(', ')}.`
    : ' This house has no natal planets in it — its themes are still very much alive, but they operate more quietly, colored primarily by the sign on the cusp and the house ruler\'s placement.';

  const analysis = analyzeChart(chart);
  const synthCtx = houseContext(houseNum, chart, analysis);

  const houseThemes: Record<number, string> = {
    1:  'identity, appearance, how you instinctively meet the world, and the energy you lead with',
    2:  'your relationship with money, possessions, and self-worth — what you value and how you earn',
    3:  'the mind, communication, siblings, short journeys, and how you learn and express ideas',
    4:  'home, family, roots, ancestry, and your emotional foundation — the private inner world',
    5:  'creativity, joy, romance, children, and self-expression — everything you do for the love of doing it',
    6:  'daily work, health, routines, and service — how you show up in the ordinary texture of life',
    7:  'partnerships, marriage, and one-on-one relationships — what you seek in others and what you offer',
    8:  'transformation, death and rebirth, sexuality, shared resources, and the deep psyche',
    9:  'philosophy, higher education, travel, spirituality, and the search for meaning',
    10: 'career, public reputation, vocation, and how you wish to be remembered — your legacy',
    11: 'friends, community, social ideals, and the vision you hold for the future',
    12: 'the unconscious, solitude, hidden matters, spirituality, and what lies beneath ordinary awareness',
  };

  return {
    type: 'house',
    label: `House ${houseNum} · ${cap(sign)} on cusp`,
    prompt: `${synthCtx}

Interpret the ${houseNum}${ordSuffix(houseNum)} house — ${houseThemes[houseNum] ?? 'this life domain'} — with ${sign} on the cusp.${planetsNote}

Draw on the full chart. Analyze what this house configuration mechanically produces: how does ${sign}'s specific psychological signature shape the approach to this life domain — not just the style, but the underlying motivation, the defensive structure around it, and the growth edge? What does ${sign} want from this arena, and what does it fear? How does that tension play out in actual behavior?

If planets occupy the house, show how their drives interact with and complicate the sign's energy — what inner conflicts or amplifications arise? If the house is empty, trace how the ruler's placement elsewhere imports its conditions into this domain.

Root every observation in what is specific to this chart. Name the contradiction at the heart of it. Frame the interpretation through the dominant themes in the synthesis context.`,
  };
}

export function buildAspectSection(asp: Aspect, chart: NatalChart): InterpretSection {
  const aName = BODY_LABEL[asp.a] ?? asp.a;
  const bName = BODY_LABEL[asp.b] ?? asp.b;
  const analysis = analyzeChart(chart);
  const synthCtx = aspectContext(asp.a, asp.b, chart, analysis);

  return {
    type: 'aspect',
    label: `${aName} ${asp.kind} ${bName}`,
    prompt: `${synthCtx}

Interpret the ${asp.kind} between ${aName} and ${bName} in this chart (${asp.orb.toFixed(1)}° orb, ${asp.applying ? 'applying' : 'separating'}).

Draw on the full chart. What does this specific planetary pairing create as an internal dynamic — not what a ${asp.kind} generically means, but what these two particular drives, in these signs and houses, produce in this person's psychology? How do they amplify, contradict, block, or shadow each other? What is the felt quality of their interaction — what does the person actually experience around this energy, and what do they tend to do with it?

Trace the mechanism: what compensatory pattern does this aspect generate? Where does it produce strength through friction, and where does it create a recurring breakdown — in relationships, in self-expression, in the way the person moves toward what they want? If the orb is tight, treat this as a primary psychological structure, not background noise.

Identify the developmental arc: what becomes available when this tension is held consciously rather than enacted automatically? Ground the interpretation in the chart's dominant themes from the synthesis context.`,
  };
}

export function buildVedicBodySection(bodyId: BodyId, chart: NatalChart): InterpretSection {
  const body     = chart.vedic.bodies[bodyId];
  if (!body) return { type: 'body', label: `Vedic ${bodyId}`, prompt: `Interpret ${bodyId} in this Vedic chart.` };

  const retro    = body.isRetrograde ? ' retrograde' : '';
  const nakName  = body.nakshatra.charAt(0).toUpperCase() + body.nakshatra.slice(1).replace(/([A-Z])/g, ' $1').trim();
  const lordName = BODY_LABEL[body.nakshatraLord as BodyId] ?? body.nakshatraLord;
  const bodyName = bodyId === 'trueNode' ? 'Rahu' : bodyId === 'southNode' ? 'Ketu' : cap(bodyId);

  return {
    type: 'body',
    label: `Vedic · ${bodyName} in ${cap(body.sign)} · ${nakName} pada ${body.nakshatraPada}`,
    prompt: `Interpret ${bodyName}${retro} in sidereal ${body.sign}, House ${body.house}, nakshatra ${nakName} pada ${body.nakshatraPada}, nakshatra lord ${lordName}.

Draw on the full Vedic chart. Synthesize rashi + bhava + nakshatra + nakshatra lord's placement + the graha's relationship to the lagna lord and nodal axis. What does this configuration produce as a soul-level pattern — not what it symbolizes in a textbook sense, but what karmic structure and developmental pressure it creates in this specific chart?

Analyze ${nakName} precisely: its mythic substrate, the quality of its ruling deity's energy, and how that nakshatra's specific psychological signature shapes the way ${bodyName} expresses here — what it drives toward, what it fears, what it tries to resolve. Then show how rashi and bhava add their conditions to that core impulse.

If interpreting Rahu or Ketu, focus on the mechanism of the karmic axis: what the south node position indicates about the over-developed psychological function being released, and what the north node's placement is demanding be built — not as spiritual advice, but as a description of the tension the person actually lives with.

Show the evolutionary arc latent in the configuration without flattening it into either damage or aspiration.`,
  };
}

export function buildTransitSection(transit: TransitAspect, natal: NatalChart): InterpretSection {
  const natalBody = natal.western.bodies[transit.natalBody];
  const tName     = BODY_LABEL[transit.transitBody] ?? transit.transitBody;
  const nName     = BODY_LABEL[transit.natalBody]   ?? transit.natalBody;

  const timingNote = transit.applying
    ? transit.daysToExact < 1
      ? 'This is exact right now — the influence is at its peak.'
      : `This is still building — it reaches exactness in about ${Math.round(transit.daysToExact)} days, so the energy is intensifying.`
    : `This passed its peak about ${Math.round(transit.daysToExact)} days ago and is now slowly releasing.`;

  const durationNote = ['pluto','neptune','uranus','saturn','jupiter'].includes(transit.transitBody)
    ? `${tName} moves slowly, so this transit is active for weeks to months — sometimes returning multiple times.`
    : `${tName} moves quickly, so this transit lasts only a few days.`;

  return {
    type: 'transit',
    label: `Transit: ${tName} ${transit.kind} natal ${nName}`,
    prompt: `Interpret transiting ${tName} ${transit.kind} natal ${nName} in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'} (${transit.orb.toFixed(1)}° orb). ${timingNote} ${durationNote}

Draw on the full natal chart. What does this transit activate in the natal chart's existing architecture — not as an isolated event, but as a pressure applied to a specific psychological structure? What is the natal ${nName}'s role in this chart — what complex does it anchor, what house does it rule, how does it connect to other configurations — and how does transiting ${tName} now bear on that structure?

Analyze the mechanism of contact: what does ${tName} as a transiting force want to reorganize, dissolve, accelerate, or crystallize, and what in the natal ${nName}'s configuration is being asked to respond? Describe the internal quality of this activation — the felt pressure, the emerging themes, the territory being entered. Speak about what is being demanded, not what will happen.

Where relevant, reference other natal planets being simultaneously activated or the house that transiting ${tName} is moving through.`,
  };
}

export function buildProgressedBodySection(
  bodyId: BodyId,
  progBody: BodyPosition,
  natal: NatalChart,
): InterpretSection {
  const name      = BODY_LABEL[bodyId] ?? cap(bodyId);
  const natalBody = natal.western.bodies[bodyId];
  const movesNote = bodyId === 'moon'
    ? 'The progressed Moon moves through a sign roughly every 2–2.5 years, making it the most active timer of inner emotional shifts.'
    : bodyId === 'sun'
    ? 'The progressed Sun moves about one degree per year — a degree per year of your life — making sign changes rare and deeply significant milestones.'
    : 'Progressed planets move very slowly, marking long chapters of inner development rather than day-to-day events.';

  return {
    type: 'progression',
    label: `Progressed ${name} in ${cap(progBody.sign)}`,
    prompt: `Interpret progressed ${name}${progBody.isRetrograde ? ' retrograde' : ''} in ${progBody.sign}, House ${progBody.house}. Natal ${name}: ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'}. ${movesNote}

Draw on the full natal chart. What does the shift from the natal sign to the progressed sign represent as an internal developmental event — not symbolically in general, but specifically for someone with this natal ${name} configuration, in this chart, with these aspects and house placements? What in the natal setup made this sign transition necessary or inevitable? What psychological function was reaching its limits in the natal sign, and what is the progressed sign now being asked to develop?

Analyze the mechanism: what new psychological territory is the progressed ${name} mapping? What capacity is being asked to come online — and what resistance, avoidance, or disorientation typically accompanies it? Name the inner atmosphere of this chapter with precision.

If the progressed ${name} has formed any new aspects not present natally, address what those contacts are activating.`,
  };
}

export function buildProgressedAspectSection(asp: ProgressedAspect, natal: NatalChart): InterpretSection {
  const pName     = BODY_LABEL[asp.progressedBody] ?? cap(asp.progressedBody);
  const nName     = BODY_LABEL[asp.natalBody]      ?? cap(asp.natalBody);
  const natalBody = natal.western.bodies[asp.natalBody];
  const buildingNote = asp.applying
    ? 'This aspect is still building toward exactness — the energy is intensifying and will be strongest when exact.'
    : 'This aspect has just passed its peak and is now slowly releasing — its themes are present and will gradually ease.';

  return {
    type: 'progression',
    label: `Progressed ${pName} ${asp.kind} natal ${nName}`,
    prompt: `Interpret progressed ${pName} ${asp.kind} natal ${nName} in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'} (${asp.orb.toFixed(1)}° orb, ${asp.applying ? 'applying' : 'separating'}). ${buildingNote}

Draw on the full natal chart. What does this aspect contact activate in the person's existing psychological structure — not what a ${asp.kind} generically does, but what happens when the progressed ${pName}'s current developmental agenda meets the natal ${nName}'s established complex? What is the nature of this inner encounter: a collision, a recognition, an integration, a confrontation with something previously unconscious?

Analyze the natal ${nName}'s role in this chart specifically — what it represents, what it's been carrying, how it connects to other configurations — and then show what the progressed ${pName} is now asking of that structure. What is being pressured to change, and what in the person will resist that change?

Name the psychological event taking place with precision. What capacity is being demanded, and what old pattern is being asked to yield?`,
  };
}

export function buildDashaSection(maha: DashaPeriod, antar: DashaPeriod, natal: NatalChart): InterpretSection {
  const mahaName = cap(maha.lord);
  const antarName = cap(antar.lord);

  const mahaBodyId  = dashaLordToBodyId(maha.lord);
  const antarBodyId = dashaLordToBodyId(antar.lord);
  const mahaVedic   = mahaBodyId  ? natal.vedic.bodies[mahaBodyId]  : null;
  const antarVedic  = antarBodyId ? natal.vedic.bodies[antarBodyId] : null;

  const nakFmt = (v: typeof mahaVedic) => {
    if (!v) return '';
    const nak = v.nakshatra.charAt(0).toUpperCase() + v.nakshatra.slice(1).replace(/([A-Z])/g, ' $1').trim();
    return `in ${v.sign} (nakshatra: ${nak}), House ${v.house}`;
  };

  const mahaStr  = mahaVedic  ? `${mahaName} is ${nakFmt(mahaVedic)}`  : `${mahaName}`;
  const antarStr = antarVedic ? `${antarName} is ${nakFmt(antarVedic)}` : `${antarName}`;

  return {
    type: 'dasha',
    label: `${mahaName} Mahadasha · ${antarName} Antardasha`,
    prompt: `Interpret the current Vimshottari Dasha period: ${mahaName} Mahadasha (${maha.startISO}–${maha.endISO}, ${maha.durationYears.toFixed(1)} yrs) / ${antarName} Antardasha (${antar.startISO}–${antar.endISO}).

In this natal Vedic chart: ${mahaStr}; ${antarStr}.

Draw on the full Vedic chart. What does this Dasha period mechanically activate in this specific chart — not what a ${mahaName} Mahadasha generically produces, but what happens when ${mahaName}, as placed and conditioned in this particular chart, takes on the role of ruling the life chapter? What natal configurations does it amplify, what karmic material does it surface, which houses does it govern, and what does its nakshatra placement tell you about the quality and direction of the period?

Analyze ${mahaName}'s actual condition in this chart — dignity, house, aspects, relationship to lagna and nodes — and show how those conditions shape the texture of the current period. Then layer in the ${antarName} sub-period: how does ${antarName}'s natal placement interact with ${mahaName}'s, and what specific sub-themes or tensions does this combination introduce within the broader chapter?

Be precise about what is being demanded and what is being released. Name the inner and outer terrain of this period as it pertains to this chart specifically.`,
  };
}

export function buildSynastryAspectSection(
  asp: SynastryAspect,
  chartA: NatalChart,
  chartB: NatalChart,
): InterpretSection {
  const aName  = BODY_LABEL[asp.bodyA] ?? cap(asp.bodyA);
  const bName  = BODY_LABEL[asp.bodyB] ?? cap(asp.bodyB);
  const nameA  = chartA.input.name?.trim() || 'Person A';
  const nameB  = chartB.input.name?.trim() || 'Person B';
  const bodyA  = chartA.western.bodies[asp.bodyA];
  const bodyB  = chartB.western.bodies[asp.bodyB];

  const bSun  = chartB.western.bodies.sun;
  const bMoon = chartB.western.bodies.moon;
  const bAsc  = chartB.western.bodies.asc;
  const bSummary = [
    bSun  ? `Sun in ${bSun.sign}`   : '',
    bMoon ? `Moon in ${bMoon.sign}` : '',
    bAsc  ? `Rising ${bAsc.sign}`  : '',
  ].filter(Boolean).join(', ');

  return {
    type: 'synastry',
    label: `Synastry: ${nameA}'s ${aName} ${asp.kind} ${nameB}'s ${bName}`,
    prompt: `Interpret this synastry contact: ${nameA}'s ${aName} (${bodyA?.sign ?? '?'}, House ${bodyA?.house ?? '?'}) ${asp.kind} ${nameB}'s ${bName} (${bodyB?.sign ?? '?'}) — ${asp.orb.toFixed(1)}° orb. ${nameB}'s key placements: ${bSummary}. The full natal chart provided is ${nameA}'s.

Analyze what this specific inter-aspect creates as a relational dynamic — not what a ${asp.kind} generically means, but what happens when ${nameA}'s ${aName}, conditioned by its natal sign and house, makes this contact with ${nameB}'s ${bName}. What does each person's planet represent in its own chart — what complex does it carry, what need does it express — and how does the contact between them produce a specific interpersonal dynamic?

Name the mechanism: what does ${nameA} tend to activate or trigger in ${nameB} around this contact, and what does ${nameB} activate in ${nameA}? Is this a point of magnetic recognition, mutual amplification, unconscious projection, or unresolved tension that keeps pulling them back? Where is the gift, and where is the growing edge — and are those the same thing?

Consider what each person's wound or strength in this area calls forth from the other. Speak to ${nameA} directly. Be honest about the complexity of the dynamic without reducing it to either fate or warning.`,
  };
}

function ordSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

// ── Chart Snapshot (free teaser) ──────────────────────────────────────────────

export function buildSnapshotSystemPrompt(): string {
  return `You are an insightful astrologer writing a free chart snapshot — a warm, specific 120–180 word overview meant to give someone an immediate sense of their chart's dominant signature: enough to feel genuinely seen, enough to want to explore more.

Write for someone who may be new to astrology. Plain language. If you use an astrological term, briefly translate it in the same sentence. Warm, soulful, and intelligent — like a perceptive friend who understands charts deeply. Psychologically specific: avoid generic horoscope language. The reader should feel "you are describing me," not "this could apply to anyone."

FORMAT:
A thematic title on its own line — 3 to 6 words, no punctuation, no planet or sign names in the title. Then a blank line. Then a single paragraph of 120–180 words.

CONTENT REQUIREMENTS (incorporate naturally — do not list, do not enumerate):
1. Dominant elemental tone — translate into how this feels to live (not just a label)
2. Dominant modality — translate into behavioral or relational style
3. Main archetypal signature — the 1-2 convergent themes with the highest score
4. One sentence that feels emotionally specific and psychologically resonant — the "you get me" moment
5. Final sentence: open a curiosity gap — hint that the full reading reveals how these patterns shape specific areas of life, without naming them all

Do not mention every placement. Focus on 2–3 convergent patterns. Never use fatalistic language. Never say "this placement means…" — describe lived experience instead. Always complete the paragraph before stopping.

FORBIDDEN LANGUAGE — NEVER USE:

These are stock AI writing tics that make interpretations feel machine-generated. Do not use them.

Banned words: delve, tapestry, nuanced (as filler), multifaceted, intricate (as filler), profound (used loosely), transformative, holistic, robust, unfold/unfolding, harness, leverage, navigate (as metaphor), unlock, embark, unpack, foster, facilitate, underscore, weave/woven (as metaphor), interplay, landscape (as metaphor), resonate/resonant (as filler).

Banned phrases: "at its core," "at the end of the day," "in the realm of," "speaks to," "it's worth noting," "deep dive," "dance between," "holding space," "lean into," "sit with," "show up," "your authentic self," "the universe is calling you to," "you are meant to," "your soul's purpose is," "the cosmos are guiding you," "furthermore," "moreover," "in conclusion," "that said," "certainly," "absolutely," "what emerges is," "what arises is," "the key here is," "put simply," "in other words," "a kind of," "a sort of," "in a way," "in some sense."

PUNCTUATION DISCIPLINE:

Em dashes (—): use at most once per paragraph, only when grammatically necessary. Never use an em dash to introduce a dramatic restatement or fake rhetorical pause. Rewrite those as normal sentences.

Hyphens in compound adjectives: avoid unless the hyphen genuinely prevents misreading. Write "hard won" not "hard-won," "deeply rooted" not "deeply-rooted," "emotionally charged" not "emotionally-charged." The hyphenated compound adjective is a major AI stylistic tell.

RHYTHM:

Do not start three or more consecutive sentences with "This." Vary sentence openings. Do not open paragraphs with "There is a..." or "What [verb]s is..." Do not use parenthetical hedges like "(in a way)" or "(of sorts)" — commit to the observation or rewrite it.

If you reach for any of the above, stop and rewrite with a concrete, specific observation instead.`;
}

export function buildSnapshotPrompt(chart: NatalChart): InterpretSection {
  const analysis = analyzeChart(chart);

  // Determine element framing (dominant if ≥40%, balanced otherwise)
  const elPct   = analysis.elementBalance;
  const elDom   = analysis.dominantElement;
  const elWeak  = analysis.weakestElement;
  const isDomEl = elPct[elDom].percent >= 40;
  const isWeakEl = elPct[elWeak].percent <= 12;

  // Determine modality framing (dominant if ≥45%, balanced otherwise)
  const modPct  = analysis.modalityBalance;
  const modDom  = analysis.dominantModality;
  const isDomMod = modPct[modDom].percent >= 45;

  // Element description lines for the prompt
  const elementLine = isDomEl
    ? `Dominant element: ${elDom.toUpperCase()} (${elPct[elDom].percent}%)${isWeakEl ? ` — notably weak: ${elWeak.toUpperCase()} (${elPct[elWeak].percent}%)` : ''}`
    : `Element balance: relatively even — Fire ${elPct.fire.percent}% · Earth ${elPct.earth.percent}% · Air ${elPct.air.percent}% · Water ${elPct.water.percent}%`;

  // Modality description lines
  const modalityLine = isDomMod
    ? `Dominant modality: ${modDom.toUpperCase()} (${modPct[modDom].percent}%)`
    : `Modality balance: relatively even — Cardinal ${modPct.cardinal.percent}% · Fixed ${modPct.fixed.percent}% · Mutable ${modPct.mutable.percent}%`;

  // Top 3 convergent themes
  const topThemes = analysis.dominantThemes.slice(0, 3)
    .map((t, i) => `${i + 1}. ${t.label} (score ${t.weight}) — convergence: ${t.indicators.slice(0, 3).join(', ')}`)
    .join('\n');

  // Key chart facts (Sun/Moon/ASC + chart ruler)
  const sun  = chart.western.bodies.sun;
  const moon = chart.western.bodies.moon;
  const asc  = chart.western.bodies.asc;
  const coreLine = [
    sun  ? `Sun in ${sun.sign} H${sun.house}`   : '',
    moon ? `Moon in ${moon.sign} H${moon.house}` : '',
    asc  ? `${asc.sign} rising`                  : '',
    analysis.chartRuler ? `Chart ruler: ${analysis.chartRuler.label} in ${analysis.chartRuler.sign} H${analysis.chartRuler.house}` : '',
  ].filter(Boolean).join(' · ');

  const stelliumLine = analysis.stelliums.length
    ? `Stelliums: ${analysis.stelliums.map(s => `${s.label} (${s.planets.join(', ')})`).join('; ')}`
    : '';

  const configLine = analysis.configurations.length
    ? `Major configurations: ${analysis.configurations.map(c => c.type).join(', ')}`
    : '';

  const prompt = `SNAPSHOT REQUEST

Key chart signature: ${coreLine}
${stelliumLine ? stelliumLine + '\n' : ''}${configLine ? configLine + '\n' : ''}
${elementLine}
${modalityLine}
Sun-Moon relationship: ${Math.round(analysis.sunMoonRelationship.angle)}° apart — ${analysis.sunMoonRelationship.phaseDescription}
Chart shape: ${analysis.chartShape.split(' — ')[0]}

TOP CONVERGENT THEMES (highest-scoring archetypal patterns across the whole chart):
${topThemes}

Write the snapshot now. Title first (3–6 words, no punctuation), blank line, then a single 120–180 word paragraph. Use plain language. No bullet points. No jargon without translation. End the paragraph on a complete sentence.`;

  return {
    type: 'snapshot',
    label: 'Your Chart at a Glance',
    prompt,
  };
}
