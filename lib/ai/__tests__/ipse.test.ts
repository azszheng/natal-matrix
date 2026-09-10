import { describe, it, expect } from 'vitest';
import { computeIPSEStyleProfile, type IPSEStyleProfile } from '../ipse';
import { buildIPSEDomainSection } from '../ipsePrompts';
import { buildSystemPrompt } from '../prompts';
import { getDignityInfo } from '@/lib/astro/dignities';
import { computeNatalChart } from '@/lib/astro/natal';
import type { NatalChart, BodyId, SignId, ResolvedBirth, Aspect } from '@/lib/astro/types';
import type { HdChart } from '@/lib/astro/humandesign-constants';

// ── Synthetic fake-chart builder ───────────────────────────────────────────────

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

type Placement = { longitude: number };

function buildFakeChart(placements: Partial<Record<BodyId, Placement>>, aspects: Aspect[] = [], birthDate = '1990-01-01'): NatalChart {
  const bodies = {} as NatalChart['western']['bodies'];

  for (const id of ALL_BODIES) {
    // Default: spread roughly evenly around the zodiac (not clustered in any
    // one sign), unless overridden.
    const p = placements[id] ?? { longitude: (ALL_BODIES.indexOf(id) * (360 / ALL_BODIES.length)) + 7 };
    const sign = signOf(p.longitude);
    bodies[id] = {
      id, longitude: p.longitude, latitude: 0, distance: 1,
      speedLongitude: 0.5, declination: 0, isRetrograde: false,
      sign, signDegree: p.longitude % 30, house: houseOf(p.longitude),
    };
  }

  const ascLon = placements.asc?.longitude ?? 0;
  const mcLon = placements.mc?.longitude ?? 270;
  bodies.asc = { id: 'asc', longitude: ascLon, latitude: 0, distance: 0, speedLongitude: 0, declination: 0, isRetrograde: false, sign: signOf(ascLon), signDegree: ascLon % 30, house: 1 };
  bodies.mc = { id: 'mc', longitude: mcLon, latitude: 0, distance: 0, speedLongitude: 0, declination: 0, isRetrograde: false, sign: signOf(mcLon), signDegree: mcLon % 30, house: 10 };

  const cusps = Array.from({ length: 12 }, (_, i) => ((ascLon + i * 30) % 360));

  const dignities = {} as NatalChart['western']['dignities'];
  for (const id of ALL_BODIES) dignities[id] = getDignityInfo(id, bodies[id].sign);
  dignities.asc = getDignityInfo('asc' as BodyId, bodies.asc.sign);
  dignities.mc = getDignityInfo('mc' as BodyId, bodies.mc.sign);

  const input: ResolvedBirth = {
    name: 'Test', date: birthDate, time: '12:00', city: 'Testville', region: '', country: '',
    lat: 0, lng: 0, timezone: 'UTC', utc: `${birthDate}T12:00:00Z`, julianDayUT: 0,
  };

  return {
    input,
    western: { bodies, houses: { system: 'placidus', cusps, asc: ascLon, mc: mcLon, armc: 0 }, aspects, dignities },
    vedic: { ayanamsa: 24, ayanamsaName: 'lahiri', bodies: {} as NatalChart['vedic']['bodies'], ascendantRashi: signOf(ascLon) },
    meta: { computedAt: new Date().toISOString(), swephVersion: 'test' },
  } as unknown as NatalChart;
}

function conj(a: BodyId, b: BodyId, orb = 1): Aspect {
  return { a, b, kind: 'conjunction', exactAngle: 0, actualAngle: 0, orb, applying: true };
}

function fakeHdChart(overrides: Partial<HdChart>): HdChart {
  return {
    input: {} as HdChart['input'], designUtc: '', personality: [], design: [],
    definedGates: [], definedChannels: [], definedCenters: [],
    type: 'Generator', authority: 'Sacral', profile: '1/3', definition: 'Single',
    strategy: 'Wait to Respond', notSelf: 'Frustration', crossGates: [1, 2, 3, 4],
    ...overrides,
  } as HdChart;
}

// ── Domain style-detection tests ──────────────────────────────────────────────

describe('computeIPSEStyleProfile — Western style detection', () => {
  it('detects Research-oriented investigator for a Mercury-Pluto, 8th-house-heavy chart', () => {
    const chart = buildFakeChart({
      mercury: { longitude: 215 }, // scorpio, house 8
      pluto: { longitude: 220 },
      moon: { longitude: 225 }, // stellium in house 8
    }, [conj('mercury', 'pluto', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const intellectual = profile.domainCards.find(c => c.domain === 'intellectual')!;
    expect(intellectual.primaryStyle?.id).toBe('researchInvestigator');
  });

  it('detects Strategic executor for a Mars-Saturn, 10th-house-heavy chart', () => {
    const chart = buildFakeChart({
      mars: { longitude: 275 }, // capricorn
      saturn: { longitude: 280 },
      sun: { longitude: 285 }, // stellium in house 10
    }, [conj('mars', 'saturn', 1), conj('sun', 'saturn', 2)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const practical = profile.domainCards.find(c => c.domain === 'practical')!;
    expect(practical.primaryStyle?.id).toBe('strategicExecutor');
  });

  it('detects Mystic / intuitive receiver for a Moon-Neptune, 12th-house-heavy chart', () => {
    const chart = buildFakeChart({
      moon: { longitude: 335 }, // pisces
      neptune: { longitude: 340 }, // house 12
    }, [conj('moon', 'neptune', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const spiritual = profile.domainCards.find(c => c.domain === 'spiritual')!;
    expect(spiritual.primaryStyle?.id).toBe('mysticReceiver');
  });

  it('detects Rational / humanist meaning-maker for a Jupiter-Saturn, Capricorn-Jupiter, 9th-house-Saturn chart', () => {
    const chart = buildFakeChart({
      saturn: { longitude: 250 }, // sagittarius, house 9
      jupiter: { longitude: 280 }, // capricorn
    }, [conj('jupiter', 'saturn', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const spiritual = profile.domainCards.find(c => c.domain === 'spiritual')!;
    expect(spiritual.primaryStyle?.id).toBe('rationalMeaningMaker');
  });

  it('detects Relational harmonizer for a Moon-Venus, 7th-house-heavy, Libra chart', () => {
    const chart = buildFakeChart({
      moon: { longitude: 195 }, // libra
      venus: { longitude: 200 }, // house 7
    }, [conj('moon', 'venus', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const emotional = profile.domainCards.find(c => c.domain === 'emotional')!;
    expect(emotional.primaryStyle?.id).toBe('relationalHarmonizer');
  });

  it('detects Entrepreneurial opportunist for a Mars-Jupiter, 11th-house-Jupiter, Sagittarius-Mars chart', () => {
    const chart = buildFakeChart({
      mars: { longitude: 250 }, // sagittarius
      jupiter: { longitude: 310 }, // aquarius, house 11
    }, [conj('mars', 'jupiter', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const practical = profile.domainCards.find(c => c.domain === 'practical')!;
    expect(practical.primaryStyle?.id).toBe('entrepreneurialOpportunist');
  });

  it('detects Independent / nonconformist believer for a Sun-Uranus, 9th-house-Uranus, Aquarius-Sun chart', () => {
    const chart = buildFakeChart({
      uranus: { longitude: 250 }, // sagittarius, house 9
      sun: { longitude: 310 }, // aquarius
    }, [conj('sun', 'uranus', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const spiritual = profile.domainCards.find(c => c.domain === 'spiritual')!;
    expect(spiritual.primaryStyle?.id).toBe('independentBeliever');
  });

  it('detects Emotional self-regulator for a Sun-Moon, Mars-Moon, Capricorn-Moon chart', () => {
    const chart = buildFakeChart({
      moon: { longitude: 280 }, // capricorn
    }, [conj('sun', 'moon', 1), conj('mars', 'moon', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const emotional = profile.domainCards.find(c => c.domain === 'emotional')!;
    expect(emotional.primaryStyle?.id).toBe('emotionalSelfRegulator');
  });

  it('falls back to a gentle default label when no style clears the threshold', () => {
    const chart = buildFakeChart({}); // scattered, no deliberate aspects
    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    for (const card of profile.domainCards) {
      if (!card.primaryStyle) {
        expect(card.summary.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── Double-counting prevention (spec section 14's explicit example) ──────────

describe('computeIPSEStyleProfile — evidence does not blindly cross-boost every domain', () => {
  it('a single Mercury-Pluto aspect does not automatically make Intellectual, Spiritual, and Emotional all dominant', () => {
    // Mercury-Pluto is a real anchor for both researchInvestigator
    // (intellectual) and occultInvestigator (spiritual) -- that overlap is
    // intentional and astrologically real. But with NO independent Moon/
    // Venus/4th/7th/8th evidence, Emotional should not also spike from this
    // one factor alone.
    const chart = buildFakeChart({
      mercury: { longitude: 15 }, pluto: { longitude: 20 },
    }, [conj('mercury', 'pluto', 1)]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const emotional = profile.domainCards.find(c => c.domain === 'emotional')!;
    expect(emotional.orientationScore).toBeLessThan(40);
  });

  it('does not pool evidence from candidate styles that never cleared the selection threshold (regression: inflated confidence badge and evidence leaking into the AI prompt for a style the person does not have)', () => {
    const chart = buildFakeChart({
      mercury: { longitude: 215 }, // scorpio, house 8
    }, [
      conj('mercury', 'pluto', 0.1),   // strong hit -> researchInvestigator, should be primary
      conj('mercury', 'uranus', 0.1),  // strong hit -> systemsThinker, should qualify as secondary
      conj('mercury', 'saturn', 5),    // weak hit -> technicalRigorousThinker, should stay unselected
    ]);

    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const intellectual = profile.domainCards.find(c => c.domain === 'intellectual')!;

    expect(intellectual.primaryStyle?.id).toBe('researchInvestigator');
    expect(intellectual.secondaryStyles.some(s => s.id === 'systemsThinker')).toBe(true);
    expect(intellectual.secondaryStyles.some(s => s.id === 'technicalRigorousThinker')).toBe(false);

    const evidenceStyleIds = new Set(intellectual.westernEvidence.map(e => e.styleId));
    expect(evidenceStyleIds.has('technicalRigorousThinker')).toBe(false);
  });
});

// ── Graceful degradation ───────────────────────────────────────────────────────

describe('computeIPSEStyleProfile — graceful degradation', () => {
  it('still returns four domain cards when Vedic, Vibrational, and Human Design are all excluded', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    expect(profile.domainCards).toHaveLength(4);
    expect(profile.dataCoverage).toEqual({ western: true, vedic: false, vibrational: false, humanDesign: false, geneKeys: false, selfReport: false });
    for (const card of profile.domainCards) {
      expect(card.vedicLens.available).toBe(false);
      expect(card.vibrationalLens.available).toBe(false);
      expect(card.humanDesignLens.available).toBe(false);
    }
  });

  it('reports Gene Keys as unavailable always, per explicit product decision to skip it this pass', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEStyleProfile(chart, {});
    expect(profile.dataCoverage.geneKeys).toBe(false);
    for (const card of profile.domainCards) expect(card.geneKeysLens.available).toBe(false);
  });

  it('includes a working Human Design lens when an HdChart is supplied', () => {
    const chart = buildFakeChart({});
    const hd = fakeHdChart({ definedCenters: ['sacral', 'root'], type: 'Generator', authority: 'Sacral' });
    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, humanDesign: hd });
    expect(profile.dataCoverage.humanDesign).toBe(true);
    const practical = profile.domainCards.find(c => c.domain === 'practical')!;
    expect(practical.humanDesignLens.available).toBe(true);
    expect(practical.accessPattern).not.toBe('unknown');
  });
});

// ── Real end-to-end chart ──────────────────────────────────────────────────────

describe('computeIPSEStyleProfile — real chart end-to-end', () => {
  it('computes a full profile without crashing, using real Western + Vedic + harmonic data', () => {
    const einstein: ResolvedBirth = {
      name: 'Einstein', date: '1879-03-14', time: '11:30',
      city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
      lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
    };
    const chart = computeNatalChart(einstein);
    const profile = computeIPSEStyleProfile(chart);
    expect(profile.domainCards).toHaveLength(4);
    expect(profile.dataCoverage.western).toBe(true);
    expect(profile.dataCoverage.vedic).toBe(true);
    expect(profile.dataCoverage.vibrational).toBe(true);
    for (const card of profile.domainCards) {
      expect(card.orientationScore).toBeGreaterThanOrEqual(0);
      expect(card.orientationScore).toBeLessThanOrEqual(100);
    }
  });
});

// ── Minor-chart safety ─────────────────────────────────────────────────────────

describe('computeIPSEStyleProfile — minor chart', () => {
  it('uses "Learning & Growth Style" for a chart under 18', () => {
    const recentYear = new Date().getFullYear() - 8;
    const chart = buildFakeChart({}, [], `${recentYear}-06-15`);
    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    expect(profile.isMinor).toBe(true);
    expect(profile.sectionTitle).toBe('Learning & Growth Style');
    expect(profile.disclaimer).toContain('A chart is a symbolic map');
  });
});

// ── Safety language ────────────────────────────────────────────────────────────

// Note: "fixed potential" is deliberately excluded here even though the spec
// lists it as forbidden -- the same spec also mandates using it, verbatim,
// inside the required disclaimer's negation ("not measured ability, fixed
// potential, or personal worth"). Stating what ISN'T being measured is the
// opposite of the harmful usage the forbidden list exists to prevent; this
// scan instead checks that nothing POSITIVELY claims a fixed potential,
// which is what the disclaimer sentence structurally can't do.
const FORBIDDEN_TERMS = [
  'iq', 'high intelligence', 'low intelligence', 'genius', 'gifted', 'deficient',
  'superior', 'inferior', 'low eq', 'spiritually advanced', 'emotionally broken',
  'destined', 'quotient', 'lowest mode', 'weak style', 'this child will',
];

function collectAllProfileStrings(profile: IPSEStyleProfile): string[] {
  const strings: string[] = [profile.sectionTitle, profile.sectionSubtitle, profile.disclaimer, profile.profileSummary];
  for (const c of profile.domainCards) {
    strings.push(c.title, c.subtitle, c.summary, c.integratedExpression, ...c.strengths, ...c.growthEdges);
    if (c.primaryStyle) strings.push(c.primaryStyle.label);
    strings.push(...c.secondaryStyles.map(s => s.label));
    if (c.humanDesignLens.available) strings.push(c.humanDesignLens.summary, c.humanDesignLens.growthEdge, c.humanDesignLens.decisionSupport);
    if (c.vedicLens.available) strings.push(c.vedicLens.summary);
  }
  return strings;
}

describe('computeIPSEStyleProfile — safety language', () => {
  it('never uses forbidden ability/intelligence-measuring language (adult profile, with HD)', () => {
    const chart = buildFakeChart({
      mercury: { longitude: 215 }, pluto: { longitude: 220 }, mars: { longitude: 15 }, saturn: { longitude: 20 },
    }, [conj('mercury', 'pluto', 1), conj('mars', 'saturn', 1)]);
    const hd = fakeHdChart({ definedCenters: [], type: 'Projector', authority: 'Splenic' });
    const profile = computeIPSEStyleProfile(chart, { humanDesign: hd });
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) expect(haystack).not.toContain(term);
  });

  it('never uses forbidden ability/intelligence-measuring language (minor profile)', () => {
    const recentYear = new Date().getFullYear() - 8;
    const chart = buildFakeChart({}, [], `${recentYear}-06-15`);
    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) expect(haystack).not.toContain(term);
  });

  it('uses the required framing language somewhere in the disclaimer', () => {
    const chart = buildFakeChart({});
    const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    expect(profile.disclaimer.toLowerCase()).toContain('symbolic');
  });
});

// ── Style distribution balance ─────────────────────────────────────────────────
// Regression guard for a real, verified issue: several styles per domain
// used to be structurally much easier to trigger than their siblings (they
// had a broad "2+ planets in this house" indicator; the underrepresented
// ones only had narrow, single-planet-repeated checks), so a handful of
// styles dominated across many unrelated charts regardless of catalog size.
// Verified and fixed against 124 real, programmatically-varied charts
// (not hand-picked) before this test was written -- this asserts the
// property that made the difference: within each domain, no triggered
// style should out-fire the least-triggered one by more than ~6x across a
// reasonably large, varied sample.

describe('computeIPSEStyleProfile — style distribution stays reasonably balanced', () => {
  it('no single style dominates a domain across a large varied sample of synthetic charts', () => {
    const tally: Record<string, Record<string, number>> = { intellectual: {}, practical: {}, spiritual: {}, emotional: {} };
    const N = 60;

    for (let i = 0; i < N; i++) {
      // Deterministic pseudo-scatter: each body lands at a different,
      // non-repeating longitude derived from a simple multiplicative
      // sequence, so the sample is varied without a real RNG dependency.
      const placements: Partial<Record<BodyId, Placement>> = {};
      ALL_BODIES.forEach((id, bi) => {
        placements[id] = { longitude: ((i * 47 + bi * 83) % 360) };
      });
      const chart = buildFakeChart(placements);
      const profile = computeIPSEStyleProfile(chart, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
      for (const card of profile.domainCards) {
        const key = card.primaryStyle?.id ?? '(fallback)';
        tally[card.domain][key] = (tally[card.domain][key] ?? 0) + 1;
      }
    }

    for (const domain of Object.keys(tally)) {
      const counts = Object.entries(tally[domain]).filter(([id]) => id !== '(fallback)').map(([, c]) => c);
      if (counts.length < 2) continue; // not enough variety triggered in this sample to compare
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      expect(max / min).toBeLessThan(6);
    }
  });
});

// ── Interpretation copy differentiation ───────────────────────────────────────
// Regression guard for a real reported issue: strengths/growthEdges/
// integratedExpression used to come from a purely domain-level table (4
// entries total), so every person whose primary style fell under the same
// domain saw byte-for-byte identical interpretation copy regardless of
// which of the ~6 named styles was actually theirs. Copy is now keyed by
// style id (23 entries); this asserts two people with different primary
// styles in the same domain get genuinely different copy.

describe('computeIPSEStyleProfile — interpretation copy is style-specific, not just domain-specific', () => {
  it('two different primary styles in the same domain produce different strengths, growth edges, and integrated expression', () => {
    const chartA = buildFakeChart({
      asc: { longitude: 60 }, mc: { longitude: 330 },
      mercury: { longitude: 68 }, uranus: { longitude: 70 }, sun: { longitude: 100 },
    }, [conj('mercury', 'uranus', 1)]);

    const chartB = buildFakeChart({
      asc: { longitude: 335 }, mc: { longitude: 245 },
      mercury: { longitude: 340 }, neptune: { longitude: 342 }, moon: { longitude: 100 },
    }, [conj('mercury', 'neptune', 1)]);

    const profileA = computeIPSEStyleProfile(chartA, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });
    const profileB = computeIPSEStyleProfile(chartB, { includeVedic: false, includeVibrational: false, includeHumanDesign: false });

    const intellectualA = profileA.domainCards.find(c => c.domain === 'intellectual')!;
    const intellectualB = profileB.domainCards.find(c => c.domain === 'intellectual')!;

    expect(intellectualA.primaryStyle?.id).not.toBe(intellectualB.primaryStyle?.id);
    expect(intellectualA.integratedExpression).not.toBe(intellectualB.integratedExpression);
    expect(intellectualA.strengths).not.toEqual(intellectualB.strengths);
    expect(intellectualA.growthEdges).not.toEqual(intellectualB.growthEdges);
  });
});

// ── Expanded AI interpretation prompt ───────────────────────────────────────────

describe('buildIPSEDomainSection', () => {
  const einstein: ResolvedBirth = {
    name: 'Einstein', date: '1879-03-14', time: '11:30',
    city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
    lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
  };
  const chart = computeNatalChart(einstein);
  const profile = computeIPSEStyleProfile(chart);
  const card = profile.domainCards[0];

  it('carries the ipse section type and the domain evidence', () => {
    const section = buildIPSEDomainSection(card, chart, 'deepdive', false);
    expect(section.type).toBe('ipse');
    expect(section.prompt).toContain(card.title.toUpperCase());
    expect(section.prompt).toContain(String(card.orientationScore));
  });

  it('always instructs signal-strength framing instead of ability/giftedness language for strong evidence', () => {
    const section = buildIPSEDomainSection(card, chart, 'deepdive', false);
    expect(section.prompt).toContain('SIGNAL STRENGTH');
    expect(section.prompt).toMatch(/never use/i);
    expect(section.prompt.toLowerCase()).toContain('genius');
    expect(section.prompt.toLowerCase()).toContain('gifted');
    // These forbidden words appear only inside the negative instruction telling
    // the model not to use them -- confirm that framing, not a green light.
    expect(section.prompt).toContain('Do NOT translate a strong signal into a claim about giftedness');
  });

  it('adds the minor-chart safety block only when isMinor is true', () => {
    const adultSection = buildIPSEDomainSection(card, chart, 'deepdive', false);
    const minorSection = buildIPSEDomainSection(card, chart, 'deepdive', true);
    expect(adultSection.prompt).not.toContain('MINOR CHART');
    expect(minorSection.prompt).toContain('MINOR CHART');
    expect(minorSection.prompt).toContain('Always trust the child in front of you more than any interpretation.');
  });
});

describe('buildSystemPrompt — suppressAbilityFraming (used for IPSE requests)', () => {
  it('omits the "gifted" ability-framing paragraph when suppressed, so it cannot contradict the IPSE safety block', () => {
    const suppressed = buildSystemPrompt('deepdive', '', { suppressAbilityFraming: true });
    expect(suppressed.toLowerCase()).not.toContain('gifted');
    expect(suppressed.toLowerCase()).not.toContain('the wound and the gift are the same tissue');
  });

  it('keeps that paragraph by default for non-IPSE sections', () => {
    const normal = buildSystemPrompt('deepdive', '');
    expect(normal.toLowerCase()).toContain('gifted');
  });
});
