import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '@/lib/astro/natal';
import type { ResolvedBirth } from '@/lib/astro/types';
import { analyzeChart, bodyContext, aspectContext, formatChartAnalysis } from '../chartAnalysis';
import { buildSnapshotPrompt } from '../prompts';

const einsteinDay: ResolvedBirth = {
  // 11:30 LMT -- solidly daytime
  name: 'Einstein', date: '1879-03-14', time: '11:30',
  city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
  lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
};

const fuzhouNight: ResolvedBirth = {
  // 01:15 local -- solidly nighttime
  name: 'Test', date: '1986-10-26', time: '01:15',
  city: 'Fuzhou', region: 'Fujian', country: 'China',
  lat: 26.0745, lng: 119.2965, timezone: 'Asia/Shanghai',
  utc: '1986-10-25T17:15:00Z', julianDayUT: 0,
};

describe('bodyContext — sect synthesis wiring', () => {
  it('includes a SECT line for a traditional planet, naming capacity vs accessibility separately', () => {
    const chart = computeNatalChart(einsteinDay);
    const analysis = analyzeChart(chart);
    const ctx = bodyContext('mars', chart, analysis);
    expect(ctx).toMatch(/SECT/);
    expect(ctx).toMatch(/NOT capacity/);
    expect(ctx).toContain(chart.western.planetSect.mars!.role.replace(/-/g, ' '));
  });

  it('omits the SECT line entirely for outer planets', () => {
    const chart = computeNatalChart(einsteinDay);
    const analysis = analyzeChart(chart);
    const ctx = bodyContext('pluto', chart, analysis);
    expect(ctx).not.toMatch(/SECT/);
  });

  it('flags mutual reception when present, without claiming simple weakness', () => {
    // Einstein's chart has a genuine Mars/Saturn mutual reception (verified
    // directly against computed dignities during implementation).
    const chart = computeNatalChart(einsteinDay);
    expect(chart.western.dignities.mars.label).not.toBe('domicile');
    expect(chart.western.dignities.mars.traditionalRuler).toBe('saturn');
    expect(chart.western.dignities.saturn.traditionalRuler).toBe('mars');

    const analysis = analyzeChart(chart);
    const ctx = bodyContext('mars', chart, analysis);
    expect(ctx).toMatch(/Mutual reception/);
    expect(ctx).toMatch(/not simple weakness/);
  });
});

describe('aspectContext — sect lines for both bodies', () => {
  it('includes sect synthesis for both traditional planets in an aspect', () => {
    const chart = computeNatalChart(einsteinDay);
    const analysis = analyzeChart(chart);
    const ctx = aspectContext('mars', 'saturn', chart, analysis);
    const sectMentions = (ctx.match(/SECT \(accessibility/g) ?? []).length;
    expect(sectMentions).toBe(2);
  });

  it('includes only one SECT line when the other body is not-applicable (outer planet)', () => {
    const chart = computeNatalChart(einsteinDay);
    const analysis = analyzeChart(chart);
    const ctx = aspectContext('mars', 'pluto', chart, analysis);
    const sectMentions = (ctx.match(/SECT \(accessibility/g) ?? []).length;
    expect(sectMentions).toBe(1);
  });
});

describe('formatChartAnalysis — CHART SECT header block', () => {
  it('shows Day with the correct team for a daytime chart', () => {
    const chart = computeNatalChart(einsteinDay);
    const analysis = analyzeChart(chart);
    const text = formatChartAnalysis(chart, analysis);
    expect(text).toMatch(/CHART SECT: Day/);
    expect(text).toMatch(/Sect luminary: Sun/);
    expect(text).toMatch(/Benefic of sect: Jupiter/);
    expect(text).toMatch(/Malefic of sect: Saturn/);
  });

  it('shows Night with the correct team for a nighttime chart', () => {
    const chart = computeNatalChart(fuzhouNight);
    const analysis = analyzeChart(chart);
    const text = formatChartAnalysis(chart, analysis);
    expect(text).toMatch(/CHART SECT: Night/);
    expect(text).toMatch(/Sect luminary: Moon/);
    expect(text).toMatch(/Benefic of sect: Venus/);
    expect(text).toMatch(/Malefic of sect: Mars/);
  });

  it('never presents sect as a numeric +/- score', () => {
    const chart = computeNatalChart(einsteinDay);
    const analysis = analyzeChart(chart);
    const text = formatChartAnalysis(chart, analysis);
    expect(text).toMatch(/never a \+\/- score/);
  });
});

describe('buildSnapshotPrompt ("Chart at a Glance") — sect line', () => {
  it('names the chart sect, sect light, benefic/malefic of sect, and contrary pair', () => {
    const chart = computeNatalChart(einsteinDay);
    const section = buildSnapshotPrompt(chart);
    expect(section.prompt).toMatch(/Chart sect: Day chart/);
    expect(section.prompt).toMatch(/sect light Sun/);
    expect(section.prompt).toMatch(/benefic of sect Jupiter/);
    expect(section.prompt).toMatch(/malefic of sect Saturn/);
  });

  it('explicitly bans the day/night cliché oversimplifications', () => {
    const chart = computeNatalChart(einsteinDay);
    const section = buildSnapshotPrompt(chart);
    expect(section.prompt.toLowerCase()).toMatch(/night charts are emotional/);
    expect(section.prompt.toLowerCase()).toMatch(/day charts are rational/);
  });
});
