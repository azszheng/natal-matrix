'use client';

import { useMemo } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import type { HdChart } from '@/lib/astro/humandesign-constants';
import { generateIPSEProfile } from '@/lib/ipse/generate-profile';
import type { IPSEDomainProfile } from '@/lib/ipse/types';
import { buildIPSEDomainSection } from '@/lib/ai/ipsePrompts';
import Disclosure from '@/components/ui/Disclosure';
import InterpretButton from '@/components/interpret/InterpretButton';

const CAPACITY_LABEL: Record<string, string> = {
  emphasized: 'Emphasized', moderate: 'Moderate', mixed: 'Mixed', less_emphasized: 'Less emphasized',
};

const EASE_LABEL: Record<string, string> = {
  natural: 'Flows naturally', conditional: 'Available under the right conditions', effortful: 'Works through real effort', variable: 'Varies by context',
};

function capacityColor(level: string): string {
  if (level === 'emphasized') return 'var(--fg-glyph)';
  if (level === 'moderate') return 'var(--accent)';
  if (level === 'mixed') return 'var(--fg-muted)';
  return 'var(--fg-dim)';
}

function StyleChip({ label, dominant }: { label: string; dominant?: boolean }) {
  return (
    <span style={{
      fontSize: dominant ? 12.5 : 10.5, fontFamily: dominant ? 'var(--font-display)' : 'var(--font-mono)',
      fontWeight: dominant ? 500 : 400, color: dominant ? 'var(--fg)' : 'var(--fg-dim)',
      border: dominant ? '1px solid var(--fg-glyph)' : '1px solid var(--line)',
      borderRadius: 2, padding: dominant ? '4px 10px' : '2px 8px',
    }}>
      {label}
    </span>
  );
}

function DomainCard({ domain, chart, mode, isMinor, onInterpret }: {
  domain: IPSEDomainProfile;
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
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--fg-dim)' }}>{domain.shortCode}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, color: 'var(--fg)', marginLeft: 8 }}>{domain.domainLabel}</span>
        </div>
        {onInterpret && <InterpretButton section={buildIPSEDomainSection(domain, chart, mode, isMinor)} onInterpret={onInterpret} />}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>{domain.definition}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {domain.styles.length > 0
          ? domain.styles.map((s, i) => <StyleChip key={s.id} label={s.label} dominant={i === 0} />)
          : <span style={{ fontSize: 12.5, fontFamily: 'var(--font-display)', color: 'var(--fg-muted)', fontStyle: 'italic' }}>No single style stands out yet</span>}
      </div>

      <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, color: 'var(--fg)' }}>{domain.profileStyleLabel}</p>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.65 }}>{domain.synthesis}</p>

      {!isEssence && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-dim)' }}>
              Capacity: <span style={{ color: capacityColor(domain.capacity.level) }}>{CAPACITY_LABEL[domain.capacity.level]}</span>
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-dim)' }}>
              Expression: <span style={{ color: 'var(--fg-muted)' }}>{EASE_LABEL[domain.expression.ease]}</span>
            </span>
          </div>

          <div className="am-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
            <div>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>Strengths</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
                {domain.strengths.map(s => <li key={s.text}>{s.text}</li>)}
              </ul>
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
                {isMinor ? 'Support Cues' : 'Potential Shadows'}
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
                {domain.shadows.map(s => <li key={s.trait}>{s.trait}</li>)}
              </ul>
            </div>
          </div>

          {domain.compensators.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>Compensating Factors</p>
              {domain.compensators.map(c => (
                <p key={c.narrative} style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>{c.narrative}</p>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>Works Best When</p>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
              {domain.optimalConditions.map(c => <li key={c}>{c}</li>)}
            </ul>
          </div>

          {domain.crossDomainNote && (
            <p style={{
              margin: '0 0 10px', padding: '10px 12px', fontSize: 12, color: 'var(--fg-muted)',
              fontFamily: 'var(--font-sans)', lineHeight: 1.6,
              background: 'var(--bg)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)',
            }}>
              {domain.crossDomainNote}
            </p>
          )}
        </>
      )}

      <Disclosure label="Why? Astrological basis">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {domain.basis.keyPlanets.map(p => (
            <div key={p.planet} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--fg-muted)' }}>
              <span>{cap(p.planet)} in {cap(p.sign)}, house {p.house}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>{p.dignity} · {p.sect.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
        {domain.basis.aspects.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>Aspects</p>
            {domain.basis.aspects.map(a => <p key={a} style={{ margin: '0 0 2px', fontSize: 11.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{a}</p>)}
          </div>
        )}
        {domain.basis.vedic && <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>Vedic: {domain.basis.vedic}</p>}
        {domain.basis.vibrational && <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>Vibrational: {domain.basis.vibrational}</p>}
        {domain.basis.humanDesign && <p style={{ margin: 0, fontSize: 11.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>Human Design: {domain.basis.humanDesign}</p>}
        {isAdvanced && (
          <p style={{ margin: '10px 0 0', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
            Confidence: {domain.capacity.confidence}
          </p>
        )}
      </Disclosure>
    </div>
  );
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

type Props = {
  chart: NatalChart;
  mode: InterpretMode;
  hdChart?: HdChart | null;
  onInterpret?: (section: InterpretSection) => void;
};

export default function IPSEPanel({ chart, mode, hdChart, onInterpret }: Props) {
  const profile = useMemo(
    () => generateIPSEProfile(chart, { mode, humanDesign: hdChart ?? null }),
    [chart, mode, hdChart],
  );

  if (profile.domains.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
        {profile.profileSummary}
      </p>
    );
  }

  return (
    <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}>
          {profile.intro}
        </p>
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
        {profile.crossDomainSynthesis.map(note => (
          <p key={note} style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>{note}</p>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {profile.domains.map(domain => (
          <DomainCard key={domain.domain} domain={domain} chart={chart} mode={mode} isMinor={profile.isMinor} onInterpret={onInterpret} />
        ))}
      </div>
    </section>
  );
}
