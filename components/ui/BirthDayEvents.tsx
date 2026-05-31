'use client';

import { useState } from 'react';

type NytArticle = { headline: string; abstract: string; url: string; section: string };

export default function BirthDayEvents({ date }: { date: string }) {
  const [open,    setOpen]    = useState(false);
  const [articles, setArticles] = useState<NytArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loaded,  setLoaded]  = useState(false);

  const [yr, mo, d] = date.split('-');
  const yrInt = parseInt(yr, 10);
  const moInt = parseInt(mo, 10);
  const dInt  = parseInt(d, 10);

  const displayDate = new Date(Date.UTC(yrInt, moInt - 1, dInt))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onthisday?date=${date}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setArticles(data.articles ?? []);
      setLoaded(true);
    } catch {
      setError('Could not load headlines. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'none', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)', cursor: 'pointer',
          padding: '9px 18px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--accent)',
        }}
      >
        <span style={{ opacity: 0.55, fontFamily: 'var(--font-display)', fontSize: 14 }}>§</span>
        In the News on {displayDate}
        <span style={{
          display: 'inline-block', transition: 'transform .2s',
          transform: open ? 'rotate(90deg)' : 'none', opacity: 0.5, fontSize: 10,
        }}>▸</span>
      </button>

      {open && (
        <div style={{ marginTop: 18 }}>
          {loading && (
            <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', letterSpacing: '0.06em' }}>
              Consulting the archive…
            </p>
          )}
          {error && (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--retro)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </p>
          )}
          {!loading && !error && loaded && articles.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', letterSpacing: '0.04em' }}>
              No headlines found for {displayDate}.
            </p>
          )}
          {!loading && !error && articles.map((a, i) => (
            <div key={i} style={{ padding: '14px 0', borderTop: '1px solid var(--line)' }}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', fontSize: 15, fontWeight: 500,
                  fontFamily: 'var(--font-display)', color: 'var(--fg)',
                  textDecoration: 'none', lineHeight: 1.4, marginBottom: 6,
                }}
              >
                {a.headline}
              </a>
              {a.abstract && (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
                  {a.abstract}
                </p>
              )}
            </div>
          ))}
          {!loading && !error && articles.length > 0 && (
            <p style={{ margin: '10px 0 0', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
              Source: The New York Times Archive
            </p>
          )}
        </div>
      )}
    </div>
  );
}
