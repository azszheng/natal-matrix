'use client';

import { useState, useEffect, useRef } from 'react';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';

const MODE_LABEL: Record<InterpretMode, string> = {
  essence:    'Essence',
  deepdive:   'Deep Dive',
  astrologer: 'Astrologer Mode',
};

type Props = {
  chart: NatalChart;
  section: InterpretSection;
  onClose: () => void;
  mode?: InterpretMode;
  cachedText?: string;
  onCached?: (text: string) => void;
};

function SimpleMarkdown({ text }: { text: string }) {
  return (
    <div style={{ lineHeight: 1.75, color: 'var(--fg)', fontSize: 13 }}>
      {text.split('\n\n').filter(Boolean).map((para, i) => (
        <p key={i} style={{ margin: '0 0 14px' }}>
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </div>
  );
}

export default function InterpretationPanel({ chart, section, onClose, mode = 'deepdive', cachedText, onCached }: Props) {
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(true);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cachedText) {
      setText(cachedText);
      setLoading(false);
      setDone(true);
      return;
    }

    setText('');
    setLoading(true);
    setDone(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chart, section, mode }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setError(err.error ?? `HTTP ${res.status}`);
          setLoading(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        setLoading(false);

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
              setDone(true);
              onCached?.(accumulated);
              return;
            }
            try {
              const { token, error: e } = JSON.parse(payload);
              if (e) { setError(e); return; }
              if (token) { accumulated += token; setText(prev => prev + token); }
            } catch { /* ignore malformed line */ }
          }
        }
        setDone(true);
        onCached?.(accumulated);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [chart, section]);

  function handleStop() {
    abortRef.current?.abort();
    setDone(true);
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(55vw, 500px)',
        background: 'var(--bg-raised)',
        borderLeft: '1px solid var(--line)',
        zIndex: 70,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {section.frontTitle ? (
              <>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--fg)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                  {section.frontTitle}
                </h3>
                {section.anchor && (
                  <p style={{ margin: '0 0 2px', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', letterSpacing: '0.03em', lineHeight: 1.4 }}>
                    {section.anchor}
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 3px', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  AI Interpretation
                </p>
                <h3 style={{ margin: 0, fontSize: 13, color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
                  {section.label}
                </h3>
              </>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 18, padding: '2px 6px', flexShrink: 0 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && (
            <p style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Thinking…
            </p>
          )}
          {error && (
            <p style={{ color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Error: {error}
            </p>
          )}
          {text && (() => {
            const newline = text.indexOf('\n');
            const hasTitle = newline > 0;
            const title = hasTitle ? text.slice(0, newline).trim() : '';
            const body   = hasTitle ? text.slice(newline + 1).trimStart() : text;
            return (
              <>
                {title && (
                  <p style={{
                    margin: '0 0 16px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                  }}>
                    {title}
                  </p>
                )}
                {body && <SimpleMarkdown text={body} />}
              </>
            );
          })()}
          {!done && !loading && !error && (
            <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--accent)', opacity: 0.7, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!done && !error && (
            <button
              onClick={handleStop}
              style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', background: 'none', border: '1px solid var(--line)', borderRadius: 2, padding: '4px 12px', cursor: 'pointer' }}
            >
              Stop
            </button>
          )}
          {text && (
            <button
              onClick={handleCopy}
              style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', background: 'none', border: '1px solid var(--line)', borderRadius: 2, padding: '4px 12px', cursor: 'pointer' }}
            >
              Copy
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            {MODE_LABEL[mode]} · {done ? `${text.split(/\s+/).filter(Boolean).length} words` : loading ? '…' : 'streaming'}
          </span>
        </div>
      </div>
    </>
  );
}
