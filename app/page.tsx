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
            {/* Plain <a>, not next/link, is intentional: Dashboard's cast
                chart lives in local client state, and a same-route <Link>
                navigation is a no-op that wouldn't reset it. A real
                navigation (full reload) is required to get back to a blank
                entry form. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 500, color: 'var(--fg)', letterSpacing: '0.01em', whiteSpace: 'nowrap', textDecoration: 'none' }}
              title="Back to birth data entry"
            >
              Natal Matrix
            </a>
          </div>
          <AuthHeader initialUser={user} />
        </div>
      </header>
      <Dashboard initialLoggedIn={!!user} />
    </main>
  );
}
