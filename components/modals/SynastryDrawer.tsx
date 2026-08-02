'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { NatalChart, ResolvedBirth, BodyId } from '@/lib/astro/types';
import { computeSynastry } from '@/lib/astro/synastryScoring';
import type {
  SynastryAspect,
  SynastryHouseOverlay,
  SharedPattern,
  SynastryThemeSummary,
  SynastryTheme,
  SalienceLevel,
  RelationshipContext,
  SynastryResult,
} from '@/lib/astro/synastry';
import BirthForm from '@/components/BirthForm';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { ASPECT_SYMBOL, ASPECT_COLOR } from '@/components/tables/tableUtils';
import InterpretButton from '@/components/interpret/InterpretButton';
import {
  buildSynastryAspectSection,
  buildSynastryOverlaySection,
  buildSynastryThemeSection,
  buildSharedPatternSection,
  buildSynastryRelationshipSummarySection,
} from '@/lib/ai/synastryPrompts';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';

// ── Saved chart type ──────────────────────────────────────────────────────────

type SavedChart = {
  id: number;
  label: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  chart_data: NatalChart;
};

// ── Display helpers ───────────────────────────────────────────────────────────

const BODY_NAME: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N.Node', chiron: 'Chiron', asc: 'ASC', mc: 'MC',
};

const THEME_LABEL: Record<SynastryTheme, string> = {
  emotional_bond:         'Emotional Bond',
  attraction_chemistry:   'Attraction & Chemistry',
  communication:          'Communication',
  commitment_stability:   'Commitment & Stability',
  growth_shadow:          'Growth & Shadow',
  ease_support:           'Ease & Support',
  karmic_development:     'Karmic Development',
  creative_play:          'Creative Play',
  conflict_activation:    'Conflict & Activation',
  identity_visibility:    'Identity & Visibility',
  family_roots:           'Family Roots',
  spiritual_unconscious:  'Spiritual & Unconscious',
};

const CONTEXT_OPTIONS: Array<{ value: RelationshipContext; label: string }> = [
  { value: 'romantic',     label: 'Romantic' },
  { value: 'friendship',   label: 'Friendship' },
  { value: 'family',       label: 'Family' },
  { value: 'parent_child', label: 'Parent-Child' },
  { value: 'sibling',      label: 'Sibling' },
  { value: 'professional', label: 'Professional' },
  { value: 'general',      label: 'General' },
];

const SALIENCE_COLOR: Record<SalienceLevel, string> = {
  very_high:  '#a83232',
  high:       '#c46f38',
  moderate:   '#8a7a4a',
  low:        'var(--fg-dim)',
  background: 'var(--fg-dim)',
};

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function salienceLabel(s: SalienceLevel): string {
  return { very_high: 'Very High', high: 'High', moderate: 'Moderate', low: 'Low', background: 'Background' }[s];
}

function personSummary(chart: NatalChart): string {
  const b = chart.western.bodies;
  const name = chart.input.name?.trim();
  const parts: string[] = [];
  if (name) parts.push(name);
  if (b.sun)  parts.push(`${cap(b.sun.sign)} Sun`);
  if (b.moon) parts.push(`${cap(b.moon.sign)} Moon`);
  if (b.asc)  parts.push(`${cap(b.asc.sign)} Rising`);
  return parts.join(' · ');
}

// ── Salience badge ────────────────────────────────────────────────────────────

function SalienceBadge({ level }: { level: SalienceLevel }) {
  if (level === 'background') return null;
  return (
    <span style={{
      fontSize: 9.5, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: SALIENCE_COLOR[level],
      border: `1px solid ${SALIENCE_COLOR[level]}`,
      borderRadius: 2, padding: '2px 6px', whiteSpace: 'nowrap',
    }}>
      {salienceLabel(level)}
    </span>
  );
}

// ── Theme chip ────────────────────────────────────────────────────────────────

function ThemeChip({ theme }: { theme: SynastryTheme }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      color: 'var(--fg-dim)', border: '1px solid var(--line)',
      borderRadius: 2, padding: '1px 5px', whiteSpace: 'nowrap',
    }}>
      {THEME_LABEL[theme]}
    </span>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHead({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-dim)' }}>
        {label}
      </p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{sub}</p>}
    </div>
  );
}

// ── Saved profile picker ──────────────────────────────────────────────────────

function SavedProfilePicker({
  profiles,
  selectedId,
  onSelect,
}: {
  profiles: SavedChart[];
  selectedId: number | null;
  onSelect: (c: SavedChart) => void;
}) {
  if (profiles.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: '0 0 7px', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
        Load saved profile
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {profiles.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              fontSize: 10.5, fontFamily: 'var(--font-mono)',
              padding: '5px 11px', borderRadius: 3, cursor: 'pointer',
              border: '1px solid var(--line)',
              background: selectedId === c.id ? 'var(--accent)' : 'none',
              color: selectedId === c.id ? '#fff' : 'var(--fg-muted)',
              transition: 'all 0.12s',
              textAlign: 'left',
              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            title={`${c.label} · ${c.birth_location}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', letterSpacing: '0.06em' }}>or enter manually</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>
    </div>
  );
}

// ── Relationship context selector ─────────────────────────────────────────────

function ContextPicker({
  value,
  onChange,
}: {
  value: RelationshipContext;
  onChange: (v: RelationshipContext) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
        Relationship Type
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CONTEXT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              fontSize: 10, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
              border: '1px solid var(--line)',
              background: value === opt.value ? 'var(--accent)' : 'none',
              color: value === opt.value ? '#fff' : 'var(--fg-dim)',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Relationship snapshot ─────────────────────────────────────────────────────

function RelationshipSnapshot({
  themes,
  result,
  context,
  mode,
  onInterpret,
}: {
  themes: SynastryThemeSummary[];
  result: SynastryResult;
  context: RelationshipContext;
  mode: InterpretMode;
  onInterpret: (s: InterpretSection) => void;
}) {
  const top = themes.slice(0, 5);
  const section = useCallback(
    () => buildSynastryRelationshipSummarySection(result, context, mode),
    [result, context, mode],
  );

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-dim)' }}>
            Relationship Signature
          </p>
          <InterpretButton section={section()} onInterpret={onInterpret} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px 20px' }}>
          {top.map(t => (
            <div key={t.theme} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
                {THEME_LABEL[t.theme]}
              </span>
              <SalienceBadge level={t.salienceLevel} />
            </div>
          ))}
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
          These levels reflect theme intensity, not relationship success. High intensity in Growth &amp; Shadow means significant activation — not incompatibility.
        </p>
      </div>
    </div>
  );
}

// ── Theme card ────────────────────────────────────────────────────────────────

function ThemeCard({
  summary,
  chartA,
  chartB,
  context,
  mode,
  nameA,
  nameB,
  onInterpret,
}: {
  summary: SynastryThemeSummary;
  chartA: NatalChart;
  chartB: NatalChart;
  context: RelationshipContext;
  mode: InterpretMode;
  nameA: string;
  nameB: string;
  onInterpret: (s: InterpretSection) => void;
}) {
  const section = useCallback(
    () => buildSynastryThemeSection(summary, chartA, chartB, context, mode),
    [summary, chartA, chartB, context, mode],
  );

  return (
    <div style={{
      border: '1px solid var(--line)', background: 'var(--bg-raised)',
      padding: '10px 14px', marginBottom: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>
          {THEME_LABEL[summary.theme]}
        </span>
        <SalienceBadge level={summary.salienceLevel} />
      </div>
      <InterpretButton section={section()} onInterpret={onInterpret} />
    </div>
  );
}

// ── Top aspects table ─────────────────────────────────────────────────────────

function TopAspectsSection({
  aspects,
  chartA,
  chartB,
  context,
  mode,
  nameA,
  nameB,
  onInterpret,
}: {
  aspects: SynastryAspect[];
  chartA: NatalChart;
  chartB: NatalChart;
  context: RelationshipContext;
  mode: InterpretMode;
  nameA: string;
  nameB: string;
  onInterpret: (s: InterpretSection) => void;
}) {
  const top = aspects.filter(a => !a.isGenerational).slice(0, 10);
  if (top.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionHead label="Most Significant Contacts" sub="Ranked by interpretive weight — personal planet contacts first." />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <th style={th}>{nameA}</th>
            <th style={{ ...th, textAlign: 'center' }}>Asp</th>
            <th style={th}>{nameB}</th>
            <th style={th}>Orb</th>
            <th style={th}>Salience</th>
            <th style={{ ...th, textAlign: 'right' }} />
          </tr>
        </thead>
        <tbody>
          {top.map((asp, i) => {
            const section = buildSynastryAspectSection(asp, chartA, chartB, context, mode);
            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {PLANET_GLYPH[asp.bodyA] ?? ''} {BODY_NAME[asp.bodyA] ?? asp.bodyA}
                </td>
                <td style={{ ...td, textAlign: 'center', color: ASPECT_COLOR[asp.kind], fontWeight: 600, fontSize: 14 }}>
                  {ASPECT_SYMBOL[asp.kind] ?? asp.kind}
                </td>
                <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {PLANET_GLYPH[asp.bodyB] ?? ''} {BODY_NAME[asp.bodyB] ?? asp.bodyB}
                </td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', fontSize: 11 }}>
                  {asp.orb.toFixed(1)}°
                </td>
                <td style={td}>
                  <SalienceBadge level={asp.salienceLevel} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <InterpretButton section={section} onInterpret={onInterpret} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── House overlays section ────────────────────────────────────────────────────

function HouseOverlaysSection({
  overlays,
  chartA,
  chartB,
  context,
  mode,
  hasHouseData,
  onInterpret,
}: {
  overlays: SynastryHouseOverlay[];
  chartA: NatalChart;
  chartB: NatalChart;
  context: RelationshipContext;
  mode: InterpretMode;
  hasHouseData: boolean;
  onInterpret: (s: InterpretSection) => void;
}) {
  const top = overlays.filter(o => o.salienceLevel !== 'background').slice(0, 12);

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionHead label="Where They Land" sub="Where each person's planets fall in the other person's chart." />

      {!hasHouseData ? (
        <p style={{ fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}>
          House overlays require reliable birth times for both charts. Planet-to-planet synastry aspects and shared sign patterns are still available above.
        </p>
      ) : (
        <div>
          {top.map((o, i) => {
            const section = buildSynastryOverlaySection(o, chartA, chartB, context, mode);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '8px 12px', borderBottom: '1px solid var(--line)',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
                    {o.label}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {o.themes.map(t => <ThemeChip key={t} theme={t} />)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <SalienceBadge level={o.salienceLevel} />
                  <InterpretButton section={section} onInterpret={onInterpret} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared patterns section ───────────────────────────────────────────────────

function SharedPatternsSection({
  patterns,
  chartA,
  chartB,
  context,
  mode,
  onInterpret,
}: {
  patterns: SharedPattern[];
  chartA: NatalChart;
  chartB: NatalChart;
  context: RelationshipContext;
  mode: InterpretMode;
  onInterpret: (s: InterpretSection) => void;
}) {
  const isFamily = context === 'parent_child' || context === 'family' || context === 'sibling';
  const visible  = patterns.filter(p => !p.isGenerational && p.salienceLevel !== 'background').slice(0, 8);

  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionHead
        label={isFamily ? 'Family Echoes' : 'Shared Patterns'}
        sub={isFamily
          ? 'Symbolic themes both charts carry independently. These reflect resonance, not inheritance or determinism.'
          : 'What both charts independently share — creating familiarity, mirroring, or amplification.'}
      />

      {isFamily && (
        <p style={{
          margin: '0 0 12px', padding: '10px 14px',
          fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.7,
          background: 'var(--bg)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)',
        }}>
          Family Echoes are symbolic patterns, not labels or diagnoses. A child's chart should never be used to limit, define, or predict their future. These insights are for reflection, compassion, and awareness.
        </p>
      )}

      {visible.map((p, i) => {
        const section = buildSharedPatternSection(p, chartA, chartB, context, mode);
        return (
          <div key={i} style={{
            border: '1px solid var(--line)', padding: '12px 14px', marginBottom: 6,
            background: 'var(--bg-raised)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                  {p.label}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
                  {p.description}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <SalienceBadge level={p.salienceLevel} />
                <InterpretButton section={section} onInterpret={onInterpret} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {p.themes.map(t => <ThemeChip key={t} theme={t} />)}
              {isFamily && p.familyRelevance !== 'low' && (
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: '#8a7a4a',
                  border: '1px solid #8a7a4a', borderRadius: 2, padding: '1px 5px',
                }}>
                  {p.familyRelevance} family resonance
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── All aspects (collapsed) ───────────────────────────────────────────────────

function AllAspectsSection({
  aspects,
  chartA,
  chartB,
  context,
  mode,
  nameA,
  nameB,
  onInterpret,
}: {
  aspects: SynastryAspect[];
  chartA: NatalChart;
  chartB: NatalChart;
  context: RelationshipContext;
  mode: InterpretMode;
  nameA: string;
  nameB: string;
  onInterpret: (s: InterpretSection) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', border: '1px solid var(--line)', background: 'var(--bg-raised)',
          padding: '10px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '0.09em', color: 'var(--fg-dim)',
        }}
      >
        <span>All Inter-Aspects ({aspects.length})</span>
        <span style={{ fontSize: 8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ border: '1px solid var(--line)', borderTop: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>
                <th style={th}>{nameA}</th>
                <th style={{ ...th, textAlign: 'center' }}>Asp</th>
                <th style={th}>{nameB}</th>
                <th style={th}>Orb</th>
                <th style={th}>Level</th>
                <th style={{ ...th, textAlign: 'right' }} />
              </tr>
            </thead>
            <tbody>
              {aspects.map((asp, i) => {
                const section = buildSynastryAspectSection(asp, chartA, chartB, context, mode);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line)', color: asp.isGenerational ? 'var(--fg-dim)' : 'var(--fg)', opacity: asp.salienceLevel === 'background' ? 0.55 : 1 }}>
                    <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                      {PLANET_GLYPH[asp.bodyA] ?? ''} {BODY_NAME[asp.bodyA] ?? asp.bodyA}
                    </td>
                    <td style={{ ...td, textAlign: 'center', color: ASPECT_COLOR[asp.kind], fontWeight: 600, fontSize: 13 }}>
                      {ASPECT_SYMBOL[asp.kind] ?? asp.kind}
                    </td>
                    <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                      {PLANET_GLYPH[asp.bodyB] ?? ''} {BODY_NAME[asp.bodyB] ?? asp.bodyB}
                    </td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', fontSize: 10 }}>
                      {asp.orb.toFixed(1)}°
                    </td>
                    <td style={td}>
                      {asp.isGenerational
                        ? <span style={{ fontSize: 9, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>Generational</span>
                        : <SalienceBadge level={asp.salienceLevel} />
                      }
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <InterpretButton section={section} onInterpret={onInterpret} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

type Props = {
  chart: NatalChart;
  onClose: () => void;
  onInterpret?: (s: InterpretSection) => void;
  mode?: InterpretMode;
};

export default function SynastryDrawer({ chart: chartA, onClose, onInterpret, mode = 'deepdive' }: Props) {
  const [chartB, setChartB] = useState<NatalChart | null>(null);
  const [context, setContext] = useState<RelationshipContext>('general');
  const [savedProfiles, setSavedProfiles] = useState<SavedChart[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/charts')
      .then(r => r.ok ? r.json() : [])
      .then((data: SavedChart[]) => {
        data.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
        setSavedProfiles(data);
      })
      .catch(() => {});
  }, []);

  function handleProfileSelect(c: SavedChart) {
    setSelectedProfileId(c.id);
    setChartB(c.chart_data);
  }

  const result = useMemo<SynastryResult | null>(
    () => (chartB ? computeSynastry(chartA, chartB) : null),
    [chartA, chartB],
  );

  const nameA = chartA.input.name?.trim() || 'Person A';
  const nameB = chartB?.input.name?.trim() || 'Person B';

  const handleInterpret = useCallback(
    (s: InterpretSection) => { if (onInterpret) onInterpret(s); },
    [onInterpret],
  );

  // Major themes to show as cards (score > 0, prioritized)
  const majorThemes = result?.themes.filter(t =>
    ['emotional_bond', 'attraction_chemistry', 'communication',
     'commitment_stability', 'growth_shadow', 'ease_support',
     'karmic_development', 'family_roots', 'spiritual_unconscious'].includes(t.theme) &&
    t.score > 0
  ).slice(0, 7) ?? [];

  const isFamily = context === 'parent_child' || context === 'family' || context === 'sibling';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(72vw, 680px)',
        background: 'var(--bg-raised)', borderLeft: '1px solid var(--line)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Synastry
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
              Synastry highlights symbolic relationship patterns. It is not a prediction of whether a relationship will succeed or fail, and should not be used to make major relationship decisions on its own.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 18, padding: '2px 6px', flexShrink: 0 }}>×</button>
        </div>

        <div style={{ flex: 1, padding: '20px 24px' }}>

          {/* Person A */}
          <div style={{ padding: '0 0 14px', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Person A
            </p>
            <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
              {personSummary(chartA)}
            </p>
          </div>

          {/* Person B */}
          <div style={{ paddingBottom: chartB ? 16 : 0, borderBottom: chartB ? '1px solid var(--line)' : undefined, marginBottom: chartB ? 20 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Person B
              </p>
              {chartB && (
                <button
                  onClick={() => { setChartB(null); setSelectedProfileId(null); }}
                  style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', background: 'none', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                >
                  Change
                </button>
              )}
            </div>

            {chartB ? (
              <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                {personSummary(chartB)}
              </p>
            ) : (
              <>
                <SavedProfilePicker
                  profiles={savedProfiles}
                  selectedId={selectedProfileId}
                  onSelect={handleProfileSelect}
                />
                <BirthForm onResolved={(_b: ResolvedBirth, c: NatalChart) => { setSelectedProfileId(null); setChartB(c); }} />
              </>
            )}
          </div>

          {/* Results */}
          {result && chartB && (
            <>
              {/* Relationship type picker */}
              <ContextPicker value={context} onChange={setContext} />

              {/* Relationship snapshot */}
              <RelationshipSnapshot
                themes={result.themes}
                result={result}
                context={context}
                mode={mode}
                onInterpret={handleInterpret}
              />

              {/* Theme cards */}
              {majorThemes.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SectionHead label="Relationship Themes" sub="What each area of the relationship looks like based on your combined charts." />
                  {majorThemes.map(t => (
                    <ThemeCard
                      key={t.theme}
                      summary={t}
                      chartA={chartA}
                      chartB={chartB}
                      context={context}
                      mode={mode}
                      nameA={nameA}
                      nameB={nameB}
                      onInterpret={handleInterpret}
                    />
                  ))}
                </div>
              )}

              {/* Top aspects */}
              <TopAspectsSection
                aspects={result.aspects}
                chartA={chartA}
                chartB={chartB}
                context={context}
                mode={mode}
                nameA={nameA}
                nameB={nameB}
                onInterpret={handleInterpret}
              />

              {/* House overlays */}
              <HouseOverlaysSection
                overlays={result.overlays}
                chartA={chartA}
                chartB={chartB}
                context={context}
                mode={mode}
                hasHouseData={result.hasHouseData}
                onInterpret={handleInterpret}
              />

              {/* Shared patterns */}
              <SharedPatternsSection
                patterns={result.patterns}
                chartA={chartA}
                chartB={chartB}
                context={context}
                mode={mode}
                onInterpret={handleInterpret}
              />

              {/* All aspects (collapsed) */}
              <AllAspectsSection
                aspects={result.aspects}
                chartA={chartA}
                chartB={chartB}
                context={context}
                mode={mode}
                nameA={nameA}
                nameB={nameB}
                onInterpret={handleInterpret}
              />
            </>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 24px' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            Synastry · Western tropical · Placidus houses
          </p>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = { padding: '5px 8px', fontWeight: 500, textAlign: 'left' };
const td: React.CSSProperties = { padding: '6px 8px', verticalAlign: 'middle' };
