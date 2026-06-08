'use client';

import { useEffect, useState, useRef } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { BirthAtmosphere } from '@/lib/astro/atmosphere';
import { PLANET_GLYPH } from './glyphs';
import MoonFace from './MoonFace';

// ── Static data ───────────────────────────────────────────────────────────────

function seeded(n: number): number {
  const x = Math.sin(n * 99991.137) * 43758.5453;
  return x - Math.floor(x);
}

const BG_STARS = Array.from({ length: 90 }, (_, i) => ({
  lon: seeded(i + 1) * 360,
  h:   0.12 + seeded(i + 50) * 0.86,
  r:   0.5  + seeded(i + 120) * 1.4,
  tw:  1.6  + seeded(i + 200) * 3.2,
  ph:  seeded(i + 300) * 6.28,
}));

const ZODIAC_DATA = [
  { sign: 'aries', lon: 15 }, { sign: 'taurus', lon: 45 }, { sign: 'gemini', lon: 75 },
  { sign: 'cancer', lon: 105 }, { sign: 'leo', lon: 135 }, { sign: 'virgo', lon: 165 },
  { sign: 'libra', lon: 195 }, { sign: 'scorpio', lon: 225 }, { sign: 'sagittarius', lon: 255 },
  { sign: 'capricorn', lon: 285 }, { sign: 'aquarius', lon: 315 }, { sign: 'pisces', lon: 345 },
].map((c, ci) => ({
  ...c,
  stars: Array.from({ length: 4 }, (_, j) => ({
    dl: (seeded(ci * 10 + j) - 0.5) * 16,
    dh: (seeded(ci * 10 + j + 5) - 0.5) * 0.26,
    r:   0.8 + seeded(ci * 10 + j + 9) * 1.1,
  })),
}));

// Apparent magnitude table (lower = brighter). Sun/Moon always large.
const PLANET_MAG: Record<string, number> = {
  mercury: -0.2, venus: -4.3, mars: -1.2,
  jupiter: -2.4, saturn: 0.6, uranus: 5.7, neptune: 7.8, pluto: 14,
};
// 'equal' = symbolic uniform size (default per spec); 'brightness' = sized by apparent magnitude
function orbRadius(id: string, mode: 'equal' | 'brightness'): number {
  if (id === 'sun') return 12;
  if (mode === 'equal') return 5;
  const m = PLANET_MAG[id];
  if (m == null) return 5;
  return Math.max(2.0, Math.min(7.2, 4.0 + 0.6 * (-m)));
}

type PStyle = { c: string; hi: string; edge: string; r: number; glow: number; ring?: boolean; band?: boolean };
const PLANET_STYLE: Record<string, PStyle> = {
  sun:     { c: '#f5c842', hi: '#fff4c8', edge: '#e08820', r: 12,  glow: 0.30 },
  mercury: { c: '#b6a589', hi: '#e6dcc6', edge: '#776a52', r: 4.4, glow: 0.16 },
  venus:   { c: '#ecdca6', hi: '#fff7dc', edge: '#bda866', r: 6.2, glow: 0.20 },
  mars:    { c: '#c8603a', hi: '#f2a274', edge: '#7c2e16', r: 5.2, glow: 0.20 },
  jupiter: { c: '#d6b78c', hi: '#f4e6cc', edge: '#977150', r: 8,   glow: 0.18, band: true },
  saturn:  { c: '#d8c89a', hi: '#f5edcb', edge: '#998456', r: 6.8, glow: 0.18, ring: true },
  uranus:  { c: '#a6dbe2', hi: '#e0f6fa', edge: '#5c98a4', r: 5.4, glow: 0.20 },
  neptune: { c: '#5a7ad8', hi: '#a2b6f0', edge: '#2c428e', r: 5.4, glow: 0.22 },
  pluto:   { c: '#b09a86', hi: '#ddccba', edge: '#6c5a48', r: 3.8, glow: 0.14 },
};

const BODY_LABEL: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
  neptune: 'Neptune', pluto: 'Pluto', trueNode: 'N.Node', southNode: 'S.Node',
  chiron: 'Chiron', blackMoonLilith: 'Lilith', partOfFortune: 'Fortune',
};

const SKY_VISIBLE = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode',
  'chiron', 'blackMoonLilith', 'partOfFortune',
] as const;

// PLANET_GLYPH already has U+FE0E appended at source
const G = PLANET_GLYPH as Record<string, string>;


// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  chart: NatalChart;
  atmo: BirthAtmosphere;
  height?: number;
  speed?: number;
  theme: 'night' | 'day';
  sizeMode?: 'equal' | 'brightness';
};

export default function SkyBand({ chart, atmo, height = 380, speed = 4, theme, sizeMode = 'equal' }: Props) {
  const W = 1600, H = height;
  const mid = H * 0.54;
  const amp = H * 0.30;

  const [mins, setMins] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) { lastRef.current = 0; return; }
    function tick(ts: number) {
      if (!lastRef.current) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setMins(m => { const n = m + dt * speed; return n > 1440 ? 0 : n; });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed]);

  const ascNow = (chart.western.houses.asc + mins * 0.25 + 360) % 360;
  const ang = (lon: number) => ((lon - ascNow) % 360 + 360) % 360;
  const pos = (lon: number, hp = 1) => {
    const a = ang(lon);
    return { x: (a / 360) * W, y: mid - Math.sin(a * Math.PI / 180) * amp * hp, a };
  };
  const edgeFade = (x: number) => Math.max(0, Math.min(1, Math.min(x, W - x) / (W * 0.045)));

  // Clock
  const [bh, bm] = chart.input.time.split(':').map(Number);
  const birthMin = bh * 60 + bm;
  const totalMin = ((birthMin + mins) % 1440 + 1440) % 1440;
  const hh = Math.floor(totalMin / 60), mm = Math.floor(totalMin % 60);
  const clock = `${hh % 12 || 12}:${mm.toString().padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
  const atBirth = mins < 3;

  // Theme + weather
  const isDay = theme === 'day';
  const overcast = atmo.weatherCategory === 'rain' || atmo.weatherCategory === 'snow' || atmo.weatherCategory === 'cloudy';
  const dotFill = isDay ? '#5b6e88' : '#dfe7f5';

  // Fractal-noise clouds (day only) — stitched tiles drift seamlessly, density mask shapes the layer
  const cloudDrift  = isDay ? (mins * 0.7) % W : 0;
  const cloudSlope  = overcast ? 3.4 : 3.0;
  const cloudThresh = overcast ? 0.44 : 0.52;
  const cloudAlphaRow = `${cloudSlope} 0 0 0 ${(-cloudSlope * cloudThresh).toFixed(3)}`;
  const tint = overcast ? { r: 0.97, g: 0.98, b: 1 } : { r: 1, g: 1, b: 1 };
  const cloudLayer = isDay ? (
    <g mask="url(#cloud-mask)">
      <g transform={`translate(${-cloudDrift},0)`}>
        <rect x={0} y={0} width={W} height={H} fill="#fff" filter="url(#pano-clouds)" />
        <rect x={W} y={0} width={W} height={H} fill="#fff" filter="url(#pano-clouds)" />
      </g>
    </g>
  ) : null;

  // Sun glow (day, when sun above horizon)
  const sunLon = chart.western.bodies.sun?.longitude ?? 0;
  const sunP = pos(sunLon);
  const showSunGlow = isDay && sunP.a < 180;

  // Static sine ribbon
  const wavePts = Array.from({ length: 81 }, (_, i) => {
    const x = (i / 80) * W;
    const a = (i / 80) * 360;
    return `${x.toFixed(0)},${(mid - Math.sin(a * Math.PI / 180) * amp).toFixed(1)}`;
  });
  const wave = 'M ' + wavePts.join(' L ');

  // Background stars (night only)
  const stars = isDay ? [] : BG_STARS.map((s, i) => {
    const x = (ang(s.lon) / 360) * W;
    const y = H * 0.08 + (1 - s.h) * (mid - H * 0.08);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(mins / 7 + s.ph));
    return <circle key={i} cx={x} cy={y} r={s.r} fill="#dfe7f5" opacity={tw * 0.85 * edgeFade(x)} />;
  });

  // Constellations
  const consts = ZODIAC_DATA.map(c => {
    const cp = pos(c.lon, 1);
    const fade = edgeFade(cp.x);
    if (fade <= 0.02) return null;
    const pts = c.stars.map(s => { const p = pos((c.lon + s.dl + 360) % 360, 1); return { x: p.x, y: p.y + s.dh * amp * 0.5, r: s.r }; });
    const line = 'M ' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
    return (
      <g key={c.sign} opacity={fade}>
        <path d={line} fill="none" stroke="var(--fg-glyph)" strokeWidth={0.6} opacity={isDay ? 0.42 : 0.30} />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={dotFill} opacity={isDay ? 0.7 : 0.85} />)}
        <text x={cp.x} y={cp.y - 16} fontSize={11} fill="var(--fg-glyph)" textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', opacity: isDay ? 0.6 : 0.45 }}>
          {c.sign.toUpperCase()}
        </text>
      </g>
    );
  });

  // Bodies
  const bodies = SKY_VISIBLE.map(id => {
    const body = chart.western.bodies[id as keyof typeof chart.western.bodies];
    if (!body) return null;
    const lon = (body as { longitude: number }).longitude;
    const p = pos(lon, 1);
    const below = p.a > 180;
    const fade = edgeFade(p.x) * (below ? 0.62 : 1);

    if (id === 'moon') {
      const ms = 30;
      const uid = `skm${Math.round(atmo.moonPhase)}`;
      return (
        <g key={id} transform={`translate(${p.x - ms / 2},${p.y - ms / 2})`} opacity={fade}>
          <circle cx={ms / 2} cy={ms / 2} r={ms / 2 + 4} fill="#f0e6c0" opacity={0.12} />
          <svg width={ms} height={ms} viewBox={`0 0 ${ms} ${ms}`} overflow="visible">
            <MoonFace phase={atmo.moonPhase} size={ms} uid={uid} />
          </svg>
          <text x={ms / 2} y={ms + 14} fontSize={11} fill="var(--fg-muted)" textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)' }}>Moon</text>
        </g>
      );
    }

    const s = PLANET_STYLE[id];
    if (!s) {
      // Calculated points — hollow marker + glyph
      return (
        <g key={id} opacity={fade}>
          <circle cx={p.x} cy={p.y} r={2.6} fill="none" stroke="var(--fg-glyph)" strokeWidth={1.1} opacity={0.7} />
          <text x={p.x} y={p.y - 9} fontSize={13} fill="var(--fg-glyph)" textAnchor="middle"
            style={{ fontFamily: 'serif', opacity: 0.8 }}>{G[id] ?? id}</text>
          <text x={p.x} y={p.y + 15} fontSize={9.5} fill="var(--fg-dim)" textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)' }}>{BODY_LABEL[id] ?? id}</text>
        </g>
      );
    }

    const pr = orbRadius(id, sizeMode);
    return (
      <g key={id} opacity={fade}>
        <circle cx={p.x} cy={p.y} r={pr * 2.6} fill={s.c} opacity={s.glow} />
        {s.ring && (
          <ellipse cx={p.x} cy={p.y} rx={pr * 2.0} ry={pr * 0.64} fill="none" stroke={s.hi}
            strokeWidth={1.5} opacity={0.75} transform={`rotate(-20 ${p.x} ${p.y})`} />
        )}
        <circle cx={p.x} cy={p.y} r={pr} fill={`url(#pg-${id})`} stroke={s.edge} strokeWidth={0.5} />
        {s.band && (
          <g clipPath={`url(#pc-${id})`}>
            <ellipse cx={p.x} cy={p.y - pr * 0.28} rx={pr} ry={pr * 0.13} fill={s.edge} opacity={0.22} />
            <ellipse cx={p.x} cy={p.y + pr * 0.30} rx={pr} ry={pr * 0.12} fill={s.edge} opacity={0.18} />
          </g>
        )}
        <text x={p.x} y={p.y - pr - 8} fontSize={15} fill="var(--fg-glyph)" textAnchor="middle"
          style={{ fontFamily: 'serif' }}>{G[id] ?? id}</text>
        <text x={p.x} y={p.y + pr + 15} fontSize={10} fill="var(--fg-muted)" textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)' }}>{BODY_LABEL[id] ?? id}</text>
      </g>
    );
  });

  const btnStyle: React.CSSProperties = {
    fontSize: 12, fontFamily: 'var(--font-mono)', borderRadius: 1,
    width: 30, height: 26, cursor: 'pointer',
    color: isDay ? 'rgba(24,36,50,0.9)' : 'rgba(220,235,255,0.9)',
    background: isDay ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
    border: `1px solid ${isDay ? 'rgba(30,45,65,0.25)' : 'rgba(255,255,255,0.18)'}`,
  };
  const capColor = isDay ? 'rgba(28,42,58,0.82)' : 'rgba(170,194,230,0.85)';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="pano-sky" x1="0" y1="0" x2="0" y2="1">
            {isDay ? (overcast
              ? <><stop offset="0%" stopColor="#6f8cb0" /><stop offset="58%" stopColor="#9db4cf" /><stop offset="100%" stopColor="#cddded" /></>
              : <><stop offset="0%" stopColor="#4f8fd1" /><stop offset="55%" stopColor="#8cb8e6" /><stop offset="100%" stopColor="#d3e8f8" /></>)
              : <><stop offset="0%" stopColor="#02040c" /><stop offset="55%" stopColor="#06091a" /><stop offset="100%" stopColor="#0a1024" /></>}
          </linearGradient>
          <linearGradient id="pano-ground" x1="0" y1="0" x2="0" y2="1">
            {isDay
              ? <><stop offset="0%" stopColor="#c2d0db" stopOpacity="0.0" /><stop offset="100%" stopColor="#aebcc8" stopOpacity="0.55" /></>
              : <><stop offset="0%" stopColor="#0a0c16" stopOpacity="0.0" /><stop offset="100%" stopColor="#05060c" stopOpacity="0.7" /></>}
          </linearGradient>
          {/* Fractal-noise cloud filter — feColorMatrix derives alpha from noise; stitchTiles = seamless loop */}
          {isDay && (
            <filter id="pano-clouds" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.004 0.0085" numOctaves={4} seed={11} stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix"
                values={`0 0 0 0 ${tint.r}  0 0 0 0 ${tint.g}  0 0 0 0 ${tint.b}  ${cloudAlphaRow}`}
                result="c" />
              <feGaussianBlur in="c" stdDeviation={0.9} />
            </filter>
          )}
          {isDay && (
            <>
              <linearGradient id="cloud-dens" x1="0" y1="0" x2="0" y2="1">
                {overcast ? (<>
                  <stop offset="0%"   stopColor="#fff" stopOpacity={0.6} />
                  <stop offset="50%"  stopColor="#fff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#fff" stopOpacity={0.82} />
                </>) : (<>
                  <stop offset="0%"   stopColor="#fff" stopOpacity={0.72} />
                  <stop offset="40%"  stopColor="#fff" stopOpacity={0.38} />
                  <stop offset="68%"  stopColor="#fff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#fff" stopOpacity={0.95} />
                </>)}
              </linearGradient>
              <mask id="cloud-mask">
                <rect x="0" y="0" width={W} height={H} fill="url(#cloud-dens)" />
              </mask>
            </>
          )}
          {Object.entries(PLANET_STYLE).map(([id, s]) => (
            <radialGradient key={id} id={`pg-${id}`} cx="36%" cy="30%" r="78%">
              <stop offset="0%"   stopColor={s.hi} />
              <stop offset="52%"  stopColor={s.c} />
              <stop offset="100%" stopColor={s.edge} />
            </radialGradient>
          ))}
          {Object.entries(PLANET_STYLE).filter(([, s]) => s.band).map(([id]) => {
            const b = chart.western.bodies[id as keyof typeof chart.western.bodies];
            if (!b) return null;
            const p = pos((b as { longitude: number }).longitude, 0.96);
            const pr = orbRadius(id, sizeMode);
            return <clipPath key={id} id={`pc-${id}`}><circle cx={p.x} cy={p.y} r={pr} /></clipPath>;
          })}
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#pano-sky)" />
        {cloudLayer}
        <rect x="0" y={mid} width={W} height={H - mid} fill="url(#pano-ground)" />
        {stars}
        {showSunGlow && (
          <g>
            <circle cx={sunP.x} cy={sunP.y} r={78} fill="#fff4d2" opacity={overcast ? 0.22 : 0.50} />
            <circle cx={sunP.x} cy={sunP.y} r={42} fill="#ffe9a8" opacity={overcast ? 0.40 : 0.82} />
          </g>
        )}
        <path d={wave} fill="none" stroke="var(--accent)" strokeWidth={1.1} opacity={0.30} strokeDasharray="3 5" />
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="var(--fg-glyph)" strokeWidth={0.8} opacity={0.28} />
        {consts}
        {bodies}
        <text x={W * 0.25} y={mid - amp - 12} fontSize={10} fill="var(--fg-dim)" textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}>OVERHEAD</text>
        <text x={W * 0.75} y={mid + amp + 22} fontSize={10} fill="var(--fg-dim)" textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}>BELOW HORIZON</text>
        <text x={12} y={mid - 6} fontSize={10} fill="var(--fg-muted)"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>↑ HORIZON</text>
      </svg>

      {/* Controls overlay */}
      <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: capColor }}>
            Your actual birth-time sky · press play to watch it turn
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: atBirth ? 'var(--accent)' : capColor, marginLeft: 4 }}>
          {clock}{atBirth ? ' · birth' : ''}
        </span>
        <button onClick={() => setPlaying(p => !p)} style={btnStyle}>{playing ? '❚❚' : '▶'}</button>
        <button onClick={() => setMins(0)} style={btnStyle}>↺</button>
      </div>
    </div>
  );
}
