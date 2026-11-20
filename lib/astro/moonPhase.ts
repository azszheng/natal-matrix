/**
 * moonPhase.ts — Moon illumination geometry for the NatalMoonIcon feature.
 *
 * Two distinct calculations live here, deliberately kept separate:
 *
 * 1. computeMoonIllumination() — the real, physically accurate illuminated
 *    fraction for an actual natal chart. Uses the full Sun-Earth-Moon
 *    geometry (geocentric elongation, which accounts for the Moon's
 *    ecliptic latitude, plus the real Sun/Moon distances already returned
 *    by Swiss Ephemeris) rather than assuming the Sun-Moon ecliptic
 *    longitude difference alone gives the exact illuminated fraction. The
 *    longitude-only shortcut is a good approximation (the Moon's orbital
 *    inclination is only ~5.1°), but it is an approximation, not the actual
 *    geometry, so it is not used here.
 *
 * 2. illuminationFromPhaseAngle() — a simple, idealized sin/cos relationship
 *    between a 0-360° "phase angle" and illuminated fraction, used ONLY by
 *    the dev-only phase-slider preview (app/dev/moon-phases) as a synthetic
 *    testing input. It does not represent any real chart.
 *
 * Waxing/waning convention: 0° = New Moon, 180° = Full Moon, phase < 180 =
 * waxing (lit on the right limb, standard Northern Hemisphere view), phase
 * >= 180 = waning (lit on the left limb). This matches the existing
 * moonPhase convention already used by computeAtmosphere() in
 * atmosphere.ts and rendered by components/charts/MoonFace.tsx, so the
 * waxing/waning direction is consistent everywhere in the app.
 */

import type { NatalChart } from './types';

const DEG2RAD = Math.PI / 180;

export type MoonIllumination = {
  /** 0-360°. (Moon ecliptic longitude - Sun ecliptic longitude), the same
   * convention already used elsewhere in the app for waxing/waning and
   * terminator-side orientation. NOT used for the illuminated fraction
   * itself (see illuminatedFraction). */
  phaseAngleDeg: number;
  /** True physical illuminated fraction, 0 (new) to 1 (full), from actual
   * Sun-Earth-Moon geometry (elongation + real distances), not the
   * longitude-difference shortcut. */
  illuminatedFraction: number;
  /** phaseAngleDeg < 180 */
  isWaxing: boolean;
};

/**
 * Physically accurate illuminated fraction from real ecliptic geometry.
 *
 * Standard formulation (Meeus, "Astronomical Algorithms", ch. 48):
 *   cos(elongation) = cos(moonLat) * cos(moonLon - sunLon)
 *   phaseAngle i    = atan2( R_sun * sin(elongation), Δ_moon - R_sun * cos(elongation) )
 *   illuminated k   = (1 + cos(i)) / 2
 *
 * R_sun and Δ_moon are the real Earth-Sun and Earth-Moon distances (AU, as
 * already returned by Swiss Ephemeris for every body in this app) — their
 * ratio is what the longitude-only shortcut implicitly assumes is exactly
 * 1, which is never quite true. Because R_sun (~1 AU) vastly exceeds Δ_moon
 * (~0.0026 AU), the correction this adds over the longitude-only shortcut
 * is small in absolute terms, but it is the actual geometry rather than an
 * assumption, and ecliptic latitude (up to ~5.1°, from the Moon's orbital
 * inclination) is fully accounted for via the elongation term.
 */
export function computeMoonIllumination(chart: NatalChart): MoonIllumination {
  const sun = chart.western.bodies.sun;
  const moon = chart.western.bodies.moon;

  const phaseAngleDeg = ((moon.longitude - sun.longitude) % 360 + 360) % 360;
  const isWaxing = phaseAngleDeg < 180;

  const lonDiffRad = (moon.longitude - sun.longitude) * DEG2RAD;
  const moonLatRad = moon.latitude * DEG2RAD;
  const cosElongation = Math.cos(moonLatRad) * Math.cos(lonDiffRad);
  const elongation = Math.acos(Math.max(-1, Math.min(1, cosElongation)));

  const R = sun.distance;   // AU
  const Delta = moon.distance; // AU
  const phaseAngle = Math.atan2(
    R * Math.sin(elongation),
    Delta - R * Math.cos(elongation),
  );

  const illuminatedFraction = (1 + Math.cos(phaseAngle)) / 2;

  return { phaseAngleDeg, illuminatedFraction, isWaxing };
}

/**
 * Idealized phase-angle -> illuminated-fraction relationship (a perfect
 * circular orbit, zero ecliptic latitude, infinite Sun distance). Used only
 * by the dev-only phase-slider preview to drive a synthetic 0-360° sweep —
 * never used for a real chart, where computeMoonIllumination() above is
 * the physically accurate calculation.
 */
export function illuminationFromPhaseAngle(phaseAngleDeg: number): { illuminatedFraction: number; isWaxing: boolean } {
  const angle = ((phaseAngleDeg % 360) + 360) % 360;
  const illuminatedFraction = (1 - Math.cos(angle * DEG2RAD)) / 2;
  return { illuminatedFraction, isWaxing: angle < 180 };
}
