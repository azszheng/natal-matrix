'use client';

import { useEffect, useState } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import { computeAtmosphere, type AtmosphericTheme } from '@/lib/astro/atmosphere';

const THEMES: Record<AtmosphericTheme, Record<string, string>> = {
  'night-clear': {
    '--bg': '#06080f',
    '--bg-raised': '#0b0f1c',
    '--bg-chart': '#08091a',
    '--line': '#141928',
    '--line-chart': '#1c2440',
    '--fg': '#dce4f2',
    '--fg-muted': '#7888aa',
    '--fg-dim': '#445570',
    '--fg-glyph': '#d4bc7a',
    '--accent': '#88b8e8',
    '--aspect-harmonious': '#6aa4d4',
    '--aspect-dynamic': '#c46060',
    '--aspect-neutral': '#9898b8',
    '--aspect-minor': '#c8ae60',
    '--retro': '#c46060',
  },
  'night-fullmoon': {
    '--bg': '#080a18',
    '--bg-raised': '#0e1128',
    '--bg-chart': '#09102a',
    '--line': '#181e38',
    '--line-chart': '#202848',
    '--fg': '#eaeff8',
    '--fg-muted': '#8e98b8',
    '--fg-dim': '#545e80',
    '--fg-glyph': '#e0d090',
    '--accent': '#c8d8f0',
    '--aspect-harmonious': '#88b4d8',
    '--aspect-dynamic': '#cc6060',
    '--aspect-neutral': '#a0a8c8',
    '--aspect-minor': '#d4c070',
    '--retro': '#cc6060',
  },
  'night-clouds': {
    '--bg': '#0b0c0e',
    '--bg-raised': '#131417',
    '--bg-chart': '#0d0e11',
    '--line': '#1d1f24',
    '--line-chart': '#24272e',
    '--fg': '#c4c8d0',
    '--fg-muted': '#6e7280',
    '--fg-dim': '#464a54',
    '--fg-glyph': '#a89860',
    '--accent': '#6e88a8',
    '--aspect-harmonious': '#5878a0',
    '--aspect-dynamic': '#a85858',
    '--aspect-neutral': '#888498',
    '--aspect-minor': '#9e8858',
    '--retro': '#a85858',
  },
  'night-rain': {
    '--bg': '#060810',
    '--bg-raised': '#0a0e1a',
    '--bg-chart': '#070912',
    '--line': '#101620',
    '--line-chart': '#18202e',
    '--fg': '#b8c4d8',
    '--fg-muted': '#607090',
    '--fg-dim': '#3a4d68',
    '--fg-glyph': '#9098b0',
    '--accent': '#4878b8',
    '--aspect-harmonious': '#3868a8',
    '--aspect-dynamic': '#9a5080',
    '--aspect-neutral': '#6888a8',
    '--aspect-minor': '#7070a8',
    '--retro': '#9a5080',
  },
  'day-golden': {
    '--bg': '#1a0e06',
    '--bg-raised': '#241408',
    '--bg-chart': '#1c100a',
    '--line': '#381e0a',
    '--line-chart': '#4a2810',
    '--fg': '#f0d898',
    '--fg-muted': '#b88850',
    '--fg-dim': '#886030',
    '--fg-glyph': '#f0aa30',
    '--accent': '#e07828',
    '--aspect-harmonious': '#b06820',
    '--aspect-dynamic': '#d04020',
    '--aspect-neutral': '#9a7840',
    '--aspect-minor': '#c87020',
    '--retro': '#d04020',
  },
  'day-clear': {
    '--bg': '#f4ede0',
    '--bg-raised': '#ede4d0',
    '--bg-chart': '#ede6d8',
    '--line': '#d0c0a0',
    '--line-chart': '#c0ae90',
    '--fg': '#28200a',
    '--fg-muted': '#6e5830',
    '--fg-dim': '#9e8860',
    '--fg-glyph': '#7a4e14',
    '--accent': '#946018',
    '--aspect-harmonious': '#487228',
    '--aspect-dynamic': '#b83020',
    '--aspect-neutral': '#806e4a',
    '--aspect-minor': '#986420',
    '--retro': '#b83020',
  },
  'day-clouds': {
    '--bg': '#eceef2',
    '--bg-raised': '#e0e4ea',
    '--bg-chart': '#e8eaee',
    '--line': '#c4c8d4',
    '--line-chart': '#b8bec8',
    '--fg': '#1e2230',
    '--fg-muted': '#4e5868',
    '--fg-dim': '#788094',
    '--fg-glyph': '#425270',
    '--accent': '#3c6494',
    '--aspect-harmonious': '#30684e',
    '--aspect-dynamic': '#943040',
    '--aspect-neutral': '#5870a0',
    '--aspect-minor': '#6c5c40',
    '--retro': '#943040',
  },
  'day-rain': {
    '--bg': '#e4ecf6',
    '--bg-raised': '#d8e4f0',
    '--bg-chart': '#deeaf4',
    '--line': '#b4c8e0',
    '--line-chart': '#a4bcd8',
    '--fg': '#14203a',
    '--fg-muted': '#385070',
    '--fg-dim': '#5e7898',
    '--fg-glyph': '#304870',
    '--accent': '#2a5890',
    '--aspect-harmonious': '#2a6860',
    '--aspect-dynamic': '#782848',
    '--aspect-neutral': '#4a6890',
    '--aspect-minor': '#505898',
    '--retro': '#782848',
  },
};

export default function BirthTheme({ chart }: { chart: NatalChart }) {
  const [theme, setTheme] = useState<AtmosphericTheme | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeAtmosphere(chart).then(atmo => {
      if (!cancelled) setTheme(atmo.theme);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [chart.input.utc]);

  useEffect(() => {
    if (!theme) return;
    const vars = THEMES[theme];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => { Object.keys(vars).forEach(k => root.style.removeProperty(k)); };
  }, [theme]);

  return null;
}
