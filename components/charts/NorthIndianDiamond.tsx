import type { NatalChart } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import { PLANET_GLYPH, SIGN_GLYPH } from './glyphs';

// Fixed geometry constants
const W = 460, H = 460;
const T  = { x: 230, y: 0   };
const TR = { x: 460, y: 0   };
const R  = { x: 460, y: 230 };
const BR = { x: 460, y: 460 };
const B  = { x: 230, y: 460 };
const BL = { x: 0,   y: 460 };
const L  = { x: 0,   y: 230 };
const TL = { x: 0,   y: 0   };
const C  = { x: 230, y: 230 };
const M_TL = { x: 115, y: 115 };
const M_TR = { x: 345, y: 115 };
const M_BR = { x: 345, y: 345 };
const M_BL = { x: 115, y: 345 };

function pts(...points: { x: number; y: number }[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function centroid(...points: { x: number; y: number }[]): { x: number; y: number } {
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

// House polygon vertices and label centroid, indexed 1–12
const HOUSE_DEFS: { poly: { x: number; y: number }[]; label: { x: number; y: number } }[] = [
  { poly: [T, M_TR, C, M_TL], label: centroid(T, M_TR, C, M_TL) },   // H1
  { poly: [T, TR, M_TR],       label: centroid(T, TR, M_TR) },         // H2
  { poly: [TR, R, M_TR],       label: centroid(TR, R, M_TR) },         // H3
  { poly: [R, M_BR, C, M_TR],  label: centroid(R, M_BR, C, M_TR) },   // H4
  { poly: [R, BR, M_BR],       label: centroid(R, BR, M_BR) },         // H5
  { poly: [BR, B, M_BR],       label: centroid(BR, B, M_BR) },         // H6
  { poly: [B, M_BL, C, M_BR],  label: centroid(B, M_BL, C, M_BR) },   // H7
  { poly: [B, BL, M_BL],       label: centroid(B, BL, M_BL) },         // H8
  { poly: [BL, L, M_BL],       label: centroid(BL, L, M_BL) },         // H9
  { poly: [L, M_TL, C, M_BL],  label: centroid(L, M_TL, C, M_BL) },   // H10
  { poly: [L, TL, M_TL],       label: centroid(L, TL, M_TL) },         // H11
  { poly: [TL, T, M_TL],       label: centroid(TL, T, M_TL) },         // H12
];

// Sign label positions (slightly inset from each house's corner region)
const SIGN_POS: { x: number; y: number }[] = [
  { x: 230, y: 48  },  // H1 – top center
  { x: 405, y: 55  },  // H2
  { x: 405, y: 210 },  // H3
  { x: 370, y: 230 },  // H4 – right center
  { x: 405, y: 310 },  // H5
  { x: 405, y: 415 },  // H6
  { x: 230, y: 410 },  // H7 – bottom center
  { x: 55,  y: 415 },  // H8
  { x: 55,  y: 310 },  // H9
  { x: 88,  y: 230 },  // H10 – left center
  { x: 55,  y: 210 },  // H11
  { x: 55,  y: 55  },  // H12
];

export default function NorthIndianDiamond({ chart }: { chart: NatalChart }) {
  const { bodies } = chart.vedic;
  // 0-based index of ascendant sign in SIGNS array
  const ascIdx = SIGNS.indexOf(chart.vedic.ascendantRashi);

  // Map house number (1-based) → 0-based sign index
  function houseSignIdx(house: number): number {
    return (ascIdx + house - 1) % 12;
  }

  // Group bodies by Vedic house
  const houseContents: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) houseContents[h] = [];

  const SHOW_BODIES = [
    'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
    'trueNode', 'southNode', 'chiron', 'blackMoonLilith',
  ] as const;

  for (const id of SHOW_BODIES) {
    const body = bodies[id as keyof typeof bodies];
    if (body) houseContents[body.house].push(id);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-label="North Indian Vedic chart diamond"
      style={{ fontFamily: 'var(--font-sans)', width: '100%', height: 'auto', maxWidth: W, display: 'block' }}
    >
      <title>Vedic Natal Chart — {chart.input.name || 'Chart'}</title>

      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill="var(--bg-chart)" />

      {/* House polygons */}
      {HOUSE_DEFS.map(({ poly }, i) => (
        <polygon
          key={i}
          points={pts(...poly)}
          fill="none"
          stroke="var(--line-chart)"
          strokeWidth="1"
        />
      ))}

      {/* Outer border diagonals */}
      <line x1={TL.x} y1={TL.y} x2={BR.x} y2={BR.y} stroke="var(--line-chart)" strokeWidth="1" />
      <line x1={TR.x} y1={TR.y} x2={BL.x} y2={BL.y} stroke="var(--line-chart)" strokeWidth="1" />

      {/* Sign glyphs */}
      {Array.from({ length: 12 }, (_, i) => {
        const signId = SIGNS[houseSignIdx(i + 1)];
        const pos = SIGN_POS[i];
        return (
          <text
            key={i}
            x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="17" fill="var(--fg-glyph)"
          >
            {SIGN_GLYPH[signId]}
          </text>
        );
      })}

      {/* House number labels */}
      {HOUSE_DEFS.map(({ label }, i) => (
        <text
          key={i}
          x={label.x} y={label.y}
          textAnchor="middle" dominantBaseline="central"
          fontSize="12" fill="var(--fg-dim)"
          fontFamily="var(--font-mono)"
        >
          {i + 1}
        </text>
      ))}

      {/* ASC marker */}
      <text
        x={HOUSE_DEFS[0].label.x} y={HOUSE_DEFS[0].label.y - 12}
        textAnchor="middle" dominantBaseline="central"
        fontSize="10" fill="var(--accent)" fontFamily="var(--font-mono)"
      >
        AC
      </text>

      {/* Planet glyphs per house */}
      {Array.from({ length: 12 }, (_, i) => {
        const house = i + 1;
        const ids = houseContents[house];
        if (!ids.length) return null;
        const { label } = HOUSE_DEFS[i];
        // Stack planets below the house number
        return ids.map((id, j) => {
          const body = bodies[id as keyof typeof bodies];
          const glyph = PLANET_GLYPH[id as keyof typeof PLANET_GLYPH] ?? id.slice(0, 2);
          const isRetro = body?.isRetrograde ?? false;
          const ox = (j - (ids.length - 1) / 2) * 17;
          const oy = 18;
          return (
            <g key={id}>
              <title>{id} {body?.sign} {body?.signDegree?.toFixed(1)}°{isRetro ? ' ℞' : ''}</title>
              <text
                x={label.x + ox} y={label.y + oy}
                textAnchor="middle" dominantBaseline="central"
                fontSize="15"
                fill={isRetro ? 'var(--retro)' : 'var(--fg-glyph)'}
              >
                {glyph}
              </text>
              {isRetro && (
                <text
                  x={label.x + ox + 8} y={label.y + oy - 5}
                  fontSize="7" fill="var(--retro)"
                >
                  ℞
                </text>
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}
