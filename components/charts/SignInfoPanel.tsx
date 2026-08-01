'use client';

import type { SignId } from '@/lib/astro/types';
import { SIGN_DATA, ELEMENT_COLOR } from '@/lib/astro/signData';
import { SIGN_GLYPH } from './glyphs';

type Props = {
  signId: SignId;
  onClose: () => void;
};

export default function SignInfoPanel({ signId, onClose }: Props) {
  const d = SIGN_DATA[signId];
  const elColor = ELEMENT_COLOR[d.element];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 60 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(55vw, 480px)',
        background: 'var(--bg-raised)',
        borderLeft: '1px solid var(--line)',
        zIndex: 70,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: 'var(--bg-raised)', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 44, color: 'var(--fg-glyph)', fontFamily: 'serif', lineHeight: 1 }}>
              {SIGN_GLYPH[signId]}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Zodiac Sign
              </p>
              <h2 style={{ margin: '3px 0 0', fontSize: 24, fontWeight: 500, color: 'var(--fg)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {d.name}
              </h2>
              <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: d.element, color: elColor },
                  { label: d.modality, color: 'var(--fg-dim)' },
                  { label: `Ruled by ${d.ruler}`, color: 'var(--fg-dim)' },
                ].map(tag => (
                  <span key={tag.label} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '2px 8px',
                    border: `1px solid ${tag.color}`, color: tag.color,
                  }}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 20, padding: '2px 6px', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* Essence */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line)' }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
            {d.essence}
          </p>
        </div>

        {/* 3 Evolutions */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)' }}>
          <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
            Three Evolutions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {d.evolutions.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {ev.symbol}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
                    {ev.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)' }}>
                    {ev.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Positive + Shadow traits */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--aspect-harmonious)' }}>
              Strengths
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.positive.map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                  <span style={{ color: 'var(--aspect-harmonious)', fontSize: 10, marginTop: 2, flexShrink: 0 }}>+</span>
                  <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--aspect-dynamic)' }}>
              Shadow
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.shadow.map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                  <span style={{ color: 'var(--aspect-dynamic)', fontSize: 10, marginTop: 2, flexShrink: 0 }}>−</span>
                  <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Keywords */}
        <div style={{ padding: '14px 24px 20px' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
            Keywords
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {d.keywords.map(k => (
              <span key={k} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
                padding: '3px 10px', border: '1px solid var(--line)', color: 'var(--fg-dim)',
              }}>
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
