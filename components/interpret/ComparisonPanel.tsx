'use client';

import { useState, useEffect, useRef } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import type { ComparisonRatings } from '@/lib/ai/interpretationInput';

type StreamState = {
  text: string;
  loading: boolean;
  done: boolean;
  error: string | null;
};

const INIT: StreamState = { text: '', loading: true, done: false, error: null };

const RATING_FIELDS: { key: keyof Omit<ComparisonRatings, 'overallPreference'>; label: string }[] = [
  { key: 'astrologyAccuracy',   label: 'Astrology accuracy'    },
  { key: 'specificity',         label: 'Specificity'           },
  { key: 'houseTopicAnchoring', label: 'House / topic anchoring' },
  { key: 'userRelatability',    label: 'User relatability'     },
  { key: 'emotionalResonance',  label: 'Emotional resonance'   },
  { key: 'clarity',             label: 'Clarity'               },
];

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n\n').filter(Boolean);
  return (
    <div style={{ lineHeight: 1.75, color: 'var(--fg)', fontSize: 12.5 }}>
      {lines.map((para, i) => (
        <p key={i} style={{ margin: '0 0 12px' }}>
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </div>
  );
}

function StreamPane({
  label, state,
}: { label: string; state: StreamState }) {
  const { text, loading, done, error } = state;
  const newline = text.indexOf('\n');
  const hasTitle = newline > 0;
  const title = hasTitle ? text.slice(0, newline).trim() : '';
  const body  = hasTitle ? text.slice(newline + 1).trimStart() : text;

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        padding: '12px 18px 10px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)' }}>
          {done ? `${text.split(/\s+/).filter(Boolean).length} words` : loading ? '…' : 'streaming'}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {loading && !text && (
          <p style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Thinking…</p>
        )}
        {error && (
          <p style={{ color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Error: {error}</p>
        )}
        {title && (
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>
            {title}
          </p>
        )}
        {body && <SimpleMarkdown text={body} />}
        {!done && !loading && !error && (
          <span style={{ display: 'inline-block', width: 7, height: 13, background: 'var(--accent)', opacity: 0.7, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
        )}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 14,
            color: value !== null && n <= value ? 'var(--fg-glyph)' : 'var(--line)',
            transition: 'color .1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

type Props = {
  chart: NatalChart;
  section: InterpretSection;
  onClose: () => void;
  mode?: InterpretMode;
};

export default function ComparisonPanel({ chart, section, onClose, mode = 'deepdive' }: Props) {
  const [claudeState, setClaudeState] = useState<StreamState>(INIT);
  const [openaiState, setOpenaiState] = useState<StreamState>(INIT);
  const [ratings, setRatings] = useState<ComparisonRatings>({
    astrologyAccuracy: null, specificity: null, houseTopicAnchoring: null,
    userRelatability: null, emotionalResonance: null, clarity: null,
    overallPreference: null,
  });

  const claudeAbort = useRef<AbortController | null>(null);
  const openaiAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    startStream('claude', setClaudeState, claudeAbort);
    startStream('openai', setOpenaiState, openaiAbort);
    return () => {
      claudeAbort.current?.abort();
      openaiAbort.current?.abort();
    };
  }, [chart, section]);

  function startStream(
    provider: 'claude' | 'openai',
    setState: React.Dispatch<React.SetStateAction<StreamState>>,
    abortRef: React.MutableRefObject<AbortController | null>,
  ) {
    setState(INIT);
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chart, section, mode, provider }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setState(s => ({ ...s, loading: false, error: err.error ?? `HTTP ${res.status}` }));
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        setState(s => ({ ...s, loading: false }));

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') {
              setState(s => ({ ...s, done: true }));
              return;
            }
            try {
              const { token, error: e } = JSON.parse(payload);
              if (e) { setState(s => ({ ...s, error: e })); return; }
              if (token) setState(s => ({ ...s, text: s.text + token }));
            } catch { /* ignore malformed line */ }
          }
        }
        setState(s => ({ ...s, done: true }));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState(s => ({ ...s, loading: false, error: (err as Error).message }));
        }
      }
    })();
  }

  function setRating(key: keyof Omit<ComparisonRatings, 'overallPreference'>, val: number) {
    setRatings(r => ({ ...r, [key]: val }));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', inset: '5vh 3vw',
        background: 'var(--bg-raised)',
        border: '1px solid var(--line)',
        zIndex: 70,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              AI Comparison · Admin
            </p>
            <h3 style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
              {section.frontTitle ?? section.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 20, padding: '2px 8px' }}
          >
            ×
          </button>
        </div>

        {/* Two-column stream area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
          <StreamPane label="Claude" state={claudeState} />
          <div style={{ width: 1, background: 'var(--line)', flexShrink: 0 }} />
          <StreamPane label="OpenAI" state={openaiState} />
        </div>

        {/* Rating form */}
        <div style={{ flexShrink: 0, padding: '16px 20px', overflowY: 'auto', maxHeight: '38vh' }}>
          <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
            Rate each dimension (1 = Claude better, 5 = OpenAI better)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px 24px' }}>
            {RATING_FIELDS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)' }}>
                  {label}
                </span>
                <StarRating
                  value={ratings[key]}
                  onChange={(v) => setRating(key, v)}
                />
              </div>
            ))}
          </div>

          {/* Overall preference */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)' }}>
              Overall preference
            </span>
            {(['claude', 'openai'] as const).map(p => (
              <button
                key={p}
                onClick={() => setRatings(r => ({ ...r, overallPreference: p }))}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  padding: '5px 16px', cursor: 'pointer',
                  border: `1px solid ${ratings.overallPreference === p ? 'var(--fg-glyph)' : 'var(--line)'}`,
                  background: ratings.overallPreference === p ? 'var(--fg-glyph)' : 'transparent',
                  color: ratings.overallPreference === p ? 'var(--bg)' : 'var(--fg-dim)',
                  transition: 'background .12s, color .12s',
                }}
              >
                {p}
              </button>
            ))}
            {ratings.overallPreference && (
              <button
                onClick={() => setRatings(r => ({ ...r, overallPreference: null }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              >
                clear
              </button>
            )}
          </div>

          {/* Rating summary (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ marginTop: 14, fontSize: 9, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', opacity: 0.5, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(ratings, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}
