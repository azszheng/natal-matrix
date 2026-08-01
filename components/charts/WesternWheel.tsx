'use client';

import { useState } from 'react';
import type { NatalChart, AspectKind, BodyId, SignId } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import {
  CX, CY, R_OUTER, R_SIGN_IN, R_HOUSE_IN, R_PLANET, R_CORE,
  lonToAngle, polarToXY, midAngle,
} from './wheel-geometry';
import { PLANET_GLYPH, SIGN_GLYPH, WHEEL_BODIES } from './glyphs';
import type { InterpretSection } from '@/lib/ai/prompts';
import { buildBodySection, buildHouseSection } from '@/lib/ai/prompts';
import SignInfoPanel from './SignInfoPanel';
import HouseInfoPanel from './HouseInfoPanel';

function signSectorPath(signIdx: number, ascLon: number): string {
  const startLon = signIdx * 30;
  const startA = lonToAngle(startLon, ascLon);
  const endA   = lonToAngle(startLon + 30, ascLon);
  const sO = polarToXY(R_OUTER,   startA);
  const eO = polarToXY(R_OUTER,   endA);
  const sI = polarToXY(R_SIGN_IN, startA);
  const eI = polarToXY(R_SIGN_IN, endA);
  return [
    `M ${sO.x.toFixed(2)} ${sO.y.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 0 0 ${eO.x.toFixed(2)} ${eO.y.toFixed(2)}`,
    `L ${eI.x.toFixed(2)} ${eI.y.toFixed(2)}`,
    `A ${R_SIGN_IN} ${R_SIGN_IN} 0 0 1 ${sI.x.toFixed(2)} ${sI.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function houseSectorPath(startLon: number, endLon: number, ascLon: number): string {
  const startA = lonToAngle(startLon, ascLon);
  const endA   = lonToAngle(endLon,   ascLon);
  const sO = polarToXY(R_SIGN_IN, startA);
  const eO = polarToXY(R_SIGN_IN, endA);
  const sI = polarToXY(R_CORE,    startA);
  const eI = polarToXY(R_CORE,    endA);
  // CCW angular span in SVG space (since increasing longitude → decreasing SVG angle)
  const ccwSpan = ((startA - endA) + 360) % 360;
  const laf = ccwSpan > 180 ? 1 : 0;
  return [
    `M ${sO.x.toFixed(2)} ${sO.y.toFixed(2)}`,
    `A ${R_SIGN_IN} ${R_SIGN_IN} 0 ${laf} 0 ${eO.x.toFixed(2)} ${eO.y.toFixed(2)}`,
    `L ${eI.x.toFixed(2)} ${eI.y.toFixed(2)}`,
    `A ${R_CORE} ${R_CORE} 0 ${laf} 1 ${sI.x.toFixed(2)} ${sI.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

const ASPECT_COLOR: Record<AspectKind, string> = {
  trine:       'var(--aspect-harmonious)',
  sextile:     'var(--aspect-harmonious)',
  conjunction: 'var(--aspect-neutral)',
  opposition:  'var(--aspect-dynamic)',
  square:      'var(--aspect-dynamic)',
  quincunx:    'var(--aspect-minor)',
};

const MIN_SEP = 6;

type PlacedBody = { id: string; angle: number; r: number; lon: number };

function placePlanets(bodies: NatalChart['western']['bodies'], ascLon: number): PlacedBody[] {
  const placed = WHEEL_BODIES.filter(id => bodies[id]).map(id => ({
    id,
    angle: lonToAngle(bodies[id].longitude, ascLon),
    r: R_PLANET,
    lon: bodies[id].longitude,
  }));

  placed.sort((a, b) => a.angle - b.angle);
  const rings = [R_PLANET, R_PLANET - 14, R_PLANET - 28];
  const ringIdx: number[] = new Array(placed.length).fill(0);

  for (let i = 0; i < placed.length; i++) {
    const prev = placed[(i - 1 + placed.length) % placed.length];
    const angDiff = ((placed[i].angle - prev.angle + 360) % 360);
    if (angDiff < MIN_SEP && i > 0) {
      ringIdx[i] = (ringIdx[i - 1] + 1) % rings.length;
    }
    placed[i].r = rings[ringIdx[i]];
  }

  return placed;
}

type Props = {
  chart: NatalChart;
  onInterpret?: (s: InterpretSection) => void;
};

export default function WesternWheel({ chart, onInterpret }: Props) {
  const [hoveredId,     setHoveredId]     = useState<string | null>(null);
  const [hoveredSign,   setHoveredSign]   = useState<SignId | null>(null);
  const [selectedSign,  setSelectedSign]  = useState<SignId | null>(null);
  const [hoveredHouse,  setHoveredHouse]  = useState<number | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  const asc = chart.western.houses.asc;
  const { bodies, houses, aspects } = chart.western;

  const placed = placePlanets(bodies, asc);
  const placedMap = Object.fromEntries(placed.map(p => [p.id, p]));

  const signRing = SIGNS.map((sign, i) => {
    const startLon = i * 30;
    const endLon   = startLon + 30;
    const midLon   = startLon + 15;
    const startA   = lonToAngle(startLon, asc);
    const midA     = lonToAngle(midLon, asc);
    const startOuter = polarToXY(R_OUTER,   startA);
    const startInner = polarToXY(R_SIGN_IN, startA);
    const midGlyph   = polarToXY((R_OUTER + R_SIGN_IN) / 2, midA);
    void endLon;
    return { sign, startOuter, startInner, midGlyph, midA };
  });

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const lon = i * 5;
    const a   = lonToAngle(lon, asc);
    const isMajor = i % 2 === 0;
    const rInner  = isMajor ? R_OUTER - 9 : R_OUTER - 5;
    return { a, rInner };
  });

  const cusps = houses.cusps.map((lon, i) => {
    const a = lonToAngle(lon, asc);
    const outer = polarToXY(R_SIGN_IN,  a);
    const inner = polarToXY(R_HOUSE_IN, a);
    const nextLon = houses.cusps[(i + 1) % 12];
    const midA = midAngle(a, lonToAngle(nextLon, asc));
    const numPt  = polarToXY((R_SIGN_IN + R_HOUSE_IN) / 2, midA);
    return { outer, inner, num: i + 1, numPt, midA };
  });

  const ascA    = lonToAngle(asc, asc);
  const descA   = (ascA + 180) % 360;
  const mcA     = lonToAngle(chart.western.houses.mc, asc);
  const icA     = (mcA + 180) % 360;
  const ascOut  = polarToXY(R_OUTER, ascA);
  const descOut = polarToXY(R_OUTER, descA);
  const mcOut   = polarToXY(R_OUTER, mcA);
  const icOut   = polarToXY(R_OUTER, icA);

  const canInterpret = !!onInterpret;

  return (
    <>
    {selectedSign && (
      <SignInfoPanel signId={selectedSign} onClose={() => setSelectedSign(null)} />
    )}
    {selectedHouse && (
      <HouseInfoPanel houseNum={selectedHouse} onClose={() => setSelectedHouse(null)} />
    )}
    <svg
      viewBox="0 0 460 460"
      width="460"
      height="460"
      aria-label="Western natal chart wheel"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <title>Western Natal Chart — {chart.input.name || 'Chart'}</title>

      <circle cx={CX} cy={CY} r={R_OUTER} fill="var(--bg-chart)" />

      {/* Aspect lines */}
      {aspects.map((asp, i) => {
        const pa = placedMap[asp.a];
        const pb = placedMap[asp.b];
        if (!pa || !pb) return null;
        const ptA = polarToXY(R_CORE, lonToAngle(bodies[asp.a].longitude, asc));
        const ptB = polarToXY(R_CORE, lonToAngle(bodies[asp.b].longitude, asc));
        return (
          <line key={i}
            x1={ptA.x} y1={ptA.y} x2={ptB.x} y2={ptB.y}
            stroke={ASPECT_COLOR[asp.kind]} strokeWidth="0.6" strokeOpacity="0.45"
          >
            <title>{asp.a} {asp.kind} {asp.b} (orb {asp.orb.toFixed(2)}°)</title>
          </line>
        );
      })}

      {/* Ring borders */}
      <circle cx={CX} cy={CY} r={R_OUTER}   fill="none" stroke="var(--line-chart)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_SIGN_IN}  fill="none" stroke="var(--line-chart)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_HOUSE_IN} fill="none" stroke="var(--line-chart)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_CORE}     fill="none" stroke="var(--line-chart)" strokeWidth="0.5" strokeOpacity="0.3" />

      {/* Degree ticks */}
      {ticks.map((t, i) => {
        const outer = polarToXY(R_OUTER,  t.a);
        const inner = polarToXY(t.rInner, t.a);
        return <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
          stroke="var(--fg-dim)" strokeWidth="0.5" />;
      })}

      {/* Sign sectors — hover highlight + click */}
      {SIGNS.map((sign, i) => (
        <path
          key={`sector-${sign}`}
          d={signSectorPath(i, asc)}
          fill="var(--fg-glyph)"
          fillOpacity={hoveredSign === sign ? 0.12 : 0}
          stroke="none"
          style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
          onMouseEnter={() => setHoveredSign(sign)}
          onMouseLeave={() => setHoveredSign(null)}
          onClick={() => setSelectedSign(sign)}
        />
      ))}

      {/* Sign boundary spokes + glyphs */}
      {signRing.map(({ sign, startOuter, startInner, midGlyph }) => (
        <g
          key={sign}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredSign(sign as SignId)}
          onMouseLeave={() => setHoveredSign(null)}
          onClick={() => setSelectedSign(sign as SignId)}
        >
          <line x1={startOuter.x} y1={startOuter.y} x2={startInner.x} y2={startInner.y}
            stroke="var(--line-chart)" strokeWidth="1" />
          <text x={midGlyph.x} y={midGlyph.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="12"
            fill={hoveredSign === sign ? 'var(--accent)' : 'var(--fg-glyph)'}
            style={{ transition: 'fill 0.12s' }}>
            {SIGN_GLYPH[sign]}
          </text>
        </g>
      ))}

      {/* House sector hover highlights */}
      {cusps.map(({ num }) => {
        const startLon = houses.cusps[num - 1];
        const endLon   = houses.cusps[num % 12];
        return (
          <path
            key={`house-sector-${num}`}
            d={houseSectorPath(startLon, endLon, asc)}
            fill="var(--accent)"
            fillOpacity={hoveredHouse === num ? 0.08 : 0}
            stroke="none"
            style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
            onMouseEnter={() => setHoveredHouse(num)}
            onMouseLeave={() => setHoveredHouse(null)}
            onClick={() => setSelectedHouse(num)}
          />
        );
      })}

      {/* House cusp lines + house number labels */}
      {cusps.map(({ outer, inner, num, numPt }) => (
        <g key={num}>
          <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
            stroke="var(--fg-dim)" strokeWidth="0.8" />
          <g
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredHouse(num)}
            onMouseLeave={() => setHoveredHouse(null)}
            onClick={() => setSelectedHouse(num)}
          >
            <circle cx={numPt.x} cy={numPt.y} r={8} fill="transparent" />
            <circle cx={numPt.x} cy={numPt.y} r={8}
              fill="var(--accent)" fillOpacity={hoveredHouse === num ? 0.18 : 0}
              stroke="var(--accent)" strokeWidth="0.8"
              strokeOpacity={hoveredHouse === num ? 0.6 : 0}
            />
            <text x={numPt.x} y={numPt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="9" fill={hoveredHouse === num ? 'var(--accent)' : 'var(--fg-muted)'}
              fontFamily="var(--font-mono)"
              style={{ transition: 'fill 0.12s' }}>
              {num}
            </text>
          </g>
        </g>
      ))}

      {/* ASC–DESC and MC–IC axes */}
      <line x1={ascOut.x} y1={ascOut.y} x2={descOut.x} y2={descOut.y}
        stroke="var(--accent)" strokeWidth="1.2" />
      <line x1={mcOut.x} y1={mcOut.y} x2={icOut.x} y2={icOut.y}
        stroke="var(--fg-muted)" strokeWidth="0.8" strokeDasharray="3 2" />

      {/* Clickable planet glyphs */}
      {placed.map(({ id, angle, r }) => {
        const body = bodies[id as keyof typeof bodies];
        if (!body) return null;
        const pt    = polarToXY(r, angle);
        const glyph = PLANET_GLYPH[id as keyof typeof PLANET_GLYPH];
        const isRetro = body.isRetrograde;
        const isHovered = hoveredId === id;

        return (
          <g key={id}
            onClick={canInterpret ? () => onInterpret(buildBodySection(id as BodyId, chart)) : undefined}
            onMouseEnter={canInterpret ? () => setHoveredId(id) : undefined}
            onMouseLeave={canInterpret ? () => setHoveredId(null) : undefined}
            style={{ cursor: canInterpret ? 'pointer' : 'default' }}
          >
            <title>{id} {body.sign} {body.signDegree.toFixed(2)}° H{body.house}{isRetro ? ' ℞' : ''}</title>
            {/* Hit area + hover highlight */}
            <circle cx={pt.x} cy={pt.y} r={10} fill="transparent" />
            <circle cx={pt.x} cy={pt.y} r={10}
              fill="var(--accent)" fillOpacity={isHovered ? 0.14 : 0}
              stroke="var(--accent)" strokeWidth="0.8"
              strokeOpacity={isHovered ? 0.5 : 0}
            />
            <text x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11"
              fill={isHovered ? 'var(--accent)' : isRetro ? 'var(--retro)' : 'var(--fg-glyph)'}
            >
              {glyph}
            </text>
            {isRetro && (
              <text x={pt.x + 7} y={pt.y - 5} fontSize="6" fill="var(--retro)">℞</text>
            )}
          </g>
        );
      })}

      {/* ASC / DESC / MC / IC labels */}
      {(() => {
        const ascPt  = polarToXY(R_SIGN_IN - 12, ascA);
        const descPt = polarToXY(R_SIGN_IN - 12, descA);
        const mcPt   = polarToXY(R_SIGN_IN - 12, mcA);
        const icPt   = polarToXY(R_SIGN_IN - 12, icA);
        return (
          <>
            <text x={ascPt.x}  y={ascPt.y}  textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="var(--accent)" fontFamily="var(--font-mono)">AC</text>
            <text x={descPt.x} y={descPt.y} textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="var(--accent)" fontFamily="var(--font-mono)">DC</text>
            <text x={mcPt.x}   y={mcPt.y}   textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="var(--fg-muted)" fontFamily="var(--font-mono)">MC</text>
            <text x={icPt.x}   y={icPt.y}   textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="var(--fg-muted)" fontFamily="var(--font-mono)">IC</text>
          </>
        );
      })()}
    </svg>
    </>
  );
}
