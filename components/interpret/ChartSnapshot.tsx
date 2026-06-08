'use client';

import { useState, useEffect, useRef } from 'react';
import type { NatalChart } from '@/lib/astro/types';

type Props = {
  chart: NatalChart;
};

export default function ChartSnapshot({ chart }: Props) {
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(true);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Re-fetch whenever the chart changes (new birth data submitted)
  useEffect(() => {
    setText('');
    setLoading(true);
    setDone(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch('/api/snapshot', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ chart }),
          signal:  controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setError(err.error ?? `HTTP ${res.status}`);
          setLoading(false);
          return;
        }

        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
            if (payload === '[DONE]') { setDone(true); return; }
            try {
              const { token, error: e } = JSON.parse(payload);
              if (e) { setError(e); return; }
              if (token) setText(prev => prev + token);
            } catch { /* ignore malformed line */ }
          }
        }
        setDone(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [chart]);

  // Parse title from first line; split drop cap from body
  const newlineIdx = text.indexOf('\n');
  const hasTitle   = newlineIdx > 0;
  const title      = hasTitle ? text.slice(0, newlineIdx).trim() : '';
  const body       = hasTitle ? text.slice(newlineIdx + 1).trimStart() : text;
  const dropChar   = body.charAt(0);
  const bodyRest   = body.slice(1);

  return (
    <section style={{ padding: '8px 2px 8px', position: 'relative' }}>
      {/* "Free reading" tag — top right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <span style={{
          fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)',
          border: '1px solid var(--line)', padding: '3px 9px',
        }}>Free reading</span>
      </div>

      {/* Loading state */}
      {loading && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
          Reading your chart…
        </p>
      )}

      {/* Error state */}
      {error && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)' }}>
          {error}
        </p>
      )}

      {/* Title (display serif h2) */}
      {title && (
        <h2 style={{
          margin: '0 0 18px',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 38,
          lineHeight: 1.12,
          color: 'var(--fg)',
          letterSpacing: '0.005em',
          maxWidth: 680,
        }}>
          {title}
        </h2>
      )}

      {/* Body with gold drop cap on first character */}
      {body && (
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.85, color: 'var(--fg)', maxWidth: 680, opacity: 0.95 }}>
          {dropChar && (
            <span style={{
              float: 'left',
              fontFamily: 'var(--font-display)',
              fontSize: 62,
              lineHeight: 0.78,
              fontWeight: 500,
              color: 'var(--fg-glyph)',
              padding: '6px 12px 0 0',
            }}>
              {dropChar}
            </span>
          )}
          {bodyRest}
          {/* Blinking cursor while streaming */}
          {!done && !error && (
            <span style={{
              display: 'inline-block', width: 7, height: 14,
              background: 'var(--accent)', opacity: 0.6,
              verticalAlign: 'middle', marginLeft: 2,
              animation: 'blink 1s step-end infinite',
            }} />
          )}
        </p>
      )}

      {/* Post-stream footer */}
      {done && !error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--line)', clear: 'both' }}>
          <span style={{ color: 'var(--fg-glyph)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>↓</span>
          <p style={{ margin: 0, fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', letterSpacing: '0.02em' }}>
            Choose a reading style to explore the full depth of your chart
          </p>
        </div>
      )}
    </section>
  );
}
