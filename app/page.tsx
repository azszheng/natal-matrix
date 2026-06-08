import Dashboard from '@/components/Dashboard';
import AuthHeader from '@/components/auth/AuthHeader';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}>
      <header style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="am-masthead" style={{ maxWidth: 1040, margin: '0 auto', padding: '18px 28px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 500, color: 'var(--fg)', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
              Natal Matrix
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>
              Advanced Astrology
            </span>
          </div>
          <AuthHeader initialUser={user} />
        </div>
      </header>
      <Dashboard initialLoggedIn={!!user} />
    </main>
  );
}
