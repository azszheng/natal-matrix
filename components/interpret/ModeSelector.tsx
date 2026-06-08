'use client';

import type { InterpretMode } from '@/lib/ai/prompts';
import Tooltip from '@/components/ui/Tooltip';

const MODES: {
  id: InterpretMode;
  name: string;
  subtitle: string;
  description: string;
  tooltip: string;
}[] = [
  {
    id: 'essence',
    name: 'Essence Mode',
    subtitle: 'Simple, relatable, and easy to understand',
    description: 'For users who want clear self-understanding without astrology jargon.',
    tooltip: 'Short and clear — perfect if you\'re new to astrology or want the core insight without the complexity. 100–200 words per interpretation.',
  },
  {
    id: 'deepdive',
    name: 'Deep Dive Mode',
    subtitle: 'Psychological, detailed, and personalized',
    description: 'For users who want richer insight into patterns, relationships, growth, and life themes.',
    tooltip: 'The full psychological portrait — how your placements shape relationships, work, creativity, and growth. Balances depth with accessibility. 320–600 words.',
  },
];

export default function ModeSelector({ mode, onChange }: { mode: InterpretMode; onChange: (m: InterpretMode) => void }) {
  return (
    <div className="am-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {MODES.map(m => {
        const selected = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            style={{
              flex: '1 1 160px',
              textAlign: 'left',
              background: selected ? 'color-mix(in srgb, var(--accent) 6%, var(--bg))' : 'transparent',
              border: selected ? '1px solid var(--accent)' : '1px solid var(--line)',
              borderLeft: selected ? '3px solid var(--accent)' : '1px solid var(--line)',
              borderRadius: 4,
              padding: '11px 13px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: selected ? 'var(--accent)' : 'var(--fg-muted)',
                fontWeight: 600,
              }}>
                {m.name}
              </span>
              <Tooltip text={m.tooltip} width={230} align="right">
                <span style={{
                  fontSize: 9, color: selected ? 'var(--accent)' : 'var(--fg-dim)',
                  fontFamily: 'var(--font-mono)', marginLeft: 6, opacity: 0.7,
                }}>?</span>
              </Tooltip>
            </div>
            <p style={{ margin: '0 0 3px', fontSize: 11, color: selected ? 'var(--fg)' : 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
              {m.subtitle}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.35 }}>
              {m.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
