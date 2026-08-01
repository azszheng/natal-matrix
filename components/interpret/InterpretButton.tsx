'use client';

import type { InterpretSection } from '@/lib/ai/prompts';

type Props = {
  section: InterpretSection;
  onInterpret: (section: InterpretSection) => void;
};

export default function InterpretButton({ section, onInterpret }: Props) {
  return (
    <button
      onClick={() => onInterpret(section)}
      title="Generate AI interpretation"
      aria-label={`Interpret ${section.label} with AI`}
      style={{
        background: 'none',
        border: '1px solid var(--accent)',
        borderRadius: 4,
        padding: '5px 11px',
        cursor: 'pointer',
        color: 'var(--accent)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.background = 'var(--accent)';
        btn.style.color = '#fff';
      }}
      onMouseLeave={e => {
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.background = 'none';
        btn.style.color = 'var(--accent)';
      }}
    >
      <span style={{ fontSize: 12, lineHeight: 1 }}>✦</span>
      Interpret
    </button>
  );
}
