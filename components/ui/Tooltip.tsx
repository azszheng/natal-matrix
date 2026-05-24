'use client';

import { useState, useRef } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export default function Tooltip({ text, children, width = 270, align = 'left' }: TooltipProps) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  function show() {
    if (ref.current) setAnchor(ref.current.getBoundingClientRect());
  }

  function hide() {
    setAnchor(null);
  }

  // Compute fixed position so the tooltip escapes any overflow:auto parent.
  let left = 0;
  if (anchor) {
    if (align === 'right')       left = anchor.right - width;
    else if (align === 'center') left = anchor.left + anchor.width / 2 - width / 2;
    else                         left = anchor.left;
    // Clamp to viewport
    if (typeof window !== 'undefined') {
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    }
  }

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span style={{ borderBottom: '1px dotted currentColor' }}>{children}</span>

      {anchor && (
        <div style={{
          position: 'fixed',
          top: anchor.top - 8,
          left,
          transform: 'translateY(-100%)',
          width,
          background: 'var(--bg-raised)',
          border: '1px solid var(--accent)',
          borderRadius: 4,
          padding: '10px 12px',
          fontSize: 11,
          color: 'var(--fg)',
          lineHeight: 1.7,
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
          fontWeight: 400,
          textTransform: 'none',
          letterSpacing: 'normal',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}
