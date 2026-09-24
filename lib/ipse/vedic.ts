/**
 * lib/ipse/vedic.ts
 *
 * Vedic astrology as SECONDARY CORROBORATION, never an independent score
 * (spec section 14). Reuses analyzeVedicChart()/computeVimshottariDasha()
 * rather than recomputing planet strength or house lords. Reports evidence
 * as supportive/challenging factors the domain analyzers can fold in
 * (capped, small), not a second vote that could double-count the same
 * underlying planet Western already used.
 */

import { analyzeVedicChart, type VedicAnalysis } from '@/lib/ai/vedicAnalysis';
import { computeVimshottariDasha, type DashaLord } from '@/lib/astro/dashas';
import type { BodyId } from '@/lib/astro/types';
import type { ChartInput, AstroFactor, IPSEDomainId } from './types';

type VedicDomainMap = { karakas: BodyId[]; houses: number[]; importantLords: number[]; dashas: DashaLord[] };

const VEDIC_IPSE_MAP: Record<IPSEDomainId, VedicDomainMap> = {
  intellectual: { karakas: ['mercury', 'jupiter'], houses: [2, 3, 5, 9, 10, 11], importantLords: [2, 3, 5, 9], dashas: ['mercury', 'jupiter'] },
  practical: { karakas: ['saturn', 'mars', 'mercury', 'sun'], houses: [2, 3, 6, 10, 11], importantLords: [3, 6, 10, 11], dashas: ['saturn', 'mars', 'mercury', 'sun'] },
  spiritual: { karakas: ['jupiter', 'southNode', 'moon'], houses: [4, 5, 8, 9, 12], importantLords: [5, 8, 9, 12], dashas: ['jupiter', 'ketu', 'moon'] },
  emotional: { karakas: ['moon', 'venus'], houses: [4, 7, 8, 12], importantLords: [4, 7, 8, 12], dashas: ['moon', 'venus'] },
};

const DASHA_LORD_TO_BODY: Record<DashaLord, BodyId> = {
  sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn', rahu: 'trueNode', ketu: 'southNode',
};

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function ordinal(n: number): string { if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd'; return `${n}th`; }

export type VedicLens = {
  available: boolean;
  summary: string;
  timing?: string;
  factors: AstroFactor[];
};

export function computeVedicLens(chart: ChartInput, domain: IPSEDomainId): VedicLens {
  if (!chart.vedic) return { available: false, summary: '', factors: [] };
  let analysis: VedicAnalysis;
  try { analysis = analyzeVedicChart(chart); } catch { return { available: false, summary: '', factors: [] }; }

  const map = VEDIC_IPSE_MAP[domain];
  const factors: AstroFactor[] = [];
  const karakaNotes: string[] = [];

  for (const planet of map.karakas) {
    const strength = analysis.planetStrengths[planet];
    if (!strength) continue;
    if (strength.score >= 6) {
      karakaNotes.push(`${cap(planet)} is functionally strong`);
      factors.push({ label: `${cap(planet)} karaka strength`, system: 'vedic', weight: strength.score / 10, polarity: strength.dignity === 'debilitation' ? 'challenging' : 'supportive', sourcePlanet: planet });
    } else if (strength.score <= 3) {
      karakaNotes.push(`${cap(planet)} is functionally pressured`);
      factors.push({ label: `${cap(planet)} karaka pressure`, system: 'vedic', weight: (10 - strength.score) / 10, polarity: 'challenging', sourcePlanet: planet });
    }
  }

  const routedHouses: string[] = [];
  for (const houseNum of map.importantLords) {
    const hl = analysis.houseLords[houseNum];
    if (!hl || hl.lordHouse == null) continue;
    const strong = hl.lordDignity === 'exaltation' || hl.lordDignity === 'own' || hl.lordDignity === 'moolatrikona';
    const weak = hl.lordDignity === 'debilitation';
    routedHouses.push(`${ordinal(houseNum)} house routed through ${cap(hl.lord)} in house ${hl.lordHouse}`);
    factors.push({ label: `${ordinal(houseNum)} lord (${cap(hl.lord)}) in house ${hl.lordHouse}`, system: 'vedic', weight: strong ? 0.6 : weak ? 0.5 : 0.3, polarity: strong ? 'supportive' : weak ? 'challenging' : 'mixed', sourcePlanet: hl.lord, sourceHouse: houseNum });
  }

  let timing: string | undefined;
  try {
    const dasha = computeVimshottariDasha(chart, new Date().toISOString());
    const mahaActive = map.dashas.includes(dasha.mahadasha.lord);
    const antarActive = map.dashas.includes(dasha.antardasha.lord);
    if (mahaActive || antarActive) {
      const mahaHouse = chart.vedic.bodies[DASHA_LORD_TO_BODY[dasha.mahadasha.lord]]?.house;
      const houseAligned = mahaHouse !== undefined && map.houses.includes(mahaHouse);
      timing = `Currently activated by the ${cap(dasha.mahadasha.lord)}${antarActive ? `/${cap(dasha.antardasha.lord)}` : ''} dasha period${houseAligned ? `, aligning with this domain's own house routing` : ''}.`;
      factors.push({ label: 'Current dasha activation', system: 'vedic', weight: (mahaActive && antarActive ? 0.7 : 0.4) + (houseAligned ? 0.2 : 0), polarity: 'mixed' });
    }
  } catch { /* dasha unavailable for this chart */ }

  const relevantYogas = analysis.yogas.filter(y =>
    y.planets.some(p => map.karakas.includes(p)) || y.affectedHouses.filter(h => map.houses.includes(h)).length >= 2,
  ).slice(0, 2);
  const yogaNotes = relevantYogas.map(y => y.name);
  for (const yoga of relevantYogas) {
    factors.push({ label: yoga.name, system: 'vedic', weight: yoga.strength === 'strong' ? 0.7 : yoga.strength === 'moderate' ? 0.5 : 0.3, polarity: yoga.category === 'challenging' ? 'challenging' : 'supportive' });
  }

  const summaryParts = [...karakaNotes.slice(0, 1), ...routedHouses.slice(0, 1)].filter(Boolean);
  const summary = summaryParts.length > 0
    ? `${summaryParts.join('; ')}.${yogaNotes.length ? ` ${yogaNotes.join(', ')} also relevant.` : ''}`
    : 'Vedic data is available but shows no strongly differentiating signal for this domain.';

  return { available: true, summary, timing, factors };
}
