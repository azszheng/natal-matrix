import Dashboard from '@/components/Dashboard';
import AuthHeader from '@/components/auth/AuthHeader';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--line)' }}
      >
        <h1
          className="text-xl tracking-wide"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
        >
          Natal Matrix
        </h1>
        <AuthHeader initialUser={user} />
      </header>
      <Dashboard initialLoggedIn={!!user} />
    </main>
  );
}
