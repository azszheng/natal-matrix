'use client';

import { useState, useMemo, useCallback } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { buildChildhoodSection } from '@/lib/ai/prompts';
import {
  scoreChildhoodImprints,
  isMinorChart,
  type ScoredTheme,
  type ChildhoodSnapshot,
  type ImprStrength,
} from '@/lib/ai/childhoodImprints';
import AcknowledgmentGate from '@/components/childhood/AcknowledgmentGate';
import InterpretButton from '@/components/interpret/InterpretButton';

// ── Helpers ───────────────────────────────────────────────────────────────────

function lsGet(key: string): boolean {
  try { return localStorage.getItem(key) === 'true'; } catch { return false; }
}
function lsSet(key: string) {
  try { localStorage.setItem(key, 'true'); } catch { /* storage full */ }
}

function chartAckKey(chart: NatalChart): string {
  return `nc_ack_minor_v2_${chart.input.date}_${chart.input.time}`;
}

// ── Strength badge ────────────────────────────────────────────────────────────

const STRENGTH_COLOR: Record<ImprStrength, string> = {
  'Subtle imprint':     'var(--fg-dim)',
  'Noticeable imprint': '#8a7a4a',
  'Strong imprint':     '#c46f38',
  'Defining imprint':   '#a83232',
};

function StrengthBadge({ strength }: { strength: ImprStrength }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase',
      letterSpacing: '0.09em', padding: '3px 10px',
      border: `1px solid ${STRENGTH_COLOR[strength]}`,
      color: STRENGTH_COLOR[strength],
      borderRadius: 2, whiteSpace: 'nowrap',
    }}>
      {strength}
    </span>
  );
}

// ── Snapshot card ─────────────────────────────────────────────────────────────

function SnapshotCard({ snapshot, isMinor }: { snapshot: ChildhoodSnapshot; isMinor: boolean }) {
  const rows = isMinor ? [
    { label: 'Family Dynamic',      value: snapshot.familyRole },
    { label: 'Support Focus',       value: snapshot.coreUnmetNeed },
    { label: 'Parenting Awareness', value: snapshot.protectiveAdaptation },
    { label: 'Invitation',          value: snapshot.integratedGift },
  ] : [
    { label: 'Primary Imprint',   value: snapshot.primaryImprint },
    snapshot.secondaryImprint && { label: 'Secondary Pattern', value: snapshot.secondaryImprint },
    { label: 'Family Role',        value: snapshot.familyRole },
    snapshot.lineageThread && { label: 'Lineage Thread',  value: snapshot.lineageThread },
    { label: 'Core Unmet Need',   value: snapshot.coreUnmetNeed },
    { label: 'Integrated Gift',   value: snapshot.integratedGift },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div style={{
      border: '1px solid var(--line)',
      background: 'var(--bg-raised)',
      padding: '20px 22px',
      marginBottom: 12,
    }}>
      <p style={{
        margin: '0 0 18px',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'var(--fg-dim)',
      }}>
        {isMinor ? 'Child Profile Snapshot' : 'Imprint Snapshot'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px 28px' }}>
        {rows.map(r => (
          <div key={r.label}>
            <p style={{
              margin: '0 0 4px',
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              textTransform: 'uppercase', letterSpacing: '0.09em',
              color: 'var(--fg-dim)',
            }}>
              {r.label}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg)', lineHeight: 1.55, fontFamily: 'var(--font-sans)' }}>
              {r.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Evidence drawer ───────────────────────────────────────────────────────────

function EvidenceDrawer({ theme }: { theme: ScoredTheme }) {
  const [open, setOpen] = useState(false);
  const total = theme.tropicalIndicators.length + theme.vedicIndicators.length;
  if (total === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          marginTop: 14, background: 'none', border: 'none',
          padding: 0, cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--fg-dim)', display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <span style={{ fontSize: 8 }}>{open ? '▲' : '▼'}</span>
        {open ? 'Hide indicators' : `View chart indicators (${total})`}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          {theme.tropicalIndicators.length > 0 && (
            <>
              <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--fg-dim)' }}>
                Tropical (Western)
              </p>
              <ul style={{ margin: '0 0 10px', paddingLeft: 18, listStyle: 'disc' }}>
                {theme.tropicalIndicators.map((ind, i) => (
                  <li key={i} style={{ fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
                    {ind}
                  </li>
                ))}
              </ul>
            </>
          )}
          {theme.hasVedicEvidence && theme.vedicIndicators.length > 0 ? (
            <>
              <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--fg-dim)' }}>
                Vedic (Sidereal)
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
                {theme.vedicIndicators.map((ind, i) => (
                  <li key={i} style={{ fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
                    {ind}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
              No significant Vedic indicators for this theme.
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ── System note chip ──────────────────────────────────────────────────────────

function SystemNoteChip({ note }: { note: 'tropical-only' | 'tropical-and-vedic' }) {
  const label = note === 'tropical-and-vedic' ? 'tropical + vedic' : 'tropical astrology';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--fg-dim)',
      border: '1px solid var(--line)', borderRadius: 2,
      padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ── Theme card ────────────────────────────────────────────────────────────────

function ThemeCard({
  theme,
  isMinor,
  chart,
  mode,
  onInterpret,
  tier = 'primary',
}: {
  theme: ScoredTheme;
  isMinor: boolean;
  chart: NatalChart;
  mode: InterpretMode;
  onInterpret: (s: InterpretSection) => void;
  tier?: 'primary' | 'secondary' | 'background';
}) {
  const title = isMinor ? theme.minorTitle : theme.adultTitle;
  const summary = isMinor ? theme.minorSummary : theme.adultSummary;
  const section = useCallback(
    () => buildChildhoodSection(theme, chart, isMinor, mode),
    [theme, chart, isMinor, mode],
  );

  const isSecondary = tier === 'secondary';

  return (
    <div style={{
      border: `1px solid ${isSecondary ? 'var(--line)' : 'var(--line)'}`,
      background: 'var(--bg-raised)',
      padding: '18px 20px',
      marginBottom: 8,
      opacity: isSecondary ? 0.92 : 1,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {isSecondary && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.09em', color: 'var(--fg-dim)',
              }}>
                Secondary
              </span>
            )}
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.2 }}>
              {title}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <StrengthBadge strength={theme.strength} />
            <SystemNoteChip note={theme.systemNote} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
            {summary}
          </p>
        </div>
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <InterpretButton section={section()} onInterpret={onInterpret} />
        </div>
      </div>

      {/* Protective + Gift (adult only) */}
      {!isMinor && (
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--fg-dim)' }}>
              Protective Adaptation
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65, fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
              {theme.protectiveAdaptation}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--fg-dim)' }}>
              Integrated Gift
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65, fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
              {theme.integratedGift.split(',')[0]}
            </p>
          </div>
        </div>
      )}

      {/* Evidence drawer (tropical + vedic split) */}
      <EvidenceDrawer theme={theme} />

      {/* Reflection prompt (adult) */}
      {!isMinor && (
        <p style={{
          margin: '16px 0 0', fontSize: 13,
          color: 'var(--fg-dim)', lineHeight: 1.7,
          fontFamily: 'var(--font-sans)',
          borderTop: '1px solid var(--line)', paddingTop: 14,
          fontStyle: 'italic',
        }}>
          {theme.reflectionPrompt}
        </p>
      )}

      {/* Minor: support response */}
      {isMinor && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--fg-dim)' }}>
            Parenting Response
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
            {theme.minorSupportResponse}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Background themes (collapsed accordion) ───────────────────────────────────

function BackgroundThemes({
  themes,
  isMinor,
  chart,
  mode,
  onInterpret,
}: {
  themes: ScoredTheme[];
  isMinor: boolean;
  chart: NatalChart;
  mode: InterpretMode;
  onInterpret: (s: InterpretSection) => void;
}) {
  const [open, setOpen] = useState(false);
  if (themes.length === 0) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          border: '1px solid var(--line)',
          background: 'var(--bg-raised)',
          padding: '12px 20px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '0.09em', color: 'var(--fg-dim)',
        }}
      >
        <span>
          {open ? 'Hide' : 'Show'} background patterns ({themes.length})
        </span>
        <span style={{ fontSize: 8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 2 }}>
          <p style={{
            margin: '0 0 8px', padding: '8px 12px',
            fontSize: 11.5, color: 'var(--fg-dim)',
            fontFamily: 'var(--font-sans)', lineHeight: 1.6,
            background: 'var(--bg-raised)', border: '1px solid var(--line)', borderTop: 'none',
          }}>
            These themes share significant indicator overlap with the primary pattern and are shown here for completeness. They may color the primary pattern but are unlikely to be independent in their expression.
          </p>
          {themes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isMinor={isMinor}
              chart={chart}
              mode={mode}
              onInterpret={onInterpret}
              tier="background"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Acknowledgment content ────────────────────────────────────────────────────

const ADULT_GATE = {
  title: 'Childhood & Lineage Imprints — A Note Before You Begin',
  body: `This section offers a symbolic read of early psychological patterns — the adaptive strategies and emotional orientations that planetary configurations can point toward. These are possibilities and tendencies, not certainties or diagnoses.

Astrological charts describe psychological potentials. They do not reveal what actually happened to you, and no astrological pattern is deterministic. Use this as one lens among many — a prompt for reflection, not a verdict about your past.

If this material touches something difficult, please work with a qualified therapist or counselor. This is not a substitute for professional support.`,
  checkboxText: 'I understand this is a symbolic reflection tool, not a therapeutic or diagnostic resource.',
};

const MINOR_GATE = {
  title: 'You Are Viewing a Chart for Someone Under 18',
  body: `This section reframes the childhood indicators as parenting and caregiving awareness — not as a description of what a child has experienced.

Astrological patterns suggest sensitivities and needs, not certainties about a child's inner life or history. Every child is far more than any chart can hold.

Use this information as a gentle prompt to reflect on what might support their flourishing — not as a lens through which to define or predict them. If you have concerns about a child's wellbeing, please consult a licensed professional.`,
  checkboxText: 'I understand this section is for parenting reflection only, and I will not use it to define or label this child.',
};

// ── Main section ──────────────────────────────────────────────────────────────

type Props = {
  chart: NatalChart;
  mode: InterpretMode;
  onInterpret: (s: InterpretSection) => void;
};

export default function ChildhoodImprintsSection({ chart, mode, onInterpret }: Props) {
  const isMinor = isMinorChart(chart.input.date);

  const [ack1, setAck1] = useState(() => {
    if (typeof window === 'undefined') return false;
    return lsGet('nc_ack_childhood_v1');
  });

  const [ack2, setAck2] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!isMinor) return true;
    return lsGet(chartAckKey(chart));
  });

  const result = useMemo(() => scoreChildhoodImprints(chart), [chart]);

  function confirmAck1() { lsSet('nc_ack_childhood_v1'); setAck1(true); }
  function confirmAck2() { lsSet(chartAckKey(chart)); setAck2(true); }

  if (!result.primary) return null;

  return (
    <>
      {!ack1 && (
        <AcknowledgmentGate
          title={ADULT_GATE.title}
          body={ADULT_GATE.body}
          checkboxText={ADULT_GATE.checkboxText}
          onConfirm={confirmAck1}
        />
      )}
      {ack1 && isMinor && !ack2 && (
        <AcknowledgmentGate
          title={MINOR_GATE.title}
          body={MINOR_GATE.body}
          checkboxText={MINOR_GATE.checkboxText}
          onConfirm={confirmAck2}
        />
      )}

      {ack1 && (!isMinor || ack2) && (
        <div>
          {/* Minor mode banner */}
          {isMinor && (
            <div style={{
              border: '1px solid var(--line)', background: 'var(--bg-raised)',
              padding: '12px 18px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>
                Parent Reflection Mode
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg-muted)' }}>
                — Written for caregivers. These are sensitivities and needs, not fixed descriptions.
              </span>
            </div>
          )}

          {/* Intro note */}
          <div style={{
            border: '1px solid var(--line)', background: 'var(--bg-raised)',
            padding: '16px 20px', marginBottom: 10,
          }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
              {isMinor
                ? "The pattern below reflects the most prominent sensitivity suggested by this chart’s planetary configuration."
                : "The pattern below is the most prominent psychological tendency suggested by your planetary configuration. Descriptions reflect possibilities — not certainties."
              }
            </p>
            <p style={{
              margin: '10px 0 0', fontSize: 12, color: 'var(--fg-dim)',
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {result.overallSystemNote === 'tropical-and-vedic'
                ? 'This section draws on both tropical (Western) and Vedic (sidereal) chart data.'
                : 'This section is based on tropical (Western) astrology.'
              }
            </p>
          </div>

          {/* Snapshot */}
          {result.snapshot && <SnapshotCard snapshot={result.snapshot} isMinor={isMinor} />}

          {/* Primary theme card */}
          <ThemeCard
            theme={result.primary}
            isMinor={isMinor}
            chart={chart}
            mode={mode}
            onInterpret={onInterpret}
            tier="primary"
          />

          {/* Secondary theme cards (0-2) */}
          {result.secondary.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isMinor={isMinor}
              chart={chart}
              mode={mode}
              onInterpret={onInterpret}
              tier="secondary"
            />
          ))}

          {/* Background themes (collapsed) */}
          <BackgroundThemes
            themes={result.background}
            isMinor={isMinor}
            chart={chart}
            mode={mode}
            onInterpret={onInterpret}
          />

          {/* Child safety anchor */}
          {isMinor && (
            <p style={{
              margin: '12px 0 0', fontSize: 12,
              color: 'var(--fg-dim)', lineHeight: 1.75,
              fontFamily: 'var(--font-sans)', fontStyle: 'italic',
              borderTop: '1px solid var(--line)', paddingTop: 12,
            }}>
              A chart is a symbolic map. A child is a living person. Always trust the child in front of you more than any interpretation.
            </p>
          )}

          {/* Anti-projection footer */}
          <p style={{
            margin: '10px 0 0', fontSize: 12.5,
            color: 'var(--fg-dim)', lineHeight: 1.7,
            fontFamily: 'var(--font-sans)', fontStyle: 'italic',
          }}>
            {isMinor
              ? 'Anti-projection reminder: these patterns describe possible needs and sensitivities — not evidence of what a child has experienced. Every child is always more than any chart can hold.'
              : 'These patterns are symbolic maps of psychological possibility — not a record of what happened. Please work with a qualified professional if this material brings up something significant.'
            }
          </p>
        </div>
      )}
    </>
  );
}
