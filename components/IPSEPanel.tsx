'use client';

import { useMemo } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretMode } from '@/lib/ai/prompts';
import { computeIPSEProfile, type IPSEDomainResult, type IPSEEvidence, type IPSESystem } from '@/lib/ai/ipse';
import Disclosure from '@/components/ui/Disclosure';

const TONE_LABEL: Record<string, string> = {
  supportive: 'Flows easily',
  challenging: 'Effortful, activating',
  mixed: 'Mixed',
  transformational: 'Transformational',
};

const SYSTEM_LABEL: Record<IPSESystem, string> = {
  western: 'Western / Tropical',
  vedic: 'Vedic',
  vibrational: 'Vibrational (Harmonic)',
};

function labelColor(label: string): string {
  if (label === 'Dominant emphasis') return 'var(--fg-glyph)';
  if (label === 'Strong emphasis') return 'var(--accent)';
  if (label === 'Moderate emphasis') return 'var(--fg-muted)';
  return 'var(--fg-dim)';
}

function EvidenceList({ title, evidence }: { title: string; evidence: IPSEEvidence[] }) {
  if (evidence.length === 0) return null;
  const top = evidence.slice(0, 6);
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {top.map((e, i) => (
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

function DomainCard({ domain, mode, isMinor }: { domain: IPSEDomainResult; mode: InterpretMode; isMinor: boolean }) {
  const isEssence = mode === 'essence';
  const isAdvanced = mode === 'astrologer';

  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '16px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' }}>#{domain.rank}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 17, color: 'var(--fg)' }}>{domain.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-glyph)', border: '1px solid var(--fg-glyph)', borderRadius: 2, padding: '2px 7px' }}>
            {domain.rankLabel}
          </span>
          {!isEssence && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: labelColor(domain.label), border: `1px solid ${labelColor(domain.label)}`, borderRadius: 2, padding: '2px 7px' }}>
              {domain.label}
            </span>
          )}
          {isAdvanced && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
              {domain.score}/100
            </span>
          )}
        </div>
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.65 }}>
        {domain.summary}
      </p>

      {!isEssence && (
        <>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {domain.subtypes.map(s => (
              <span key={s} style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', border: '1px solid var(--line)', borderRadius: 2, padding: '2px 7px' }}>
                {s}
              </span>
            ))}
            <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              · {TONE_LABEL[domain.tone] ?? domain.tone}
            </span>
          </div>

          <div className="am-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 10 }}>
            <div>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>Strengths</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
                {domain.strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
                {isMinor ? 'Support Cues' : 'Growth Edges'}
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
                {domain.growthEdges.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>

          <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {domain.integratedExpression}
          </p>
        </>
      )}

      {isAdvanced && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>Western: {domain.westernScore ?? '—'}</span>
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>Vedic: {domain.vedicScore ?? '—'}</span>
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>Vibrational: {domain.vibrationalScore ?? '—'}</span>
          </div>
          <Disclosure label="Evidence used for this domain">
            <EvidenceList title={SYSTEM_LABEL.western} evidence={domain.westernEvidence} />
            {domain.vedicEvidence.length > 0
              ? <EvidenceList title={SYSTEM_LABEL.vedic} evidence={domain.vedicEvidence} />
              : <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>Vedic layer unavailable for this chart.</p>}
            {domain.vibrationalEvidence.length > 0 && <EvidenceList title={SYSTEM_LABEL.vibrational} evidence={domain.vibrationalEvidence} />}
          </Disclosure>
        </div>
      )}
    </div>
  );
}

type Props = {
  chart: NatalChart;
  mode: InterpretMode;
};

export default function IPSEPanel({ chart, mode }: Props) {
  const profile = useMemo(() => computeIPSEProfile(chart), [chart]);

  if (profile.rankedDomains.length === 0) {
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
        <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-dim)' }}>
          {profile.balancePattern}
        </p>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}>
          {profile.profileSummary}
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {profile.rankedDomains.map(d => (
          <DomainCard key={d.domain} domain={d} mode={mode} isMinor={profile.isMinor} />
        ))}
      </div>
    </section>
  );
}
