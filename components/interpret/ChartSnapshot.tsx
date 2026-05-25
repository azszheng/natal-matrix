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

  // Parse title from first line
  const newlineIdx = text.indexOf('\n');
  const hasTitle   = newlineIdx > 0;
  const title      = hasTitle ? text.slice(0, newlineIdx).trim() : '';
  const body       = hasTitle ? text.slice(newlineIdx + 1).trimStart() : text;

  return (
    <section style={{
      border:          '1px solid var(--line)',
      borderLeft:      '3px solid var(--accent)',
      borderRadius:    'var(--radius)',
      backgroundColor: 'var(--bg-raised)',
      padding:         '18px 22px 20px',
    }}>
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <p style={{
          margin:         0,
          fontSize:       10,
          textTransform:  'uppercase',
          letterSpacing:  '0.08em',
          color:          'var(--accent)',
          fontFamily:     'var(--font-mono)',
          fontWeight:     600,
        }}>
          Your Chart at a Glance
        </p>
        <span style={{ fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
          Free
        </span>
      </div>

      {/* Subtitle */}
      <p style={{
        margin:     '0 0 16px',
        fontSize:   11,
        color:      'var(--fg-dim)',
        fontFamily: 'var(--font-sans, sans-serif)',
        lineHeight: 1.5,
      }}>
        A short snapshot of your dominant chart patterns — unlock the full reading to explore the deeper layers.
      </p>

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

      {/* Content */}
      {(title || body) && (
        <div>
          {title && (
            <p style={{
              margin:        '0 0 10px',
              fontSize:      16,
              fontWeight:    600,
              color:         'var(--fg)',
              fontFamily:    'var(--font-sans, sans-serif)',
              letterSpacing: '-0.01em',
              lineHeight:    1.3,
            }}>
              {title}
            </p>
          )}
          {body && (
            <p style={{
              margin:     0,
              fontSize:   13,
              color:      'var(--fg)',
              lineHeight: 1.75,
              fontFamily: 'var(--font-sans, sans-serif)',
            }}>
              {body}
              {/* Blinking cursor while streaming */}
              {!done && !error && (
                <span style={{
                  display:        'inline-block',
                  width:          7,
                  height:         13,
                  background:     'var(--accent)',
                  opacity:        0.6,
                  verticalAlign:  'middle',
                  marginLeft:     2,
                  animation:      'blink 1s step-end infinite',
                }} />
              )}
            </p>
          )}
        </div>
      )}

      {/* Post-stream unlock nudge */}
      {done && !error && (
        <p style={{
          margin:     '14px 0 0',
          fontSize:   11,
          color:      'var(--fg-dim)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.02em',
        }}>
          ↓ Select a reading style below to explore the full depth of your chart
        </p>
      )}
    </section>
  );
}
