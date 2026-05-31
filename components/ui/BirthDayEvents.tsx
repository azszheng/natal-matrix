'use client';

import { useState } from 'react';

type WikiEvent = { year: number; text: string };

export default function BirthDayEvents({ date }: { date: string }) {
  const [open,   setOpen]   = useState(false);
  const [events, setEvents] = useState<WikiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [, mo, d] = date.split('-');
  const moInt = parseInt(mo, 10);
  const dInt  = parseInt(d, 10);

  const displayDate = new Date(Date.UTC(2000, moInt - 1, dInt))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${moInt}/${dInt}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const sorted: WikiEvent[] = (data.events ?? [])
        .map((e: { year: unknown; text: unknown }) => ({ year: Number(e.year), text: String(e.text) }))
        .sort((a: WikiEvent, b: WikiEvent) => a.year - b.year)
        .slice(0, 10);
      setEvents(sorted);
      setLoaded(true);
    } catch {
      setError('Could not load events. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Trigger button */}
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
        On {displayDate} in History
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
          {!loading && !error && events.length > 0 && (
            <>
              <p style={{
                margin: '0 0 14px', fontSize: 10.5,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--fg-dim)',
              }}>
                Notable events on {displayDate} throughout history — via Wikipedia
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {events.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', gap: 20, padding: '11px 0',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: 'var(--accent)', letterSpacing: '0.05em',
                      flexShrink: 0, paddingTop: 2, minWidth: 42,
                    }}>
                      {ev.year}
                    </span>
                    <span style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--fg)', opacity: 0.9 }}>
                      {ev.text}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
