import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../natal';
import { calculateChartSect, getPlanetSectCondition } from '../sect';
import { getDignityInfo } from '../dignities';
import type { ResolvedBirth, BodyPosition, SectInfo } from '../types';

const einsteinDay: ResolvedBirth = {
  // 11:30 LMT, essentially true solar time at this longitude -- solidly
  // daytime (mid-morning), far from any horizon ambiguity.
  name: 'Einstein', date: '1879-03-14', time: '11:30',
  city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
  lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
};

const fuzhouNight: ResolvedBirth = {
  // 01:15 local (CST, UTC+8) -- solidly nighttime, well before sunrise.
  name: 'Test', date: '1986-10-26', time: '01:15',
  city: 'Fuzhou', region: 'Fujian', country: 'China',
  lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
  utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
};

describe('calculateChartSect — day/night determination', () => {
  it('reports day for a clearly daytime (mid-morning) birth', () => {
    const chart = computeNatalChart(einsteinDay);
    expect(chart.western.sect.chartSect).toBe('day');
    expect(chart.western.sect.sunAltitudeDeg).toBeGreaterThan(0);
  });

  it('reports night for a clearly nighttime (pre-dawn) birth', () => {
    const chart = computeNatalChart(fuzhouNight);
    expect(chart.western.sect.chartSect).toBe('night');
    expect(chart.western.sect.sunAltitudeDeg).toBeLessThan(0);
  });

  it('is driven purely by the true solar altitude sign, not by house number', () => {
    // The decision rule itself: chartSect must always agree with the sign
    // of sunAltitudeDeg, for any chart -- this is what "astronomical, not
    // house-based" means in practice, and holds regardless of how close
    // the Sun sits to the Ascendant/Descendant in a given chart.
    for (const birth of [einsteinDay, fuzhouNight]) {
      const { sect } = computeNatalChart(birth).western;
      expect(sect.chartSect).toBe(sect.sunAltitudeDeg >= 0 ? 'day' : 'night');
    }
  });
});

describe('calculateChartSect — day vs night team assignment', () => {
  it('day chart: Sun/Jupiter/Saturn in sect, Moon/Venus/Mars contrary', () => {
    const { sect } = computeNatalChart(einsteinDay).western;
    expect(sect.chartSect).toBe('day');
    expect(sect.sectLuminary).toBe('sun');
    expect(sect.contraryLuminary).toBe('moon');
    expect(sect.beneficOfSect).toBe('jupiter');
    expect(sect.beneficContrarySect).toBe('venus');
    expect(sect.maleficOfSect).toBe('saturn');
    expect(sect.maleficContrarySect).toBe('mars');
  });

  it('night chart: Moon/Venus/Mars in sect, Sun/Jupiter/Saturn contrary', () => {
    const { sect } = computeNatalChart(fuzhouNight).western;
    expect(sect.chartSect).toBe('night');
    expect(sect.sectLuminary).toBe('moon');
    expect(sect.contraryLuminary).toBe('sun');
    expect(sect.beneficOfSect).toBe('venus');
    expect(sect.beneficContrarySect).toBe('jupiter');
    expect(sect.maleficOfSect).toBe('mars');
    expect(sect.maleficContrarySect).toBe('saturn');
  });
});

describe('getPlanetSectCondition — roles and statuses', () => {
  const dayInfo: SectInfo = {
    chartSect: 'day', sunAltitudeDeg: 30,
    sectLuminary: 'sun', contraryLuminary: 'moon',
    beneficOfSect: 'jupiter', beneficContrarySect: 'venus',
    maleficOfSect: 'saturn', maleficContrarySect: 'mars',
    mercuryOrientation: 'oriental', mercurySect: 'diurnal',
  };
  const nightInfo: SectInfo = {
    ...dayInfo,
    chartSect: 'night', sunAltitudeDeg: -30,
    sectLuminary: 'moon', contraryLuminary: 'sun',
    beneficOfSect: 'venus', beneficContrarySect: 'jupiter',
    maleficOfSect: 'mars', maleficContrarySect: 'saturn',
  };

  it('assigns correct status/role for each day-chart planet', () => {
    expect(getPlanetSectCondition('sun', dayInfo)).toMatchObject({ status: 'in-sect', role: 'sect-luminary' });
    expect(getPlanetSectCondition('moon', dayInfo)).toMatchObject({ status: 'contrary-sect', role: 'contrary-luminary' });
    expect(getPlanetSectCondition('jupiter', dayInfo)).toMatchObject({ status: 'in-sect', role: 'benefic-of-sect' });
    expect(getPlanetSectCondition('venus', dayInfo)).toMatchObject({ status: 'contrary-sect', role: 'benefic-contrary-sect' });
    expect(getPlanetSectCondition('saturn', dayInfo)).toMatchObject({ status: 'in-sect', role: 'malefic-of-sect' });
    expect(getPlanetSectCondition('mars', dayInfo)).toMatchObject({ status: 'contrary-sect', role: 'malefic-contrary-sect' });
  });

  it('assigns correct status/role for each night-chart planet', () => {
    expect(getPlanetSectCondition('moon', nightInfo)).toMatchObject({ status: 'in-sect', role: 'sect-luminary' });
    expect(getPlanetSectCondition('sun', nightInfo)).toMatchObject({ status: 'contrary-sect', role: 'contrary-luminary' });
    expect(getPlanetSectCondition('venus', nightInfo)).toMatchObject({ status: 'in-sect', role: 'benefic-of-sect' });
    expect(getPlanetSectCondition('jupiter', nightInfo)).toMatchObject({ status: 'contrary-sect', role: 'benefic-contrary-sect' });
    expect(getPlanetSectCondition('mars', nightInfo)).toMatchObject({ status: 'in-sect', role: 'malefic-of-sect' });
    expect(getPlanetSectCondition('saturn', nightInfo)).toMatchObject({ status: 'contrary-sect', role: 'malefic-contrary-sect' });
  });

  it('never classifies Venus as malefic, in either sect', () => {
    expect(getPlanetSectCondition('venus', dayInfo).role).not.toMatch(/malefic/);
    expect(getPlanetSectCondition('venus', nightInfo).role).not.toMatch(/malefic/);
  });

  it('never classifies Jupiter as malefic, in either sect', () => {
    expect(getPlanetSectCondition('jupiter', dayInfo).role).not.toMatch(/malefic/);
    expect(getPlanetSectCondition('jupiter', nightInfo).role).not.toMatch(/malefic/);
  });

  it('returns not-applicable for outer planets, angles, nodes, and asteroids', () => {
    const outer: Array<Parameters<typeof getPlanetSectCondition>[0]> = [
      'uranus', 'neptune', 'pluto', 'chiron', 'trueNode', 'southNode',
      'blackMoonLilith', 'ceres', 'juno', 'vesta', 'pallas', 'asc', 'mc',
    ];
    for (const planet of outer) {
      expect(getPlanetSectCondition(planet, dayInfo)).toMatchObject({ status: 'not-applicable', role: 'outer-planet', interpretationTags: [] });
    }
  });

  it('preserves essential dignity independent of sect — same domicile, different sect status', () => {
    // Mars in Scorpio is domicile regardless of sect; only the sect status
    // (capacity vs. regulation/accessibility) should differ day vs. night.
    expect(getDignityInfo('mars', 'scorpio').label).toBe('domicile');
    expect(getPlanetSectCondition('mars', dayInfo).status).toBe('contrary-sect');
    expect(getPlanetSectCondition('mars', nightInfo).status).toBe('in-sect');

    // Saturn in Capricorn is domicile regardless of sect; sect status flips.
    expect(getDignityInfo('saturn', 'capricorn').label).toBe('domicile');
    expect(getPlanetSectCondition('saturn', dayInfo).status).toBe('in-sect');
    expect(getPlanetSectCondition('saturn', nightInfo).status).toBe('contrary-sect');
  });
});

describe('Mercury — conditional sect', () => {
  function fakeBody(longitude: number): BodyPosition {
    return {
      id: 'mercury', longitude, latitude: 0, distance: 1, speedLongitude: 1,
      declination: 0, isRetrograde: false, sign: 'aries', signDegree: 0, house: 1,
    };
  }

  it('marks Mercury ambiguous when extremely close to the Sun', () => {
    const sun = fakeBody(100); // reused as a Sun-shaped BodyPosition
    const mercury = fakeBody(100.3); // 0.3° separation, well under the 1° ambiguous orb
    const chart = computeNatalChart(einsteinDay); // for jdUT/lat/lng only
    const sect = calculateChartSect(sun, mercury, chart.input.julianDayUT, chart.input.lat, chart.input.lng);
    expect(sect.mercurySect).toBe('ambiguous');
    expect(getPlanetSectCondition('mercury', sect).status).toBe('conditional');
  });

  it('does not force a confident oriental/occidental reading in the ambiguous zone', () => {
    const sun = fakeBody(200);
    const mercury = fakeBody(200.9);
    const chart = computeNatalChart(einsteinDay);
    const sect = calculateChartSect(sun, mercury, chart.input.julianDayUT, chart.input.lat, chart.input.lng);
    expect(sect.mercuryOrientation).toBe('ambiguous');
  });
});

describe('NatalChart.western.planetSect — computed once per chart', () => {
  it('includes a sect condition entry for every western body', () => {
    const chart = computeNatalChart(einsteinDay);
    for (const id of Object.keys(chart.western.bodies)) {
      expect(chart.western.planetSect[id as keyof typeof chart.western.planetSect]).toBeDefined();
    }
  });

  it('Vedic chart data carries no sect field', () => {
    const chart = computeNatalChart(einsteinDay);
    expect('sect' in chart.vedic).toBe(false);
    expect('planetSect' in chart.vedic).toBe(false);
  });
});
