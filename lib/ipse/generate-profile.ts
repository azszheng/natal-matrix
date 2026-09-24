/**
 * lib/ipse/generate-profile.ts
 *
 * Main entry point. Pipeline (spec section 21):
 *   chart -> calculateSectContext -> analyze{I,P,S,E} -> crossDomainSynthesis
 *   -> IPSEProfile
 *
 * Computation is fully deterministic. The optional AI-expanded
 * interpretation (lib/ai/ipsePrompts.ts) narrates ONLY from the structured
 * evidence this module produces.
 */

import type { NatalChart } from '@/lib/astro/types';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import { isMinorChart } from '@/lib/ai/childhoodImprints';
import { calculateSectContext } from './sect';
import { analyzeIntellectual } from './intellectual';
import { analyzePractical } from './practical';
import { analyzeSpiritual } from './spiritual';
import { analyzeEmotional } from './emotional';
import { crossDomainSynthesis } from './synthesis';
import type { CapacityLevel, IPSEDomainProfile, IPSELayerAvailability, IPSEOptions, IPSEOverallPattern, IPSEProfile } from './types';

function hasWesternChartData(chart: NatalChart | null | undefined): boolean {
  return !!chart?.western?.bodies?.sun && !!chart.western.houses?.cusps?.length;
}

const SECTION_TITLE = 'IPSE Profile';
const SECTION_SUBTITLE = 'How you think, execute, find meaning, and process emotion';
const INTRO = 'IPSE describes four complementary forms of intelligence: Intellectual, Practical, Spiritual, and Emotional. It is not an IQ test or a ranking of how intelligent you are. Instead, it explores how different forms of intelligence are expressed, where your natural strengths lie, what can interfere with their expression, and the conditions under which they work best.';
const DISCLAIMER = 'IPSE describes styles, capacities, and conditions for expression -- it does not measure intelligence, ability, fixed potential, or personal worth.';
const MINOR_SUBTITLE = "Supportive insight into a child's natural learning, feeling, and growth patterns -- not a measure of ability or potential.";
const MINOR_DISCLAIMER = 'This profile is for supportive reflection only. It does not measure intelligence, ability, personality, or potential. Children should never be labeled, limited, compared, or judged based on a chart. A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation.';

function levelOrdinal(level: CapacityLevel): number {
  return level === 'emphasized' ? 3 : level === 'moderate' ? 2 : level === 'mixed' ? 1 : 0;
}

const DOMAIN_PATTERN_LABEL: Record<string, IPSEOverallPattern> = {
  intellectual: 'intellect-led', practical: 'practicality-led', spiritual: 'spirit-led', emotional: 'emotion-led',
};

function computeOverallPattern(domains: IPSEDomainProfile[]): IPSEOverallPattern {
  const sorted = [...domains].sort((a, b) => levelOrdinal(b.capacity.level) - levelOrdinal(a.capacity.level));
  const [top, second, , fourth] = sorted;
  const topOrd = levelOrdinal(top.capacity.level), secondOrd = levelOrdinal(second.capacity.level), fourthOrd = levelOrdinal(fourth.capacity.level);
  const spread = topOrd - fourthOrd, topGap = topOrd - secondOrd;

  if (spread <= 0) return 'blended';
  if (topGap === 0 && spread >= 2) return 'dual-led';
  if (spread >= 3) return 'polarized';
  if (topOrd <= 1) return 'subtle';
  if (topGap >= 2) return DOMAIN_PATTERN_LABEL[top.domain] ?? 'blended';
  return 'blended';
}

const DOMAIN_SHORT: Record<string, string> = { intellectual: 'Intellectual', practical: 'Practical', spiritual: 'Spiritual', emotional: 'Emotional' };

function describePattern(domains: IPSEDomainProfile[], pattern: IPSEOverallPattern): string {
  const sorted = [...domains].sort((a, b) => levelOrdinal(b.capacity.level) - levelOrdinal(a.capacity.level));
  const [top, second, third, fourth] = sorted;
  const name = (d: IPSEDomainProfile) => DOMAIN_SHORT[d.domain];
  switch (pattern) {
    case 'intellect-led': case 'practicality-led': case 'spirit-led': case 'emotion-led':
      return `${name(top)}-led, with ${name(second)} offering support.`;
    case 'dual-led':
      return `Dual-led -- ${name(top)} and ${name(second)} work closely together rather than one leading alone.`;
    case 'blended':
      return 'Blended rather than dominated by one mode -- all four forms of intelligence have meaningful presence.';
    case 'polarized':
      return `Polarized -- ${name(top)} and ${name(second)} are much more emphasized than ${name(third)} and ${name(fourth)}.`;
    case 'subtle':
      return 'Subtle overall -- no single form strongly dominates; these capacities may develop through lived experience more than one obvious chart signature.';
  }
}

function fallbackProfile(isMinor: boolean, dataCoverage: IPSELayerAvailability): IPSEProfile {
  return {
    sectionTitle: isMinor ? 'Learning & Growth Style' : SECTION_TITLE,
    sectionSubtitle: isMinor ? MINOR_SUBTITLE : SECTION_SUBTITLE,
    intro: INTRO,
    disclaimer: isMinor ? MINOR_DISCLAIMER : DISCLAIMER,
    isMinor, dataCoverage, sect: null,
    overallPattern: 'blended',
    profileSummary: 'Not enough chart data is available yet to compute an IPSE profile.',
    domains: [], crossDomainSynthesis: [],
  };
}

export function generateIPSEProfile(chart: NatalChart, options: IPSEOptions = {}): IPSEProfile {
  const isMinor = options.isMinor ?? isMinorChart(chart.input.date);

  const dataCoverage: IPSELayerAvailability = {
    western: hasWesternChartData(chart),
    vedic: Boolean(options.includeVedic !== false && chart.vedic),
    vibrational: Boolean(options.includeVibrational !== false && typeof chart.western.bodies.sun?.longitude === 'number'),
    humanDesign: Boolean(options.includeHumanDesign !== false && options.humanDesign),
  };

  if (!dataCoverage.western) return fallbackProfile(isMinor, dataCoverage);

  const sect = calculateSectContext(chart);
  const hdChart: HdChart | null | undefined = dataCoverage.humanDesign ? options.humanDesign : null;

  const domains: IPSEDomainProfile[] = [
    analyzeIntellectual(chart, sect, hdChart),
    analyzePractical(chart, sect, hdChart),
    analyzeSpiritual(chart, sect, hdChart),
    analyzeEmotional(chart, sect, hdChart),
  ];

  const synthesisNotes = crossDomainSynthesis(domains);
  const overallPattern = computeOverallPattern(domains);
  const profileSummary = isMinor
    ? `This child's profile currently appears most expressive through ${[...domains].sort((a, b) => levelOrdinal(b.capacity.level) - levelOrdinal(a.capacity.level))[0].domainLabel.toLowerCase()} patterns. This should be used as a gentle support map, not a fixed description of who they are or what they can become.`
    : `Overall pattern: ${describePattern(domains, overallPattern)}`;

  return {
    sectionTitle: isMinor ? 'Learning & Growth Style' : SECTION_TITLE,
    sectionSubtitle: isMinor ? MINOR_SUBTITLE : SECTION_SUBTITLE,
    intro: INTRO,
    disclaimer: isMinor ? MINOR_DISCLAIMER : DISCLAIMER,
    isMinor, dataCoverage, sect,
    overallPattern, profileSummary,
    domains, crossDomainSynthesis: synthesisNotes,
  };
}
