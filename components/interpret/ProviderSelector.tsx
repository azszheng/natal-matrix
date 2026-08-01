'use client';

export type ProviderMode = 'claude' | 'openai' | 'comparison';

const ENABLED = process.env.NEXT_PUBLIC_OPENAI_ENABLED === 'true';

const OPTIONS: { id: ProviderMode; label: string }[] = [
  { id: 'claude',     label: 'Claude'     },
  { id: 'openai',     label: 'OpenAI'     },
  { id: 'comparison', label: 'Compare'    },
];

type Props = {
  value: ProviderMode;
  onChange: (p: ProviderMode) => void;
};

export default function ProviderSelector({ value, onChange }: Props) {
  if (!ENABLED) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9.5,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--fg-dim)',
      }}>
        AI Provider
      </span>
      <div style={{ display: 'flex', border: '1px solid var(--line)' }}>
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '5px 14px', cursor: 'pointer', border: 'none',
              borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
              background: value === opt.id ? 'var(--fg-glyph)' : 'transparent',
              color: value === opt.id ? 'var(--bg)' : 'var(--fg-dim)',
              transition: 'background .12s, color .12s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
