'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NatalChart, ProgressedChart, BodyId } from '@/lib/astro/types';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { ASPECT_SYMBOL, ASPECT_COLOR, signLabel, toDMS } from '@/components/tables/tableUtils';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildProgressedBodySection, buildProgressedAspectSection, type InterpretSection } from '@/lib/ai/prompts';

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N. Node', asc: 'AC', mc: 'MC',
};

const PROG_ORDER: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'trueNode',
];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function toNoonUTC(d: string) { return `${d}T12:00:00.000Z`; }

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function ProgressionsDrawer({ chart, onClose, onInterpret }: { chart: NatalChart; onClose: () => void; onInterpret?: (s: InterpretSection) => void }) {
  const [date,   setDate]   = useState(todayISO());
  const [result, setResult] = useState<ProgressedChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch_ = useCallback(async (d: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/progressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natal: chart, whenUTC: toNoonUTC(d) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [chart]);

  useEffect(() => { fetch_(date); }, [date, fetch_]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(90vw, 560px)',
        background: 'var(--bg-raised)', borderLeft: '1px solid var(--line)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Secondary Progressions
            </h2>
            <div style={descBox}>
              <p style={descText}>
                <strong>A symbolic map of inner growth over time.</strong> The technique works by a simple rule: each day after your birth equals one year of your life. So if you want to see your "progressed chart" at age 30, the system looks at the sky 30 days after your birth. Progressions move slowly and show the gradual evolution of your personality, values, and inner world — where transits show outer events, progressions show who you're becoming.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 8px' }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 18, padding: '2px 6px' }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '16px 0' }}>
          {loading && <p style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Computing progressions…</p>}
          {error   && <p style={{ padding: '24px', color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Error: {error}</p>}

          {!loading && !error && result && (
            <>
              {/* Symbolic date info */}
              <div style={{ padding: '0 24px 16px', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
                  Progressed to <span style={{ color: 'var(--fg-muted)' }}>{fmtDate(date)}</span>
                  {' '}· Symbolic date <span style={{ color: 'var(--accent)' }}>{fmtDate(result.progressedDateISO)}</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
                  1 day after birth = 1 year of life
                </p>
              </div>

              {/* Progressed planets table */}
              <div style={{ padding: '0 24px', marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progressed Planets</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={th}>Planet</th>
                      <th style={th}>Sign</th>
                      <th style={th}>Degree</th>
                      <th style={{ ...th, textAlign: 'center' }}>R</th>
                      {onInterpret && <th style={{ ...th, width: 28 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {PROG_ORDER.map(id => {
                      const b = result.bodies[id];
                      if (!b) return null;
                      const glyph = PLANET_GLYPH[id] ?? '';
                      const name  = BODY_NAME[id] ?? id;
                      return (
                        <tr key={id} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                          <td style={{ ...td, color: b.isRetrograde ? 'var(--retro)' : 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>{glyph} {name}</td>
                          <td style={td}>{signLabel(b.sign)}</td>
                          <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{toDMS(b.signDegree)}</td>
                          <td style={{ ...td, textAlign: 'center', color: 'var(--retro)', fontSize: 10 }}>{b.isRetrograde ? '℞' : ''}</td>
                          {onInterpret && (
                            <td style={{ ...td, textAlign: 'center' }}>
                              <InterpretButton section={buildProgressedBodySection(id, b, chart)} onInterpret={onInterpret} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Progressed → natal aspects */}
              <div style={{ padding: '0 24px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Progressed → Natal Aspects <span style={{ color: 'var(--fg-dim)' }}>(1° orb)</span>
                </p>
                {result.aspects.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>No exact progressed aspects within 1° on this date.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <th style={th}>Prog</th>
                        <th style={{ ...th, textAlign: 'center' }}>Asp</th>
                        <th style={th}>Natal</th>
                        <th style={{ ...th, fontFamily: 'var(--font-mono)' }}>Orb</th>
                        <th style={{ ...th, textAlign: 'center' }}>A/S</th>
                        {onInterpret && <th style={{ ...th, width: 28 }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {result.aspects.map((asp, i) => {
                        const color  = ASPECT_COLOR[asp.kind];
                        const symbol = ASPECT_SYMBOL[asp.kind] ?? asp.kind;
                        const pglyph = PLANET_GLYPH[asp.progressedBody] ?? '';
                        const nglyph = PLANET_GLYPH[asp.natalBody] ?? '';
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                            <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>{pglyph} {BODY_NAME[asp.progressedBody] ?? asp.progressedBody}</td>
                            <td style={{ ...td, textAlign: 'center', color, fontWeight: 600, fontSize: 14 }}>{symbol}</td>
                            <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>{nglyph} {BODY_NAME[asp.natalBody] ?? asp.natalBody}</td>
                            <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{asp.orb.toFixed(2)}°</td>
                            <td style={{ ...td, textAlign: 'center', fontFamily: 'var(--font-mono)', color: asp.applying ? 'var(--aspect-harmonious)' : 'var(--fg-dim)', fontSize: 10 }}>
                              {asp.applying ? 'A' : 'S'}
                            </td>
                            {onInterpret && (
                              <td style={{ ...td, textAlign: 'center' }}>
                                <InterpretButton section={buildProgressedAspectSection(asp, chart)} onInterpret={onInterpret} />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 24px' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            Secondary progressions · 1 day/year · Noon UTC
          </p>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = { padding: '5px 8px', fontWeight: 500, textAlign: 'left' };
const td: React.CSSProperties = { padding: '5px 8px', verticalAlign: 'middle' };

const descBox: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  borderLeft: '3px solid var(--accent)',
  borderRadius: 4,
  padding: '10px 14px',
};

const descText: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--fg)',
  lineHeight: 1.7,
  fontFamily: 'var(--font-sans, sans-serif)',
};
