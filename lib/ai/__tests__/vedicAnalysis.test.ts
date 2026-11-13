import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '@/lib/astro/natal';
import type { ResolvedBirth } from '@/lib/astro/types';
import { analyzeVedicChart } from '../vedicAnalysis';

const BIRTHS: ResolvedBirth[] = [
  {
    name: 'Test A', date: '1986-10-26', time: '01:15',
    city: 'Fuzhou', region: 'Fujian', country: 'China',
    lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
    utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
  },
  {
    name: 'Test B', date: '2000-06-15', time: '12:30',
    city: 'New York', region: 'NY', country: 'USA',
    lat: 40.7128, lng: -74.006, timezone: 'America/New_York',
    utc: '2000-06-15T16:30:00Z', julianDayUT: 0,
  },
  {
    name: 'Test C', date: '1975-03-02', time: '08:05',
    city: 'London', region: '', country: 'UK',
    lat: 51.5074, lng: -0.1278, timezone: 'Europe/London',
    utc: '1975-03-02T08:05:00Z', julianDayUT: 0,
  },
];

describe('Kemadruma Yoga — single source of truth', () => {
  it('the Moon section flag and the Yogas list never contradict each other', () => {
    for (const birth of BIRTHS) {
      const chart = computeNatalChart(birth);
      const analysis = analyzeVedicChart(chart);
      const yogaListHasKemadruma = analysis.yogas.some(y => y.name === 'Kemadruma Yoga');
      expect(analysis.moonAnalysis.hasKemadruma).toBe(yogaListHasKemadruma);
    }
  });
});

describe('detectYogas — significance-ranked, not insertion-ordered', () => {
  it('never returns more than 10 yogas', () => {
    for (const birth of BIRTHS) {
      const chart = computeNatalChart(birth);
      const analysis = analyzeVedicChart(chart);
      expect(analysis.yogas.length).toBeLessThanOrEqual(10);
    }
  });

  it('places rarer/high-priority categories ahead of generic ones when both are present', () => {
    for (const birth of BIRTHS) {
      const chart = computeNatalChart(birth);
      const analysis = analyzeVedicChart(chart);
      const rajaIdx = analysis.yogas.findIndex(y => y.category === 'raja');
      const dhanaIdx = analysis.yogas.findIndex(y => y.category === 'dhana');
      if (rajaIdx !== -1 && dhanaIdx !== -1) {
        expect(dhanaIdx).toBeLessThan(rajaIdx);
      }
    }
  });
});
