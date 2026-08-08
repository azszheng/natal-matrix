'use client';

import { useEffect, useState } from 'react';

/**
 * Casual client-side speed bump, not real security — the pin ships in the
 * JS bundle like any other client code. Meant to keep casual visitors off
 * an in-progress section, not to protect sensitive data.
 */
export default function PinGate({
  storageKey, pin, title = 'This section is locked', children,
}: {
  storageKey: string;
  pin: string;
  title?: string;
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(storageKey) === '1');
    } catch { /* localStorage unavailable — stay locked */ }
    setChecked(true);
  }, [storageKey]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value === pin) {
      setUnlocked(true);
      setError(false);
      try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    } else {
      setError(true);
      setValue('');
    }
  }

  // Avoid a flash of the locked screen before we've checked localStorage.
  if (!checked) return null;

  if (unlocked) return <>{children}</>;

  return (
    <div style={{
      border: '1px solid var(--line)', background: 'var(--bg-raised)',
      padding: '32px 24px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 14, maxWidth: 320, margin: '20px auto',
    }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
        {title}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoFocus
          value={value}
          onChange={e => { setValue(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(false); }}
          aria-label="4-digit PIN"
          style={{
            width: 120, textAlign: 'center', fontSize: 22, letterSpacing: '0.5em',
            fontFamily: 'var(--font-mono)', color: 'var(--fg)', background: 'var(--bg)',
            border: `1px solid ${error ? 'var(--aspect-dynamic)' : 'var(--line)'}`, borderRadius: 2,
            padding: '10px 0 10px 10px',
          }}
        />
        <button type="submit" style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--fg-glyph)', background: 'none', border: '1px solid var(--fg-glyph)',
          borderRadius: 1, padding: '7px 18px', cursor: 'pointer',
        }}>
          Unlock
        </button>
        {error && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)' }}>
            Incorrect code
          </p>
        )}
      </form>
    </div>
  );
}
