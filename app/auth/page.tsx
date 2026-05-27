'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const supabase = createClient();

  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

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
          Natal Matrix
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Google */}
              <button
                onClick={handleGoogle}
                style={{
                  width: '100%', padding: '9px 0', fontSize: 13,
                  fontFamily: 'var(--font-sans, sans-serif)',
                  background: '#fff', color: '#3c4043',
                  border: '1px solid #dadce0', borderRadius: 4,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 10, fontWeight: 500,
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{ fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              {/* Magic link */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={input}
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 12, color: '#e05', margin: 0 }}>{error}</p>
                )}

                <button type="submit" style={btn} disabled={loading}>
                  {loading ? '…' : 'Send Sign-In Link'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to chart</a>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
