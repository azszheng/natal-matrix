'use client';

import { useEffect, useState } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import { computeAtmosphere } from '@/lib/astro/atmosphere';

// Celestial Almanac — warm ink night / airy white day, brass-gold accent
const NIGHT_VARS: Record<string, string> = {
  '--bg':               '#0c0a08',
  '--bg-raised':        '#14110d',
  '--bg-chart':         '#100d0a',
  '--line':             '#2a241b',
  '--line-chart':       '#3a3225',
  '--fg':               '#ece4d3',
  '--fg-muted':         '#b0a48c',
  '--fg-dim':           '#7c715c',
  '--fg-glyph':         '#d9b774',
  '--accent':           '#c9a44c',
  '--aspect-harmonious':'#7ba6b8',
  '--aspect-dynamic':   '#c96a52',
  '--aspect-neutral':   '#b0a48c',
  '--aspect-minor':     '#c9a44c',
  '--retro':            '#c96a52',
};

const DAY_VARS: Record<string, string> = {
  '--bg':               '#eef3f9',
  '--bg-raised':        '#ffffff',
  '--bg-chart':         '#e4eef7',
  '--line':             '#d4dde7',
  '--line-chart':       '#bccddb',
  '--fg':               '#1c2733',
  '--fg-muted':         '#54657a',
  '--fg-dim':           '#8496a8',
  '--fg-glyph':         '#b07d1e',
  '--accent':           '#c9a44c',
  '--aspect-harmonious':'#3f7a52',
  '--aspect-dynamic':   '#c2542f',
  '--aspect-neutral':   '#5f6f82',
  '--aspect-minor':     '#b07d1e',
  '--retro':            '#c2542f',
};

export default function BirthTheme({ chart }: { chart: NatalChart }) {
  const [isDay, setIsDay] = useState(false);

  useEffect(() => {
    let cancelled = false;
    computeAtmosphere(chart).then(atmo => {
      if (!cancelled) setIsDay(atmo.isDaytime && atmo.sunAltDeg > 6);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [chart.input.utc]);

  useEffect(() => {
    const vars = isDay ? DAY_VARS : NIGHT_VARS;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => { Object.keys(vars).forEach(k => root.style.removeProperty(k)); };
  }, [isDay]);

  return null;
}
