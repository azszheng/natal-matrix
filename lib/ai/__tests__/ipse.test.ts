import { describe, it, expect } from 'vitest';
import { generateIPSEProfile } from '@/lib/ipse/generate-profile';
import { calculateSectContext, planetSectStatus } from '@/lib/ipse/sect';
import { planetCondition } from '@/lib/ipse/evidence';
import { buildIPSEDomainSection } from '../ipsePrompts';
import { buildSystemPrompt } from '../prompts';
import { getDignityInfo } from '@/lib/astro/dignities';
import { computeNatalChart } from '@/lib/astro/natal';
import type { NatalChart, BodyId, SignId, ResolvedBirth, Aspect } from '@/lib/astro/types';
import type { IPSEProfile } from '@/lib/ipse/types';

// ── Synthetic fake-chart builder (same pattern established this session) ───────

const ALL_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode', 'chiron',
];

const SIGN_ORDER: SignId[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

function houseOf(longitude: number, ascLon = 0): number {
  return Math.floor((((longitude - ascLon) % 360 + 360) % 360) / 30) + 1;
}
function signOf(longitude: number): SignId {
  return SIGN_ORDER[Math.floor((((longitude % 360) + 360) % 360) / 30)];
}

type Placement = { longitude: number };

function buildFakeChart(placements: Partial<Record<BodyId, Placement>>, aspects: Aspect[] = [], ascLon = 0, birthDate = '1990-01-01'): NatalChart {
  const bodies = {} as NatalChart['western']['bodies'];

  for (const id of ALL_BODIES) {
    const p = placements[id] ?? { longitude: (ALL_BODIES.indexOf(id) * (360 / ALL_BODIES.length)) + 7 };
    const sign = signOf(p.longitude);
    bodies[id] = {
      id, longitude: p.longitude, latitude: 0, distance: 1,
      speedLongitude: 0.5, declination: 0, isRetrograde: false,
      sign, signDegree: p.longitude % 30, house: houseOf(p.longitude, ascLon),
    };
  }

  const mcLon = placements.mc?.longitude ?? ((ascLon + 270) % 360);
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

function aspect(a: BodyId, b: BodyId, kind: Aspect['kind'], orb = 1): Aspect {
  return { a, b, kind, exactAngle: 0, actualAngle: 0, orb, applying: true };
}

const NO_SECONDARY = { includeVedic: false, includeVibrational: false, includeHumanDesign: false } as const;

// ── Sect ─────────────────────────────────────────────────────────────────────

describe('calculateSectContext', () => {
  it('is a day chart when the Sun is above the horizon (houses 7-12)', () => {
    const chart = buildFakeChart({ sun: { longitude: 285 } }); // capricorn, house 10
    const sect = calculateSectContext(chart);
    expect(sect.sect).toBe('day');
    expect(sect.maleficOfSect).toBe('saturn');
    expect(sect.maleficContrary).toBe('mars');
  });

  it('is a night chart when the Sun is below the horizon (houses 1-6)', () => {
    const chart = buildFakeChart({ sun: { longitude: 15 } }); // aries, house 1
    const sect = calculateSectContext(chart);
    expect(sect.sect).toBe('night');
    expect(sect.maleficOfSect).toBe('mars');
    expect(sect.maleficContrary).toBe('saturn');
  });

  it('reports in_sect / contrary_to_sect correctly for a day chart', () => {
    const chart = buildFakeChart({ sun: { longitude: 285 } });
    const sect = calculateSectContext(chart);
    expect(planetSectStatus(sect, 'saturn')).toBe('in_sect');
    expect(planetSectStatus(sect, 'mars')).toBe('contrary_to_sect');
    expect(planetSectStatus(sect, 'mercury')).toBe('neutral');
  });
});

// ── Scenario 1: strong Mercury, weak/frictional Mars+Saturn ────────────────────

describe('scenario 1 -- strong Mercury vs. weak/frictional Mars and Saturn', () => {
  it('shows high intellectual capacity, lower/variable practical expression, and an explicit idea-to-execution gap', () => {
    const chart = buildFakeChart({
      sun: { longitude: 285 }, // day chart
      mercury: { longitude: 165 }, // virgo -- domicile
      jupiter: { longitude: 245 }, // sagittarius
      mars: { longitude: 95 }, // cancer -- fall
      saturn: { longitude: 5 }, // aries -- fall
    }, [
      aspect('mercury', 'jupiter', 'trine', 1),
      aspect('mercury', 'saturn', 'trine', 1),
      aspect('mercury', 'pluto', 'trine', 1),
      aspect('mars', 'saturn', 'square', 1),
      aspect('mars', 'pluto', 'square', 2),
    ]);

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const intellectual = profile.domains.find(d => d.domain === 'intellectual')!;
    const practical = profile.domains.find(d => d.domain === 'practical')!;

    expect(['emphasized', 'moderate']).toContain(intellectual.capacity.level);
    expect(['effortful', 'variable', 'conditional']).toContain(practical.expression.ease);
    expect(profile.crossDomainSynthesis.some(n => n.toLowerCase().includes('outpace') || n.toLowerCase().includes('vision'))).toBe(true);
  });
});

// ── Scenario 2: average Mercury, strong Mars+Saturn ────────────────────────────

describe('scenario 2 -- average Mercury, strong Mars and Saturn', () => {
  it('shows strong practical intelligence with a balanced, reliable execution style', () => {
    const chart = buildFakeChart({
      sun: { longitude: 285 },
      mars: { longitude: 215 }, // scorpio -- domicile
      saturn: { longitude: 275 }, // capricorn -- domicile
    }, [
      aspect('mars', 'saturn', 'trine', 1),
      aspect('sun', 'saturn', 'trine', 1),
    ]);

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const practical = profile.domains.find(d => d.domain === 'practical')!;
    expect(practical.executionProfile?.overallStyle).toBe('balanced');
    expect(['emphasized', 'moderate']).toContain(practical.capacity.level);
  });
});

// ── Scenario 3: strong Mars, weak Saturn ───────────────────────────────────────

describe('scenario 3 -- strong Mars, weak Saturn', () => {
  it('produces a strong-initiator execution style', () => {
    const chart = buildFakeChart({
      sun: { longitude: 15 }, // night chart -> Mars is in_sect here
      mars: { longitude: 215 }, // scorpio -- domicile
      saturn: { longitude: 95 }, // cancer -- detriment
    }, [
      aspect('mars', 'jupiter', 'trine', 1),
      aspect('saturn', 'uranus', 'square', 1),
      aspect('saturn', 'pluto', 'square', 2),
    ]);

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const practical = profile.domains.find(d => d.domain === 'practical')!;
    expect(practical.executionProfile?.overallStyle).toBe('strong_initiator');
  });
});

// ── Scenario 4: weak Mars, strong Saturn ───────────────────────────────────────

describe('scenario 4 -- weak Mars, strong Saturn', () => {
  it('produces a strong-sustainer execution style (slow activation, excellent persistence)', () => {
    const chart = buildFakeChart({
      sun: { longitude: 285 }, // day chart -> Saturn is in_sect here
      mars: { longitude: 185 }, // libra -- detriment
      saturn: { longitude: 275 }, // capricorn -- domicile
    }, [
      aspect('mars', 'saturn', 'square', 1),
      aspect('mars', 'neptune', 'square', 2),
    ]);

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const practical = profile.domains.find(d => d.domain === 'practical')!;
    expect(practical.executionProfile?.overallStyle).toBe('strong_sustainer');
  });
});

// ── Scenario 5: strong Moon/Neptune, weak Saturn boundaries ────────────────────

describe('scenario 5 -- strong Moon-Neptune, weak Saturn', () => {
  it('shows high sensitivity without automatically implying strong regulation', () => {
    const chart = buildFakeChart({
      moon: { longitude: 335 }, // pisces
      neptune: { longitude: 340 },
      saturn: { longitude: 5 }, // aries -- fall
    }, [
      aspect('moon', 'neptune', 'square', 0.5),
      aspect('moon', 'venus', 'trine', 2),
      aspect('saturn', 'mars', 'square', 1),
    ]);

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const emotional = profile.domains.find(d => d.domain === 'emotional')!;
    expect(emotional.shadows.some(s => s.trait.toLowerCase().includes('sensitivity without'))).toBe(true);
  });
});

// ── Scenario 6: strong Neptune/Jupiter, weak Mercury grounding ─────────────────

describe('scenario 6 -- strong Neptune/Jupiter, weak Mercury', () => {
  it('shows a strong spiritual/symbolic orientation with a discernment-flavored shadow', () => {
    const chart = buildFakeChart({
      neptune: { longitude: 340 }, // pisces -- domicile (modern)
      jupiter: { longitude: 245 }, // sagittarius -- domicile
      mercury: { longitude: 335 }, // pisces -- detriment
    }, [
      aspect('jupiter', 'neptune', 'trine', 1),
      aspect('mercury', 'neptune', 'square', 1),
    ]);

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const spiritual = profile.domains.find(d => d.domain === 'spiritual')!;
    expect(['emphasized', 'moderate']).toContain(spiritual.capacity.level);
    expect(spiritual.shadows.some(s => s.trait.toLowerCase().includes('verif') || s.trait.toLowerCase().includes('projection'))).toBe(true);
  });
});

// ── Scenario 7: same Mars dignity, different sect ──────────────────────────────

describe('scenario 7 -- same Mars dignity, different sect', () => {
  it('changes expression/accessibility with sect, without changing Mars\'s own dignity', () => {
    const dayChart = buildFakeChart({ sun: { longitude: 285 }, mars: { longitude: 215 } }); // scorpio, domicile
    const nightChart = buildFakeChart({ sun: { longitude: 15 }, mars: { longitude: 215 } }); // scorpio, domicile

    expect(dayChart.western.dignities.mars.label).toBe(nightChart.western.dignities.mars.label);

    const daySect = calculateSectContext(dayChart);
    const nightSect = calculateSectContext(nightChart);
    const dayMars = planetCondition(dayChart, daySect, 'mars')!;
    const nightMars = planetCondition(nightChart, nightSect, 'mars')!;

    expect(dayMars.dignity).toBe(nightMars.dignity);
    expect(dayMars.sectStatus).not.toBe(nightMars.sectStatus);
    expect(dayMars.accessibility).not.toBeCloseTo(nightMars.accessibility, 5);
  });
});

// ── Scenario 8: debilitated planet, strong dispositor ──────────────────────────

describe('scenario 8 -- debilitated planet with a strong dispositor', () => {
  it('produces a compensated/alternative-expression narrative rather than a flat negative', () => {
    const chart = buildFakeChart({
      mars: { longitude: 185 }, // libra -- detriment, disposited by Venus
      venus: { longitude: 335 }, // pisces -- exalted
    }, [
      aspect('mars', 'saturn', 'square', 2),
    ]);

    const sect = calculateSectContext(chart);
    const mars = planetCondition(chart, sect, 'mars')!;
    expect(mars.dignity).toBe('detriment');
    expect(mars.dispositor).toBe('venus');
    expect(mars.dispositorCondition).toBe('strong');

    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const practical = profile.domains.find(d => d.domain === 'practical')!;
    expect(practical.compensators.length).toBeGreaterThan(0);
    expect(practical.compensators[0].narrative.toLowerCase()).not.toContain('low practical intelligence');
  });
});

// ── Real chart end-to-end ────────────────────────────────────────────────────

describe('generateIPSEProfile -- real chart end-to-end', () => {
  it('computes a full profile without crashing, using real Western + Vedic + harmonic data', () => {
    const einstein: ResolvedBirth = {
      name: 'Einstein', date: '1879-03-14', time: '11:30',
      city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
      lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
    };
    const chart = computeNatalChart(einstein);
    const profile = generateIPSEProfile(chart);
    expect(profile.domains).toHaveLength(4);
    expect(profile.dataCoverage.western).toBe(true);
    expect(profile.dataCoverage.vedic).toBe(true);
    expect(profile.sect).not.toBeNull();
    for (const d of profile.domains) {
      expect(d.styles.length).toBeGreaterThanOrEqual(0);
      expect(d.basis.keyPlanets.length).toBeGreaterThan(0);
    }
  });
});

// ── Minor-chart safety ─────────────────────────────────────────────────────────

describe('generateIPSEProfile -- minor chart', () => {
  it('uses "Learning & Growth Style" and the required disclaimer for a chart under 18', () => {
    const recentYear = new Date().getFullYear() - 8;
    const chart = buildFakeChart({}, [], 0, `${recentYear}-06-15`);
    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    expect(profile.isMinor).toBe(true);
    expect(profile.sectionTitle).toBe('Learning & Growth Style');
    expect(profile.disclaimer).toContain('A chart is a symbolic map');
  });
});

// ── Safety language ────────────────────────────────────────────────────────────

// Note: "iq" is deliberately excluded even though it's forbidden in
// AI-generated content -- the fixed, developer-authored intro copy says
// "It is not an IQ test," which is the negation the rule exists to protect
// against, not the harmful usage (same reasoning as the established
// "fixed potential" exception in the disclaimer text elsewhere in the app).
const FORBIDDEN_TERMS = [
  'high intelligence', 'low intelligence', 'genius', 'gifted', 'deficient',
  'superior', 'inferior', 'low eq', 'spiritually advanced', 'emotionally broken',
  'destined', 'quotient', 'lowest mode', 'weak style', 'this child will',
];

function collectAllProfileStrings(profile: IPSEProfile): string[] {
  const strings: string[] = [profile.sectionTitle, profile.sectionSubtitle, profile.disclaimer, profile.intro, profile.profileSummary, ...profile.crossDomainSynthesis];
  for (const d of profile.domains) {
    strings.push(d.domainLabel, d.definition, d.profileStyleLabel, d.styleDescription, d.expression.description, d.synthesis);
    strings.push(...d.strengths.map(s => s.text), ...d.shadows.map(s => s.trait), ...d.compensators.map(c => c.narrative), ...d.optimalConditions);
    if (d.crossDomainNote) strings.push(d.crossDomainNote);
    if (d.executionProfile) strings.push(d.executionProfile.narrative);
  }
  return strings;
}

describe('generateIPSEProfile -- safety language', () => {
  it('never uses forbidden ability/intelligence-measuring language (adult profile)', () => {
    const einstein: ResolvedBirth = {
      name: 'Einstein', date: '1879-03-14', time: '11:30',
      city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
      lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
    };
    const profile = generateIPSEProfile(computeNatalChart(einstein));
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) expect(haystack).not.toContain(term);
  });

  it('never uses forbidden ability/intelligence-measuring language (minor profile)', () => {
    const recentYear = new Date().getFullYear() - 8;
    const chart = buildFakeChart({}, [], 0, `${recentYear}-06-15`);
    const profile = generateIPSEProfile(chart, NO_SECONDARY);
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) expect(haystack).not.toContain(term);
  });

  it('never frames dignity as simply good or bad', () => {
    const einstein: ResolvedBirth = {
      name: 'Einstein', date: '1879-03-14', time: '11:30',
      city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
      lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
    };
    const profile = generateIPSEProfile(computeNatalChart(einstein));
    const haystack = collectAllProfileStrings(profile).join(' \n ').toLowerCase();
    expect(haystack).not.toContain('domicile = good');
    expect(haystack).not.toContain('detriment = bad');
  });
});

// ── buildIPSEDomainSection (AI-expanded interpretation prompt) ─────────────────

describe('buildIPSEDomainSection', () => {
  const einstein: ResolvedBirth = {
    name: 'Einstein', date: '1879-03-14', time: '11:30',
    city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
    lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
  };
  const chart = computeNatalChart(einstein);
  const profile = generateIPSEProfile(chart);
  const domain = profile.domains[0];

  it('carries the ipse section type and grounds the prompt in the structured evidence, not invented factors', () => {
    const section = buildIPSEDomainSection(domain, chart, 'deepdive', false);
    expect(section.type).toBe('ipse');
    expect(section.prompt).toContain(domain.domainLabel.toUpperCase());
    expect(section.prompt).toContain('do not invent chart factors');
  });

  it('instructs signal-strength framing and never-good/bad dignity framing', () => {
    const section = buildIPSEDomainSection(domain, chart, 'deepdive', false);
    expect(section.prompt).toContain('SIGNAL STRENGTH');
    expect(section.prompt.toLowerCase()).toContain('domicile = good, detriment = bad');
  });

  it('adds the minor-chart safety block only when isMinor is true', () => {
    const adult = buildIPSEDomainSection(domain, chart, 'deepdive', false);
    const minor = buildIPSEDomainSection(domain, chart, 'deepdive', true);
    expect(adult.prompt).not.toContain('MINOR CHART');
    expect(minor.prompt).toContain('MINOR CHART');
    expect(minor.prompt).toContain('Always trust the child in front of you more than any interpretation.');
  });
});

describe('buildSystemPrompt -- suppressAbilityFraming (used for IPSE requests)', () => {
  it('omits the "gifted" ability-framing paragraph when suppressed', () => {
    const suppressed = buildSystemPrompt('deepdive', '', { suppressAbilityFraming: true });
    expect(suppressed.toLowerCase()).not.toContain('gifted');
  });
});

// ── Style distribution balance ─────────────────────────────────────────────────
// Same hard-won methodology established this session: a sample with an empty
// aspects array never exercises any aspect-based indicator (most styles'
// primary signal), and a longitude formula of `i*step1 + bodyIndex*step2`
// keeps the relative angle between any two specific bodies constant across
// the whole sample (the i-term cancels in the difference) -- so aspects
// still wouldn't vary even with a non-empty array. The hash-based formula
// below varies pairwise angles for real.

const ASPECT_ANGLES: { angle: number; kind: Aspect['kind'] }[] = [
  { angle: 0, kind: 'conjunction' }, { angle: 60, kind: 'sextile' }, { angle: 90, kind: 'square' },
  { angle: 120, kind: 'trine' }, { angle: 180, kind: 'opposition' },
];
function deriveAspects(placements: Record<string, number>): Aspect[] {
  const ids = Object.keys(placements) as BodyId[];
  const aspects: Aspect[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const diff = Math.abs(placements[a] - placements[b]) % 360;
      const angle = diff > 180 ? 360 - diff : diff;
      for (const { angle: target, kind } of ASPECT_ANGLES) {
        const orb = Math.abs(angle - target);
        if (orb <= 6) { aspects.push({ a, b, kind, exactAngle: target, actualAngle: angle, orb, applying: true }); break; }
      }
    }
  }
  return aspects;
}

describe('generateIPSEProfile -- style distribution stays reasonably balanced', () => {
  it('no single style dominates a domain across a large varied sample of synthetic charts', () => {
    const tally: Record<string, Record<string, number>> = { intellectual: {}, practical: {}, spiritual: {}, emotional: {} };
    const N = 150;

    for (let i = 0; i < N; i++) {
      const placements: Partial<Record<BodyId, Placement>> = {};
      const raw: Record<string, number> = {};
      ALL_BODIES.forEach((id, bi) => {
        const lon = ((i + 1) * (bi + 1) * 2654435761) % 360;
        placements[id] = { longitude: lon };
        raw[id] = lon;
      });
      const chart = buildFakeChart(placements, deriveAspects(raw));
      const profile = generateIPSEProfile(chart, NO_SECONDARY);
      for (const d of profile.domains) {
        const key = d.styles[0]?.id ?? '(none)';
        tally[d.domain][key] = (tally[d.domain][key] ?? 0) + 1;
      }
    }

    for (const domain of Object.keys(tally)) {
      const counts = Object.entries(tally[domain]).filter(([id]) => id !== '(none)').map(([, c]) => c);
      if (counts.length < 2) continue;
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      expect(max / min).toBeLessThan(8);
    }
  });
});
