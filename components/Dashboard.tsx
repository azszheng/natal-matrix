'use client';

import { useState, useEffect, useMemo } from 'react';
import BirthForm from '@/components/BirthForm';
import WesternWheel from '@/components/charts/WesternWheel';
import NorthIndianDiamond from '@/components/charts/NorthIndianDiamond';
import PlanetTable from '@/components/tables/PlanetTable';
import HouseTable from '@/components/tables/HouseTable';
import AspectTable from '@/components/tables/AspectTable';
import DignityTable from '@/components/tables/DignityTable';
import VedicRashiTable from '@/components/tables/VedicRashiTable';
import PlaceholderModal from '@/components/modals/PlaceholderModal';
import TransitsDrawer from '@/components/modals/TransitsDrawer';
import ProgressionsDrawer from '@/components/modals/ProgressionsDrawer';
import DashasDrawer from '@/components/modals/DashasDrawer';
import SynastryDrawer from '@/components/modals/SynastryDrawer';
import InterpretationPanel from '@/components/interpret/InterpretationPanel';
import ModeSelector from '@/components/interpret/ModeSelector';
import ChartSnapshot from '@/components/interpret/ChartSnapshot';
import BirthAtmosphereHero from '@/components/BirthAtmosphere';
import Disclosure from '@/components/ui/Disclosure';
import { SIGN_GLYPH, PLANET_GLYPH } from '@/components/charts/glyphs';
import { createClient } from '@/lib/supabase/client';
import type { ResolvedBirth, NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';

type SavedChart = {
  id: number;
  label: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  chart_data: NatalChart;
};

function interpCacheKey(chart: NatalChart, section: InterpretSection, mode: InterpretMode): string {
  const { date, time, lat, lng } = chart.input;
  return `nc_interp::${date}|${time}|${lat.toFixed(3)}|${lng.toFixed(3)}::${mode}::${section.type}|${section.label}`;
}

function lsGet(key: string): string | undefined {
  try { return localStorage.getItem(key) ?? undefined; } catch { return undefined; }
}

function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage full */ }
}

type TableTab = 'planets' | 'houses' | 'aspects' | 'dignities' | 'vedic';
type ModalId  = 'transits' | 'progressions' | 'dashas' | 'synastry';

const TABS: { id: TableTab; label: string }[] = [
  { id: 'planets',   label: 'Planets'     },
  { id: 'houses',    label: 'Houses'      },
  { id: 'aspects',   label: 'Aspects'     },
  { id: 'dignities', label: 'Dignities'   },
  { id: 'vedic',     label: 'Vedic Rashi' },
];

const TAB_DESC: Record<TableTab, string> = {
  planets:   'Where each planet sat in the sky the moment you were born. The Sun is your core identity, the Moon your emotions, Mercury your mind — the sign colors how that energy expresses, the house shows where it plays out.',
  houses:    'The birth chart is divided into 12 houses, each governing a different area of life — from your appearance (1st) to the subconscious (12th). The house a planet falls in shows where its energy is most active in your day-to-day life.',
  aspects:   'When two planets sit at a precise angle they form an aspect. Trines and sextiles flow easily; squares and oppositions create the tension that drives growth; conjunctions fuse two energies into one.',
  dignities: 'Each planet has signs where it is at home (Domicile, Exaltation) and signs where it struggles (Detriment, Fall). This shapes how cleanly its energy expresses — not better or worse, just easier or harder.',
  vedic:     'The sidereal view, tied to the actual constellations rather than the seasons — usually one sign earlier than Western. Each planet also falls in a Nakshatra, one of 27 lunar mansions that add fine-grained nuance.',
};

const MODALS: { id: ModalId; label: string; phase: number }[] = [
  { id: 'transits',     label: 'Transits',     phase: 6 },
  { id: 'progressions', label: 'Progressions', phase: 7 },
  { id: 'dashas',       label: 'Dashas',       phase: 8 },
  { id: 'synastry',     label: 'Synastry',     phase: 9 },
];

const SIGN_NAME: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

// ── Section header (almanac style) ───────────────────────────────────────────

function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, margin: '20px 2px 2px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{title}</span>
      {note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>{note}</span>}
    </div>
  );
}

// ── Big Three ─────────────────────────────────────────────────────────────────

function BigThree({ chart }: { chart: NatalChart }) {
  const sun  = chart.western.bodies.sun;
  const moon = chart.western.bodies.moon;
  const asc  = chart.western.bodies.asc;
  const cards = [
    { role: 'Sun',    sub: 'Core identity', body: sun  },
    { role: 'Moon',   sub: 'Inner world',   body: moon },
    { role: 'Rising', sub: 'The mask',      body: asc  },
  ];
  return (
    <div className="am-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      {cards.map((c, i) => (
        <div key={c.role} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', borderLeft: i === 0 ? 'none' : '1px solid var(--line)' }}>
          <span style={{ fontSize: 44, color: 'var(--fg-glyph)', fontFamily: 'serif', lineHeight: 1 }}>
            {SIGN_GLYPH[c.body.sign]}
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
              {c.role} · {c.sub}
            </p>
            <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: 'var(--fg)', lineHeight: 1.05 }}>
              {SIGN_NAME[c.body.sign]}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
              {c.body.signDegree.toFixed(1)}° {SIGN_ABBR[c.body.sign]}{c.role !== 'Rising' ? ` · H${c.body.house}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const SIGN_ABBR: Record<string, string> = {
  aries: 'Ar', taurus: 'Ta', gemini: 'Ge', cancer: 'Cn', leo: 'Le', virgo: 'Vi',
  libra: 'Li', scorpio: 'Sc', sagittarius: 'Sg', capricorn: 'Cp', aquarius: 'Aq', pisces: 'Pi',
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const supabase = useMemo(() => createClient(), []);

  const [birth,     setBirth]     = useState<ResolvedBirth | null>(null);
  const [chart,     setChart]     = useState<NatalChart | null>(null);
  const [formOpen,  setFormOpen]  = useState(true);
  const [tab,       setTab]       = useState<TableTab>('planets');
  const [modal,     setModal]     = useState<ModalId | null>(null);
  const [interpSection, setInterpSection] = useState<InterpretSection | null>(null);
  const [interpCache,   setInterpCache]   = useState<Map<string, string>>(() => new Map());
  const [interpMode,    setInterpMode]    = useState<InterpretMode>(() => {
    if (typeof window === 'undefined') return 'deepdive';
    return (localStorage.getItem('interpretMode') as InterpretMode) ?? 'deepdive';
  });
  const [isLoggedIn,   setIsLoggedIn]   = useState(initialLoggedIn);
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedChartId, setSavedChartId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setIsLoggedIn(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function onLoadChart(e: Event) {
      const c = (e as CustomEvent<SavedChart>).detail;
      setChart(c.chart_data);
      setBirth(c.chart_data.input);
      setSavedChartId(c.id);
      setSaveStatus('saved');
      setFormOpen(false);
    }
    function onChartDeleted(e: Event) {
      const { id } = (e as CustomEvent<{ id: number }>).detail;
      setSavedChartId(prev => (prev === id ? null : prev));
    }
    window.addEventListener('natal:load-chart', onLoadChart);
    window.addEventListener('natal:chart-deleted', onChartDeleted);
    return () => {
      window.removeEventListener('natal:load-chart', onLoadChart);
      window.removeEventListener('natal:chart-deleted', onChartDeleted);
    };
  }, []);

  async function saveChart() {
    if (!chart || !birth) return;
    setSaveStatus('saving');
    const res = await fetch('/api/charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birth, chart }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setSavedChartId(id);
      setSaveStatus('saved');
      window.dispatchEvent(new CustomEvent('natal:chart-saved', { detail: { id } }));
    } else {
      setSaveStatus('error');
    }
  }

  function cacheResult(key: string, text: string) {
    setInterpCache(prev => new Map(prev).set(key, text));
    lsSet(key, text);
  }

  function handleModeChange(m: InterpretMode) {
    setInterpMode(m);
    localStorage.setItem('interpretMode', m);
  }

  function handleResolved(b: ResolvedBirth, c: NatalChart) {
    setBirth(b);
    setChart(c);
    setFormOpen(false);
    setSaveStatus('idle');
    setSavedChartId(null);
  }

  // ── Styles ──
  const barBtn = (primary: boolean): React.CSSProperties => ({
    fontSize: 10.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: primary ? 'var(--fg-glyph)' : 'var(--fg-muted)',
    background: 'none',
    border: `1px solid ${primary ? 'var(--fg-glyph)' : 'var(--line)'}`,
    borderRadius: 1, padding: '6px 14px', cursor: 'pointer',
  });

  return (
    <div className="flex-1 w-full" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Full-bleed Hero (atmosphere + sky band) ── */}
      {chart && <BirthAtmosphereHero chart={chart} />}

      {/* ── Content column ── */}
      <main className="am-main" style={{
        maxWidth: 1040, width: '100%', margin: '0 auto',
        padding: '0 28px 72px',
        marginTop: chart ? 24 : 32,
        position: 'relative', zIndex: 3,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>

        {/* Birth bar / form */}
        {chart && birth && !formOpen ? (
          <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'var(--bg)' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              {SIGN_GLYPH[chart.western.bodies.sun.sign]}︎ {SIGN_NAME[chart.western.bodies.sun.sign]} Sun
              {' · '}{SIGN_GLYPH[chart.western.bodies.moon.sign]}︎ {SIGN_NAME[chart.western.bodies.moon.sign]} Moon
              {' · '}{SIGN_GLYPH[chart.western.bodies.asc.sign]}︎ {SIGN_NAME[chart.western.bodies.asc.sign]} rising
              {' · '}{birth.date}
              {(birth.city || birth.region) && ` · ${[birth.city, birth.region].filter(Boolean).join(', ')}`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {isLoggedIn && saveStatus !== 'saved' && (
                <button onClick={saveChart} disabled={saveStatus === 'saving'} style={barBtn(true)}>
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Retry' : 'Save'}
                </button>
              )}
              {saveStatus === 'saved' && (
                <span style={{ ...barBtn(false), cursor: 'default', opacity: 0.6 }}>✓ Saved</span>
              )}
              <button onClick={() => setFormOpen(true)} style={barBtn(false)}>Edit</button>
            </div>
          </section>
        ) : (
          <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '20px 24px', marginTop: chart ? 0 : 0 }}>
            <p style={{ margin: '0 0 16px', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-muted)' }}>Birth Data</p>
            <BirthForm onResolved={handleResolved} />
          </section>
        )}

        {chart && (
          <>
            {/* §01 Big Three */}
            <SectionHead title="The Big Three" note="Sun · Moon · Rising" />
            <BigThree chart={chart} />

            {/* §02 Chart at a Glance */}
            <SectionHead title="Your Chart at a Glance" />
            <ChartSnapshot chart={chart} />

            {/* §03 Reading Style */}
            <SectionHead title="Reading Style" />
            <section style={{ padding: '4px 2px 2px' }}>
              <ModeSelector mode={interpMode} onChange={handleModeChange} />
            </section>

            {/* §04 Chart Wheel */}
            <SectionHead title="The Chart Wheel" note="Western · Tropical · Placidus" />
            <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
              <div style={{ padding: '22px 22px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 18px' }}>
                  <div className="am-wheel" style={{ maxWidth: 460, width: '100%' }}>
                    <WesternWheel chart={chart} />
                  </div>
                </div>
                {/* Aspect color legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap', paddingBottom: 14 }}>
                  {[
                    { label: 'Trine · Sextile', color: 'var(--aspect-harmonious)' },
                    { label: 'Square · Opposition', color: 'var(--aspect-dynamic)' },
                    { label: 'Conjunction', color: 'var(--aspect-neutral)' },
                    { label: 'Quincunx', color: 'var(--aspect-minor)' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 20, height: 2, background: l.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <Disclosure label="What this shows">
                  A map of your <strong>conscious self, ego, and personality</strong>, anchored to Earth&apos;s seasons. The Sun is your core identity, the Moon your emotional world, the Rising sign how others first perceive you. The lines across the center are <strong>aspects</strong> — geometric relationships between planets that describe how their energies interact.
                </Disclosure>
              </div>
            </section>

            {/* §05 The Tables */}
            <SectionHead title="The Tables" note="Ephemeris data" />
            <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 8px' }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px',
                    fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: tab === t.id ? '2px solid var(--fg-glyph)' : '2px solid transparent',
                    marginBottom: -1, color: tab === t.id ? 'var(--fg-glyph)' : 'var(--fg-muted)',
                  }}>{t.label}</button>
                ))}
              </div>
              {/* Collapsible description */}
              <div style={{ padding: '16px 22px 6px' }}>
                <Disclosure label={`About ${TABS.find(t => t.id === tab)!.label}`}>
                  {TAB_DESC[tab]}
                </Disclosure>
              </div>
              {/* Vedic Lahiri note */}
              {tab === 'vedic' && (
                <p style={{ margin: '0 22px 4px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  Lahiri ayanamsa {chart.vedic.ayanamsa.toFixed(4)}°
                </p>
              )}
              {/* Table content */}
              <div style={{ padding: '4px 8px 14px', overflowX: 'auto' }}>
                {tab === 'planets'   && <PlanetTable    chart={chart} onInterpret={setInterpSection} />}
                {tab === 'houses'    && <HouseTable     chart={chart} onInterpret={setInterpSection} />}
                {tab === 'aspects'   && <AspectTable    chart={chart} onInterpret={setInterpSection} />}
                {tab === 'dignities' && <DignityTable   chart={chart} />}
                {tab === 'vedic'     && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 16px 16px' }}>
                      <div style={{ maxWidth: 420 }}>
                        <NorthIndianDiamond chart={chart} />
                      </div>
                    </div>
                    <VedicRashiTable chart={chart} onInterpret={setInterpSection} />
                  </>
                )}
              </div>
            </section>

            {/* §06 Advanced */}
            <SectionHead title="Advanced" />
            <section style={{ padding: '4px 2px 0' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {MODALS.map(m => (
                  <button key={m.id} onClick={() => setModal(m.id)} style={{
                    fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--fg-muted)', background: 'transparent',
                    border: '1px solid var(--line)', borderRadius: 1, padding: '9px 16px', cursor: 'pointer',
                  }}>{m.label}</button>
                ))}
                <button style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--fg-muted)', background: 'transparent',
                  border: '1px solid var(--line)', borderRadius: 1, padding: '9px 16px', cursor: 'pointer',
                }}>Export PDF</button>
              </div>
            </section>
          </>
        )}

        {/* ── Modals / drawers ── */}
        {modal === 'transits' && chart && (
          <TransitsDrawer chart={chart} onClose={() => setModal(null)} onInterpret={setInterpSection} />
        )}
        {modal === 'progressions' && chart && (
          <ProgressionsDrawer chart={chart} onClose={() => setModal(null)} onInterpret={setInterpSection} />
        )}
        {modal === 'dashas' && chart && (
          <DashasDrawer chart={chart} onClose={() => setModal(null)} onInterpret={setInterpSection} />
        )}
        {modal === 'synastry' && chart && (
          <SynastryDrawer chart={chart} onClose={() => setModal(null)} onInterpret={setInterpSection} />
        )}
        {modal && !['transits', 'progressions', 'dashas', 'synastry'].includes(modal) && (
          <PlaceholderModal
            title={MODALS.find(m => m.id === modal)!.label}
            phase={MODALS.find(m => m.id === modal)!.phase}
            onClose={() => setModal(null)}
          />
        )}

        {interpSection && chart && (() => {
          const cKey   = interpCacheKey(chart, interpSection, interpMode);
          const cached = interpCache.get(cKey) ?? lsGet(cKey);
          return (
            <InterpretationPanel
              chart={chart}
              section={interpSection}
              onClose={() => setInterpSection(null)}
              mode={interpMode}
              cachedText={cached}
              onCached={(text) => cacheResult(cKey, text)}
            />
          );
        })()}
      </main>
    </div>
  );
}
