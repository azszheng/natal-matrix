'use client';

import { useMemo } from 'react';
import type { NatalChart, BodyId } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { computeVibrationalProfile, HARMONIC_CONJUNCTION_ORB, type VibrationalHarmonic } from '@/lib/astro/vibrational';
import { buildVibrationalHarmonicSection, buildVibrationalProfileSection } from '@/lib/ai/vibrationalPrompts';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import Disclosure from '@/components/ui/Disclosure';
import InterpretButton from '@/components/interpret/InterpretButton';

const BODY_NAME: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N.Node', chiron: 'Chiron', asc: 'ASC', mc: 'MC',
};

function strengthColor(strength: number): string {
  if (strength >= 80) return '#a83232';
  if (strength >= 55) return '#c46f38';
  if (strength >= 30) return '#8a7a4a';
  return 'var(--fg-dim)';
}

// ── Harmonic card ─────────────────────────────────────────────────────────────

function HarmonicCard({
  harmonic, chart, mode, onInterpret,
}: {
  harmonic: VibrationalHarmonic;
  chart: NatalChart;
  mode: InterpretMode;
  onInterpret: (s: InterpretSection) => void;
}) {
  const hasHits = harmonic.conjunctions.length > 0;
  const section = () => buildVibrationalHarmonicSection(harmonic, chart, mode);

  return (
    <div style={{
      border: '1px solid var(--line)', background: 'var(--bg-raised)',
      padding: '14px 18px', marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, color: 'var(--fg)' }}>
            {harmonic.label}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, maxWidth: 520 }}>
            {harmonic.theme}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {hasHits && (
            <span style={{
              fontSize: 9.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
              color: strengthColor(harmonic.strength),
              border: `1px solid ${strengthColor(harmonic.strength)}`,
              borderRadius: 2, padding: '2px 6px', whiteSpace: 'nowrap',
            }}>
              {harmonic.strength}% strength
            </span>
          )}
          <InterpretButton section={section()} onInterpret={onInterpret} />
        </div>
      </div>

      {hasHits ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {harmonic.conjunctions.slice(0, 6).map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-mono)',
              color: 'var(--fg)', borderTop: i > 0 ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{ color: 'var(--fg-glyph)' }}>
                {PLANET_GLYPH[c.bodyA] ?? ''} {BODY_NAME[c.bodyA] ?? c.bodyA}
                {' conjunct '}
                {PLANET_GLYPH[c.bodyB] ?? ''} {BODY_NAME[c.bodyB] ?? c.bodyB}
              </span>
              <span style={{ color: 'var(--fg-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                orb {c.orb.toFixed(2)}°
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
          No conjunction within {HARMONIC_CONJUNCTION_ORB}° orb — not strongly activated in this chart.
        </p>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type Props = {
  chart: NatalChart;
  mode: InterpretMode;
  onInterpret: (section: InterpretSection) => void;
};

export default function VibrationalPanel({ chart, mode, onInterpret }: Props) {
  const profile = useMemo(() => computeVibrationalProfile(chart), [chart]);
  const dominant = [...profile].sort((a, b) => b.strength - a.strength)[0];
  const profileSection = () => buildVibrationalProfileSection(profile, chart, mode);

  return (
    <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 20px 13px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 620 }}>
          Harmonic astrology multiplies each planet&apos;s exact degree to reveal hidden aspect patterns as tight conjunctions.
          This is real, exact math — computed from the same ephemeris data as the rest of your chart, not a metaphor.
        </p>
        {dominant && dominant.strength > 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>
            Dominant: {dominant.number}th harmonic
          </span>
        )}
      </div>

      <div style={{ padding: '14px 20px' }}>
        <Disclosure label="What is Vibrational (harmonic) astrology?">
          <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.7 }}>
            Harmonic astrology was pioneered by John Addey and later developed into &ldquo;Vibrational Astrology&rdquo; by David Cochrane. The technique is simple to state and exact to compute: take every planet&apos;s ecliptic longitude, multiply it by a whole number N (the &ldquo;harmonic&rdquo;), and reduce the result modulo 360°. Any aspect of order N in your natal chart — a trine in the 3rd harmonic, a quintile in the 5th — collapses into an exact <strong>conjunction</strong> in that harmonic chart. A tight conjunction there means two planets share a genuine, precise Nth-harmonic relationship in your birth data.
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.7 }}>
            This section focuses on six harmonics Cochrane&apos;s research treats as especially significant — 5, 7, 8, 9, 11, and 13 — each associated with a distinct quality, from creativity (5th) to drive (8th) to innovation (11th). A tighter orb represents a stronger &ldquo;current&rdquo;; not every harmonic will show a strong hit in every chart, and that&apos;s expected — this method surfaces concentrated energy where it genuinely exists rather than forcing a reading onto every frequency.
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }}>
            This is an additional, specialized lens — not a replacement for your Western or Vedic chart.
          </p>
        </Disclosure>
      </div>

      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'flex-end' }}>
        <InterpretButton section={profileSection()} onInterpret={onInterpret} />
      </div>

      <div style={{ padding: '4px 20px 18px' }}>
        {profile.map(h => (
          <HarmonicCard key={h.number} harmonic={h} chart={chart} mode={mode} onInterpret={onInterpret} />
        ))}
      </div>
    </section>
  );
}
