'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode,    setMode]    = useState<'login' | 'signup'>('login');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDone('');
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setDone('Check your email to confirm your account.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: 13,
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
          {/* Tab toggle */}
          <div style={{ display: 'flex', marginBottom: 24, gap: 4 }}>
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setDone(''); }}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 11,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', cursor: 'pointer',
                  background: mode === m ? 'var(--accent)' : 'none',
                  color: mode === m ? '#fff' : 'var(--fg-dim)',
                  border: '1px solid var(--line)', borderRadius: 4,
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                style={input}
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                style={input}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#e05', margin: 0 }}>{error}</p>
            )}
            {done && (
              <p style={{ fontSize: 12, color: 'var(--accent)', margin: 0 }}>{done}</p>
            )}

            <button type="submit" style={btn} disabled={loading}>
              {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to chart</a>
        </p>
      </div>
    </main>
  );
}
