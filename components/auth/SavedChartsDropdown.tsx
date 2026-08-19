'use client';

import { useEffect, useState, useRef } from 'react';
import type { NatalChart } from '@/lib/astro/types';

type SavedChart = {
  id: number;
  label: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  chart_data: NatalChart;
};

export default function SavedChartsDropdown() {
  const [charts, setCharts]   = useState<SavedChart[]>([]);
  const [open, setOpen]       = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  async function fetchCharts() {
    const res = await fetch('/api/charts');
    if (!res.ok) return;
    const data: SavedChart[] = await res.json();
    data.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    setCharts(data);
  }

  useEffect(() => { fetchCharts(); }, []);

  useEffect(() => {
    function onSaved(e: Event) {
      const { id } = (e as CustomEvent<{ id: number }>).detail;
      setActiveId(id);
      fetchCharts();
    }
    function onDeleted(e: Event) {
      const { id } = (e as CustomEvent<{ id: number }>).detail;
      setCharts(prev => prev.filter(c => c.id !== id));
      setActiveId(prev => (prev === id ? null : prev));
    }
    window.addEventListener('natal:chart-saved', onSaved);
    window.addEventListener('natal:chart-deleted', onDeleted);
    return () => {
      window.removeEventListener('natal:chart-saved', onSaved);
      window.removeEventListener('natal:chart-deleted', onDeleted);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    function place() {
      const rect = btnRef.current!.getBoundingClientRect();
      const width = Math.min(300, window.innerWidth - 28);
      const left = Math.min(
        Math.max(rect.right - width, 14),
        window.innerWidth - width - 14,
      );
      setPanelPos({ top: rect.bottom + 6, left, width });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  function loadChart(c: SavedChart) {
    window.dispatchEvent(new CustomEvent('natal:load-chart', { detail: c }));
    setActiveId(c.id);
    setOpen(false);
  }

  async function deleteChart(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await fetch('/api/charts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    window.dispatchEvent(new CustomEvent('natal:chart-deleted', { detail: { id } }));
  }

  if (charts.length === 0) return null;

  const btnStyle: React.CSSProperties = {
    fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--fg-dim)', background: 'none',
    border: '1px solid var(--line)', borderRadius: 4, padding: '3px 10px',
    cursor: 'pointer',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={() => setOpen(o => !o)} style={btnStyle}>
        Profiles{' '}
        <span style={{ color: 'var(--accent)' }}>({charts.length})</span>
      </button>

      {open && panelPos && (
        <div style={{
          position: 'fixed', top: panelPos.top, left: panelPos.left, width: panelPos.width,
          background: 'var(--bg-raised)', border: '1px solid var(--line)',
          borderRadius: 6, padding: 6,
          maxHeight: 'min(420px, calc(100vh - 120px))', overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 200,
          display: 'flex', flexDirection: 'column', gap: 3,
        }}>
          <p style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--fg-muted)', margin: '2px 6px 4px',
          }}>
            Saved Profiles
          </p>
          {charts.map(c => (
            <div
              key={c.id}
              onClick={() => loadChart(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 4, cursor: 'pointer',
                background: activeId === c.id ? 'var(--bg)' : 'transparent',
                border: `1px solid ${activeId === c.id ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.birth_location}
                </div>
              </div>
              <button
                onClick={e => deleteChart(e, c.id)}
                title="Delete"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1,
                  padding: '2px 4px', flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
