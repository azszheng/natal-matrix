/**
 * synastryLabels.ts
 * Shared display helpers for synastry modules — previously duplicated
 * (and silently diverged: synastryPatterns.ts labeled trueNode "N.Node"
 * while synastryOverlays.ts labeled it "North Node") across
 * synastryPatterns.ts and synastryOverlays.ts.
 */

import type { BodyId } from './types';

export const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', chiron: 'Chiron', asc: 'ASC', mc: 'MC',
};

export function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}
