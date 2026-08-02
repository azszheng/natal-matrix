'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import ComparisonPanel from '@/components/interpret/ComparisonPanel';
import ProviderSelector, { type ProviderMode } from '@/components/interpret/ProviderSelector';
import ModeSelector from '@/components/interpret/ModeSelector';
import ChartSnapshot from '@/components/interpret/ChartSnapshot';
import BirthAtmosphereHero from '@/components/BirthAtmosphere';
import HumanDesignDrawer from '@/components/modals/HumanDesignDrawer';
import TopicsPanel from '@/components/TopicsPanel';
import ChildhoodImprintsSection from '@/components/childhood/ChildhoodImprintsSection';
import Disclosure from '@/components/ui/Disclosure';
import { SIGN_GLYPH, PLANET_GLYPH } from '@/components/charts/glyphs';
import { createClient } from '@/lib/supabase/client';
import type { ResolvedBirth, NatalChart } from '@/lib/astro/types';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { buildProviderCacheKey, type InterpretationProvider } from '@/lib/ai/interpretationInput';

type SavedChart = {
  id: number;
  label: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  chart_data: NatalChart;
};


function lsGet(key: string): string | undefined {
  try { return localStorage.getItem(key) ?? undefined; } catch { return undefined; }
}

function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage full */ }
}

function snapshotLsKey(c: NatalChart): string {
  const { date, time, lat, lng } = c.input;
  return `snapshot_v1_${date}_${time}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
}

type TableTab = 'planets' | 'houses' | 'aspects' | 'dignities';
type ModalId  = 'transits' | 'progressions' | 'dashas' | 'synastry';

const TABS: { id: TableTab; label: string }[] = [
  { id: 'planets',   label: 'Planets'     },
  { id: 'houses',    label: 'Houses'      },
  { id: 'aspects',   label: 'Aspects'     },
  { id: 'dignities', label: 'Dignities'   },
];

const TAB_DESC: Record<TableTab, string> = {
  planets:   'Where each planet sat in the sky the moment you were born. The Sun describes your conscious self-expression, the Moon your emotional patterns, Mercury how you think and communicate — the sign colors how that energy expresses, the house shows where it plays out.',
  houses:    'The birth chart is divided into 12 houses, each governing a different area of life — from your appearance (1st) to the subconscious (12th). The house a planet falls in shows where its energy is most active in your day-to-day life.',
  aspects:   'When two planets sit at a precise angle they form an aspect. Trines and sextiles flow easily; squares and oppositions create the tension that drives growth; conjunctions fuse two energies into one.',
  dignities: 'Each planet has signs where it is at home (Domicile, Exaltation) and signs where it struggles (Detriment, Fall). This shapes how cleanly its energy expresses — not better or worse, just easier or harder.',
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

// ── Top-level section nav ────────────────────────────────────────────────────

type PageSection = 'chart' | 'topics' | 'timing' | 'compare' | 'vedic' | 'humandesign' | 'childhood';

const TOPICS_MENU: { id: PageSection; label: string }[] = [
  { id: 'topics',    label: 'Life Themes' },
  { id: 'childhood', label: 'Childhood'   },
];

function SectionNavButton({ label, active, secondary, onClick }: {
  label: string; active: boolean; secondary?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
      fontSize: secondary ? 10.5 : 11.5,
      padding: secondary ? '7px 13px' : '9px 15px',
      borderRadius: 1,
      border: `1px solid ${active ? 'var(--fg-glyph)' : 'var(--line)'}`,
      background: active ? 'rgba(201,164,76,0.08)' : 'transparent',
      color: active ? 'var(--fg-glyph)' : (secondary ? 'var(--fg-dim)' : 'var(--fg-muted)'),
    }}>{label}</button>
  );
}

function SectionNav({ section, onChange }: { section: PageSection; onChange: (s: PageSection) => void }) {
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicsRef = useRef<HTMLDivElement>(null);
  const topicsActive = section === 'topics' || section === 'childhood';

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (topicsRef.current && !topicsRef.current.contains(e.target as Node)) setTopicsOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', padding: '2px 2px 4px' }}>
      <SectionNavButton label="Charts" active={section === 'chart'} onClick={() => onChange('chart')} />

      <div ref={topicsRef} style={{ position: 'relative' }}>
        <SectionNavButton label="Topics" active={topicsActive} onClick={() => setTopicsOpen(o => !o)} />
        {topicsOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10, minWidth: 160,
            display: 'flex', flexDirection: 'column',
            border: '1px solid var(--line)', background: 'var(--bg-raised)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          }}>
            {TOPICS_MENU.map((item, i) => (
              <button key={item.id} onClick={() => { onChange(item.id); setTopicsOpen(false); }} style={{
                textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
                padding: '10px 14px',
                border: 'none', borderBottom: i < TOPICS_MENU.length - 1 ? '1px solid var(--line)' : 'none',
                background: section === item.id ? 'rgba(201,164,76,0.08)' : 'transparent',
                fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: section === item.id ? 'var(--fg-glyph)' : 'var(--fg-muted)',
              }}>{item.label}</button>
            ))}
          </div>
        )}
      </div>

      <SectionNavButton label="Compatibility" active={section === 'compare'} onClick={() => onChange('compare')} />
      <SectionNavButton label="Timing" active={section === 'timing'} onClick={() => onChange('timing')} />

      <span style={{ width: 1, alignSelf: 'stretch', minHeight: 18, background: 'var(--line)', flexShrink: 0 }} />

      <SectionNavButton label="Vedic" active={section === 'vedic'} secondary onClick={() => onChange('vedic')} />
      <SectionNavButton label="Human Design" active={section === 'humandesign'} secondary onClick={() => onChange('humandesign')} />
    </nav>
  );
}

// ── Feature card (Timing / Compare / Other Systems) ──────────────────────────

function FeatureCard({
  title, tag, description, tags, ctaLabel, onOpen,
}: {
  title: string;
  tag?: string;
  description: string;
  tags?: string[];
  ctaLabel?: string;
  onOpen: () => void;
}) {
  return (
    <div style={{
      border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '18px 20px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
    }}>
      <div style={{ flex: '1 1 260px' }}>
        {tag && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--fg-dim)', textTransform: 'uppercase', border: '1px solid var(--line)', padding: '2px 8px', display: 'inline-block', marginBottom: 8 }}>
            {tag}
          </span>
        )}
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, color: 'var(--fg)' }}>
          {title}
        </p>
        <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
          {description}
        </p>
        {tags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tags.map(t => (
              <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--fg-dim)', border: '1px solid var(--line)', padding: '2px 8px', textTransform: 'uppercase' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <button onClick={onOpen} style={{
        flexShrink: 0, alignSelf: 'flex-start',
        fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--fg-muted)', background: 'transparent',
        border: '1px solid var(--line)', borderRadius: 1, padding: '8px 16px', cursor: 'pointer',
      }}>
        {ctaLabel ?? 'Open →'}
      </button>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const supabase = useMemo(() => createClient(), []);

  const [birth,     setBirth]     = useState<ResolvedBirth | null>(null);
  const [chart,     setChart]     = useState<NatalChart | null>(null);
  const [hdChart,      setHdChart]      = useState<HdChart | null>(null);
  const [hdLoading,    setHdLoading]    = useState(false);
  const [hdDrawerOpen, setHdDrawerOpen] = useState(false);
  const [formOpen,  setFormOpen]  = useState(true);
  const [section,   setSection]   = useState<PageSection>('chart');
  const [tab,       setTab]       = useState<TableTab>('planets');
  const [modal,     setModal]     = useState<ModalId | null>(null);
  const [interpSection,  setInterpSection]  = useState<InterpretSection | null>(null);
  const [interpCache,    setInterpCache]    = useState<Map<string, string>>(() => new Map());
  const [interpMode,     setInterpMode]     = useState<InterpretMode>(() => {
    if (typeof window === 'undefined') return 'deepdive';
    return (localStorage.getItem('interpretMode') as InterpretMode) ?? 'deepdive';
  });
  const [interpProvider, setInterpProvider] = useState<ProviderMode>('claude');
  const [savedSnapshot,  setSavedSnapshot]  = useState<string | null>(null);
  const [isLoggedIn,   setIsLoggedIn]   = useState(initialLoggedIn);
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedChartId, setSavedChartId] = useState<number | null>(null);
  const [savedCharts,  setSavedCharts]  = useState<SavedChart[]>([]);

  async function loadChartInterpretations(chartId: number) {
    try {
      const res = await fetch(`/api/charts/${chartId}/interpretations`);
      if (!res.ok) return;
      const data: Record<string, string> = await res.json();
      // Snapshot stored under special key
      const snap = data['__snapshot__'] ?? null;
      delete data['__snapshot__'];
      setSavedSnapshot(snap);
      // Merge topic interpretations into cache + localStorage
      const entries = Object.entries(data);
      if (entries.length > 0) {
        setInterpCache(prev => {
          const next = new Map(prev);
          for (const [k, v] of entries) {
            if (!next.has(k)) { next.set(k, v); lsSet(k, v); }
          }
          return next;
        });
      }
    } catch { /* fail silently — interpretations regenerate on demand */ }
  }

  async function fetchHdChart(b: ResolvedBirth) {
    setHdLoading(true);
    setHdChart(null);
    try {
      const res = await fetch('/api/human-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
      });
      if (res.ok) setHdChart(await res.json());
    } catch {
      // HD chart is optional — fail silently
    } finally {
      setHdLoading(false);
    }
  }

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
    if (!isLoggedIn) return;
    fetch('/api/charts').then(r => r.ok ? r.json() : []).then(setSavedCharts).catch(() => {});
    function onSaved() {
      fetch('/api/charts').then(r => r.ok ? r.json() : []).then(setSavedCharts).catch(() => {});
    }
    function onDeleted(e: Event) {
      const { id } = (e as CustomEvent<{ id: number }>).detail;
      setSavedCharts(prev => prev.filter(c => c.id !== id));
    }
    window.addEventListener('natal:chart-saved', onSaved);
    window.addEventListener('natal:chart-deleted', onDeleted);
    return () => {
      window.removeEventListener('natal:chart-saved', onSaved);
      window.removeEventListener('natal:chart-deleted', onDeleted);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    function onLoadChart(e: Event) {
      const c = (e as CustomEvent<SavedChart>).detail;
      setChart(c.chart_data);
      setBirth(c.chart_data.input);
      setSavedChartId(c.id);
      setSaveStatus('saved');
      setFormOpen(false);
      setSavedSnapshot(null);
      fetchHdChart(c.chart_data.input);
      loadChartInterpretations(c.id);
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
      // Batch-save any interpretations already generated in this session
      const entries: { cache_key: string; content: string }[] = [];
      const snap = lsGet(snapshotLsKey(chart));
      if (snap) entries.push({ cache_key: '__snapshot__', content: snap });
      interpCache.forEach((content, cache_key) => entries.push({ cache_key, content }));
      if (entries.length > 0) {
        fetch(`/api/charts/${id}/interpretations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entries),
        }).catch(() => {});
      }
    } else {
      setSaveStatus('error');
    }
  }

  function cacheResult(key: string, text: string) {
    setInterpCache(prev => new Map(prev).set(key, text));
    lsSet(key, text);
    // Persist to Supabase if this is a saved chart
    if (savedChartId && isLoggedIn) {
      fetch(`/api/charts/${savedChartId}/interpretations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ cache_key: key, content: text }]),
      }).catch(() => {});
    }
  }

  function persistSnapshotToSupabase(text: string) {
    if (!savedChartId || !isLoggedIn) return;
    fetch(`/api/charts/${savedChartId}/interpretations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cache_key: '__snapshot__', content: text }]),
    }).catch(() => {});
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
    setSavedSnapshot(null);
    fetchHdChart(b);
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
            <SectionNav section={section} onChange={setSection} />

            {section === 'chart' && (
              <>
                {/* Big Three */}
                <SectionHead title="The Big Three" note="Sun · Moon · Rising" />
                <BigThree chart={chart} />

                {/* Chart at a Glance */}
                <SectionHead title="Your Chart at a Glance" />
                <ChartSnapshot
                  chart={chart}
                  savedText={savedSnapshot ?? undefined}
                  onPersist={persistSnapshotToSupabase}
                />

                {/* Reading style — compact, no section header of its own */}
                <section style={{ padding: '4px 2px 2px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ModeSelector mode={interpMode} onChange={handleModeChange} />
                  <ProviderSelector value={interpProvider} onChange={setInterpProvider} />
                </section>

                {/* Chart Wheel */}
                <SectionHead title="The Chart Wheel" note="Western · Tropical · Placidus" />
                <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
                  <div style={{ padding: '22px 22px 16px' }}>
                    <p style={{ margin: '0 0 14px', textAlign: 'center', fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                      Click any sign, house, or planet to explore what it means
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 18px' }}>
                      <div className="am-wheel" style={{ maxWidth: 460, width: '100%' }}>
                        <WesternWheel chart={chart} onInterpret={setInterpSection} />
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
                      A map of your <strong>conscious self-expression, ego, and personality</strong>, anchored to Earth&apos;s seasons. The Sun describes how your vital energy seeks to express itself, the Moon your emotional patterns, the Rising sign how others tend to first perceive you. The lines across the center are <strong>aspects</strong> — geometric relationships between planets that describe how their energies interact.
                    </Disclosure>
                  </div>
                </section>

                {/* The Tables */}
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
                  {/* Table content */}
                  <div style={{ padding: '4px 8px 14px', overflowX: 'auto' }}>
                    {tab === 'planets'   && <PlanetTable    chart={chart} onInterpret={setInterpSection} />}
                    {tab === 'houses'    && <HouseTable     chart={chart} onInterpret={setInterpSection} />}
                    {tab === 'aspects'   && <AspectTable    chart={chart} onInterpret={setInterpSection} />}
                    {tab === 'dignities' && <DignityTable   chart={chart} />}
                  </div>
                </section>
              </>
            )}

            {section === 'topics' && (
              <>
                <SectionHead title="Life Topics" note="14 areas · ranked by chart emphasis" />
                <TopicsPanel chart={chart} onInterpret={setInterpSection} />
              </>
            )}

            {section === 'timing' && (
              <>
                <SectionHead title="Timing" note="Where your chart is headed" />
                <section style={{ padding: '4px 2px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <FeatureCard
                    title="Transits"
                    description="What's happening in the sky right now, mapped against your natal placements — today's weather, not just your climate."
                    onOpen={() => setModal('transits')}
                  />
                  <FeatureCard
                    title="Progressions"
                    description="Your chart advanced one symbolic day per year of life — the slow, internal evolution of who you're becoming."
                    onOpen={() => setModal('progressions')}
                  />
                  <FeatureCard
                    title="Dashas"
                    tag="Vedic timing"
                    description={`Vimshottari planetary periods — the Vedic system's own timeline of which planet is "running" your life right now.`}
                    onOpen={() => setModal('dashas')}
                  />
                </section>
              </>
            )}

            {section === 'compare' && (
              <>
                <SectionHead title="Compatibility" note="Synastry" />
                <section style={{ padding: '4px 2px 0' }}>
                  <FeatureCard
                    title="Synastry"
                    description="Add a second birth chart to see how your placements interact — overlapping houses, cross-aspects, and where the friction and ease actually sit."
                    ctaLabel="Add a second chart →"
                    onOpen={() => setModal('synastry')}
                  />
                </section>
              </>
            )}

            {section === 'vedic' && (
              <>
                <SectionHead title="Vedic Astrology" note="Sidereal · Lahiri ayanamsa · Whole Sign houses" />
                <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 22px 6px' }}>
                    <Disclosure label="About the Vedic view">
                      The sidereal view, tied to the actual constellations rather than the seasons — usually one sign earlier than Western. Each planet also falls in a Nakshatra, one of 27 lunar mansions that add fine-grained nuance.
                    </Disclosure>
                  </div>
                  <p style={{ margin: '0 22px 4px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                    Lahiri ayanamsa {chart.vedic.ayanamsa.toFixed(4)}°
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 16px 16px' }}>
                    <div style={{ maxWidth: 420 }}>
                      <NorthIndianDiamond chart={chart} />
                    </div>
                  </div>
                  <div style={{ padding: '4px 8px 14px', overflowX: 'auto' }}>
                    <VedicRashiTable chart={chart} onInterpret={setInterpSection} />
                  </div>
                </section>
              </>
            )}

            {section === 'humandesign' && (
              <>
                <SectionHead title="Human Design" />
                <section style={{ padding: '4px 2px 0' }}>
                  <FeatureCard
                    title="Human Design"
                    description="A synthesis of astrology, the I Ching, and the chakra system that maps your energy type, decision-making authority, and life purpose — calculated from your exact birth data."
                    tags={['Energy Type', 'Inner Authority', 'Profile', 'Bodygraph', 'Gates']}
                    ctaLabel="Open Chart →"
                    onOpen={() => setHdDrawerOpen(true)}
                  />
                </section>
              </>
            )}

            {section === 'childhood' && (
              <>
                <div style={{ margin: '2px 2px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.2 }}>
                      Childhood &amp; Lineage Imprints
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>
                      Symbolic · For reflection only
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
                    A symbolic read of early psychological patterns and adaptive strategies suggested by your planetary configuration.
                  </p>
                </div>
                <section style={{ padding: '4px 2px 0' }}>
                  <ChildhoodImprintsSection
                    chart={chart}
                    mode={interpMode}
                    onInterpret={setInterpSection}
                  />
                </section>
              </>
            )}
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
        {hdDrawerOpen && (
          <HumanDesignDrawer
            hdChart={hdChart}
            loading={hdLoading}
            onClose={() => setHdDrawerOpen(false)}
          />
        )}

        {modal && !['transits', 'progressions', 'dashas', 'synastry'].includes(modal) && (
          <PlaceholderModal
            title={MODALS.find(m => m.id === modal)!.label}
            phase={MODALS.find(m => m.id === modal)!.phase}
            onClose={() => setModal(null)}
          />
        )}

        {interpSection && chart && (() => {
          if (interpProvider === 'comparison') {
            return (
              <ComparisonPanel
                chart={chart}
                section={interpSection}
                onClose={() => setInterpSection(null)}
                mode={interpMode}
              />
            );
          }
          const provider = interpProvider as InterpretationProvider;
          const cKey   = buildProviderCacheKey(chart, interpSection, interpMode, provider);
          const cached = interpCache.get(cKey) ?? lsGet(cKey);
          return (
            <InterpretationPanel
              chart={chart}
              section={interpSection}
              onClose={() => setInterpSection(null)}
              mode={interpMode}
              provider={provider}
              cachedText={cached}
              onCached={(text) => cacheResult(cKey, text)}
            />
          );
        })()}
      </main>
    </div>
  );
}
