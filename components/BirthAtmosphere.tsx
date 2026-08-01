'use client';

import { useEffect, useState } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import { computeAtmosphere, type BirthAtmosphere } from '@/lib/astro/atmosphere';
import SkyBand from '@/components/charts/SkyBand';
import MoonFace from '@/components/charts/MoonFace';

// Celestial Almanac theme tokens
const NIGHT_VARS: Record<string, string> = {
  '--bg': '#0c0a08', '--bg-raised': '#14110d', '--bg-chart': '#100d0a',
  '--line': '#2a241b', '--line-chart': '#3a3225',
  '--fg': '#ece4d3', '--fg-muted': '#b0a48c', '--fg-dim': '#7c715c', '--fg-glyph': '#d9b774',
  '--accent': '#c9a44c',
  '--aspect-harmonious': '#7ba6b8', '--aspect-dynamic': '#c96a52',
  '--aspect-neutral': '#b0a48c', '--aspect-minor': '#c9a44c', '--retro': '#c96a52',
};
const DAY_VARS: Record<string, string> = {
  '--bg': '#eef3f9', '--bg-raised': '#ffffff', '--bg-chart': '#e4eef7',
  '--line': '#d4dde7', '--line-chart': '#bccddb',
  '--fg': '#1c2733', '--fg-muted': '#54657a', '--fg-dim': '#8496a8', '--fg-glyph': '#b07d1e',
  '--accent': '#c9a44c',
  '--aspect-harmonious': '#3f7a52', '--aspect-dynamic': '#c2542f',
  '--aspect-neutral': '#5f6f82', '--aspect-minor': '#b07d1e', '--retro': '#c2542f',
};

function MoonSVG({ phase, size = 46 }: { phase: number; size?: number }) {
  const uid = `hero-moon-${Math.round(phase)}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <MoonFace phase={phase} size={size} uid={uid} />
    </svg>
  );
}

// ── Weather icon ──────────────────────────────────────────────────────────────

function WeatherIcon({ cat, size = 46 }: { cat: BirthAtmosphere['weatherCategory']; size?: number }) {
  if (cat === 'clear') {
    const c = size / 2, r = size * 0.22, rs = r + size * 0.04, rl = size * 0.12;
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return [c + Math.cos(a) * rs, c + Math.sin(a) * rs, c + Math.cos(a) * (rs + rl), c + Math.sin(a) * (rs + rl)];
    });
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rays.map((p, i) => <line key={i} x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke="#f5c842" strokeWidth={2} strokeLinecap="round" />)}
        <circle cx={c} cy={c} r={r} fill="#f5c842" />
        <circle cx={c} cy={c} r={r * 0.75} fill="#fde868" />
      </svg>
    );
  }
  if (cat === 'rain') {
    const cloud = '#2a3848', drop = '#4878b8';
    const drops = [[30, 60], [40, 65], [50, 60], [35, 72], [55, 72]];
    return (
      <svg width={size} height={size} viewBox="0 0 80 80">
        <ellipse cx={40} cy={38} rx={26} ry={12} fill={cloud} />
        <circle cx={28} cy={34} r={12} fill={cloud} /><circle cx={48} cy={30} r={16} fill={cloud} /><circle cx={36} cy={26} r={12} fill={cloud} />
        {drops.map((d, i) => <ellipse key={i} cx={d[0]} cy={d[1]} rx={2.5} ry={5} fill={drop} opacity={0.85} />)}
      </svg>
    );
  }
  if (cat === 'snow') {
    const flakes = [[30, 62], [42, 68], [54, 62], [36, 74], [50, 74]];
    return (
      <svg width={size} height={size} viewBox="0 0 80 80">
        <ellipse cx={40} cy={38} rx={26} ry={12} fill="#c8d8e8" />
        <circle cx={28} cy={34} r={12} fill="#c8d8e8" /><circle cx={48} cy={30} r={16} fill="#c8d8e8" /><circle cx={36} cy={26} r={12} fill="#c8d8e8" />
        {flakes.map((f, i) => (
          <g key={i}>
            <line x1={f[0]} y1={f[1] - 5} x2={f[0]} y2={f[1] + 5} stroke="#a0c0d8" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={f[0] - 4} y1={f[1] - 2.5} x2={f[0] + 4} y2={f[1] + 2.5} stroke="#a0c0d8" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={f[0] + 4} y1={f[1] - 2.5} x2={f[0] - 4} y2={f[1] + 2.5} stroke="#a0c0d8" strokeWidth={1.5} strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );
  }
  // cloudy / unknown
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <ellipse cx={40} cy={48} rx={28} ry={14} fill="#9ab4c8" />
      <circle cx={28} cy={44} r={14} fill="#9ab4c8" /><circle cx={50} cy={40} r={18} fill="#9ab4c8" /><circle cx={36} cy={36} r={14} fill="#9ab4c8" />
    </svg>
  );
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function weatherLabel(atmo: BirthAtmosphere): string {
  if (atmo.weatherCategory === 'clear') return atmo.isDaytime ? 'Clear' : 'Clear Night';
  if (atmo.weatherCategory === 'cloudy') return 'Cloudy';
  if (atmo.weatherCategory === 'rain') return 'Rainy';
  if (atmo.weatherCategory === 'snow') return 'Snow';
  return 'Unknown';
}

function moonPhaseLabel(phase: number): string {
  if (phase < 22.5)  return 'New Moon';
  if (phase < 67.5)  return 'Waxing Crescent';
  if (phase < 112.5) return 'First Quarter';
  if (phase < 157.5) return 'Waxing Gibbous';
  if (phase < 202.5) return 'Full Moon';
  if (phase < 247.5) return 'Waning Gibbous';
  if (phase < 292.5) return 'Last Quarter';
  if (phase < 337.5) return 'Waning Crescent';
  return 'New Moon';
}

function formatBirthLine(chart: NatalChart): string {
  const { date, time, city, region } = chart.input;
  const [y, mo, d] = date.split('-').map(Number);
  const jsDate  = new Date(Date.UTC(y, mo - 1, d));
  const weekday = jsDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const datePart = jsDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const [h, m]  = time.split(':').map(Number);
  const ampm    = h < 12 ? 'AM' : 'PM';
  const timePart = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  const place   = [city, region].filter(Boolean).join(', ');
  return `${weekday}, ${datePart} · ${timePart}${place ? ` · ${place}` : ''}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BirthAtmosphereHero({ chart }: { chart: NatalChart }) {
  const [atmo, setAtmo] = useState<BirthAtmosphere | null>(null);
  const [skyW, setSkyW] = useState(1600);
  const [skyH, setSkyH] = useState(380);

  useEffect(() => {
    let cancelled = false;
    computeAtmosphere(chart).then(a => { if (!cancelled) setAtmo(a); }).catch(() => {});
    return () => { cancelled = true; };
  }, [chart.input.utc]);

  useEffect(() => {
    function update() {
      const narrow = window.innerWidth < 720;
      setSkyW(narrow ? 490 : 1600);
      setSkyH(narrow ? 220 : 380);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Apply day/night CSS tokens to document root
  useEffect(() => {
    if (!atmo) return;
    const isDay = atmo.isDaytime && atmo.sunAltDeg > 6;
    const vars = isDay ? DAY_VARS : NIGHT_VARS;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => { Object.keys(vars).forEach(k => root.style.removeProperty(k)); };
  }, [atmo]);

  if (!atmo) return null;

  const isDay = atmo.isDaytime && atmo.sunAltDeg > 6;
  const theme = isDay ? 'day' : 'night';
  const heroBg = isDay ? 'var(--bg-chart)' : '#04060e';
  const textColor = isDay ? 'rgba(22,32,44,0.96)' : 'rgba(234,243,255,0.98)';
  const labelColor = isDay ? 'rgba(68,88,110,0.82)' : 'rgba(170,194,230,0.85)';

  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--line)', background: heroBg }}>
      {/* Title strip — sits above the sky, never over it */}
      <div className="am-hero-pad" style={{ maxWidth: 1040, margin: '0 auto', padding: '26px 28px 22px' }}>
        <div className="am-hero-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
          {/* Left: kicker + headline + birth line */}
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <p className="am-hero-kicker" style={{ margin: 0, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: labelColor }}>
              Natal Atmosphere
            </p>
            <h1 className="am-h1" style={{ margin: '12px 0 0', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 32, lineHeight: 1.16, color: textColor, letterSpacing: '0.005em' }}>
              The sky at the moment of your birth
            </h1>
            <p className="am-hero-birthline" style={{ margin: '9px 0 0', fontSize: 12.5, fontFamily: 'var(--font-mono)', color: labelColor, letterSpacing: '0.02em' }}>
              {formatBirthLine(chart)}
            </p>
          </div>

          {/* Right: weather + moon readout */}
          <div className="am-readout" style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="am-readout-icon" style={{ width: 46, height: 46, flexShrink: 0 }}>
                <WeatherIcon cat={atmo.weatherCategory} size={46} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: labelColor }}>Weather</p>
                <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: textColor, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
                  {weatherLabel(atmo)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="am-readout-icon" style={{ width: 46, height: 46, flexShrink: 0 }}>
                <MoonSVG phase={atmo.moonPhase} size={46} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: labelColor }}>Moon</p>
                <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: textColor, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
                  {moonPhaseLabel(atmo.moonPhase)}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: labelColor, whiteSpace: 'nowrap' }}>
                  {Math.round(atmo.moonPhase)}° from Sun
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Celestial band — fully unobstructed */}
      <SkyBand chart={chart} atmo={atmo} theme={theme} width={skyW} height={skyH} />

    </section>
  );
}
