'use client';

import { useState } from 'react';

type WikiItem = { year: number; text: string };
type Bucket = { events: WikiItem[]; births: WikiItem[]; deaths: WikiItem[] };

function filterByYear(arr: { year: unknown; text: unknown }[], yr: number): WikiItem[] {
  return arr
    .filter(e => Number(e.year) === yr)
    .map(e => ({ year: Number(e.year), text: String(e.text) }));
}

export default function BirthDayEvents({ date }: { date: string }) {
  const [open,    setOpen]    = useState(false);
  const [bucket,  setBucket]  = useState<Bucket>({ events: [], births: [], deaths: [] });
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
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${moInt}/${dInt}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBucket({
        events: filterByYear(data.events ?? [], yrInt),
        births: filterByYear(data.births ?? [], yrInt),
        deaths: filterByYear(data.deaths ?? [], yrInt),
      });
      setLoaded(true);
    } catch {
      setError('Could not load events. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const total = bucket.events.length + bucket.births.length + bucket.deaths.length;

  return (
    <div>
      {/* Trigger */}
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
        What Happened on {displayDate}
        <span style={{
          display: 'inline-block', transition: 'transform .2s',
          transform: open ? 'rotate(90deg)' : 'none', opacity: 0.5, fontSize: 10,
        }}>▸</span>
      </button>

      {open && (
        <div style={{ marginTop: 18 }}>
          {loading && (
            <p style={{
              margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)',
              color: 'var(--fg-muted)', letterSpacing: '0.06em',
            }}>
              Consulting the archives…
            </p>
          )}
          {error && (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--retro)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </p>
          )}

          {!loading && !error && loaded && total === 0 && (
            <p style={{
              margin: 0, fontSize: 13, fontFamily: 'var(--font-mono)',
              color: 'var(--fg-muted)', letterSpacing: '0.04em', lineHeight: 1.7,
            }}>
              No notable events are recorded in the Wikipedia archive for {displayDate}.
            </p>
          )}

          {!loading && !error && total > 0 && (
            <>
              <p style={{
                margin: '0 0 14px', fontSize: 10.5,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--fg-dim)',
              }}>
                From the historical record · {displayDate} · via Wikipedia
              </p>

              {(['events', 'births', 'deaths'] as const).map(cat => {
                const rows = bucket[cat];
                if (rows.length === 0) return null;
                const labels: Record<string, string> = {
                  events: 'Events', births: 'Notable Births', deaths: 'Notable Deaths',
                };
                return (
                  <div key={cat} style={{ marginBottom: 22 }}>
                    <p style={{
                      margin: '0 0 4px', fontSize: 9.5,
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: 'var(--fg-glyph)',
                    }}>
                      {labels[cat]}
                    </p>
                    {rows.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', gap: 0, padding: '10px 0',
                          borderTop: '1px solid var(--line)',
                        }}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--fg)', opacity: 0.9 }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
