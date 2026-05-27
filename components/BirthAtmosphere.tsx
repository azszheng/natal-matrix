'use client';

import { useEffect, useState } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import { computeAtmosphere, type BirthAtmosphere } from '@/lib/astro/atmosphere';

// ─── Sky gradients ────────────────────────────────────────────────────────────

const SKY: Record<string, string> = {
  'day-clear':    'linear-gradient(to bottom, #2a7fd4 0%, #5ba8e8 30%, #a8d4f5 65%, #f0ece0 100%)',
  'day-clouds':   'linear-gradient(to bottom, #7090b0 0%, #9ab4c8 40%, #c8d8e4 70%, #e8eaee 100%)',
  'day-rain':     'linear-gradient(to bottom, #4a6080 0%, #6a8098 40%, #9ab0c0 70%, #c8d8e0 100%)',
  'day-golden':   'linear-gradient(to bottom, #c84800 0%, #e07820 25%, #f0a840 55%, #f8d888 80%, #fff0c0 100%)',
  'night-clear':  'linear-gradient(to bottom, #03050e 0%, #06080f 40%, #0a0d1a 70%, #101828 100%)',
  'night-fullmoon':'linear-gradient(to bottom, #050814 0%, #090e20 40%, #0f1530 70%, #16203a 100%)',
  'night-clouds': 'linear-gradient(to bottom, #080a0d 0%, #0c0e12 40%, #131518 70%, #1c1e24 100%)',
  'night-rain':   'linear-gradient(to bottom, #02040c 0%, #050810 40%, #080c18 70%, #0c1020 100%)',
};

// ─── Day / night CSS variables ────────────────────────────────────────────────

const DAY_VARS: Record<string, string> = {
  '--bg':               '#f5f0e8',
  '--bg-raised':        '#ede6d4',
  '--bg-chart':         '#e8e0cc',
  '--line':             '#c8baa0',
  '--line-chart':       '#b8a888',
  '--fg':               '#28200a',
  '--fg-muted':         '#6e5830',
  '--fg-dim':           '#9e8860',
  '--fg-glyph':         '#7a4e14',
  '--accent':           '#946018',
  '--aspect-harmonious':'#487228',
  '--aspect-dynamic':   '#b83020',
  '--aspect-neutral':   '#806e4a',
  '--aspect-minor':     '#986420',
  '--retro':            '#b83020',
};

const NIGHT_VARS: Record<string, string> = {
  '--bg':               '#06080f',
  '--bg-raised':        '#0b0f1c',
  '--bg-chart':         '#08091a',
  '--line':             '#141928',
  '--line-chart':       '#1c2440',
  '--fg':               '#dce4f2',
  '--fg-muted':         '#7888aa',
  '--fg-dim':           '#445570',
  '--fg-glyph':         '#d4bc7a',
  '--accent':           '#88b8e8',
  '--aspect-harmonious':'#6aa4d4',
  '--aspect-dynamic':   '#c46060',
  '--aspect-neutral':   '#9898b8',
  '--aspect-minor':     '#c8ae60',
  '--retro':            '#c46060',
};

// ─── SVG: Moon ────────────────────────────────────────────────────────────────

function MoonSVG({ phase, size = 80 }: { phase: number; size?: number }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const id = `moon-clip-${Math.round(phase)}`;

  // phase: 0=new, 90=first quarter, 180=full, 270=last quarter
  // terminator ellipse x-radius: how squished the terminator is
  // at 0°   → new moon (all dark)
  // at 90°  → first quarter (right half lit)
  // at 180° → full moon (all lit)
  // at 270° → last quarter (left half lit)

  const isWaxing = phase < 180;
  const isGibbous = (phase >= 90 && phase < 270);

  // rx of the terminator ellipse (0 = straight edge, r = full circle)
  const normalised = isWaxing ? phase / 180 : (phase - 180) / 180; // 0→1 in half-cycle
  const termRx = r * Math.abs(Math.cos(normalised * Math.PI));

  // For waxing: lit side is right; for waning: lit side is left
  const litOnRight = isWaxing;

  // The lit half is a semicircle on one side, plus/minus the terminator ellipse
  // We draw using a clipPath approach:
  //   1. full dark circle
  //   2. clip a lit region = union of lit-half-rect + terminator-ellipse (gibbous)
  //                        = intersection of lit-half-rect - terminator-ellipse (crescent)

  const moonFill   = '#e8e0c8';
  const shadowFill = '#181c28';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Clip to circle boundary */}
        <clipPath id={`${id}-outer`}>
          <circle cx={cx} cy={cy} r={r - 0.5} />
        </clipPath>

        {/* Lit half mask */}
        <mask id={`${id}-mask`}>
          {/* Start with a white (visible) full circle */}
          <circle cx={cx} cy={cy} r={r} fill="white" />

          {/* For crescent: punch out the dark side (terminator ellipse on lit side) */}
          {!isGibbous && (
            <ellipse
              cx={cx + (litOnRight ? termRx : -termRx)}
              cy={cy}
              rx={termRx}
              ry={r}
              fill="black"
            />
          )}

          {/* Always hide the dark half-rect */}
          <rect
            x={litOnRight ? 0 : cx}
            y={0}
            width={r}
            height={size}
            fill="black"
          />

          {/* For gibbous: add terminator ellipse to restore the extra lit portion */}
          {isGibbous && (
            <ellipse
              cx={cx + (litOnRight ? -termRx : termRx)}
              cy={cy}
              rx={termRx}
              ry={r}
              fill="white"
            />
          )}
        </mask>
      </defs>

      {/* Shadow base */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill={shadowFill} clipPath={`url(#${id}-outer)`} />

      {/* Lit portion */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill={moonFill} mask={`url(#${id}-mask)`} clipPath={`url(#${id}-outer)`} />

      {/* Subtle crater texture on lit portion */}
      <circle cx={cx + r * 0.15} cy={cy - r * 0.25} r={r * 0.07} fill={shadowFill} opacity={0.12} mask={`url(#${id}-mask)`} />
      <circle cx={cx - r * 0.1}  cy={cy + r * 0.2}  r={r * 0.05} fill={shadowFill} opacity={0.10} mask={`url(#${id}-mask)`} />
      <circle cx={cx + r * 0.3}  cy={cy + r * 0.1}  r={r * 0.04} fill={shadowFill} opacity={0.08} mask={`url(#${id}-mask)`} />

      {/* Thin rim highlight */}
      <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke={moonFill} strokeWidth={0.5} opacity={0.3} />
    </svg>
  );
}

// ─── SVG: Sun ─────────────────────────────────────────────────────────────────

function SunIcon({ size = 80 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.22;
  const rayLen = size * 0.13;
  const rayStart = r + size * 0.04;
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const x1 = c + Math.cos(a) * rayStart;
    const y1 = c + Math.sin(a) * rayStart;
    const x2 = c + Math.cos(a) * (rayStart + rayLen);
    const y2 = c + Math.sin(a) * (rayStart + rayLen);
    return { x1, y1, x2, y2 };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rays.map((ray, i) => (
        <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2}
          stroke="#f5c842" strokeWidth={2.5} strokeLinecap="round" />
      ))}
      <circle cx={c} cy={c} r={r} fill="#f5c842" />
      <circle cx={c} cy={c} r={r * 0.75} fill="#fde868" />
    </svg>
  );
}

// ─── SVG: Cloud ───────────────────────────────────────────────────────────────

function CloudIcon({ size = 80, color = '#c8d8e8' }: { size?: number; color?: string }) {
  const s = size / 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <ellipse cx={40} cy={48} rx={28} ry={14} fill={color} />
      <circle  cx={28} cy={44} r={14} fill={color} />
      <circle  cx={50} cy={40} r={18} fill={color} />
      <circle  cx={36} cy={36} r={14} fill={color} />
    </svg>
  );
}

// ─── SVG: Partly Cloudy ───────────────────────────────────────────────────────

function PartlyCloudyIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      {/* Mini sun behind */}
      <circle cx={28} cy={28} r={14} fill="#f5c842" opacity={0.9} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <line key={i}
            x1={28 + Math.cos(a) * 16} y1={28 + Math.sin(a) * 16}
            x2={28 + Math.cos(a) * 22} y2={28 + Math.sin(a) * 22}
            stroke="#f5c842" strokeWidth={2} strokeLinecap="round" opacity={0.9} />
        );
      })}
      {/* Cloud in front */}
      <ellipse cx={46} cy={54} rx={24} ry={12} fill="#d8e4f0" />
      <circle  cx={34} cy={50} r={12} fill="#d8e4f0" />
      <circle  cx={52} cy={46} r={15} fill="#d8e4f0" />
      <circle  cx={40} cy={42} r={12} fill="#d8e4f0" />
    </svg>
  );
}

// ─── SVG: Rain ────────────────────────────────────────────────────────────────

function RainIcon({ size = 80, dark = false }: { size?: number; dark?: boolean }) {
  const cloudColor = dark ? '#2a3848' : '#9ab4c8';
  const dropColor  = dark ? '#4878b8' : '#5890c8';
  const drops = [
    { x: 30, y: 60 }, { x: 40, y: 65 }, { x: 50, y: 60 },
    { x: 35, y: 72 }, { x: 55, y: 72 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <ellipse cx={40} cy={38} rx={26} ry={12} fill={cloudColor} />
      <circle  cx={28} cy={34} r={12} fill={cloudColor} />
      <circle  cx={48} cy={30} r={16} fill={cloudColor} />
      <circle  cx={36} cy={26} r={12} fill={cloudColor} />
      {drops.map((d, i) => (
        <ellipse key={i} cx={d.x} cy={d.y} rx={2.5} ry={5} fill={dropColor} opacity={0.85} />
      ))}
    </svg>
  );
}

// ─── SVG: Snow ────────────────────────────────────────────────────────────────

function SnowIcon({ size = 80 }: { size?: number }) {
  const flakes = [
    { x: 30, y: 62 }, { x: 42, y: 68 }, { x: 54, y: 62 },
    { x: 36, y: 74 }, { x: 50, y: 74 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <ellipse cx={40} cy={38} rx={26} ry={12} fill="#c8d8e8" />
      <circle  cx={28} cy={34} r={12} fill="#c8d8e8" />
      <circle  cx={48} cy={30} r={16} fill="#c8d8e8" />
      <circle  cx={36} cy={26} r={12} fill="#c8d8e8" />
      {flakes.map((f, i) => (
        <g key={i}>
          <line x1={f.x} y1={f.y - 5} x2={f.x} y2={f.y + 5} stroke="#a0c0d8" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={f.x - 4.3} y1={f.y - 2.5} x2={f.x + 4.3} y2={f.y + 2.5} stroke="#a0c0d8" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={f.x + 4.3} y1={f.y - 2.5} x2={f.x - 4.3} y2={f.y + 2.5} stroke="#a0c0d8" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// ─── SVG: Stars ───────────────────────────────────────────────────────────────

const STARS = [
  { x: 8,  y: 12, r: 1.2, o: 0.9 }, { x: 22, y: 6,  r: 0.9, o: 0.6 }, { x: 38, y: 10, r: 1.4, o: 0.8 },
  { x: 55, y: 4,  r: 1.0, o: 0.7 }, { x: 70, y: 14, r: 0.8, o: 0.9 }, { x: 82, y: 8,  r: 1.1, o: 0.6 },
  { x: 92, y: 20, r: 0.7, o: 0.8 }, { x: 15, y: 28, r: 0.8, o: 0.7 }, { x: 45, y: 22, r: 1.0, o: 0.9 },
  { x: 62, y: 30, r: 0.6, o: 0.6 }, { x: 78, y: 26, r: 1.3, o: 0.8 }, { x: 5,  y: 45, r: 0.9, o: 0.7 },
  { x: 30, y: 40, r: 1.1, o: 0.9 }, { x: 88, y: 38, r: 0.8, o: 0.6 }, { x: 96, y: 52, r: 1.0, o: 0.8 },
  { x: 18, y: 55, r: 0.7, o: 0.7 }, { x: 50, y: 48, r: 1.2, o: 0.9 }, { x: 72, y: 50, r: 0.9, o: 0.6 },
  { x: 10, y: 68, r: 0.8, o: 0.8 }, { x: 35, y: 62, r: 1.0, o: 0.7 }, { x: 60, y: 65, r: 0.7, o: 0.9 },
  { x: 85, y: 60, r: 1.1, o: 0.6 }, { x: 25, y: 78, r: 0.9, o: 0.8 }, { x: 48, y: 75, r: 0.6, o: 0.7 },
  { x: 75, y: 72, r: 1.0, o: 0.9 }, { x: 93, y: 78, r: 0.8, o: 0.6 }, { x: 42, y: 85, r: 1.2, o: 0.8 },
  { x: 65, y: 82, r: 0.7, o: 0.7 },
];

function Stars() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 }} viewBox="0 0 100 90" preserveAspectRatio="xMidYMid slice">
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
      ))}
    </svg>
  );
}

// ─── Weather + time label helpers ─────────────────────────────────────────────

function weatherLabel(cat: BirthAtmosphere['weatherCategory'], theme: string): string {
  if (theme === 'day-golden') return 'Golden Hour';
  if (cat === 'clear')   return 'Clear';
  if (cat === 'cloudy')  return 'Cloudy';
  if (cat === 'rain')    return 'Rainy';
  if (cat === 'snow')    return 'Snow';
  return 'Unknown conditions';
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

// ─── Weather icon selector ────────────────────────────────────────────────────

function WeatherIcon({ atmo, size = 72 }: { atmo: BirthAtmosphere; size?: number }) {
  const { theme, weatherCategory: cat } = atmo;
  const dark = !atmo.isDaytime;

  if (theme === 'day-golden')  return <SunIcon size={size} />;
  if (cat === 'clear' && atmo.isDaytime) return <SunIcon size={size} />;
  if (cat === 'clear' && !atmo.isDaytime) return null; // moon handles it
  if (cat === 'cloudy' && atmo.isDaytime) return <PartlyCloudyIcon size={size} />;
  if (cat === 'cloudy' && !atmo.isDaytime) return <CloudIcon size={size} color="#2a3848" />;
  if (cat === 'rain')  return <RainIcon size={size} dark={dark} />;
  if (cat === 'snow')  return <SnowIcon size={size} />;
  if (cat === 'unknown' && atmo.isDaytime) return <PartlyCloudyIcon size={size} />;
  return null;
}

// ─── Sky Card ────────────────────────────────────────────────────────────────

function SkyCard({ atmo }: { atmo: BirthAtmosphere }) {
  const { theme, isDaytime, moonPhase } = atmo;
  const gradient = SKY[theme] ?? SKY['night-clear'];
  const isNight  = !isDaytime || theme === 'night-clear' || theme === 'night-fullmoon' || theme === 'night-clouds' || theme === 'night-rain';

  const wLabel = weatherLabel(atmo.weatherCategory, theme);
  const mLabel = moonPhaseLabel(moonPhase);

  const textColor = isNight ? 'rgba(220,235,255,0.9)' : 'rgba(30,20,8,0.75)';
  const labelColor = isNight ? 'rgba(160,185,220,0.7)' : 'rgba(80,60,30,0.6)';

  return (
    <div style={{
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      background: gradient,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      minHeight: 120,
    }}>
      {/* Stars overlay for night */}
      {isNight && <Stars />}

      {/* Weather icon */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <WeatherIcon atmo={atmo} size={72} />
      </div>

      {/* Weather label */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <p style={{ margin: '0 0 2px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor }}>
          Weather
        </p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: textColor, fontFamily: 'var(--font-sans)' }}>
          {wLabel}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: labelColor, fontFamily: 'var(--font-mono)' }}>
          {isDaytime ? (theme === 'day-golden' ? 'Twilight' : 'Daytime birth') : 'Nighttime birth'}
        </p>
      </div>

      {/* Divider */}
      <div style={{ position: 'relative', zIndex: 1, width: 1, height: 60, background: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', flexShrink: 0 }} />

      {/* Moon */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <MoonSVG phase={moonPhase} size={64} />
      </div>

      {/* Moon label */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor }}>
          Moon
        </p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: textColor, fontFamily: 'var(--font-sans)' }}>
          {mLabel}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: labelColor, fontFamily: 'var(--font-mono)' }}>
          {Math.round(moonPhase)}° from Sun
        </p>
      </div>
    </div>
  );
}

// ─── Birth header ─────────────────────────────────────────────────────────────

function formatBirthLine(chart: NatalChart): string {
  const { date, time, city, region } = chart.input;
  const [y, mo, d] = date.split('-').map(Number);
  const jsDate   = new Date(Date.UTC(y, mo - 1, d));
  const weekday  = jsDate.toLocaleDateString('en-US', { weekday: 'long',  timeZone: 'UTC' });
  const datePart = jsDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const [h, m]   = time.split(':').map(Number);
  const ampm     = h < 12 ? 'AM' : 'PM';
  const hour12   = h % 12 || 12;
  const timePart = `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  const place    = city || region;
  return `You were born on ${weekday}, ${datePart} at ${timePart}${place ? ` in ${place}` : ''}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function BirthAtmosphere({ chart }: { chart: NatalChart }) {
  const [atmo, setAtmo] = useState<BirthAtmosphere | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeAtmosphere(chart).then(a => {
      if (!cancelled) setAtmo(a);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [chart.input.utc]);

  // Apply day/night CSS theme to document root
  useEffect(() => {
    if (!atmo) return;
    const vars = atmo.isDaytime && atmo.sunAltDeg > 6 ? DAY_VARS : NIGHT_VARS;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => { Object.keys(vars).forEach(k => root.style.removeProperty(k)); };
  }, [atmo]);

  if (!atmo) return null;
  return (
    <div>
      <p style={{
        margin:        '0 0 8px',
        fontSize:      11,
        color:         'var(--fg-muted)',
        fontFamily:    'var(--font-mono)',
        letterSpacing: '0.03em',
      }}>
        {formatBirthLine(chart)}
      </p>
      <SkyCard atmo={atmo} />
    </div>
  );
}
