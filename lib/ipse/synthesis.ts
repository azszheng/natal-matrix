/**
 * lib/ipse/synthesis.ts
 *
 * Cross-domain interaction patterns (spec section 18). Detected only when
 * the evidence is genuinely strong -- these are not forced into every
 * profile. A person can simultaneously be brilliant and inconsistent,
 * disciplined and rigid, intuitive and prone to projection; contradictions
 * are the feature, not a scoring problem to eliminate.
 */

import type { CapacityLevel, ExpressionEase, IPSEDomainProfile } from './types';

function isHigh(c: CapacityLevel): boolean { return c === 'emphasized'; }
function isVariable(e: ExpressionEase): boolean { return e === 'variable' || e === 'effortful'; }

export function crossDomainSynthesis(domains: IPSEDomainProfile[]): string[] {
  const byId = Object.fromEntries(domains.map(d => [d.domain, d]));
  const I = byId.intellectual, P = byId.practical, S = byId.spiritual, E = byId.emotional;
  const notes: string[] = [];

  if (I && P) {
    // Capacity measures how much complexity/emphasis a domain carries in the
    // chart -- it is NOT the same as how easily that complexity resolves
    // into clean output (a domain full of hard aspects can carry very high
    // capacity while still expressing with real friction). The order below
    // checks expression ease FIRST for exactly that reason: high capacity in
    // both domains only reads as "Builder-Thinker" when practical expression
    // is also reasonably clean -- otherwise it's the vision-outpaces-
    // execution pattern, regardless of how complex practical capacity looks.
    if (isHigh(I.capacity.level) && isVariable(P.expression.ease)) {
      notes.push('Vision may outpace implementation: conceptual ability here likely runs ahead of how consistently it gets turned into finished, real-world results.');
      I.crossDomainNote = 'Your Intellectual Intelligence is stronger than your execution consistency, so ideas may develop faster than they are implemented.';
    } else if (isHigh(I.capacity.level) && isHigh(P.capacity.level)) {
      notes.push('Builder-Thinker pattern: real capacity to both conceptualize a system and actually execute it -- ideas here are not just theoretical.');
    } else if (!isHigh(I.capacity.level) && isHigh(P.capacity.level)) {
      notes.push('Operational achiever pattern: results here are more likely to come through consistency and resourcefulness than through conceptual complexity -- and that is a genuinely different, equally real form of intelligence.');
    }
  }

  if (I && S && isHigh(I.capacity.level) && isHigh(S.capacity.level)) {
    notes.push('Metaphysical/conceptual synthesizer pattern: a mind that treats meaning-making itself as something to be rigorously thought through, not just felt.');
  }

  if (S && E && isHigh(S.capacity.level) && isHigh(E.capacity.level)) {
    notes.push('Experiential, empathic meaning-maker pattern: meaning and feeling are tightly linked here -- insight tends to arrive through direct experience rather than abstraction.');
  }

  if (E && P && isHigh(E.capacity.level) && isHigh(P.capacity.level)) {
    notes.push('People-centered operator pattern: execution here is likely to run through relationships and read of other people, not just individual output.');
  }

  if (I && E && isHigh(I.capacity.level) && (E.capacity.level === 'less_emphasized' || isVariable(E.expression.ease))) {
    notes.push('Systems and logic may be easier to hold with confidence here than emotional ambiguity -- not a deficit, just a difference in which kind of complexity feels more native.');
  }

  return notes;
}
