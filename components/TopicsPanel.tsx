'use client';

import { useMemo } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection } from '@/lib/ai/prompts';
import { computeTopics, topicToSection, type ScoredTopic } from '@/lib/ai/topics';

// ── Relevance badge styles ────────────────────────────────────────────────────

const BADGE: Record<string, React.CSSProperties> = {
  'Major chart theme': {
    color: 'var(--fg-glyph)',
    border: '1px solid var(--fg-glyph)',
    background: 'rgba(200,160,80,0.08)',
  },
  'Strong influence': {
    color: 'var(--fg-muted)',
    border: '1px solid var(--fg-muted)',
    background: 'transparent',
  },
  'Moderate influence': {
    color: 'var(--fg-dim)',
    border: '1px solid var(--line)',
    background: 'transparent',
  },
  'Subtle influence': {
    color: 'var(--fg-dim)',
    border: '1px solid var(--line)',
    background: 'transparent',
    opacity: 0.7,
  },
  'Not heavily emphasized': {
    color: 'var(--fg-dim)',
    border: '1px solid var(--line)',
    background: 'transparent',
    opacity: 0.45,
  },
};

// ── Topic card ────────────────────────────────────────────────────────────────

function TopicCard({
  topic, chart, onInterpret,
}: {
  topic: ScoredTopic;
  chart: NatalChart;
  onInterpret: (s: InterpretSection) => void;
}) {
  const isMajor  = topic.relevanceLabel === 'Major chart theme';
  const isStrong = topic.relevanceLabel === 'Strong influence';
  const dimmed   = topic.relevanceLabel === 'Subtle influence' || topic.relevanceLabel === 'Not heavily emphasized';

  return (
    <div
      style={{
        border: `1px solid ${isMajor ? 'var(--fg-glyph)' : 'var(--line)'}`,
        background: isMajor ? 'rgba(200,160,80,0.04)' : 'transparent',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        opacity: dimmed ? 0.65 : 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: isMajor ? 14 : 13,
          color: isMajor ? 'var(--fg)' : 'var(--fg-muted)',
          lineHeight: 1.2,
        }}
      >
        {topic.title}
      </span>

      <button
        onClick={() => onInterpret(topicToSection(topic, chart))}
        style={{
          flexShrink: 0,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: isMajor ? 'var(--fg-glyph)' : 'var(--fg-dim)',
          background: 'none',
          border: `1px solid ${isMajor ? 'var(--fg-glyph)' : 'var(--line)'}`,
          borderRadius: 1, padding: '4px 10px', cursor: 'pointer',
        }}
      >
        Interpret →
      </button>
    </div>
  );
}

// ── Topic group ───────────────────────────────────────────────────────────────

function TopicGroup({
  label, topics, chart, onInterpret, border = true,
}: {
  label: string;
  topics: ScoredTopic[];
  chart: NatalChart;
  onInterpret: (s: InterpretSection) => void;
  border?: boolean;
}) {
  if (topics.length === 0) return null;
  return (
    <div style={{ padding: '16px 18px', borderBottom: border ? '1px solid var(--line)' : 'none' }}>
      <p style={{
        margin: '0 0 12px',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'var(--fg-dim)',
      }}>
        {label}
      </p>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {topics.map(t => (
          <TopicCard key={t.id} topic={t} chart={chart} onInterpret={onInterpret} />
        ))}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type Props = {
  chart: NatalChart;
  onInterpret: (section: InterpretSection) => void;
};

export default function TopicsPanel({ chart, onInterpret }: Props) {
  const topics = useMemo(() => computeTopics(chart), [chart]);

  const major    = topics.filter(t => t.relevanceLabel === 'Major chart theme');
  const strong   = topics.filter(t => t.relevanceLabel === 'Strong influence');
  const moderate = topics.filter(t => t.relevanceLabel === 'Moderate influence');
  const rest     = topics.filter(t =>
    t.relevanceLabel === 'Subtle influence' || t.relevanceLabel === 'Not heavily emphasized'
  );

  return (
    <section style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', overflow: 'hidden' }}>
      {/* Explainer */}
      <div style={{
        padding: '14px 20px 13px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 620 }}>
          Each topic is scored from the actual chart — houses, rulers, aspects, dignity.
          Click <strong style={{ color: 'var(--fg)' }}>Interpret →</strong> on any topic
          for an AI reading grounded only in the indicators present in your chart.
        </p>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
          color: 'var(--fg-dim)', whiteSpace: 'nowrap',
        }}>
          14 topics · ranked by emphasis
        </span>
      </div>

      <TopicGroup label="Major Chart Themes"  topics={major}    chart={chart} onInterpret={onInterpret} />
      <TopicGroup label="Strong Influences"   topics={strong}   chart={chart} onInterpret={onInterpret} />
      <TopicGroup label="Moderate Influences" topics={moderate} chart={chart} onInterpret={onInterpret} />
      <TopicGroup label="Background Patterns" topics={rest}     chart={chart} onInterpret={onInterpret} border={false} />
    </section>
  );
}
