'use client';

import type { NatalChart } from '@/lib/astro/types';
import { computeMoonIllumination } from '@/lib/astro/moonPhase';
import MoonPhaseIcon from './MoonPhaseIcon';

type Props = {
  chart: NatalChart;
  /** px, 32-256 supported */
  size?: number;
  className?: string;
};

/**
 * Personalized natal Moon phase icon — purely visual, no text/labels/
 * interpretation. Illumination is computed once per chart from the real
 * Sun/Moon ecliptic geometry already present on the chart (see
 * lib/astro/moonPhase.ts); nothing here is approximated from a lookup
 * table of 8 or 30 preset phases.
 */
export default function NatalMoonIcon({ chart, size = 96, className }: Props) {
  const { illuminatedFraction, isWaxing } = computeMoonIllumination(chart);
  return <MoonPhaseIcon illuminatedFraction={illuminatedFraction} isWaxing={isWaxing} size={size} className={className} />;
}
