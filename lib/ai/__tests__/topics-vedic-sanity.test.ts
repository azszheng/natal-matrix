import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../../astro/natal';
import type { ResolvedBirth } from '../../astro/types';
import { computeTopics, topicToSection } from '../topics';

describe('topics.ts Vedic enrichment (sanity check, not a permanent assertion suite)', () => {
  const einsteinBirth: ResolvedBirth = {
    name: 'Albert Einstein',
    date: '1879-03-14',
    time: '11:30',
    city: 'Ulm',
    region: 'Baden-Württemberg',
    country: 'Germany',
    lat: 48.3984,
    lng: 9.9916,
    timezone: 'LMT',
    utc: '1879-03-14T10:50:02Z',
    julianDayUT: 0,
  };

  it('produces a plausible mix of topics with and without Vedic anchors', () => {
    const chart = computeNatalChart(einsteinBirth);
    const topics = computeTopics(chart);

    expect(topics).toHaveLength(14);

    const withVedic = topics.filter(t => t.vedicAnchors.length > 0);
    const withoutVedic = topics.filter(t => t.vedicAnchors.length === 0);

    console.log('\n=== Topic scoring (Western vs Vedic anchors) ===');
    for (const t of topics) {
      console.log(`\n[${t.relevanceLabel}] ${t.title} — score ${t.relevanceScore}`);
      console.log('  Western:', t.chartAnchors);
      console.log('  Vedic:  ', t.vedicAnchors);
    }

    // Sanity: neither extreme — some topics get real Vedic corroboration,
    // some genuinely don't (no forced signal on every topic).
    expect(withVedic.length).toBeGreaterThan(0);
    expect(withoutVedic.length).toBeGreaterThan(0);

    // Prompt for the top topic should mention Vedic only if it has anchors.
    const top = topics[0];
    const section = topicToSection(top, chart);
    console.log(`\n=== Prompt for top topic: ${top.title} ===\n`);
    console.log(section.prompt);

    if (top.vedicAnchors.length > 0) {
      expect(section.prompt).toContain('VEDIC (SIDEREAL) CHART INDICATORS');
    } else {
      expect(section.prompt).not.toContain('VEDIC (SIDEREAL) CHART INDICATORS');
    }
  });
});
