'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function AuthHeader({ initialUser }: { initialUser: User | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const linkStyle: React.CSSProperties = {
    fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--fg-dim)', textDecoration: 'none',
    background: 'none', border: '1px solid var(--line)', borderRadius: 4,
    padding: '3px 10px', cursor: 'pointer',
  };

  if (!user) {
    return (
      <a href="/auth" style={linkStyle}>
        Sign In
      </a>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user.email}
      </span>
      <button onClick={signOut} style={linkStyle}>
        Sign Out
      </button>
    </div>
  );
}
