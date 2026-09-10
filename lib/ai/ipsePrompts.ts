/**
 * ipsePrompts.ts
 * AI prompt builder for expanded IPSE Style Profile interpretations.
 *
 * Safety note: unlike the deterministic copy in ipse.ts (which is
 * guaranteed safe by construction and tested against a forbidden-term
 * list), this prompt asks a language model to write freely. The
 * instructions below are the actual enforcement mechanism for this
 * section, so they're deliberately explicit and repeated rather than
 * assumed. When evidence is unusually strong or convergent, the model is
 * told to say so in terms of signal strength/concentration -- never in
 * terms of measured ability, giftedness, or fixed potential.
 */

import type { NatalChart } from '@/lib/astro/types';
import type { IPSEDomainCard } from './ipse';
import type { InterpretSection, InterpretMode } from './prompts';

function modeInstruction(mode: InterpretMode): string {
  if (mode === 'essence')
    return 'Length: 200–300 words. Style: warm, plain-language, no jargon. Focus on what this style feels like to live with day to day.';
  if (mode === 'astrologer')
    return 'Length: 500–750 words. Style: technical. Name the specific placements/aspects/lenses driving this read and explain the mechanism, not just the outcome.';
  return 'Length: 350–500 words. Style: psychologically rich, accessible, grounded in the specific evidence below rather than generic.';
}

const SAFETY_BLOCK = `SAFETY RULES (must follow exactly):
Never use: IQ, high intelligence, low intelligence, genius, gifted, deficient, superior, inferior, low EQ, spiritually advanced, emotionally broken, destined, fixed potential, weak style, lowest mode, quotient, "this child will".
Use instead: symbolic emphasis, intelligence style, processing mode, expression style, orientation, fluency, friction, conditioning, access pattern, growth edge, integrated expression.
If the evidence below is unusually strong, convergent, or concentrated (multiple independent factors -- Western, Vedic, harmonic, Human Design -- pointing the same direction), say so in terms of SIGNAL STRENGTH: "several independent factors converge here," "this shows up with unusual concentration in this chart," "this current is unusually pronounced." Do NOT translate a strong signal into a claim about giftedness, genius, superior ability, or untapped potential -- describe the pattern's intensity, never the person's capability or worth.
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
  card: IPSEDomainCard,
  chart: NatalChart,
  mode: InterpretMode = 'deepdive',
  isMinor = false,
): InterpretSection {
  const primaryLine = card.primaryStyle
    ? `${card.primaryStyle.label} (salience ${card.primaryStyle.score}/100, tone: ${card.primaryStyle.tone})`
    : '(no single style cleared the threshold -- treat this as a genuinely blended, undifferentiated domain)';
  const secondaryLine = card.secondaryStyles.length
    ? card.secondaryStyles.map(s => `${s.label} (${s.score}/100)`).join(', ')
    : '(none)';

  const westernLines = card.westernEvidence
    .slice(0, 6)
    .map(e => `  - ${e.label} (${e.polarity}, weight ${(e.weight * 100).toFixed(0)}%)`)
    .join('\n') || '  (no strong Western evidence items)';

  const vedicBlock = card.vedicLens.available
    ? `VEDIC REFINEMENT: ${card.vedicLens.summary}${card.vedicLens.timing ? `\nTiming: ${card.vedicLens.timing}` : ''}`
    : 'VEDIC REFINEMENT: unavailable for this chart.';

  const vibrationalBlock = card.vibrationalLens.available && card.vibrationalLens.evidence.length > 0
    ? `VIBRATIONAL REFINEMENT: ${card.vibrationalLens.summary}`
    : 'VIBRATIONAL REFINEMENT: no strong harmonic resonance found for this domain.';

  const hdBlock = card.humanDesignLens.available
    ? `HUMAN DESIGN LENS: ${card.humanDesignLens.summary} Access pattern: ${card.accessPattern}. Decision support: ${card.humanDesignLens.decisionSupport}${card.humanDesignLens.discrepancyNote ? `\nDiscrepancy note: ${card.humanDesignLens.discrepancyNote}` : ''}`
    : 'HUMAN DESIGN LENS: unavailable for this chart.';

  const prompt = `IPSE STYLE PROFILE -- EXPANDED INTERPRETATION: ${card.title.toUpperCase()}
${SAFETY_BLOCK}
${isMinor ? `\n${MINOR_SAFETY_BLOCK}\n` : ''}

CHART CONTEXT: ${chartSummary(chart)}

DOMAIN: ${card.title} -- ${card.subtitle}
PRIMARY STYLE: ${primaryLine}
SECONDARY STYLES: ${secondaryLine}

ORIENTATION (symbolic emphasis): ${card.orientationScore}/100
FLUENCY (ease of expression): ${card.fluencyScore}/100
FRICTION (pressure/conditioning): ${card.frictionScore}/100
EXPRESSION TONE: ${card.expressionTone}

WESTERN EVIDENCE (primary layer):
${westernLines}

${vedicBlock}

${vibrationalBlock}

${hdBlock}

INSTRUCTIONS:
${modeInstruction(mode)}

Write an expanded interpretation of this domain grounded in the specific evidence above -- not a generic description of the primary style's name. Address:
1. What this style actually looks like in daily life, using the specific evidence (which planets, houses, or aspects) rather than restating the label.
2. How the secondary style(s), if any, blend with or complicate the primary one.
3. Where this style flows easily (fluency) versus where it meets pressure or conditioning (friction) -- these are different things and should not be collapsed into one.
4. If a Vedic, Vibrational, or Human Design lens is available, weave in what it adds -- routing, timing, harmonic flavor, or access/conditioning -- rather than listing it separately.
5. A grounded growth edge specific to this evidence, not a generic one.

Do not present this as fated, destined, or a fixed trait. Do not claim this measures real intelligence, ability, or worth in any of the four domains.
Begin with a 3-5 word thematic title, then a blank line, then the interpretation. No headers within the body. No bullets.
Do not include any preamble, acknowledgment, or meta-commentary before the title -- no "Here is...", no "Now generating...", no restating these instructions. The very first characters of your response must be the title itself. This is a single domain within a larger four-domain profile, not the "full natal chart" or "full natal interpretation" -- never describe it that way.`;

  return {
    type: 'ipse',
    label: `${card.title} — expanded interpretation`,
    frontTitle: card.primaryStyle ? `${card.primaryStyle.label} · ${card.title}` : card.title,
    anchor: card.primaryStyle
      ? `${card.primaryStyle.label} · orientation ${card.orientationScore} · fluency ${card.fluencyScore} · friction ${card.frictionScore}`
      : `${card.title} · blended`,
    prompt,
  };
}
