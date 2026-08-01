/**
 * synastryPrompts.ts
 * AI prompt builders for synastry: per-aspect, overlay, theme, shared-pattern, and whole-relationship.
 */

import type { NatalChart, BodyId } from '@/lib/astro/types';
import type {
  SynastryAspect,
  SynastryHouseOverlay,
  SynastryThemeSummary,
  SharedPattern,
  SynastryTheme,
  RelationshipContext,
  SynastryResult,
} from '@/lib/astro/synastry';
import type { InterpretSection, InterpretMode } from './prompts';

// ── Display helpers ───────────────────────────────────────────────────────────

const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', southNode: 'South Node',
  chiron: 'Chiron', asc: 'Ascendant', mc: 'Midheaven',
};

const THEME_LABEL: Record<SynastryTheme, string> = {
  emotional_bond:         'Emotional Bond',
  attraction_chemistry:   'Attraction & Chemistry',
  communication:          'Communication',
  commitment_stability:   'Commitment & Stability',
  growth_shadow:          'Growth & Shadow',
  ease_support:           'Ease & Support',
  karmic_development:     'Karmic Development',
  creative_play:          'Creative Play',
  conflict_activation:    'Conflict & Activation',
  identity_visibility:    'Identity & Visibility',
  family_roots:           'Family Roots',
  spiritual_unconscious:  'Spiritual & Unconscious',
};

const CONTEXT_LABEL: Record<RelationshipContext, string> = {
  romantic:      'romantic partnership',
  friendship:    'friendship',
  family:        'family relationship',
  parent_child:  'parent-child relationship',
  sibling:       'sibling relationship',
  professional:  'professional relationship',
  general:       'relationship',
};

function bodyLabel(b: BodyId): string { return BODY_LABEL[b] ?? b; }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function chartSummary(chart: NatalChart): string {
  const b = chart.western.bodies;
  return [
    b.sun  ? `Sun ${cap(b.sun.sign)} H${b.sun.house}`   : '',
    b.moon ? `Moon ${cap(b.moon.sign)} H${b.moon.house}` : '',
    b.asc  ? `${cap(b.asc.sign)} Rising`                 : '',
  ].filter(Boolean).join(' · ');
}

function contextGuard(context: RelationshipContext): string {
  if (context === 'parent_child' || context === 'family') {
    return `RELATIONSHIP CONTEXT: This is a ${CONTEXT_LABEL[context]}. Use language appropriate for family dynamics. Do not say the parent "passed" traits to the child or that the child "inherited" a placement. Use symbolic framing: shared patterns, family echo, emotional script, familiar territory. Never imply certainty about what happened or what will happen.`;
  }
  return `RELATIONSHIP CONTEXT: ${cap(CONTEXT_LABEL[context])}.`;
}

function modeInstruction(mode: InterpretMode): string {
  if (mode === 'essence')
    return 'Length: 200–300 words. Style: warm, accessible, psychologically specific. Avoid jargon. The person should feel genuinely understood.';
  if (mode === 'astrologer')
    return 'Length: 500–750 words. Style: full technical analysis. Include sign-house synthesis, aspect type mechanism, dispositor logic, and both directions of the contact. For a practitioner audience.';
  return 'Length: 350–500 words. Style: psychologically rich, accessible. Use astrological terms in context. Trace the dynamic in both directions.';
}

// ── A. Per-aspect prompt ──────────────────────────────────────────────────────

export function buildSynastryAspectSection(
  asp: SynastryAspect,
  chartA: NatalChart,
  chartB: NatalChart,
  context: RelationshipContext = 'general',
  mode: InterpretMode = 'deepdive',
): InterpretSection {
  const nameA = chartA.input.name?.trim() || 'Person A';
  const nameB = chartB.input.name?.trim() || 'Person B';
  const labA  = bodyLabel(asp.bodyA);
  const labB  = bodyLabel(asp.bodyB);
  const themeStr = asp.themes.map(t => THEME_LABEL[t]).join(', ') || 'General';

  const prompt = `SYNASTRY ASPECT INTERPRETATION
${contextGuard(context)}

ASPECT: ${nameA}'s ${labA} ${asp.kind} ${nameB}'s ${labB} (${asp.orb.toFixed(1)}° orb)
SALIENCE: ${cap(asp.salienceLevel.replace('_', ' '))}
THEMES: ${themeStr}

${nameA}: ${labA} in ${cap(asp.signA ?? '?')} H${asp.houseA ?? '?'} · ${chartSummary(chartA)}
${nameB}: ${labB} in ${cap(asp.signB ?? '?')} H${asp.houseB ?? '?'} · ${chartSummary(chartB)}

INSTRUCTIONS:
${modeInstruction(mode)}

Interpret this specific inter-aspect. Address:
1. What ${nameA}'s ${labA} carries in their own chart — what it represents, what need or complex it holds.
2. What ${nameB}'s ${labB} carries in their own chart.
3. What gets activated when these two planets meet — the specific dynamic this contact creates.
4. The gift or natural flow of the contact.
5. The possible friction, projection, or unconscious pattern this may generate.
6. How to work with it consciously.

Do NOT write generic compatibility text. Name the specific mechanism created by these planets in these signs and houses making this specific aspect.
For hard aspects (square, opposition): describe the activation, growth edge, and how the tension can be worked with — do not pathologize.
For soft aspects (trine, sextile): describe the ease, support, and any possible complacency.
Do not say this relationship is destined, fated, soulmate, or any deterministic framing.
Begin with a 3–5 word thematic title, then a blank line, then the interpretation. No headers within the body. No bullets.`;

  return {
    type:       'synastry',
    label:      `${nameA}'s ${labA} ${asp.kind} ${nameB}'s ${labB}`,
    frontTitle: `${labA} ${asp.kind} ${labB} · ${cap(asp.salienceLevel.replace('_', ' '))} salience`,
    anchor:     `${nameA} ${labA} · ${nameB} ${labB} · ${asp.orb.toFixed(1)}° ${asp.kind}`,
    prompt,
  };
}

// ── B. House overlay prompt ───────────────────────────────────────────────────

export function buildSynastryOverlaySection(
  overlay: SynastryHouseOverlay,
  chartA: NatalChart,
  chartB: NatalChart,
  context: RelationshipContext = 'general',
  mode: InterpretMode = 'deepdive',
): InterpretSection {
  const nameA = chartA.input.name?.trim() || 'Person A';
  const nameB = chartB.input.name?.trim() || 'Person B';
  const planetPerson = overlay.planetOwner === 'A' ? nameA : nameB;
  const housePerson  = overlay.planetOwner === 'A' ? nameB : nameA;
  const lab = bodyLabel(overlay.planet);
  const ordinals: Record<number, string> = { 1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',9:'9th',10:'10th',11:'11th',12:'12th' };
  const ord = ordinals[overlay.house] ?? `${overlay.house}th`;
  const themeStr = overlay.themes.map(t => THEME_LABEL[t]).join(', ');

  const prompt = `SYNASTRY HOUSE OVERLAY INTERPRETATION
${contextGuard(context)}

OVERLAY: ${planetPerson}'s ${lab} (${cap(overlay.planetSign)}) falls in ${housePerson}'s ${ord} house
SALIENCE: ${cap(overlay.salienceLevel.replace('_', ' '))}
THEMES: ${themeStr}

${nameA}: ${chartSummary(chartA)}
${nameB}: ${chartSummary(chartB)}

INSTRUCTIONS:
${modeInstruction(mode)}

Interpret this house overlay. Address:
1. What ${planetPerson}'s ${lab} represents — what energy, theme, or complex it carries.
2. What the ${ord} house represents in ${housePerson}'s chart — what area of life is being activated.
3. How this contact may feel supportive or nourishing to ${housePerson}.
4. How this contact may also feel challenging, heavy, or destabilizing.
5. How to work with this dynamic consciously.
${context === 'parent_child' || context === 'family' ? '6. If relevant, how this might symbolize a shared family theme, modeled emotional pattern, or familiar script — without implying the child is destined to repeat anyone\'s experience.' : ''}

Do not frame this as destiny, karma, or proof of anything. This is a symbolic map of possible activation.
Begin with a 3–5 word thematic title, blank line, then interpretation. No headers. No bullets.`;

  return {
    type:       'synastry',
    label:      overlay.label,
    frontTitle: `${overlay.label} · ${cap(overlay.salienceLevel.replace('_', ' '))} salience`,
    anchor:     overlay.label,
    prompt,
  };
}

// ── C. Theme-level prompt ─────────────────────────────────────────────────────

export function buildSynastryThemeSection(
  summary: SynastryThemeSummary,
  chartA: NatalChart,
  chartB: NatalChart,
  context: RelationshipContext = 'general',
  mode: InterpretMode = 'deepdive',
): InterpretSection {
  const nameA = chartA.input.name?.trim() || 'Person A';
  const nameB = chartB.input.name?.trim() || 'Person B';
  const themeLabel = THEME_LABEL[summary.theme];

  const aspectLines = summary.topAspects
    .map(a => `  ${nameA}'s ${bodyLabel(a.bodyA)} ${a.kind} ${nameB}'s ${bodyLabel(a.bodyB)} (${a.orb.toFixed(1)}°)`)
    .join('\n');

  const overlayLines = summary.topOverlays
    .map(o => `  ${o.label}`)
    .join('\n');

  const patternLines = summary.topPatterns
    .map(p => `  ${p.label}`)
    .join('\n');

  const prompt = `SYNASTRY THEME INTERPRETATION: ${themeLabel.toUpperCase()}
${contextGuard(context)}

THEME INTENSITY: ${cap(summary.salienceLevel.replace('_', ' '))}

${nameA}: ${chartSummary(chartA)}
${nameB}: ${chartSummary(chartB)}

KEY SUPPORTING CONTACTS:
${aspectLines || '  (none)'}

HOUSE OVERLAYS:
${overlayLines || '  (none)'}

SHARED PATTERNS:
${patternLines || '  (none)'}

INSTRUCTIONS:
Length: 300–500 words. Style: psychologically rich but accessible. Synthesize the evidence above.

Interpret the ${themeLabel} theme as it appears in this specific pairing. Address:
1. What this theme means in a relationship and how it shows up in the evidence above.
2. The gifts — what the ${themeLabel} contacts offer this relationship.
3. The growth edges — where friction, projection, or unconscious dynamics may appear.
4. Practical, grounded advice for how both people can work with this theme consciously.

Do not make this a generic description of ${themeLabel}. Ground every sentence in the specific contacts listed.
Do not say this relationship is destined, fated, or guaranteed to succeed or fail.
Begin with a 3–5 word thematic title, blank line, then the interpretation. No bullets. No headers within the body.`;

  return {
    type:       'synastry',
    label:      `${themeLabel} theme — ${nameA} & ${nameB}`,
    frontTitle: `${themeLabel} · ${cap(summary.salienceLevel.replace('_', ' '))} intensity`,
    anchor:     `${themeLabel} theme — ${summary.topAspects.length} contacts, intensity ${summary.score}`,
    prompt,
  };
}

// ── D. Shared pattern prompt ──────────────────────────────────────────────────

export function buildSharedPatternSection(
  pattern: SharedPattern,
  chartA: NatalChart,
  chartB: NatalChart,
  context: RelationshipContext = 'general',
  mode: InterpretMode = 'deepdive',
): InterpretSection {
  const nameA = chartA.input.name?.trim() || 'Person A';
  const nameB = chartB.input.name?.trim() || 'Person B';
  const isFamily = context === 'parent_child' || context === 'family' || context === 'sibling';

  const prompt = `SHARED PATTERN INTERPRETATION
${contextGuard(context)}

SHARED PATTERN: ${pattern.label}
SALIENCE: ${cap(pattern.salienceLevel.replace('_', ' '))}
FAMILY RELEVANCE: ${pattern.familyRelevance}
THEMES: ${pattern.themes.map(t => THEME_LABEL[t]).join(', ')}

${nameA}'s evidence: ${pattern.personAEvidence.join(', ')}
${nameB}'s evidence: ${pattern.personBEvidence.join(', ')}

${nameA}: ${chartSummary(chartA)}
${nameB}: ${chartSummary(chartB)}

INSTRUCTIONS:
Length: 250–400 words. Style: psychologically aware, warm, non-deterministic.

Interpret what it means that both charts independently share this pattern. Address:
1. What this shared pattern points to — what psychological territory both people carry independently.
2. How this shared theme may create immediate familiarity, recognition, or "you get it" quality between them.
3. How it may also create mirroring, amplification, or repetition that becomes triggering or limiting.
${isFamily ? `4. In this family context, how this may symbolize a shared emotional script, modeled pattern, or lineage theme — without implying that anyone "caused" or "passed on" the placement to the other. This is about resonance and familiarity, not genetic transmission or fate.\n5. What the invitation is — how understanding this shared pattern can create more conscious relating.` : `4. What the invitation is — how both people working with their own version of this pattern can deepen the relationship rather than re-enacting it.`}

This is not a verdict about the relationship. It is a description of a shared symbolic landscape.
Do not say this means they are the same person, fated, or that one caused the other's pattern.
Begin with a 3–5 word title, blank line, then interpretation. No bullets. No headers within the body.`;

  return {
    type:       'synastry',
    label:      `Shared pattern: ${pattern.label}`,
    frontTitle: pattern.label,
    anchor:     `Shared: ${pattern.label}`,
    prompt,
  };
}

// ── E. Whole relationship summary prompt ──────────────────────────────────────

export function buildSynastryRelationshipSummarySection(
  result: SynastryResult,
  context: RelationshipContext,
  mode: InterpretMode,
): InterpretSection {
  const { chartA, chartB, aspects, overlays, patterns, themes, hasHouseData } = result;
  const nameA = chartA.input.name?.trim() || 'Person A';
  const nameB = chartB.input.name?.trim() || 'Person B';

  const topAspects = aspects
    .filter(a => !a.isGenerational)
    .slice(0, 12)
    .map(a => `  ${nameA}'s ${bodyLabel(a.bodyA)} ${a.kind} ${nameB}'s ${bodyLabel(a.bodyB)} (${a.orb.toFixed(1)}°) — ${cap(a.salienceLevel.replace('_',''))} — ${a.themes.map(t => THEME_LABEL[t]).join(', ')}`)
    .join('\n');

  const topOverlays = overlays
    .slice(0, 8)
    .map(o => `  ${o.label} — ${o.themes.map(t => THEME_LABEL[t]).join(', ')}`)
    .join('\n');

  const topPatterns = patterns
    .filter(p => !p.isGenerational)
    .slice(0, 6)
    .map(p => `  ${p.label} (${p.familyRelevance} family relevance)`)
    .join('\n');

  const themeScores = themes
    .slice(0, 6)
    .map(t => `  ${THEME_LABEL[t.theme]}: ${cap(t.salienceLevel.replace('_', ' '))}`)
    .join('\n');

  const isFamily = context === 'parent_child' || context === 'family';

  const prompt = `SYNASTRY RELATIONSHIP READING: ${nameA} & ${nameB}
${contextGuard(context)}

${nameA}: ${chartSummary(chartA)}
${nameB}: ${chartSummary(chartB)}

THEME INTENSITIES:
${themeScores}

TOP INTER-ASPECTS (by salience):
${topAspects || '  (none)'}

${hasHouseData ? `HOUSE OVERLAYS:\n${topOverlays || '  (none)'}` : 'NOTE: House overlay data not available — one or both charts may lack precise birth times.'}

SHARED PATTERNS:
${topPatterns || '  (none)'}

INSTRUCTIONS:
Length: 600–900 words. Style: psychologically nuanced, accessible, warm but honest.

Write a relationship reading organized under these headings:

**Relationship Signature** — 2–3 sentences capturing the overall quality of the connection based on the highest-salience themes. Do not call it a score. Do not say "compatibility."

**Emotional Tone** — What the emotional landscape between these two people looks like, based on Moon contacts, emotional-bond overlays, and shared emotional patterns.

**Attraction & Energy** — What draws these two people toward each other, what creates charge, and where the creative or physical chemistry lives in the chart data.

**Communication & Mental Exchange** — How these two people think together, talk, and process — including where understanding flows and where friction enters.

**Commitment & Stability Patterns** — What the Saturn, 7th-house, and long-term themes suggest about how structure and commitment feel in this pairing.

**Growth, Shadow, and Trigger Points** — Where the relationship is most likely to activate unconscious material, create projection, or become a site of genuine transformation. Be honest without over-pathologizing.

**Shared Patterns & Mirroring** — What both people carry independently that creates recognition, familiarity, or amplification.

${isFamily ? '**Family Echoes** — What repeated or mirrored symbolic patterns appear across both charts in the context of this family relationship. Use language like "shared emotional script," "symbolic echo," "familiar territory" — not causal or deterministic language. Do not say a parent caused or transmitted a child\'s placement.\n' : ''}

**A Note on Working With This** — One paragraph of grounded, practical relationship reflection — what to lean into, what to stay curious about, and what might be worth exploring together.

Tone requirements:
- Do not use "soulmates," "twin flames," "meant to be," "doomed," or "toxic" as conclusions.
- Do not over-focus on difficulty. Name both gifts and growing edges.
- Do not claim certainty about the future.
- Keep all insights specific to the actual planetary contacts listed — no generic astrology.
${!hasHouseData ? '- Note explicitly when house-based conclusions are limited by missing birth times.' : ''}

Begin each section heading in bold, then a blank line, then the text. No other headers. No bullets.`;

  return {
    type:       'synastry',
    label:      `Relationship Reading: ${nameA} & ${nameB}`,
    frontTitle: `${nameA} & ${nameB} — Relationship Reading`,
    anchor:     `${nameA} · ${nameB} · ${CONTEXT_LABEL[context]}`,
    prompt,
  };
}
