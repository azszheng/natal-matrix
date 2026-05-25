'use client';

import { useState } from 'react';
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
import BirthAtmosphere from '@/components/BirthAtmosphere';
import { SIGN_GLYPH } from '@/components/charts/glyphs';
import type { ResolvedBirth, NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';

type TableTab = 'planets' | 'houses' | 'aspects' | 'dignities' | 'vedic';

const TAB_DESC: Record<TableTab, { title: string; body: string }> = {
  planets: {
    title: 'Planets',
    body:  'Shows where each planet was in the sky the moment you were born. Each planet represents a different part of life — the Sun is your core identity, the Moon your emotions, Mercury your mind and communication, Venus love and beauty, Mars drive and action, and so on. The sign a planet occupies colors how that energy expresses itself; the house shows which life area it plays out in.',
  },
  houses: {
    title: 'Houses',
    body:  'The birth chart is divided into 12 "houses," each governing a different area of life — from the 1st house (your appearance and how others see you) through to the 12th (the subconscious, solitude, and hidden matters). The house a planet falls in shows where its energy is most active in your day-to-day life. Houses are calculated from your exact birth time and location.',
  },
  aspects: {
    title: 'Aspects',
    body:  'When two planets are a specific number of degrees apart, they form an "aspect" — a geometric relationship that describes how they interact. Trines (120°) and sextiles (60°) are generally harmonious and easy; squares (90°) and oppositions (180°) create tension and challenge that often drives growth; conjunctions (0°) merge the two energies together.',
  },
  dignities: {
    title: 'Dignities',
    body:  'Each planet has signs where it feels at home and signs where it struggles. "Domicile" means the planet rules that sign and operates at full strength. "Exaltation" is another comfortable placement. "Detriment" and "Fall" are opposite positions — the planet is in unfamiliar territory and its energy is harder to express cleanly. This doesn\'t make a placement "bad," just different in character.',
  },
  vedic: {
    title: 'Vedic Rashi (Signs)',
    body:  'The Vedic equivalent of the Western planets table, but calculated using the sidereal zodiac. Also includes each planet\'s Nakshatra — one of 27 lunar mansions that divide the zodiac into finer 13.3° segments. Nakshatras add a layer of nuance to a planet\'s sign placement and are especially important in Vedic timing (Dashas) and compatibility.',
  },
};
type ModalId  = 'transits' | 'progressions' | 'dashas' | 'synastry';

const TABS: { id: TableTab; label: string }[] = [
  { id: 'planets',   label: 'Planets'   },
  { id: 'houses',    label: 'Houses'    },
  { id: 'aspects',   label: 'Aspects'   },
  { id: 'dignities', label: 'Dignities' },
  { id: 'vedic',     label: 'Vedic Rashi' },
];

const MODALS: { id: ModalId; label: string; phase: number }[] = [
  { id: 'transits',     label: 'Transits',     phase: 6 },
  { id: 'progressions', label: 'Progressions', phase: 7 },
  { id: 'dashas',       label: 'Dashas',       phase: 8 },
  { id: 'synastry',     label: 'Synastry',     phase: 9 },
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function chartSummary(chart: NatalChart, birth: ResolvedBirth): string {
  const sun  = chart.western.bodies.sun;
  const moon = chart.western.bodies.moon;
  const asc  = chart.western.bodies.asc;
  const parts: string[] = [];
  if (sun)  parts.push(`${SIGN_GLYPH[sun.sign]} ${cap(sun.sign)} Sun`);
  if (moon) parts.push(`${SIGN_GLYPH[moon.sign]} ${cap(moon.sign)} Moon`);
  if (asc)  parts.push(`${SIGN_GLYPH[asc.sign]} ${cap(asc.sign)} rising`);
  const [y, m, d] = birth.date.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  parts.push(dateStr);
  parts.push([birth.city, birth.region].filter(Boolean).join(', '));
  return parts.join(' · ');
}

export default function Dashboard() {
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

  function cacheResult(key: string, text: string) {
    setInterpCache(prev => new Map(prev).set(key, text));
  }

  function handleModeChange(m: InterpretMode) {
    setInterpMode(m);
    localStorage.setItem('interpretMode', m);
  }

  function handleResolved(b: ResolvedBirth, c: NatalChart) {
    setBirth(b);
    setChart(c);
    setFormOpen(false);
  }

  const section: React.CSSProperties = {
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-raised)',
  };

  const sectionHead: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--fg-muted)',
    fontFamily: 'var(--font-mono)',
  };

  return (
    <div className="flex-1 px-4 py-6 max-w-5xl w-full mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Birth Atmosphere card ── */}
      {chart && <BirthAtmosphere chart={chart} />}

      {/* ── Birth Data section ── */}
      <section style={section}>
        {chart && birth && !formOpen ? (
          /* Collapsed summary */
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              {chartSummary(chart, birth)}
            </span>
            <button
              onClick={() => setFormOpen(true)}
              style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--accent)', background: 'none',
                border: '1px solid var(--line)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              Edit
            </button>
          </div>
        ) : (
          /* Expanded form */
          <div style={{ padding: '16px 20px' }}>
            <h2 style={{ ...sectionHead, marginBottom: 16 }}>Birth Data</h2>
            <BirthForm onResolved={handleResolved} />
          </div>
        )}
      </section>

      {/* ── Chart wheels ── */}
      {chart && (
        <section style={section}>
          <div style={{ padding: '16px 20px 8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <h3 style={sectionHead}>Western · Tropical · Placidus</h3>
                <div style={{ ...descBox, maxWidth: 420 }}>
                  <strong style={descTitle}>Western Astrology — Personality &amp; Psychology</strong>
                  <p style={descText}>
                    The Western chart is a map of your <strong>conscious self, ego, and personality</strong> — who you are and how you show up in the world. It uses the <em>tropical zodiac</em>, anchored to Earth's seasons (Aries always begins at the spring equinox), making it a system rooted in present, earthly experience.
                  </p>
                  <p style={{ ...descText, marginTop: 8 }}>
                    Your Sun sign describes your core identity and life purpose; your Moon sign shows your emotional world and instincts; your Rising sign (Ascendant) is the mask you wear — how others first perceive you. Together these three form the backbone of your Western chart. The planets, signs, houses, and aspects layer on top to paint a detailed picture of your psychology, strengths, wounds, and patterns of behavior.
                  </p>
                  <p style={{ ...descText, marginTop: 8 }}>
                    <strong>Best used for:</strong> understanding personality, psychological patterns, relationships, and how you experience life consciously.
                  </p>
                </div>
                <div style={{ maxWidth: 420 }}>
                  <WesternWheel chart={chart} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <h3 style={sectionHead}>Vedic · Sidereal · Whole Sign</h3>
                <div style={{ ...descBox, maxWidth: 420 }}>
                  <strong style={descTitle}>Vedic / Jyotish Astrology — Karma &amp; Destiny</strong>
                  <p style={descText}>
                    The Vedic chart reveals your <strong>soul's journey, karma, and life circumstances</strong> — the deeper purpose and conditions you were born into. It is a system over 5,000 years old, rooted in the Indian tradition of Jyotish ("the science of light"). It uses the <em>sidereal zodiac</em>, tied to the actual star constellations rather than the seasons, which currently runs about 23° behind the Western zodiac. This is why most people find their Vedic sign is one sign earlier than their Western sign.
                  </p>
                  <p style={{ ...descText, marginTop: 8 }}>
                    Where Western astrology focuses on who you <em>are</em>, Vedic astrology focuses on what you are <em>here to do</em> — your dharma (life path), karma (past-life debts and gifts), artha (livelihood), and moksha (spiritual liberation). The Ascendant sign is the foundation of the entire chart. Timing is tracked through Dasha cycles — planetary periods that govern specific chapters of your life with remarkable precision.
                  </p>
                  <p style={{ ...descText, marginTop: 8 }}>
                    <strong>Best used for:</strong> life circumstances, career and relationship timing, spiritual path, and understanding your soul's deeper intentions.
                  </p>
                </div>
                <div style={{ maxWidth: 420 }}>
                  <NorthIndianDiamond chart={chart} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                  Lahiri ayanamsa {chart.vedic.ayanamsa.toFixed(4)}°
                </p>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── Data tables ── */}
      {chart && (
        <section style={section}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 4px' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 14px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: tab === t.id ? 'var(--accent)' : 'var(--fg-dim)',
                  borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab description */}
          <div style={{ margin: '12px 16px 4px', ...descBox }}>
            <strong style={descTitle}>{TAB_DESC[tab].title}</strong>
            <p style={descText}>{TAB_DESC[tab].body}</p>
          </div>

          {/* Table content */}
          <div style={{ padding: '4px 0 12px' }}>
            {tab === 'planets'   && <PlanetTable    chart={chart} onInterpret={setInterpSection} />}
            {tab === 'houses'    && <HouseTable     chart={chart} onInterpret={setInterpSection} />}
            {tab === 'aspects'   && <AspectTable    chart={chart} onInterpret={setInterpSection} />}
            {tab === 'dignities' && <DignityTable   chart={chart} />}
            {tab === 'vedic'     && <VedicRashiTable chart={chart} onInterpret={setInterpSection} />}
          </div>
        </section>
      )}

      {/* ── Chart Snapshot (free teaser) ── */}
      {chart && <ChartSnapshot chart={chart} />}

      {/* ── Reading Style ── */}
      {chart && (
        <section style={{ ...section, padding: '14px 20px' }}>
          <p style={{ ...sectionHead, marginBottom: 12 }}>Reading Style</p>
          <ModeSelector mode={interpMode} onChange={handleModeChange} />
        </section>
      )}

      {/* ── Actions ── */}
      {chart && (
        <section style={{ ...section, padding: '14px 20px' }}>
          <p style={{ ...sectionHead, marginBottom: 12 }}>Advanced</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MODALS.map(m => (
              <button
                key={m.id}
                onClick={() => setModal(m.id)}
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--fg-muted)',
                  background: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                ▸ {m.label}
              </button>
            ))}
          </div>
        </section>
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
      {modal && modal !== 'transits' && modal !== 'progressions' && modal !== 'dashas' && modal !== 'synastry' && (
        <PlaceholderModal
          title={MODALS.find(m => m.id === modal)!.label}
          phase={MODALS.find(m => m.id === modal)!.phase}
          onClose={() => setModal(null)}
        />
      )}

      {interpSection && chart && (
        <InterpretationPanel
          chart={chart}
          section={interpSection}
          onClose={() => setInterpSection(null)}
          mode={interpMode}
          cachedText={interpCache.get(`${interpMode}|${interpSection.prompt}`)}
          onCached={(text) => cacheResult(`${interpMode}|${interpSection.prompt}`, text)}
        />
      )}
    </div>
  );
}

const descBox: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  borderLeft: '3px solid var(--accent)',
  borderRadius: 4,
  padding: '10px 14px',
  maxWidth: 380,
};

const descTitle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--fg-muted)',
  marginBottom: 6,
};

const descText: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--fg)',
  lineHeight: 1.7,
  fontFamily: 'var(--font-sans, sans-serif)',
};
