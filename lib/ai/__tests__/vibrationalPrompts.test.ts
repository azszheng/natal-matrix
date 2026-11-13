import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '@/lib/astro/natal';
import type { ResolvedBirth } from '@/lib/astro/types';
import { computeVibrationalProfile, EMPHASIZED_HARMONICS } from '@/lib/astro/vibrational';
import { buildVibrationalHarmonicSection } from '../vibrationalPrompts';

const einstein: ResolvedBirth = {
  name: 'Einstein', date: '1879-03-14', time: '11:30',
  city: 'Ulm', region: 'Baden-Württemberg', country: 'Germany',
  lat: 48.3984, lng: 9.9916, timezone: 'LMT', utc: '1879-03-14T10:50:02Z', julianDayUT: 0,
};

describe('buildVibrationalHarmonicSection — ordinal grammar', () => {
  const chart = computeNatalChart(einstein);
  const profile = computeVibrationalProfile(chart);

  it('uses "23rd", not "23th", for the 23rd harmonic', () => {
    const h23 = profile.find(h => h.number === 23)!;
    const section = buildVibrationalHarmonicSection(h23, chart);
    expect(section.prompt).toContain('23RD');
    expect(section.prompt).not.toMatch(/23TH|23th/);
  });

  it('uses "31st", not "31th", for the 31st harmonic', () => {
    const h31 = profile.find(h => h.number === 31)!;
    const section = buildVibrationalHarmonicSection(h31, chart);
    expect(section.prompt).toContain('31ST');
    expect(section.prompt).not.toMatch(/31TH|31th/);
  });

  it('still uses "8th"/"9th" (regular case) correctly', () => {
    const h9 = profile.find(h => h.number === 9)!;
    const section = buildVibrationalHarmonicSection(h9, chart);
    expect(section.prompt).toContain('9TH');
  });
});

describe('EMPHASIZED_HARMONICS — no duplicate theme text', () => {
  it('gives every harmonic a distinct theme string', () => {
    const themes = EMPHASIZED_HARMONICS.map(h => h.theme);
    expect(new Set(themes).size).toBe(themes.length);
  });

  it('gives every harmonic a distinct label', () => {
    const labels = EMPHASIZED_HARMONICS.map(h => h.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
