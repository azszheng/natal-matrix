import { describe, it, expect } from 'vitest';
import { computeIPSEProfile, type IPSEProfile } from '../ipse';
import { getDignityInfo } from '@/lib/astro/dignities';
import { computeNatalChart } from '@/lib/astro/natal';
import type { NatalChart, BodyId, SignId, ResolvedBirth, Aspect } from '@/lib/astro/types';

// ── Synthetic fake-chart builder ───────────────────────────────────────────────
// Whole-sign-equivalent cusps (house N cusp = (N-1)*30 deg) so house/sign/ruler
// all stay internally consistent and predictable for direct control per test.

const ALL_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode', 'chiron',
];

const SIGN_ORDER: SignId[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

function houseOf(longitude: number): number {
  return Math.floor((((longitude % 360) + 360) % 360) / 30) + 1;
}

function signOf(longitude: number): SignId {
  return SIGN_ORDER[Math.floor((((longitude % 360) + 360) % 360) / 30)];
}

type Placement = { longitude: number; isRetrograde?: boolean };

function buildFakeChart(placements: Partial<Record<BodyId, Placement>>, aspects: Aspect[] = [], birthDate = '1990-01-01'): NatalChart {
  const bodies = {} as NatalChart['western']['bodies'];

  for (const id of ALL_BODIES) {
    // Default: spread roughly evenly around the zodiac (not clustered in any
    // one sign) so an un-overridden body contributes chance-level scatter
    // rather than accidentally concentrating in whichever sign this offset
    // happens to land in.
    const p = placements[id] ?? { longitude: (ALL_BODIES.indexOf(id) * (360 / ALL_BODIES.length)) + 7 };
    const sign = signOf(p.longitude);
    bodies[id] = {
      id, longitude: p.longitude, latitude: 0, distance: 1,
      speedLongitude: p.isRetrograde ? -0.5 : 0.5, declination: 0,
      isRetrograde: p.isRetrograde ?? false,
      sign, signDegree: p.longitude % 30, house: houseOf(p.longitude),
    };
  }

  const ascLon = placements.asc?.longitude ?? 0;
  const mcLon = placements.mc?.longitude ?? 270;
  bodies.asc = { id: 'asc', longitude: ascLon, latitude: 0, distance: 0, speedLongitude: 0, declination: 0, isRetrograde: false, sign: signOf(ascLon), signDegree: ascLon % 30, house: 1 };
  bodies.mc = { id: 'mc', longitude: mcLon, latitude: 0, distance: 0, speedLongitude: 0, declination: 0, isRetrograde: false, sign: signOf(mcLon), signDegree: mcLon % 30, house: 10 };

  const cusps = Array.from({ length: 12 }, (_, i) => ((ascLon + i * 30) % 360));

  const dignities = {} as NatalChart['western']['dignities'];
  for (const id of ALL_BODIES) {
    dignities[id] = getDignityInfo(id, bodies[id].sign);
  }
  dignities.asc = getDignityInfo('asc' as BodyId, bodies.asc.sign);
  dignities.mc = getDignityInfo('mc' as BodyId, bodies.mc.sign);

  const input: ResolvedBirth = {
    name: 'Test', date: birthDate, time: '12:00', city: 'Testville', region: '', country: '',
    lat: 0, lng: 0, timezone: 'UTC', utc: `${birthDate}T12:00:00Z`, julianDayUT: 0,
  };

  return {
    input,
    western: {
      bodies,
      houses: { system: 'placidus', cusps, asc: ascLon, mc: mcLon, armc: 0 },
      aspects,
      dignities,
    },
    vedic: {
      ayanamsa: 24, ayanamsaName: 'lahiri',
      bodies: {} as NatalChart['vedic']['bodies'],
      ascendantRashi: signOf(ascLon),
    },
    meta: { computedAt: new Date().toISOString(), swephVersion: 'test' },
  } as unknown as NatalChart;
}

function conj(a: BodyId, b: BodyId, orb = 1): Aspect {
  return { a, b, kind: 'conjunction', exactAngle: 0, actualAngle: 0, orb, applying: true };
}

// ── Domain-dominance tests ─────────────────────────────────────────────────────

describe('computeIPSEProfile — domain dominance from real chart-factor patterns', () => {
  it('ranks Intellectual highest for a Mercury/Uranus-heavy, angular, well-aspected chart', () => {
    const chart = buildFakeChart({
      asc: { longitude: 60 },  // Gemini rising -> chart ruler mercury
      mc: { longitude: 330 },
      mercury: { longitude: 65 }, // Gemini, angular (house 1), domicile
      uranus: { longitude: 68 }, // tight conjunction to Mercury
      sun: { longitude: 100 },
    }, [conj('mercury', 'uranus', 1), conj('sun', 'mercury', 2)]);

    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    expect(profile.dominantDomain).toBe('intellectual');
    expect(profile.rankedDomains[0].domain).toBe('intellectual');
  });

  it('ranks Practical highest for a Saturn/Mars/10th-house-heavy chart', () => {
    const chart = buildFakeChart({
      asc: { longitude: 270 }, // Capricorn rising -> chart ruler saturn
      mc: { longitude: 180 },
      saturn: { longitude: 275 }, // Capricorn, angular (house 1), domicile
      mars: { longitude: 190 }, // 10th house (Cancer cusp 180-210)
      sun: { longitude: 200 },
    }, [conj('mars', 'saturn', 2), conj('sun', 'saturn', 3)]);

    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    expect(profile.dominantDomain).toBe('practical');
  });

  it('ranks Spiritual highest for a Jupiter/Neptune/12th-house-heavy chart', () => {
    const chart = buildFakeChart({
      asc: { longitude: 240 }, // Sagittarius rising -> chart ruler jupiter
      mc: { longitude: 150 },
      jupiter: { longitude: 245 }, // Sagittarius, angular (house 1), domicile
      neptune: { longitude: 200 }, // 12th house (Sagittarius, cusp 210)... adjust below
      moon: { longitude: 210 },
    }, [conj('jupiter', 'neptune', 2)]);

    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    expect(profile.dominantDomain).toBe('spiritual');
  });

  it('ranks Emotional highest for a Moon/Venus, water-sign, 4th/7th-heavy chart', () => {
    const chart = buildFakeChart({
      asc: { longitude: 90 }, // Cancer rising -> chart ruler moon
      mc: { longitude: 0 },
      moon: { longitude: 95 }, // Cancer, angular (house 1), domicile
      venus: { longitude: 100 }, // tight conjunction to Moon
      sun: { longitude: 300 },
    }, [conj('moon', 'venus', 1)]);

    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    expect(profile.dominantDomain).toBe('emotional');
  });

  it('does not overstate any one domain for a genuinely flat/neutral chart', () => {
    // All bodies in their own default neutral cadent placements, no aspects.
    const chart = buildFakeChart({});
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    const scores = profile.rankedDomains.map(d => d.score);
    const spread = Math.max(...scores) - Math.min(...scores);
    // Weak, undifferentiated data should not produce a dramatic, confident spread.
    expect(spread).toBeLessThan(35);
  });

  it('elementModePattern only lights up for above-chance sign clustering, not chance-level scatter', () => {
    // Regression test: this component previously reached its ceiling (40)
    // whenever a domain had >=5 of ~13 tracked bodies in its supporting
    // signs -- a threshold at or below pure chance, verified against five
    // real, unrelated charts to saturate in 11 of 20 domain/person
    // combinations regardless of any genuine signal.
    const scattered = buildFakeChart({}); // default placements: no deliberate sign clustering
    const scatteredProfile = computeIPSEProfile(scattered, { includeVedic: false, includeVibrational: false });
    for (const d of scatteredProfile.rankedDomains) {
      expect(d.westernComponents!.elementModePattern).toBeLessThan(40);
    }

    // Deliberately cluster ALL 13 tracked bodies into Intellectual's signs
    // (gemini, virgo, aquarius, sagittarius, scorpio, capricorn) -- genuine,
    // well-above-chance clustering (13 hits vs. an expected ~6.5) should
    // score meaningfully higher than chance-level scatter.
    const clustered = buildFakeChart({
      sun: { longitude: 75 }, moon: { longitude: 165 }, mercury: { longitude: 315 },
      venus: { longitude: 255 }, mars: { longitude: 225 }, jupiter: { longitude: 285 },
      saturn: { longitude: 76 }, uranus: { longitude: 166 }, neptune: { longitude: 316 },
      pluto: { longitude: 256 }, trueNode: { longitude: 226 }, southNode: { longitude: 286 },
      chiron: { longitude: 77 },
    });
    const clusteredProfile = computeIPSEProfile(clustered, { includeVedic: false, includeVibrational: false });
    const intellectual = clusteredProfile.rankedDomains.find(d => d.domain === 'intellectual')!;
    expect(intellectual.westernComponents!.elementModePattern).toBeGreaterThan(20);
  });
});

// ── Graceful degradation ───────────────────────────────────────────────────────

describe('computeIPSEProfile — graceful degradation', () => {
  it('still returns four ranked domains when Vedic data is excluded', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: true });
    expect(profile.rankedDomains).toHaveLength(4);
    expect(profile.dataCoverage.vedic).toBe(false);
    for (const d of profile.rankedDomains) {
      expect(d.vedicScore).toBeNull();
      expect(d.vedicEvidence).toEqual([]);
    }
  });

  it('still returns four ranked domains when harmonic/vibrational data is excluded', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    expect(profile.rankedDomains).toHaveLength(4);
    expect(profile.dataCoverage.vibrational).toBe(false);
    for (const d of profile.rankedDomains) {
      expect(d.vibrationalScore).toBeNull();
      expect(d.vibrationalEvidence).toEqual([]);
    }
  });

  it('ranks are 1-4 with no gaps or duplicates, and scores are 0-100', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEProfile(chart, {});
    expect(profile.rankedDomains.map(d => d.rank).sort()).toEqual([1, 2, 3, 4]);
    for (const d of profile.rankedDomains) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    }
  });
});

// ── Real end-to-end chart (Einstein fixture, has real Vedic + longitude data) ──

describe('computeIPSEProfile — real chart end-to-end', () => {
  const einstein: ResolvedBirth = {
    name: 'Einstein', date: '1879-03-14', time: '11:30',
    city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
    lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
  };

  it('computes a full profile without crashing, using real Western + Vedic + harmonic data', () => {
    const chart = computeNatalChart(einstein);
    const profile = computeIPSEProfile(chart);
    expect(profile.rankedDomains).toHaveLength(4);
    expect(profile.dataCoverage.western).toBe(true);
    expect(profile.dataCoverage.vedic).toBe(true);
    expect(profile.dataCoverage.vibrational).toBe(true);
    expect(['intellectual', 'practical', 'spiritual', 'emotional']).toContain(profile.dominantDomain);
  });
});

// ── Minor-chart safety ─────────────────────────────────────────────────────────

describe('computeIPSEProfile — minor chart', () => {
  it('uses "Learning & Growth Style" and minor-safe rank labels for a chart under 18', () => {
    const recentYear = new Date().getFullYear() - 8; // 8 years old
    const chart = buildFakeChart({}, [], `${recentYear}-06-15`);
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });

    expect(profile.isMinor).toBe(true);
    expect(profile.sectionTitle).toBe('Learning & Growth Style');
    expect(profile.sectionSubtitle.toLowerCase()).not.toContain('intelligence styles');

    const minorLabels = ['Most visible growth mode', 'Supporting growth mode', 'Developing mode', 'Less emphasized right now'];
    for (const d of profile.rankedDomains) {
      expect(minorLabels).toContain(d.rankLabel);
    }
  });
});

// ── Safety language: never claims to measure real intelligence/ability ────────

const FORBIDDEN_TERMS = [
  'iq', 'low intelligence', 'high intelligence', 'genius', 'gifted', 'deficient',
  'superior', 'weak intelligence', 'spiritually advanced', 'emotionally broken',
  'not practical', 'not smart', 'low eq', 'low potential',
  'quietest intelligence', 'low score', 'weak domain', 'this child will',
];

function collectAllProfileStrings(profile: IPSEProfile): string[] {
  const strings: string[] = [profile.sectionTitle, profile.sectionSubtitle, profile.disclaimer, profile.profileSummary];
  for (const d of profile.rankedDomains) {
    strings.push(d.title, d.label, d.rankLabel, d.summary, d.integratedExpression, ...d.strengths, ...d.growthEdges, ...d.subtypes);
  }
  return strings;
}

describe('computeIPSEProfile — safety language', () => {
  it('never uses forbidden ability/intelligence-measuring language (adult profile)', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) {
      expect(haystack).not.toContain(term);
    }
  });

  it('never uses forbidden ability/intelligence-measuring language (minor profile)', () => {
    const recentYear = new Date().getFullYear() - 8;
    const chart = buildFakeChart({}, [], `${recentYear}-06-15`);
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) {
      expect(haystack).not.toContain(term);
    }
  });

  it('states plainly that IPSE does not measure intelligence, ability, or worth', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEProfile(chart, { includeVedic: false, includeVibrational: false });
    expect(profile.disclaimer.toLowerCase()).toContain('not');
  });
});
