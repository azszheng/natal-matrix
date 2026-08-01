'use client';

import { HOUSE_DATA } from '@/lib/astro/houseData';

type Props = {
  houseNum: number;
  onClose: () => void;
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function HouseInfoPanel({ houseNum, onClose }: Props) {
  const d = HOUSE_DATA[houseNum];
  if (!d) return null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, flexShrink: 0,
              border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--fg-muted)',
            }}>
              {ROMAN[houseNum]}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {d.name}
              </p>
              <h2 style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 500, color: 'var(--fg)', fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
                {d.nickname}
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 20, padding: '2px 6px', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* Description */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line)' }}>
          {d.description.split('\n\n').map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '14px 0 0', fontSize: 13, lineHeight: 1.85, color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
              {para}
            </p>
          ))}
        </div>

        {/* Themes */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--line)' }}>
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
            Core Theme
          </p>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
            {d.themes}
          </p>
        </div>

        {/* Questions to reflect on */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--line)' }}>
          <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
            Questions to Explore
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {d.questions.map((q, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Keywords */}
        <div style={{ padding: '14px 24px 20px' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
            Life Areas
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
