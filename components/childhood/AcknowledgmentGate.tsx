'use client';

import { useState } from 'react';

type Props = {
  title: string;
  body: string | React.ReactNode;
  checkboxText: string;
  confirmText?: string;
  onConfirm: () => void;
};

export default function AcknowledgmentGate({
  title,
  body,
  checkboxText,
  confirmText = 'I understand — continue',
  onConfirm,
}: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        maxWidth: 520, width: '100%',
        padding: '32px 28px 28px',
      }}>
        {/* Title */}
        <p style={{
          margin: '0 0 20px',
          fontFamily: 'var(--font-display)',
          fontSize: 17, fontWeight: 500,
          color: 'var(--fg)', lineHeight: 1.3,
        }}>
          {title}
        </p>

        {/* Body */}
        <div style={{
          fontSize: 13, lineHeight: 1.75,
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-sans)',
          marginBottom: 24,
        }}>
          {typeof body === 'string'
            ? body.split('\n\n').map((p, i) => <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0' }}>{p}</p>)
            : body
          }
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          cursor: 'pointer', marginBottom: 20,
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, color: 'var(--fg)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            {checkboxText}
          </span>
        </label>

        {/* Button */}
        <button
          onClick={() => { if (checked) onConfirm(); }}
          disabled={!checked}
          style={{
            width: '100%', padding: '10px 0', fontSize: 11,
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: checked ? 'var(--accent)' : 'var(--bg)',
            color: checked ? '#fff' : 'var(--fg-dim)',
            border: `1px solid ${checked ? 'var(--accent)' : 'var(--line)'}`,
            borderRadius: 4, cursor: checked ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
