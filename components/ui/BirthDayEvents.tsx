'use client';

import { useState } from 'react';

type WikiItem    = { year: number; text: string };
type WikiBucket  = { events: WikiItem[]; births: WikiItem[]; deaths: WikiItem[] };
type NytArticle  = { headline: string; abstract: string; url: string; section: string };

function filterByYear(arr: { year: unknown; text: unknown }[], yr: number): WikiItem[] {
  return arr
    .filter(e => Number(e.year) === yr)
    .map(e => ({ year: Number(e.year), text: String(e.text) }));
}

export default function BirthDayEvents({ date }: { date: string }) {
  const [open,    setOpen]    = useState(false);
  const [wiki,    setWiki]    = useState<WikiBucket>({ events: [], births: [], deaths: [] });
  const [nyt,     setNyt]     = useState<NytArticle[]>([]);
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
      const [wikiRes, nytRes] = await Promise.all([
        fetch(
          `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${moInt}/${dInt}`,
          { headers: { Accept: 'application/json' } }
        ),
        fetch(`/api/onthisday?date=${date}`),
      ]);

      if (wikiRes.ok) {
        const data = await wikiRes.json();
        setWiki({
          events: filterByYear(data.events ?? [], yrInt),
          births: filterByYear(data.births ?? [], yrInt),
          deaths: filterByYear(data.deaths ?? [], yrInt),
        });
      }
      if (nytRes.ok) {
        const data = await nytRes.json();
        setNyt(data.articles ?? []);
      }
      setLoaded(true);
    } catch {
      setError('Could not load events. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const wikiTotal = wiki.events.length + wiki.births.length + wiki.deaths.length;
  const hasAny    = wikiTotal > 0 || nyt.length > 0;

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

          {!loading && !error && loaded && !hasAny && (
            <p style={{
              margin: 0, fontSize: 13, fontFamily: 'var(--font-mono)',
              color: 'var(--fg-muted)', letterSpacing: '0.04em', lineHeight: 1.7,
            }}>
              No records found for {displayDate} in the archive.
            </p>
          )}

          {!loading && !error && hasAny && (
            <>
              {/* NYT Headlines */}
              {nyt.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <p style={{
                    margin: '0 0 4px', fontSize: 9.5,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'var(--fg-glyph)',
                  }}>
                    In the News · New York Times
                  </p>
                  {nyt.map((a, i) => (
                    <div key={i} style={{ padding: '11px 0', borderTop: '1px solid var(--line)' }}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block', fontSize: 14.5, fontWeight: 500,
                          fontFamily: 'var(--font-display)', color: 'var(--fg)',
                          textDecoration: 'none', lineHeight: 1.4, marginBottom: 4,
                        }}
                      >
                        {a.headline}
                      </a>
                      {a.abstract && (
                        <p style={{
                          margin: 0, fontSize: 13, lineHeight: 1.6,
                          color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)',
                        }}>
                          {a.abstract}
                        </p>
                      )}
                      {a.section && (
                        <p style={{
                          margin: '4px 0 0', fontSize: 10, fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-dim)',
                        }}>
                          {a.section}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Wikipedia: Events / Births / Deaths */}
              {(['events', 'births', 'deaths'] as const).map(cat => {
                const rows = wiki[cat];
                if (rows.length === 0) return null;
                const labels = { events: 'Events', births: 'Notable Births', deaths: 'Notable Deaths' };
                return (
                  <div key={cat} style={{ marginBottom: 22 }}>
                    <p style={{
                      margin: '0 0 4px', fontSize: 9.5,
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: 'var(--fg-glyph)',
                    }}>
                      {labels[cat]} · Wikipedia
                    </p>
                    {rows.map((item, i) => (
                      <div key={i} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
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
