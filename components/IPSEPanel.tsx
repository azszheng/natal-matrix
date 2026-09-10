'use client';

import { useMemo } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import {
  computeIPSEStyleProfile,
  type IPSEDomainCard,
  type IPSEEvidence,
  type IPSEStyleResult,
} from '@/lib/ai/ipse';
import { buildIPSEDomainSection } from '@/lib/ai/ipsePrompts';
import Disclosure from '@/components/ui/Disclosure';
import InterpretButton from '@/components/interpret/InterpretButton';

const TONE_LABEL: Record<string, string> = {
  supportive: 'Flows easily',
  challenging: 'Effortful, activating',
  mixed: 'Mixed',
  transformational: 'Transformational',
  'pressure-driven': 'Pressure-driven',
  porous: 'Porous',
  conditioned: 'Conditioned by surroundings',
  fluid: 'Fluid',
};

const ACCESS_LABEL: Record<string, string> = {
  'consistent access': 'Consistent access',
  'conditioned access': 'Conditioned access',
  'pressure-driven access': 'Pressure-driven access',
  'environment-dependent access': 'Environment-dependent access',
  'burst-based access': 'Burst-based access',
  'relationally activated access': 'Relationally activated access',
  'reflective access': 'Reflective access',
  unknown: 'Unknown',
};

function scoreColor(score: number): string {
  if (score >= 65) return 'var(--fg-glyph)';
  if (score >= 45) return 'var(--accent)';
  if (score >= 25) return 'var(--fg-muted)';
  return 'var(--fg-dim)';
}

function StyleChip({ style, dominant }: { style: IPSEStyleResult; dominant?: boolean }) {
  return (
    <span style={{
      fontSize: dominant ? 12.5 : 10.5, fontFamily: dominant ? 'var(--font-display)' : 'var(--font-mono)',
      fontWeight: dominant ? 500 : 400, color: dominant ? 'var(--fg)' : 'var(--fg-dim)',
      border: dominant ? '1px solid var(--fg-glyph)' : '1px solid var(--line)',
      borderRadius: 2, padding: dominant ? '4px 10px' : '2px 8px',
    }}>
      {style.label}
    </span>
  );
}

function EvidenceList({ title, evidence, note }: { title: string; evidence: IPSEEvidence[]; note?: string }) {
  if (evidence.length === 0 && !note) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
        {title}
      </p>
      {note && <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>{note}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {evidence.slice(0, 6).map((e, i) => (
          <div key={e.id + i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--fg-muted)' }}>
            <span>{e.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>
              {Math.round(e.weight * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--fg-muted)' }}>
      <span style={{ flex: '0 0 90px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-dim)' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: scoreColor(value) }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', width: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function DomainCard({ card, chart, mode, isMinor, onInterpret }: {
  card: IPSEDomainCard;
  chart: NatalChart;
  mode: InterpretMode;
  isMinor: boolean;
  onInterpret?: (section: InterpretSection) => void;
}) {
  const isEssence = mode === 'essence';
  const isAdvanced = mode === 'astrologer';

  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '18px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, color: 'var(--fg)' }}>{card.title}</span>
        {onInterpret && (
          <InterpretButton section={buildIPSEDomainSection(card, chart, mode, isMinor)} onInterpret={onInterpret} />
        )}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>{card.subtitle}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {card.primaryStyle ? <StyleChip style={card.primaryStyle} dominant /> : (
          <span style={{ fontSize: 12.5, fontFamily: 'var(--font-display)', color: 'var(--fg-muted)', fontStyle: 'italic' }}>No single style stands out yet</span>
        )}
        {card.secondaryStyles.map(s => <StyleChip key={s.id} style={s} />)}
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.65 }}>
        {card.summary}
      </p>

      {!isEssence && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-dim)' }}>
              Tone: <span style={{ color: 'var(--fg-muted)' }}>{TONE_LABEL[card.expressionTone] ?? card.expressionTone}</span>
            </span>
            {card.humanDesignLens.available && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-dim)' }}>
                Access: <span style={{ color: 'var(--fg-muted)' }}>{ACCESS_LABEL[card.accessPattern] ?? card.accessPattern}</span>
              </span>
            )}
          </div>

          <div className="am-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
            <div>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>Strengths</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
                {card.strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
                {isMinor ? 'Support Cues' : 'Growth Edges'}
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
                {card.growthEdges.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {card.integratedExpression}
          </p>

          {card.humanDesignLens.available && card.humanDesignLens.discrepancyNote && (
            <p style={{
              margin: '0 0 10px', padding: '10px 12px', fontSize: 12, color: 'var(--fg-muted)',
              fontFamily: 'var(--font-sans)', lineHeight: 1.6,
              background: 'var(--bg)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)',
            }}>
              {card.humanDesignLens.discrepancyNote}
            </p>
          )}
        </>
      )}

      {isAdvanced && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <ScoreBar label="Orientation" value={card.orientationScore} />
            <ScoreBar label="Fluency" value={card.fluencyScore} />
            <ScoreBar label="Friction" value={card.frictionScore} />
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
            Confidence: {card.styleConfidence}
          </p>
          <Disclosure label="Evidence by system">
            <EvidenceList title="Western / Tropical" evidence={card.westernEvidence} />
            {card.vedicLens.available
              ? <EvidenceList title="Vedic refinement" evidence={card.vedicLens.evidence} note={card.vedicLens.summary} />
              : <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>Vedic layer unavailable for this chart.</p>}
            {card.vibrationalLens.available && card.vibrationalLens.evidence.length > 0 && (
              <EvidenceList title="Vibrational (harmonic)" evidence={card.vibrationalLens.evidence} note={card.vibrationalLens.summary} />
            )}
            {card.humanDesignLens.available
              ? <EvidenceList title="Human Design lens" evidence={card.humanDesignLens.evidence} note={card.humanDesignLens.decisionSupport} />
              : <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>Human Design layer unavailable for this chart.</p>}
          </Disclosure>
        </div>
      )}
    </div>
  );
}

type Props = {
  chart: NatalChart;
  mode: InterpretMode;
  hdChart?: HdChart | null;
  onInterpret?: (section: InterpretSection) => void;
};

export default function IPSEPanel({ chart, mode, hdChart, onInterpret }: Props) {
  const profile = useMemo(
    () => computeIPSEStyleProfile(chart, { mode, humanDesign: hdChart ?? null }),
    [chart, mode, hdChart],
  );

  if (profile.domainCards.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
        {profile.profileSummary}
      </p>
    );
  }

  return (
    <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
        <p style={{
          margin: '0 0 10px', padding: '10px 14px', fontSize: 12, color: 'var(--fg-muted)',
          fontFamily: 'var(--font-sans)', lineHeight: 1.6,
          background: 'var(--bg)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)',
        }}>
          {profile.disclaimer}
        </p>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}>
          {profile.profileSummary}
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {profile.domainCards.map(card => (
          <DomainCard key={card.domain} card={card} chart={chart} mode={mode} isMinor={profile.isMinor} onInterpret={onInterpret} />
        ))}
      </div>
    </section>
  );
}
