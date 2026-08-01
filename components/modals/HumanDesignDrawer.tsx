'use client';

import type { HdChart } from '@/lib/astro/humandesign-constants';
import HumanDesignPanel from '@/components/HumanDesignPanel';

type Props = {
  hdChart: HdChart | null;
  loading: boolean;
  onClose: () => void;
};

export default function HumanDesignDrawer({ hdChart, loading, onClose }: Props) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(90vw, 800px)',
        background: 'var(--bg)',
        borderLeft: '1px solid var(--line)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
          position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Human Design
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
              Bodygraph · Type · Authority · Gates · Channels
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--line)',
              color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)',
              fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '6px 14px', cursor: 'pointer', borderRadius: 1, flexShrink: 0,
            }}
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {loading && (
            <div style={{ padding: '32px 24px', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em' }}>
              Calculating Human Design chart…
            </div>
          )}
          {!loading && hdChart && <HumanDesignPanel chart={hdChart} />}
          {!loading && !hdChart && (
            <div style={{ padding: '32px 24px', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Human Design chart unavailable.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
