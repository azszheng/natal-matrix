'use client';

import { useId, useState } from 'react';

export default function Disclosure({
  label, children, defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div style={{ margin: '0 0 4px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--accent)', padding: '2px 0',
        }}
      >
        <span aria-hidden="true" style={{ display: 'inline-block', transition: 'transform .18s', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        {label}
      </button>
      <div
        id={contentId}
        className="am-disclosure-panel"
        style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .22s ease' }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.75, color: 'var(--fg)', opacity: 0.92, maxWidth: 720 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
