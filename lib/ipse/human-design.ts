/**
 * lib/ipse/human-design.ts
 *
 * Human Design as an EXPRESSION / access-condition lens only (spec section
 * 13). It never increases or decreases capacity or "intelligence" -- it
 * answers "how does this person best access or deploy this capacity?"
 * (defined vs. open centers -> consistency vs. environmental sensitivity;
 * authority -> decision style; type -> energy deployment style).
 */

import type { HdChart, CenterId } from '@/lib/astro/humandesign-constants';
import { GATE_CENTER } from '@/lib/astro/humandesign-constants';
import type { AstroFactor, IPSEDomainId, ExpressionEase } from './types';

const HD_CENTERS_BY_DOMAIN: Record<IPSEDomainId, CenterId[]> = {
  intellectual: ['head', 'ajna', 'throat'],
  practical: ['sacral', 'root', 'heart'],
  spiritual: ['head', 'ajna', 'g', 'solarPlexus', 'spleen'],
  emotional: ['solarPlexus', 'g', 'heart', 'spleen'],
};

const CENTER_LABEL: Record<CenterId, string> = {
  head: 'Head', ajna: 'Ajna', throat: 'Throat', g: 'G Center', heart: 'Heart/Ego',
  sacral: 'Sacral', spleen: 'Spleen', solarPlexus: 'Solar Plexus', root: 'Root',
};

export type HumanDesignLens = {
  available: boolean;
  ease: ExpressionEase;
  summary: string;
  decisionSupport: string;
  factors: AstroFactor[];
};

export function computeHumanDesignLens(hdChart: HdChart | null | undefined, domain: IPSEDomainId): HumanDesignLens {
  if (!hdChart) return { available: false, ease: 'variable', summary: '', decisionSupport: '', factors: [] };

  const centers = HD_CENTERS_BY_DOMAIN[domain];
  const defined = centers.filter(c => hdChart.definedCenters.includes(c));
  const open = centers.filter(c => !hdChart.definedCenters.includes(c));
  const factors: AstroFactor[] = [];

  for (const c of defined) factors.push({ label: `Defined ${CENTER_LABEL[c]}`, system: 'humanDesign', weight: 0.6, polarity: 'supportive' });
  for (const c of open) factors.push({ label: `Open ${CENTER_LABEL[c]}`, system: 'humanDesign', weight: 0.5, polarity: 'mixed' });

  const domainChannels = hdChart.definedChannels.filter(ch => {
    const ca = GATE_CENTER.get(ch.a); const cb = GATE_CENTER.get(ch.b);
    return ca && cb && centers.includes(ca) && centers.includes(cb);
  });
  for (const ch of domainChannels) factors.push({ label: `${ch.name} channel defined`, system: 'humanDesign', weight: 0.5, polarity: 'supportive' });

  let ease: ExpressionEase;
  if (domain === 'practical') {
    ease = hdChart.type === 'Projector' || hdChart.type === 'Reflector' ? 'conditional'
      : (!hdChart.definedCenters.includes('sacral') && !hdChart.definedCenters.includes('root')) ? 'variable' : 'natural';
  } else if (domain === 'emotional') {
    ease = hdChart.authority === 'Emotional' ? 'conditional' : !hdChart.definedCenters.includes('solarPlexus') ? 'conditional' : 'natural';
  } else if (defined.length === 0) {
    ease = 'conditional';
  } else if (defined.length === centers.length) {
    ease = 'natural';
  } else {
    ease = 'conditional';
  }

  const decisionSupport = hdChart.authority === 'Emotional'
    ? 'Decisions here benefit from waiting through an emotional wave before committing.'
    : hdChart.authority === 'Sacral'
      ? 'Decisions here benefit from a body-level yes/no response rather than mental deliberation.'
      : hdChart.authority === 'Splenic'
        ? 'Decisions here benefit from trusting the first instinctive read, in the moment.'
        : `Decisions here benefit from honoring this design's ${hdChart.authority} authority rather than overriding it mentally.`;

  const summary = defined.length > 0
    ? `Consistent access through ${defined.map(c => CENTER_LABEL[c]).slice(0, 2).join(', ')}.`
    : `Open, conditionable access (${open.map(c => CENTER_LABEL[c]).slice(0, 2).join(', ')}) -- this domain amplifies or absorbs what's around it rather than generating it on a fixed schedule.`;

  return { available: true, ease, summary, decisionSupport, factors };
}
