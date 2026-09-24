/**
 * ipsePrompts.ts
 * AI prompt builder for expanded IPSE domain interpretations.
 *
 * Safety note: unlike the deterministic narrative in lib/ipse/ (which is
 * guaranteed safe by construction and tested against a forbidden-term
 * list), this prompt asks a language model to write freely. The
 * instructions below are the actual enforcement mechanism for this
 * section, so they're deliberately explicit and repeated rather than
 * assumed. When evidence is unusually strong or convergent, the model is
 * told to say so in terms of signal strength/concentration -- never in
 * terms of measured ability, giftedness, or fixed potential.
 *
 * Per spec: the model should NOT invent chart factors. Only structured
 * evidence already computed by lib/ipse/ is passed in -- capacity, styles,
 * strengths, shadows, compensators, sect, and astrological basis.
 */

import type { NatalChart } from '@/lib/astro/types';
import type { IPSEDomainProfile } from '@/lib/ipse/types';
import type { InterpretSection, InterpretMode } from './prompts';

function modeInstruction(mode: InterpretMode): string {
  if (mode === 'essence')
    return 'Length: 200–300 words. Style: warm, plain-language, no jargon. Focus on what this style feels like to live with day to day.';
  if (mode === 'astrologer')
    return 'Length: 500–750 words. Style: technical. Name the specific placements/aspects/sect/dispositors driving this read and explain the mechanism, not just the outcome.';
  return 'Length: 350–500 words. Style: psychologically rich, accessible, grounded in the specific evidence below rather than generic.';
}

const SAFETY_BLOCK = `SAFETY RULES (must follow exactly):
Never use: IQ, high intelligence, low intelligence, genius, gifted, deficient, superior, inferior, low EQ, spiritually advanced, emotionally broken, destined, fixed potential, weak style, lowest mode, quotient, "this child will".
Use instead: capacity, style, expression, accessibility, shadow, compensator, growth edge, optimal conditions.
If the evidence below is unusually strong, convergent, or concentrated (multiple independent factors -- Western, Vedic, Vibrational, Human Design -- pointing the same direction), say so in terms of SIGNAL STRENGTH: "several independent factors converge here," "this shows up with unusual concentration in this chart," "this current is unusually pronounced." Do NOT translate a strong signal into a claim about giftedness, genius, superior ability, or untapped potential -- describe the pattern's intensity, never the person's capability or worth.
Do not treat dignity or sect as morally good or bad ("domicile = good, detriment = bad" is exactly the framing to avoid). A contrary-to-sect or debilitated planet can still produce real strength -- describe it as more effortful or conditional, never as a deficiency.
This never measures IQ, EQ, real intelligence, giftedness, work ethic, morality, emotional maturity, spiritual attainment, or life success.`;

const MINOR_SAFETY_BLOCK = `MINOR CHART -- ADDITIONAL RULES:
This chart belongs to someone under 18. Do not rank, score, or compare this domain to the others. Do not say "this child will," predict outcomes, or imply fixed potential. Frame everything as a support cue for the adults around this child, not a label for the child. Use: most visible growth mode, supporting growth mode, developing mode, less emphasized right now, support cue, possible sensitivity, needs support with.
End with this exact reminder, verbatim: "A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation."`;

function chartSummary(chart: NatalChart): string {
  const b = chart.western.bodies;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `Sun ${cap(b.sun.sign)} H${b.sun.house} · Moon ${cap(b.moon.sign)} H${b.moon.house} · ${cap(b.asc.sign)} Rising`;
}

export function buildIPSEDomainSection(
  domain: IPSEDomainProfile,
  chart: NatalChart,
  mode: InterpretMode = 'deepdive',
  isMinor = false,
): InterpretSection {
  const stylesLine = domain.styles.length
    ? domain.styles.map(s => `${s.label} (${s.strength.replace('_', ' ')})`).join(', ')
    : '(no single style cleared the threshold -- treat this as a genuinely blended, undifferentiated domain)';

  const strengthsLines = domain.strengths.map(s => `  - ${s.text} [confidence: ${s.confidence}]`).join('\n') || '  (none identified)';
  const shadowLines = domain.shadows.map(s => `  - ${s.trait} [confidence: ${s.confidence}]`).join('\n') || '  (none identified)';
  const compensatorLines = domain.compensators.map(c => `  - ${c.narrative}`).join('\n') || '  (none identified)';
  const optimalLines = domain.optimalConditions.map(c => `  - ${c}`).join('\n');

  const basisPlanets = domain.basis.keyPlanets
    .map(p => `${cap(p.planet)} in ${cap(p.sign)}, house ${p.house}, ${p.dignity}, ${p.sect.replace(/_/g, ' ')}`)
    .join('\n  - ');
  const basisAspects = domain.basis.aspects.length ? domain.basis.aspects.join('\n  - ') : '(none significant)';

  const vedicBlock = domain.basis.vedic ? `VEDIC CORROBORATION: ${domain.basis.vedic}` : 'VEDIC CORROBORATION: unavailable for this chart.';
  const vibrationalBlock = domain.basis.vibrational ? `VIBRATIONAL REFINEMENT: ${domain.basis.vibrational}` : 'VIBRATIONAL REFINEMENT: unavailable for this chart.';
  const hdBlock = domain.basis.humanDesign ? `HUMAN DESIGN LENS: ${domain.basis.humanDesign}` : 'HUMAN DESIGN LENS: unavailable for this chart.';

  const executionBlock = domain.executionProfile
    ? `\nEXECUTION PROFILE: overall style is "${domain.executionProfile.overallStyle.replace(/_/g, ' ')}." ${domain.executionProfile.narrative}\n`
    : '';

  const crossDomainBlock = domain.crossDomainNote ? `\nCROSS-DOMAIN NOTE: ${domain.crossDomainNote}\n` : '';

  const prompt = `IPSE -- EXPANDED INTERPRETATION: ${domain.domainLabel.toUpperCase()}
${SAFETY_BLOCK}
${isMinor ? `\n${MINOR_SAFETY_BLOCK}\n` : ''}

CHART CONTEXT: ${chartSummary(chart)}

DOMAIN: ${domain.domainLabel} -- ${domain.definition}
CAPACITY LEVEL: ${domain.capacity.level.replace('_', ' ')} (confidence: ${domain.capacity.confidence})
PROFILE STYLE: ${domain.profileStyleLabel}
DETECTED STYLES: ${stylesLine}
EXPRESSION EASE: ${domain.expression.ease} -- ${domain.expression.description}
${executionBlock}
STRENGTHS (with confidence):
${strengthsLines}

POTENTIAL SHADOWS (with confidence -- each derived from an actual strength or tension, not generic):
${shadowLines}

COMPENSATORS (weak factor -> what provides a real alternative pathway):
${compensatorLines}

OPTIMAL CONDITIONS (what helps this intelligence work best):
${optimalLines}
${crossDomainBlock}
ASTROLOGICAL BASIS -- key planets:
  - ${basisPlanets}
Aspects on record:
  - ${basisAspects}

${vedicBlock}

${vibrationalBlock}

${hdBlock}

INSTRUCTIONS:
${modeInstruction(mode)}

Write an expanded interpretation of this domain grounded ONLY in the specific evidence above -- do not invent chart factors, placements, or aspects not listed here. Address:
1. What this style actually looks like in daily life, using the specific evidence (which planets, houses, aspects, sect, or dignity) rather than restating the label.
2. Capacity versus expression as separate things: how strongly this domain is emphasized in the chart is not the same question as how easily it currently expresses -- address both.
3. At least one shadow, framed as arising FROM the same strength or pressure that produced it, not as an unrelated flaw.
4. Any compensator listed above -- if a weak factor has a real alternative pathway, say so explicitly rather than reporting the weakness flat.
5. If a Vedic, Vibrational, or Human Design lens is available, weave in what it adds rather than listing it separately.
6. If contradictory evidence exists (e.g. a strength and a shadow pulling in different directions), preserve the contradiction -- do not average it into blandness or neutrality.

Do not present this as fated, destined, or a fixed trait. Do not claim this measures real intelligence, ability, or worth.
Begin with a 3-5 word thematic title, then a blank line, then the interpretation. No headers within the body. No bullets.
Do not include any preamble, acknowledgment, or meta-commentary before the title -- no "Here is...", no "Now generating...", no restating these instructions. The very first characters of your response must be the title itself. This is a single domain within a larger four-domain profile, not the "full natal chart" or "full natal interpretation" -- never describe it that way.`;

  return {
    type: 'ipse',
    label: `${domain.domainLabel} — expanded interpretation`,
    frontTitle: `${domain.profileStyleLabel} · ${domain.domainLabel}`,
    anchor: `${domain.profileStyleLabel} · capacity ${domain.capacity.level.replace('_', ' ')} · expression ${domain.expression.ease}`,
    prompt,
  };
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
