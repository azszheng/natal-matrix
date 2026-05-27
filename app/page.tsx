import Dashboard from '@/components/Dashboard';
import AuthHeader from '@/components/auth/AuthHeader';

export default function Home() {
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
          Amy&apos;s Chart
        </h1>
        <AuthHeader />
      </header>
      <Dashboard />
    </main>
  );
}
