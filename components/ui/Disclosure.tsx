'use client';

import { useState } from 'react';

export default function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: '0 0 4px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--accent)', padding: '2px 0',
        }}
      >
        <span style={{ display: 'inline-block', transition: 'transform .18s', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        {label}
      </button>
      {open && (
        <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.75, color: 'var(--fg)', opacity: 0.92, maxWidth: 720 }}>
          {children}
        </div>
      )}
    </div>
  );
}
