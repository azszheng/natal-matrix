'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { DashaResult, DashaPeriod, DashaLord } from '@/lib/astro/dashas';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildDashaSection, type InterpretSection } from '@/lib/ai/prompts';

const LORD_NAME: Record<DashaLord, string> = {
  ketu: 'Ketu', venus: 'Venus', sun: 'Sun', moon: 'Moon', mars: 'Mars',
  rahu: 'Rahu', jupiter: 'Jupiter', saturn: 'Saturn', mercury: 'Mercury',
};

const LORD_COLOR: Record<DashaLord, string> = {
  ketu:    'var(--fg-dim)',
  venus:   '#c084fc',
  sun:     '#f59e0b',
  moon:    '#93c5fd',
  mars:    '#f87171',
  rahu:    'var(--fg-muted)',
  jupiter: '#86efac',
  saturn:  '#94a3b8',
  mercury: '#6ee7b7',
};

function todayISO() { return new Date().toISOString().slice(0, 10); }

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function progressPct(period: DashaPeriod, targetISO: string): number {
  const start   = new Date(period.startISO).getTime();
  const end     = new Date(period.endISO).getTime();
  const now     = new Date(targetISO).getTime();
  const elapsed = Math.max(0, Math.min(now - start, end - start));
  return end > start ? (elapsed / (end - start)) * 100 : 0;
}

function PeriodCard({ period, targetISO, label }: { period: DashaPeriod; targetISO: string; label: string }) {
  const color = LORD_COLOR[period.lord];
  const pct   = progressPct(period, targetISO);

  return (
    <div style={{
      border: '1px solid var(--line)', borderRadius: 6,
      padding: '14px 16px', background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
          {LORD_NAME[period.lord]}
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
        <span>{fmtDate(period.startISO)}</span>
        <span style={{ color: 'var(--fg-muted)' }}>{pct.toFixed(0)}%</span>
        <span>{fmtDate(period.endISO)}</span>
      </div>

      <p style={{ margin: '6px 0 0', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
        {period.durationYears.toFixed(2)} years
      </p>
    </div>
  );
}

export default function DashasDrawer({ chart, onClose, onInterpret }: { chart: NatalChart; onClose: () => void; onInterpret?: (s: InterpretSection) => void }) {
  const [date,    setDate]    = useState(todayISO());
  const [result,  setResult]  = useState<DashaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/dashas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natal: chart, whenUTC: `${d}T12:00:00.000Z` }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [chart]);

  useEffect(() => { load(date); }, [date, load]);

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
              Vimshottari Dashas
            </h2>
            <div style={descBox}>
              <p style={descText}>
                <strong>Vedic planetary time cycles.</strong> In Jyotish astrology, your entire life is divided into a 120-year sequence of planetary "chapters" called Mahadashas — for example, a 20-year Venus period, a 6-year Sun period, and so on. Within each Mahadasha there are shorter sub-periods (Antardashas). The sequence and start date are determined by the position of your Moon at birth. The planet ruling a period tends to color the themes, opportunities, and challenges of that time.
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
          {loading && (
            <p style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Computing dashas…
            </p>
          )}
          {error && (
            <p style={{ padding: '24px', color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Error: {error}
            </p>
          )}

          {!loading && !error && result && (
            <>
              {/* Current periods */}
              <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--line)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PeriodCard period={result.mahadasha}  targetISO={date} label="Mahadasha" />
                <PeriodCard period={result.antardasha} targetISO={date} label="Antardasha (Bhukti)" />
                {onInterpret && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InterpretButton
                      section={buildDashaSection(result.mahadasha, result.antardasha, chart)}
                      onInterpret={onInterpret}
                    />
                    <span style={{ fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
                      Interpret current {LORD_NAME[result.mahadasha.lord]}/{LORD_NAME[result.antardasha.lord]} period
                    </span>
                  </div>
                )}
              </div>

              {/* Full timeline */}
              <div style={{ padding: '0 24px' }}>
                <p style={{ margin: '0 0 10px', fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Full Timeline
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={th}>Lord</th>
                      <th style={th}>Start</th>
                      <th style={th}>End</th>
                      <th style={{ ...th, fontFamily: 'var(--font-mono)' }}>Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.timeline.map((p, i) => {
                      const isCurrent = p.lord === result.mahadasha.lord && p.startISO === result.mahadasha.startISO;
                      const color = LORD_COLOR[p.lord];
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid var(--line)',
                          background: isCurrent ? 'rgba(255,255,255,0.03)' : 'transparent',
                        }}>
                          <td style={{ ...td, color, fontWeight: isCurrent ? 700 : 400, fontFamily: 'var(--font-mono)' }}>
                            {isCurrent ? '▸ ' : ''}{LORD_NAME[p.lord]}
                          </td>
                          <td style={{ ...td, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{fmtDate(p.startISO)}</td>
                          <td style={{ ...td, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{fmtDate(p.endISO)}</td>
                          <td style={{ ...td, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{p.durationYears.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 24px' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            Vimshottari · 120-year cycle · Lahiri ayanamsa
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
