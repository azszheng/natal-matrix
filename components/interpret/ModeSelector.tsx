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
    name: 'Tell me what it means',
    subtitle: 'Clear, warm, no jargon',
    description: 'Plain language focused on how this shows up in real life.',
    tooltip: 'Simple and emotionally grounded — explains what the placement feels like to live, what it makes easy, what it makes hard. 150–300 words.',
  },
  {
    id: 'deepdive',
    name: 'Show me the psychology',
    subtitle: 'Psychological depth, fully personal',
    description: 'Traces the mechanism, the shadow, the integrated expression, and a reflection question.',
    tooltip: 'The full psychological portrait — how the placement shapes inner life, relationships, and behavior, with protective and integrated expressions. 500–900 words.',
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
