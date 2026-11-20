'use client';

import { useState } from 'react';
import { illuminationFromPhaseAngle } from '@/lib/astro/moonPhase';
import MoonPhaseIcon from '@/components/moon/MoonPhaseIcon';

const EIGHT_PHASES: { label: string; angle: number }[] = [
  { label: 'New Moon',         angle: 0   },
  { label: 'Waxing Crescent',  angle: 45  },
  { label: 'First Quarter',    angle: 90  },
  { label: 'Waxing Gibbous',   angle: 135 },
  { label: 'Full Moon',        angle: 180 },
  { label: 'Waning Gibbous',   angle: 225 },
  { label: 'Last Quarter',     angle: 270 },
  { label: 'Waning Crescent',  angle: 315 },
];

const SIZE_CHECK = [32, 48, 64, 96, 128, 160, 200, 256];

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'var(--fg-dim)',
};

export default function MoonPhasePreview() {
  const [angle, setAngle] = useState(90);
  const { illuminatedFraction, isWaxing } = illuminationFromPhaseAngle(angle);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent)' }}>
          Dev Only — not reachable in production
        </p>
        <h1 style={{ margin: '0 0 28px', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, color: 'var(--fg)' }}>
          NatalMoonIcon Preview
        </h1>

        {/* Slider-driven sweep */}
        <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '24px 28px', marginBottom: 28 }}>
          <p style={labelStyle}>0° → 360° continuous sweep</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 16, flexWrap: 'wrap' }}>
            <MoonPhaseIcon illuminatedFraction={illuminatedFraction} isWaxing={isWaxing} size={180} />
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              <input
                type="range" min={0} max={360} step={0.5} value={angle}
                onChange={e => setAngle(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                <span>Phase angle: <strong>{angle.toFixed(1)}°</strong></span>
                <span>Illuminated fraction: <strong>{(illuminatedFraction * 100).toFixed(1)}%</strong></span>
                <span>{isWaxing ? 'Waxing (lit right limb)' : 'Waning (lit left limb)'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Eight major phases side by side */}
        <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '24px 28px', marginBottom: 28 }}>
          <p style={labelStyle}>Eight major phases</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 16 }}>
            {EIGHT_PHASES.map(({ label, angle: a }) => {
              const { illuminatedFraction: f, isWaxing: w } = illuminationFromPhaseAngle(a);
              return (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <MoonPhaseIcon illuminatedFraction={f} isWaxing={w} size={96} />
                  <p style={{ margin: 0, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textAlign: 'center' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>{a}° · {(f * 100).toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Size consistency check */}
        <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '24px 28px' }}>
          <p style={labelStyle}>Size consistency — 32px to 256px, same phase</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {SIZE_CHECK.map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <MoonPhaseIcon illuminatedFraction={illuminatedFraction} isWaxing={isWaxing} size={s} />
                <p style={{ margin: 0, fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>{s}px</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
