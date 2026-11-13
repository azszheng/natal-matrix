/**
 * humanDesignPrompts.ts
 * AI prompt builders for the Human Design interpretation layer.
 *
 * Mirrors the pattern in vibrationalPrompts.ts / ipsePrompts.ts: each builder
 * assembles the specific chart facts (gate, line, planet, center definition,
 * channel status, profile, authority...) into a prompt, and a single shared
 * system prompt (buildHumanDesignSystemPrompt) carries the voice, tone rules,
 * and non-deterministic framing that apply across every section. The actual
 * prose is generated at request time by /api/interpret — nothing here is
 * static template text.
 */

import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from './prompts';
import type {
  HdChart, HdDefinition, CenterId, Channel, HdPlanetId,
} from '@/lib/astro/humandesign-constants';
import { CENTER_LABEL } from '@/lib/astro/humandesign-constants';
import {
  TYPE_SIGNATURE, AUTHORITY_MEANING, CENTER_MEANING, GATE_KEYNOTE,
  PROFILE_LINE_MEANING, PLANET_FRAME, LINE_FRAME, TYPE_EXPERIMENT_SEED,
} from '@/lib/astro/humandesign-meanings';
import {
  getHangingActivations, isCenterDefined, getCenterForGate, PLANET_TIERS,
} from '@/lib/astro/humandesign-derive';
import type { EnrichedActivation } from '@/lib/astro/humandesign-derive';

// ── Shared helpers ────────────────────────────────────────────────────────────

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

export function planetLabel(p: HdPlanetId): string {
  const names: Record<HdPlanetId, string> = {
    sun: 'Sun', earth: 'Earth', moon: 'Moon', northNode: 'North Node', southNode: 'South Node',
    mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
    uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
  };
  return names[p];
}

function natalSummary(chart: NatalChart): string {
  const b = chart.western.bodies;
  return `Sun ${cap(b.sun.sign)} H${b.sun.house} · Moon ${cap(b.moon.sign)} H${b.moon.house} · ${cap(b.asc.sign)} Rising`;
}

function hdSnapshotLine(hdChart: HdChart): string {
  return `${hdChart.type} · ${hdChart.strategy} · ${hdChart.authority} authority · Profile ${hdChart.profile} · ${hdChart.definition} Definition`;
}

const MINOR_SAFETY_BLOCK = `MINOR CHART -- ADDITIONAL RULES:
This chart belongs to someone under 18. Do not use this reading to tell parents or guardians who the child "is," what they must become, or what to restrict. Frame everything as reflective language for the adults supporting this child, never as a fixed label on the child. Avoid deterministic claims about career, relationships, or personality. End with this exact reminder, verbatim: "Human Design is a symbolic and contemplative self-awareness system. For a young person, treat it as reflective language only -- never as a way to limit a child's identity, choices, education, relationships, or future."`;

function modeInstruction(mode: InterpretMode): string {
  if (mode === 'essence')
    return 'Length: 2-4 short paragraphs (roughly 180-320 words). Style: warm, plain language, minimal jargon -- explain what this feels like to live, and close with one simple reflection or practice.';
  if (mode === 'astrologer')
    return 'Length: 4-7 paragraphs (roughly 500-850 words). Style: precise and technically fluent -- name planet, line, center-definition state, channel status, and Personality/Design side explicitly, and use the astrology bridge where genuinely useful. Still write in full prose, still readable to a motivated non-specialist.';
  return 'Length: 4-6 paragraphs (roughly 350-600 words). Style: psychologically grounded and specific -- include conditioning patterns and at least one concrete relationship or work example.';
}

// ── System prompt (shared across all Human Design sections) ────────────────

export function buildHumanDesignSystemPrompt(mode: InterpretMode): string {
  return `You are a warm, precise Human Design guide writing for someone exploring their own chart. Human Design is a symbolic, contemplative self-awareness system -- not a medical, psychological, financial, or legal framework, and not a deterministic prediction of who someone is or what they will do. Treat every placement as a pattern to notice and experiment with, never as a verdict.

WHAT HUMAN DESIGN IS FOR IN THIS APP:
Astrology (used elsewhere in this app) explains the archetypal story -- psychological themes, wounds, gifts, timing. Human Design explains energy mechanics: how this person's energy actually operates, how they make aligned decisions, where they are consistent, where they are open to conditioning, and what a practical next experiment looks like. When you bridge to astrology, use it to add the psychological "why" underneath the Human Design mechanism -- never claim one system overrides the other.

CONTENT RULE -- THIS IS THE MOST IMPORTANT INSTRUCTION:
Every interpretation must be specific to the actual chart facts given to you (type, authority, gate, line, planet, center-definition state, channel status, Personality/Design side, profile, definition). Never write a generic paragraph that could apply to any chart. If two people share a Type but differ in Authority or an activated gate, their interpretations should read differently. Reference at least one concrete chart fact in nearly every paragraph.

FORMAT (apply to every section unless told otherwise):
A thematic title on its own line (3-6 words, no punctuation, no gate/planet numbers in the title), then a blank line, then flowing prose paragraphs. No bullet points, no headers inside the body, no numbered lists.

${modeInstruction(mode)}

REQUIRED SHAPE PER SECTION (weave these in as prose, never as labeled sub-headings):
1. What this specifically means, grounded in the given chart facts.
2. How it may show up in real, everyday behavior.
3. What the aligned expression looks like.
4. What the conditioned or distorted expression looks like.
5. One concrete, practical way to work with it.

DEFINED VS OPEN CENTERS -- ALWAYS APPLY:
When a center is defined, treat it as a consistent part of this person's energetic pattern -- not automatically better, just reliable. When a center is open or undefined, treat it as genuinely sensitive to environment and other people, with real potential for wisdom once the person stops over-identifying with energy that isn't originally theirs -- never frame it as broken, weak, or lesser.

PERSONALITY VS DESIGN -- ALWAYS APPLY:
A Personality (conscious) activation is more available to the person's own self-awareness -- they can usually recognize it in themselves. A Design (unconscious) activation is more body-based and instinctive -- less consciously identified, but often visible to others in habits, timing, or body language. Never frame a Design activation as hidden in a negative, secretive, or shameful sense.

CHANNEL STATUS -- ALWAYS APPLY:
A full channel (both gates activated, Personality or Design, anywhere in the chart) is a stable, consistent life theme -- treat it as one of the most defining features of the chart. A hanging gate (only one side of a channel activated) means the person consistently carries one half of that theme and may feel pulled toward, fascinated by, or completed by people who carry the missing gate -- frame this as an openness to connection, never as incompleteness or deficiency.

TONE -- USE LANGUAGE LIKE:
"You may notice...", "This can show up as...", "When aligned...", "When conditioned...", "A useful experiment is...", "This does not mean...".

NEVER USE DETERMINISTIC OR ABSOLUTE LANGUAGE:
Never say "you are destined to," "you must," "you will always," "this proves," "you are broken," "you cannot," or make health predictions, diagnose trauma, or tell someone what job or partner to choose. Do not pathologize any placement -- even a difficult one carries a latent capacity once it is worked with consciously.

Avoid generic filler ("you are here to live authentically and share your gifts") in favor of chart-specific observations. If you cannot ground a sentence in an actual chart fact, cut it.`;
}

// ── 1. Overview ──────────────────────────────────────────────────────────────

export function buildHumanDesignOverviewSection(hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const signature = TYPE_SIGNATURE[hdChart.type];
  const prompt = `HUMAN DESIGN -- CHART OVERVIEW

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Type: ${hdChart.type}
Strategy: ${hdChart.strategy}
Authority: ${hdChart.authority}
Signature (alignment feedback): ${signature}
Not-Self Theme (misalignment feedback): ${hdChart.notSelf}
Profile: ${hdChart.profile} (${PROFILE_LINE_MEANING[Number(hdChart.profile.split('/')[0])]?.name} / ${PROFILE_LINE_MEANING[Number(hdChart.profile.split('/')[1])]?.name})
Definition: ${hdChart.definition}
Defined centers: ${hdChart.definedCenters.map(c => CENTER_LABEL[c]).join(', ') || 'none'}

Write the opening orientation for this person's Human Design report -- their operating system in miniature. Address, in flowing prose: what their Type + Strategy means for how life should come to them; what their Authority means for how they should make decisions; and what Signature vs Not-Self Theme means as real-time feedback they can actually feel. End by naming one thing this specific combination of Type, Authority, and Definition makes distinctly true for them (not a generic Type description).

${isMinor ? '' : 'Include, worked naturally into the prose (not as a separate disclaimer paragraph bolted on): a brief note that Human Design is a symbolic, contemplative tool for reflection, not a fixed prediction.'}

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'Human Design at a Glance',
    frontTitle: 'Your Energetic Operating System',
    anchor: hdSnapshotLine(hdChart),
    prompt,
  };
}

// ── 2. Type & Strategy ───────────────────────────────────────────────────────

export function buildHumanDesignTypeSection(hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const prompt = `HUMAN DESIGN -- TYPE & STRATEGY

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Type: ${hdChart.type}
Strategy: ${hdChart.strategy}
Signature: ${TYPE_SIGNATURE[hdChart.type]}
Not-Self Theme: ${hdChart.notSelf}
Definition: ${hdChart.definition}
Defined centers: ${hdChart.definedCenters.map(c => CENTER_LABEL[c]).join(', ') || 'none'}

Explain how this person's energy actually works day to day, grounded in ${hdChart.type} mechanics and their ${hdChart.definition} definition specifically. Cover: how their Strategy (${hdChart.strategy}) determines how life should come to them versus how they might currently be forcing it; how ${TYPE_SIGNATURE[hdChart.type]} shows up as real-time positive feedback when they're aligned; and how ${hdChart.notSelf} shows up as the warning sign when they've drifted from Strategy. Ground at least one paragraph in how their specific Definition (${hdChart.definition}) changes how this Type's energy actually moves through them (e.g. a Single Definition Generator experiences sacral response differently than a widely Split one).

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'How Your Energy Works',
    frontTitle: `${hdChart.type} · ${hdChart.strategy}`,
    anchor: `${hdChart.type} · ${hdChart.definition} Definition`,
    prompt,
  };
}

// ── 3. Authority ─────────────────────────────────────────────────────────────

export function buildHumanDesignAuthoritySection(hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const meaning = AUTHORITY_MEANING[hdChart.authority];
  const prompt = `HUMAN DESIGN -- AUTHORITY (DECISION-MAKING)

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Type: ${hdChart.type}
Authority: ${hdChart.authority}
Mechanism: ${meaning.explanation}
Baseline practice: ${meaning.practice}
Defined centers: ${hdChart.definedCenters.map(c => CENTER_LABEL[c]).join(', ') || 'none'}

Explain how ${hdChart.authority} authority actually works as a decision-making mechanism for this specific person -- not a generic definition. Distinguish clearly between Strategy (how life comes to them) and Authority (how they know a specific "yes" or "no" once it's in front of them), and be explicit that the mind can gather information but should not be treated as final authority here. Ground the practice in something concrete: adapt "${meaning.practice}" into a vivid, specific real-life scenario (a decision about work, a relationship, a move, a commitment) rather than repeating it generically. Note one common way this Authority gets overridden by mental pressure or social expectation, and what that override tends to cost this person.

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'How You Make Decisions',
    frontTitle: `${hdChart.authority} Authority`,
    anchor: meaning.explanation,
    prompt,
  };
}

// ── 4. Centers ───────────────────────────────────────────────────────────────

export function buildHumanDesignCenterSection(center: CenterId, hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const defined = isCenterDefined(center, hdChart.definedCenters);
  const meaning = CENTER_MEANING[center];
  const gatesInThisCenter = [...new Set(
    [...hdChart.personality, ...hdChart.design]
      .filter(a => hdChart.definedGates.includes(a.gate) && getCenterForGate(a.gate) === center)
      .map(a => a.gate),
  )];

  const prompt = `HUMAN DESIGN -- CENTER: ${CENTER_LABEL[center]}

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Center: ${CENTER_LABEL[center]} -- governs ${meaning.role}
State in this chart: ${defined ? 'DEFINED (consistent)' : 'OPEN / UNDEFINED (sensitive to environment)'}
${defined ? `What definition means here: ${meaning.definedMeaning}` : `What openness means here: ${meaning.openMeaning}`}
Type: ${hdChart.type} · Authority: ${hdChart.authority}
Gates activated in this chart that touch this center: ${gatesInThisCenter.join(', ') || 'none directly activated'}

Write the interpretation for this ${defined ? 'defined' : 'open'} ${CENTER_LABEL[center]} center specifically for this person -- not a generic center description. Cover: what this center governs; what it concretely means that it is ${defined ? 'defined' : 'open'} for this specific person (reference their ${hdChart.type} type or ${hdChart.authority} authority if relevant to how this center's state interacts with it); the aligned expression; the conditioning risk (${defined ? 'what happens when they assume everyone processes this the way they consistently do' : 'what happens when they absorb and over-identify with energy that is not originally theirs'}); and one specific, practical experiment to try this week.

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: `${CENTER_LABEL[center]} Center`,
    frontTitle: `${CENTER_LABEL[center]} -- ${defined ? 'Defined' : 'Open'}`,
    anchor: defined ? meaning.definedMeaning : meaning.openMeaning,
    prompt,
  };
}

// ── 5. Profile ───────────────────────────────────────────────────────────────

export function buildHumanDesignProfileSection(hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const [pLineNum, dLineNum] = hdChart.profile.split('/').map(Number);
  const pLine = PROFILE_LINE_MEANING[pLineNum];
  const dLine = PROFILE_LINE_MEANING[dLineNum];

  const prompt = `HUMAN DESIGN -- PROFILE ${hdChart.profile}

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Profile: ${hdChart.profile}
Conscious (Personality) line ${pLineNum} -- ${pLine.name}: ${pLine.theme}
Unconscious (Design) line ${dLineNum} -- ${dLine.name}: ${dLine.theme}
Type: ${hdChart.type}

Interpret each line individually first -- what the conscious ${pLine.name} line (line ${pLineNum}) contributes, and what the unconscious ${dLine.name} line (line ${dLineNum}) contributes underneath it -- then interpret the combined ${hdChart.profile} profile as a single lived pattern, not two separate facts. Be specific about how these two lines interact or create tension in this person (e.g. a conscious drive toward one mode while the unconscious body runs on another). Name the profile's shadow tendency and its earned gift once matured. Ground at least one sentence in how this profile interacts with their ${hdChart.type} type specifically.

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'Your Profile',
    frontTitle: `Profile ${hdChart.profile} -- ${pLine.name} / ${dLine.name}`,
    anchor: `${pLine.theme} / ${dLine.theme}`,
    prompt,
  };
}

// ── 6. Definition ────────────────────────────────────────────────────────────

const DEFINITION_FRAME: Record<HdDefinition, string> = {
  'Single':           'all defined centers form one continuous circuit -- internally self-contained processing',
  'Split':            'defined centers form two separate islands -- connection to certain people or environments can complete the circuit',
  'Triple Split':     'defined centers form three separate islands -- clarity often comes through movement and varied environments',
  'Quadruple Split':  'defined centers form four separate islands, the rarest and most independently-wired configuration -- needs real spaciousness and variety to integrate',
  'None':             'no consistently defined centers -- a Reflector pattern, wide open to the environment',
};

export function buildHumanDesignDefinitionSection(hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const prompt = `HUMAN DESIGN -- DEFINITION: ${hdChart.definition}

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Definition: ${hdChart.definition}
What this means structurally: ${DEFINITION_FRAME[hdChart.definition]}
Defined centers: ${hdChart.definedCenters.map(c => CENTER_LABEL[c]).join(', ') || 'none'}
Defined channels: ${hdChart.definedChannels.map(c => `${c.a}-${c.b} (${c.name})`).join('; ') || 'none'}
Type: ${hdChart.type}

Explain how this person's energy connects internally, grounded in their actual defined centers and channels listed above -- do not just define the definition type abstractly. ${hdChart.definition === 'Split' || hdChart.definition === 'Triple Split' || hdChart.definition === 'Quadruple Split' ? 'Since their definition is split, address what it feels like when the bridging centers/gates are missing versus present in a relationship, and the real risk of unconsciously seeking a partner or friend purely to feel "complete" rather than as a genuine connection.' : hdChart.definition === 'None' ? 'Since this is a Reflector\'s no-definition pattern, address what it means to have no fixed energetic circuit of one\'s own, and why forcing a fixed identity works against this design.' : 'Since this is a Single Definition, address both the gift of internal coherence and the shadow of assuming other people process reality with the same continuity.'}

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'Your Definition',
    frontTitle: `${hdChart.definition} Definition`,
    anchor: DEFINITION_FRAME[hdChart.definition],
    prompt,
  };
}

// ── 7. Channels (full channels only) ────────────────────────────────────────

export function buildHumanDesignChannelSection(channel: Channel, hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const gateA = GATE_KEYNOTE[channel.a];
  const gateB = GATE_KEYNOTE[channel.b];

  const prompt = `HUMAN DESIGN -- CHANNEL ${channel.a}-${channel.b}: ${channel.name}

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Channel: ${channel.a}-${channel.b}, "${channel.name}"
Traditional theme: ${channel.description}
Gate ${channel.a} keynote: ${gateA?.name} -- ${gateA?.theme}
Gate ${channel.b} keynote: ${gateB?.name} -- ${gateB?.theme}
Type: ${hdChart.type} · Authority: ${hdChart.authority} · Definition: ${hdChart.definition}

This is a completed, always-on channel in this person's chart -- a major, consistent life theme, not an occasional current. Cover: what this channel consistently gives this person (name both gates' contributions); how it affects daily energy; the aligned expression; the conditioned or distorted expression; a practical way to use it; and how it might show up specifically in relationships or work. Reference their ${hdChart.type} type or ${hdChart.authority} authority if it changes how this channel's theme actually gets used.

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: `Channel ${channel.a}-${channel.b} · ${channel.name}`,
    frontTitle: channel.name,
    anchor: `Gates ${channel.a}-${channel.b} · ${channel.description}`,
    prompt,
  };
}

// ── 8/9/10. Gate activations (covers "gate activations", "hanging gates",
//     and "conscious vs design" -- all are properties of one activation) ────

export function buildHumanDesignGateActivationSection(activation: EnrichedActivation, hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const keynote = GATE_KEYNOTE[activation.gate];
  const planetInfo = PLANET_FRAME[activation.planet];
  const lineInfo = LINE_FRAME[activation.line];
  const centerLabel = activation.center ? CENTER_LABEL[activation.center] : 'unknown';

  const fullChannels = activation.channels.filter(c => c.status === 'full_channel');
  const hangingChannels = activation.channels.filter(c => c.status === 'hanging_gate');

  const channelBlock = activation.channels.length === 0
    ? 'This gate is not part of a defined channel pairing in this chart.'
    : [
        ...fullChannels.map(c => `Full channel with Gate ${c.pairedGate} -- "${c.channel.name}" (${c.channel.description}). This is a complete, active circuit.`),
        ...hangingChannels.map(c => `Hanging gate -- the paired Gate ${c.pairedGate} (channel "${c.channel.name}") is NOT activated in this chart. This person consistently carries this half of the theme and may feel pulled toward people or situations that carry Gate ${c.pairedGate}.`),
      ].join('\n');

  const prompt = `HUMAN DESIGN -- GATE ${activation.gate}.${activation.line} IN ${planetLabel(activation.planet).toUpperCase()}

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Gate ${activation.gate} -- "${keynote?.name}": ${keynote?.theme}
Line ${activation.line}: ${lineInfo.theme}
Planet: ${planetLabel(activation.planet)} -- ${planetInfo.role}
Side: ${activation.side} (${activation.side === 'Personality' ? 'conscious -- more available to self-awareness' : 'unconscious -- more body-based and instinctive, often visible to others'})
Center: ${centerLabel}, ${activation.centerDefined ? 'DEFINED (consistent part of the energetic pattern)' : 'OPEN (more sensitive to environment and other people)'}
Channel status: ${channelBlock}

Write the interpretation for this exact gate/line/planet/side combination -- it must read differently from the same gate on a different planet or line. Address, in flowing prose: the gate's core theme as it specifically expresses through ${planetLabel(activation.planet)} (${planetInfo.phrase}); how the line-${activation.line} coloring changes the way it comes out (${lineInfo.question}); how the ${activation.side} side determines how consciously available this is to the person; how the ${activation.centerDefined ? 'defined' : 'open'} ${centerLabel} center changes whether this runs consistently or depends on environment; the aligned expression; the conditioned/shadow expression; and a specific, practical way to use it. ${fullChannels.length > 0 ? `Since this completes a full channel with Gate ${fullChannels[0].pairedGate}, treat that as the dominant, stable theme.` : hangingChannels.length > 0 ? `Since this is a hanging gate, name what the person may be drawn to in others who carry the missing gate, without framing them as incomplete.` : ''}

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: `Gate ${activation.gate}.${activation.line} · ${planetLabel(activation.planet)} · ${activation.side}`,
    frontTitle: `${keynote?.name ?? `Gate ${activation.gate}`} in ${planetLabel(activation.planet)}`,
    anchor: `Gate ${activation.gate}.${activation.line} · ${activation.side} · ${centerLabel} (${activation.centerDefined ? 'defined' : 'open'})`,
    prompt,
  };
}

// ── 11. Astrology bridge ─────────────────────────────────────────────────────

export function buildHumanDesignAstrologyBridgeSection(hdChart: HdChart, natalChart: NatalChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const b = natalChart.western.bodies;
  const prompt = `HUMAN DESIGN + ASTROLOGY BRIDGE

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}HUMAN DESIGN FACTS:
${hdSnapshotLine(hdChart)}
Defined centers: ${hdChart.definedCenters.map(c => CENTER_LABEL[c]).join(', ') || 'none'}

NATAL ASTROLOGY FACTS:
${natalSummary(natalChart)}
Mercury: ${cap(b.mercury.sign)} H${b.mercury.house}
Venus: ${cap(b.venus.sign)} H${b.venus.house}
Mars: ${cap(b.mars.sign)} H${b.mars.house}
Saturn: ${cap(b.saturn.sign)} H${b.saturn.house}

Write a short bridge between this person's astrology and their Human Design, but only where the connection is genuinely illuminating -- do not force a link for every placement. Pick 2-3 real points of resonance or productive tension (for example: Human Design ${hdChart.authority} authority alongside their natal Moon or Mercury placement; their Human Design Type alongside their Sun/Ascendant story; a defined vs open center alongside a natal house emphasis or stellium). For each, make the distinction explicit: astrology describes the psychological/archetypal tone, Human Design describes how the energy actually operates in real time. Do not claim either system is more true than the other.

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose.`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'Astrology Integration',
    frontTitle: 'Where the Two Systems Meet',
    anchor: `${hdChart.type} · ${hdChart.authority} + ${natalSummary(natalChart)}`,
    prompt,
  };
}

// ── 12. Practical experiments ────────────────────────────────────────────────

export function buildHumanDesignPracticesSection(hdChart: HdChart, mode: InterpretMode = 'deepdive', isMinor = false): InterpretSection {
  const openCenters = (Object.keys(CENTER_LABEL) as CenterId[]).filter(c => !hdChart.definedCenters.includes(c));
  const seed = TYPE_EXPERIMENT_SEED[hdChart.type];
  const authMeaning = AUTHORITY_MEANING[hdChart.authority];

  const prompt = `HUMAN DESIGN -- PRACTICAL EXPERIMENTS

${isMinor ? `${MINOR_SAFETY_BLOCK}\n\n` : ''}CHART FACTS:
Type: ${hdChart.type} · Strategy: ${hdChart.strategy}
Authority: ${hdChart.authority} -- ${authMeaning.practice}
Open centers: ${openCenters.map(c => CENTER_LABEL[c]).join(', ') || 'none (all centers defined)'}
Notable defined channels: ${hdChart.definedChannels.slice(0, 3).map(c => `${c.a}-${c.b} (${c.name})`).join('; ') || 'none'}

Give 3-5 distinct, concrete experiments this specific person could try over the next few weeks -- each one genuinely tied to a chart fact above (their Type/Strategy, their Authority, a specific open center, or a specific defined channel), not generic self-help advice. Frame each as a real, low-stakes experiment to notice something, not a rule to obey. Vary the life domain across the experiments (a decision-making moment, a relationship interaction, a work/creative context, a rest/boundary context).

${modeInstruction(mode)}

Begin with a 3-6 word thematic title, then a blank line, then the prose (not a numbered list -- weave the experiments into flowing paragraphs, though it's fine to let each experiment start its own sentence or paragraph).`;

  return {
    type: 'humandesign',
    system: 'humandesign',
    label: 'Practical Experiments',
    frontTitle: 'Try This Next',
    anchor: seed,
    prompt,
  };
}

// ── Full-report assembly ─────────────────────────────────────────────────────

// Convenience aggregator -- returns every section the report structure calls
// for (overview, type, authority, profile, definition, every defined center,
// every full channel, every hanging gate on a "priority" planet, and
// optionally the astrology bridge + practices). The UI is free to request
// these individually instead; this exists for a "generate everything" mode.
const PRIORITY_HANGING_PLANETS: readonly HdPlanetId[] = [
  'sun', 'earth', 'moon', 'northNode', 'southNode', 'mercury', 'venus', 'mars', 'saturn', 'pluto',
];

export function buildHumanDesignReportSections(
  hdChart: HdChart,
  mode: InterpretMode = 'deepdive',
  natalChart?: NatalChart,
  isMinor = false,
): InterpretSection[] {
  const sections: InterpretSection[] = [
    buildHumanDesignOverviewSection(hdChart, mode, isMinor),
    buildHumanDesignTypeSection(hdChart, mode, isMinor),
    buildHumanDesignAuthoritySection(hdChart, mode, isMinor),
    buildHumanDesignProfileSection(hdChart, mode, isMinor),
    buildHumanDesignDefinitionSection(hdChart, mode, isMinor),
  ];

  for (const center of hdChart.definedCenters) {
    sections.push(buildHumanDesignCenterSection(center, hdChart, mode, isMinor));
  }

  for (const channel of hdChart.definedChannels) {
    sections.push(buildHumanDesignChannelSection(channel, hdChart, mode, isMinor));
  }

  for (const activation of getHangingActivations(hdChart)) {
    if (!PRIORITY_HANGING_PLANETS.includes(activation.planet)) continue;
    sections.push(buildHumanDesignGateActivationSection(activation, hdChart, mode, isMinor));
  }

  if (natalChart) {
    sections.push(buildHumanDesignAstrologyBridgeSection(hdChart, natalChart, mode, isMinor));
  }

  sections.push(buildHumanDesignPracticesSection(hdChart, mode, isMinor));

  return sections;
}

export { PLANET_TIERS };
