/**
 * sect.ts — Traditional Western/Hellenistic chart sect (day vs. night chart).
 *
 * Western-only. Do not import or apply this module's output to Vedic
 * interpretation — Vedic temporal strength (Kāla Bala, part of Ṣaḍbala) is a
 * distinct, not-yet-implemented system, and the two must never be silently
 * conflated.
 *
 * CORE PRINCIPLE: sect is not a +/- score. Essential dignity (see
 * dignities.ts) describes a planet's capacity/resources; sect describes
 * contextual fit, regulation, and accessibility. A planet can be strong and
 * difficult, weak and well regulated, strong and well regulated, or weak and
 * difficult — this module only ever answers the regulation/accessibility
 * question, never the capacity question. Downstream interpretation code must
 * keep these two axes separate rather than collapsing them into one number.
 */

import type { BodyId, BodyPosition, ChartSect, SectInfo, SectStatus, SectRole, PlanetSectCondition } from './types';
import { eclipticToTrueAltitude } from './sweph';

// Degrees around the true horizon within which the Sun's altitude is a
// genuine edge case (exactly rising/setting). The chart sect still uses the
// calculated sign of the altitude in this band rather than defaulting
// arbitrarily — this constant exists to document that the boundary is known
// to be astronomically sensitive here (Placidus house-cusp rounding is NOT
// used to resolve it; see calculateChartSect).
const SECT_HORIZON_EPSILON = 0.05;

// Degrees from exact conjunction with the Sun within which Mercury's
// oriental/occidental orientation is too unstable to read confidently.
const MERCURY_AMBIGUOUS_ORB = 1.0;

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Oriental ("morning star") = rises before the Sun = behind the Sun in
// zodiacal order. Occidental ("evening star") = sets after the Sun = ahead
// of the Sun in zodiacal order. Mercury's maximum elongation from the Sun
// (~28°) means it is always close to one side or the other, never near 180°.
function mercuryOrientation(mercuryLon: number, sunLon: number): 'oriental' | 'occidental' | 'ambiguous' {
  if (angularSeparation(mercuryLon, sunLon) < MERCURY_AMBIGUOUS_ORB) return 'ambiguous';
  const diff = ((mercuryLon - sunLon) % 360 + 360) % 360;
  return diff <= 180 ? 'occidental' : 'oriental';
}

/**
 * Determines the chart's sect and the day/night planetary teams.
 *
 * Uses the Sun's true (unrefracted) geometric altitude at the exact birth
 * moment and location — not clock time, not the displayed house number
 * (which can be ambiguous right at the Ascendant/Descendant due to Placidus
 * cusp rounding).
 */
export function calculateChartSect(
  sun: BodyPosition,
  mercury: BodyPosition,
  jdUT: number,
  lat: number,
  lng: number,
): SectInfo {
  const sunAltitudeDeg = eclipticToTrueAltitude(jdUT, lat, lng, sun.longitude, sun.latitude, sun.distance);
  const chartSect: ChartSect = sunAltitudeDeg >= 0 ? 'day' : 'night';

  const orientation = mercuryOrientation(mercury.longitude, sun.longitude);
  // Most commonly cited convention (Hellenistic sources are not unanimous
  // here): oriental Mercury carries a diurnal tendency, occidental Mercury
  // a nocturnal one.
  const mercurySect: SectInfo['mercurySect'] =
    orientation === 'ambiguous' ? 'ambiguous' : orientation === 'oriental' ? 'diurnal' : 'nocturnal';

  const base = { sunAltitudeDeg, chartSect, mercuryOrientation: orientation, mercurySect };

  return chartSect === 'day'
    ? {
        ...base,
        sectLuminary: 'sun', contraryLuminary: 'moon',
        beneficOfSect: 'jupiter', beneficContrarySect: 'venus',
        maleficOfSect: 'saturn', maleficContrarySect: 'mars',
      }
    : {
        ...base,
        sectLuminary: 'moon', contraryLuminary: 'sun',
        beneficOfSect: 'venus', beneficContrarySect: 'jupiter',
        maleficOfSect: 'mars', maleficContrarySect: 'saturn',
      };
}

// ── Interpretation tags ──────────────────────────────────────────────────────
//
// Short hint-tags, not prose — downstream prompt builders weave these into
// synthesis context for the AI to draw on, the same way dominant-theme
// indicators are passed elsewhere in this codebase. Never surfaced to users
// verbatim.

const TAGS: Record<string, string[]> = {
  sectLuminary: [
    'central-to-chart-rhythm', 'naturally-accessible',
    'identity-supportive', 'better-regulated',
  ],
  contraryLuminary: [
    'less-dominant-than-sect-luminary', 'may-operate-more-privately-or-reactively',
    'requires-integration-with-chart-primary-rhythm',
  ],
  beneficOfSect: [
    'constructive-support', 'benefits-more-calibrated',
    'easier-access-to-benefic-expression', 'protective-factor',
  ],
  beneficContrarySect: [
    'still-benefic', 'supportive-but-less-moderated',
    'potential-excess', 'overextension-risk',
  ],
  maleficOfSect: [
    'challenge-more-manageable', 'disciplined-use',
    'productive-friction', 'difficult-function-more-integrated',
  ],
  maleficContrarySect: [
    'increased-friction', 'regulation-challenge',
    'excess-or-deficiency-risk', 'shadow-more-likely-under-stress',
  ],
  mercuryInSect: [
    'mercury-more-sect-compatible', 'cognitive-style-more-naturally-accessible',
  ],
  mercuryContrarySect: [
    'mercury-less-sect-compatible', 'cognitive-style-may-need-more-conscious-integration',
  ],
  mercuryAmbiguous: [
    'mercury-too-close-to-sun-for-confident-orientation', 'do-not-force-a-confident-sect-reading',
  ],
};

/**
 * Sect condition for a single body. Outer planets, angles, nodes,
 * asteroids, and Lilith always return 'not-applicable' — they can still
 * interact with sect-conditioned traditional planets through aspects and
 * dispositorship, but never receive a sect status of their own.
 */
export function getPlanetSectCondition(planet: BodyId, sectInfo: SectInfo): PlanetSectCondition {
  const make = (status: SectStatus, role: SectRole, tagKey: string): PlanetSectCondition =>
    ({ planet, status, role, interpretationTags: TAGS[tagKey] ?? [] });

  if (planet === sectInfo.sectLuminary)        return make('in-sect',       'sect-luminary',          'sectLuminary');
  if (planet === sectInfo.contraryLuminary)    return make('contrary-sect', 'contrary-luminary',       'contraryLuminary');
  if (planet === sectInfo.beneficOfSect)       return make('in-sect',       'benefic-of-sect',         'beneficOfSect');
  if (planet === sectInfo.beneficContrarySect) return make('contrary-sect', 'benefic-contrary-sect',   'beneficContrarySect');
  if (planet === sectInfo.maleficOfSect)       return make('in-sect',       'malefic-of-sect',         'maleficOfSect');
  if (planet === sectInfo.maleficContrarySect) return make('contrary-sect', 'malefic-contrary-sect',   'maleficContrarySect');

  if (planet === 'mercury') {
    if (sectInfo.mercurySect === 'ambiguous') return make('conditional', 'mercury-ambiguous', 'mercuryAmbiguous');
    const mercuryTendency: ChartSect = sectInfo.mercurySect === 'diurnal' ? 'day' : 'night';
    const inSect = mercuryTendency === sectInfo.chartSect;
    const role: SectRole = sectInfo.mercurySect === 'diurnal' ? 'mercury-diurnal' : 'mercury-nocturnal';
    return make(inSect ? 'in-sect' : 'contrary-sect', role, inSect ? 'mercuryInSect' : 'mercuryContrarySect');
  }

  return { planet, status: 'not-applicable', role: 'outer-planet', interpretationTags: [] };
}
