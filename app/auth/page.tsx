'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const supabase = createClient();

  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13,
    background: 'var(--bg-raised)', border: '1px solid var(--line)',
    borderRadius: 4, color: 'var(--fg)', outline: 'none',
    fontFamily: 'var(--font-sans, sans-serif)',
  };

  const btn: React.CSSProperties = {
    width: '100%', padding: '9px 0', fontSize: 12,
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.08em', background: 'var(--accent)',
    color: '#fff', border: 'none', borderRadius: 4,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  return (
    <main
      className="flex flex-col min-h-screen items-center justify-center"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)', padding: '24px 16px' }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, marginBottom: 28,
            textAlign: 'center', color: 'var(--fg)',
          }}
        >
          Amy&apos;s Chart
        </h1>

        <div
          style={{
            background: 'var(--bg-raised)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '28px 24px',
          }}
        >
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 12 }}>✉️</p>
              <p style={{ fontSize: 14, color: 'var(--fg)', marginBottom: 8 }}>Check your email</p>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
                We sent a sign-in link to <strong style={{ color: 'var(--fg)' }}>{email}</strong>.
                Click it to log in — no password needed.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                style={{ marginTop: 20, fontSize: 11, fontFamily: 'var(--font-mono)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 16, lineHeight: 1.5 }}>
                  Enter your email and we&apos;ll send you a sign-in link.
                </p>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={input}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <p style={{ fontSize: 12, color: '#e05', margin: 0 }}>{error}</p>
              )}

              <button type="submit" style={btn} disabled={loading}>
                {loading ? '…' : 'Send Sign-In Link'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to chart</a>
        </p>
      </div>
    </main>
  );
}
