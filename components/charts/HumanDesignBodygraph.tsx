'use client';

import type {
  CenterId, Channel, HdChart,
} from '@/lib/astro/humandesign-constants';
import { CENTER_GATES, CHANNELS, CENTER_LABEL, GATE_CENTER } from '@/lib/astro/humandesign-constants';

// ── Center positions (cx, cy) in a 320×520 viewBox ───────────────────────────
const C: Record<CenterId, { cx: number; cy: number; w: number; h: number }> = {
  head:        { cx: 160, cy: 32,  w: 64,  h: 36 },
  ajna:        { cx: 160, cy: 98,  w: 64,  h: 36 },
  throat:      { cx: 160, cy: 178, w: 120, h: 36 },
  heart:       { cx: 88,  cy: 260, w: 64,  h: 36 },
  g:           { cx: 232, cy: 260, w: 64,  h: 36 },
  spleen:      { cx: 40,  cy: 350, w: 64,  h: 36 },
  solarPlexus: { cx: 280, cy: 350, w: 64,  h: 36 },
  sacral:      { cx: 160, cy: 415, w: 120, h: 36 },
  root:        { cx: 160, cy: 482, w: 120, h: 36 },
};

// Center-pair edge connection points for drawing channel lines
type Point = [number, number];

function edgePoint(center: CenterId, toward: CenterId): Point {
  const { cx, cy, w, h } = C[center];
  const { cx: tx, cy: ty } = C[toward];

  const dx = tx - cx;
  const dy = ty - cy;

  // Pick the closest edge in the direction of the target
  const hw = w / 2;
  const hh = h / 2;

  if (dx === 0) {
    return [cx, dy > 0 ? cy + hh : cy - hh];
  }
  const t = Math.min(Math.abs(hw / dx), Math.abs(hh / dy));
  return [cx + dx * t, cy + dy * t];
}

// All potential center-pair connections that have at least one channel
const CENTER_CONNECTIONS: Array<[CenterId, CenterId]> = (() => {
  const seen = new Set<string>();
  const pairs: Array<[CenterId, CenterId]> = [];
  for (const ch of CHANNELS) {
    const ca = GATE_CENTER.get(ch.a);
    const cb = GATE_CENTER.get(ch.b);
    if (!ca || !cb) continue;
    const key = [ca, cb].sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push([ca, cb]);
    }
  }
  return pairs;
})();

// Group channels by center-pair key
function channelsForPair(ca: CenterId, cb: CenterId): Channel[] {
  return CHANNELS.filter(ch => {
    const ga = GATE_CENTER.get(ch.a);
    const gb = GATE_CENTER.get(ch.b);
    return (ga === ca && gb === cb) || (ga === cb && gb === ca);
  });
}

type Props = {
  chart: HdChart;
};

export default function HumanDesignBodygraph({ chart }: Props) {
  const definedCenterSet = new Set(chart.definedCenters);
  const definedGateSet   = new Set(chart.definedGates);

  // For drawing, each channel pair gets 2 offset lines (one per gate)
  function renderChannelLines() {
    return CENTER_CONNECTIONS.map(([ca, cb]) => {
      const pairChannels = channelsForPair(ca, cb);
      const pA = edgePoint(ca, cb);
      const pB = edgePoint(cb, ca);

      const dx = pB[0] - pA[0];
      const dy = pB[1] - pA[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return null;

      // Perpendicular unit vector for offset
      const px = (-dy / len) * 2.2;
      const py = ( dx / len) * 2.2;

      return pairChannels.map((ch, idx) => {
        const isDefined = definedGateSet.has(ch.a) && definedGateSet.has(ch.b);
        // Alternate offsets: first channel +perp, second -perp, third 0
        const sign = idx === 0 ? 1 : idx === 1 ? -1 : 0;
        const ox = px * sign;
        const oy = py * sign;

        return (
          <line
            key={`${ch.a}-${ch.b}`}
            x1={pA[0] + ox} y1={pA[1] + oy}
            x2={pB[0] + ox} y2={pB[1] + oy}
            stroke={isDefined ? 'var(--fg-glyph)' : 'var(--line-chart)'}
            strokeWidth={isDefined ? 2.5 : 1}
            strokeOpacity={isDefined ? 0.9 : 0.5}
          />
        );
      });
    });
  }

  function renderGateLabels() {
    // For each defined channel, show gate numbers near their center attachment points
    return chart.definedChannels.map(ch => {
      const ca = GATE_CENTER.get(ch.a)!;
      const cb = GATE_CENTER.get(ch.b)!;
      const pA = edgePoint(ca, cb);
      const pB = edgePoint(cb, ca);

      // Push labels slightly inside from the edge point
      const pushIn = 10;
      const dx = pB[0] - pA[0];
      const dy = pB[1] - pA[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      const lAx = pA[0] + (dx / len) * pushIn;
      const lAy = pA[1] + (dy / len) * pushIn;
      const lBx = pB[0] - (dx / len) * pushIn;
      const lBy = pB[1] - (dy / len) * pushIn;

      return [
        <text key={`ga-${ch.a}`} x={lAx} y={lAy} textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fill="var(--fg-glyph)" fontFamily="var(--font-mono)" fontWeight="600">
          {ch.a}
        </text>,
        <text key={`gb-${ch.b}`} x={lBx} y={lBy} textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fill="var(--fg-glyph)" fontFamily="var(--font-mono)" fontWeight="600">
          {ch.b}
        </text>,
      ];
    });
  }

  function renderCenters() {
    return (Object.entries(C) as [CenterId, typeof C[CenterId]][]).map(([id, { cx, cy, w, h }]) => {
      const defined  = definedCenterSet.has(id);
      const gates    = CENTER_GATES[id];
      const hasGates = gates.some(g => definedGateSet.has(g));

      return (
        <g key={id}>
          <rect
            x={cx - w / 2} y={cy - h / 2} width={w} height={h}
            rx={3} ry={3}
            fill={defined ? 'var(--fg-glyph)' : 'var(--bg-raised)'}
            fillOpacity={defined ? 0.22 : 0.9}
            stroke={defined ? 'var(--fg-glyph)' : hasGates ? 'var(--fg-dim)' : 'var(--line-chart)'}
            strokeWidth={defined ? 1.5 : 1}
          />
          <text
            x={cx} y={cy - 5}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.08em"
            fill={defined ? 'var(--fg-glyph)' : 'var(--fg-dim)'}
            fontWeight={defined ? '700' : '400'}
          >
            {CENTER_LABEL[id].toUpperCase()}
          </text>
          {/* Active gates inside center */}
          <text
            x={cx} y={cy + 7}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8"
            fontFamily="var(--font-mono)"
            fill={defined ? 'var(--fg-glyph)' : 'var(--fg-dim)'}
            opacity={0.75}
          >
            {gates.filter(g => definedGateSet.has(g)).join(' · ')}
          </text>
        </g>
      );
    });
  }

  return (
    <svg
      viewBox="0 0 320 520"
      style={{ width: '100%', maxWidth: 340, height: 'auto' }}
      aria-label="Human Design Bodygraph"
    >
      {/* Channel lines (background) */}
      {renderChannelLines()}
      {/* Gate number labels on defined channels */}
      {renderGateLabels()}
      {/* Centers on top */}
      {renderCenters()}
    </svg>
  );
}
