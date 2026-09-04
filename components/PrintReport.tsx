// Print-only report layouts used by the "Export PDF" buttons in Dashboard.tsx.
// These re-render the wheel + full table set (without interactive AI-interpret
// affordances, since no onInterpret handler is passed) inside a light,
// ink-friendly palette that overrides the app's dark theme via scoped CSS vars.
// The container is hidden on screen and only shown via the @media print rules
// in app/globals.css when the user triggers window.print().

import WesternWheel from '@/components/charts/WesternWheel';
import NorthIndianDiamond from '@/components/charts/NorthIndianDiamond';
import PlanetTable from '@/components/tables/PlanetTable';
import HouseTable from '@/components/tables/HouseTable';
import AspectTable from '@/components/tables/AspectTable';
import DignityTable from '@/components/tables/DignityTable';
import VedicRashiTable from '@/components/tables/VedicRashiTable';
import type { NatalChart } from '@/lib/astro/types';

const SIGN_NAME: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

function ReportHeader({ chart, title, note }: { chart: NatalChart; title: string; note: string }) {
  const { input } = chart;
  const location = [input.city, input.region, input.country].filter(Boolean).join(', ');
  return (
    <div style={{ marginBottom: 22, paddingBottom: 14, borderBottom: '2px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, color: 'var(--fg)' }}>
          {input.name ? `${input.name} — ` : ''}{title}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--fg-dim)', whiteSpace: 'nowrap' }}>
          {note}
        </span>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
        Born {input.date} at {input.time}{location ? ` — ${location}` : ''}
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
        {SIGN_NAME[chart.western.bodies.sun.sign]} Sun · {SIGN_NAME[chart.western.bodies.moon.sign]} Moon · {SIGN_NAME[chart.western.bodies.asc.sign]} Rising
      </p>
      <p style={{ margin: '10px 0 0', fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
        Generated {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

function ReportSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
      color: 'var(--fg-muted)', margin: '24px 0 10px', paddingBottom: 6, borderBottom: '1px solid var(--line)',
      fontWeight: 400,
    }}>
      {children}
    </h2>
  );
}

export function PrintReportTropical({ chart }: { chart: NatalChart }) {
  return (
    <div className="am-print-report">
      <ReportHeader chart={chart} title="Tropical Birth Chart" note="Western · Tropical · Placidus" />

      <div className="am-print-block am-wheel" style={{ maxWidth: 380, margin: '0 auto 18px' }}>
        <WesternWheel chart={chart} />
      </div>

      <ReportSectionTitle>Planets</ReportSectionTitle>
      <div className="am-print-block"><PlanetTable chart={chart} /></div>

      <ReportSectionTitle>Houses</ReportSectionTitle>
      <div className="am-print-block"><HouseTable chart={chart} /></div>

      <ReportSectionTitle>Aspects</ReportSectionTitle>
      <div className="am-print-block"><AspectTable chart={chart} /></div>

      <ReportSectionTitle>Dignities</ReportSectionTitle>
      <div className="am-print-block"><DignityTable chart={chart} /></div>
    </div>
  );
}

export function PrintReportVedic({ chart }: { chart: NatalChart }) {
  return (
    <div className="am-print-report">
      <ReportHeader
        chart={chart}
        title="Vedic Birth Chart"
        note={`Sidereal · Lahiri ayanamsa ${chart.vedic.ayanamsa.toFixed(4)}° · Whole Sign`}
      />

      <div className="am-print-block" style={{ maxWidth: 360, margin: '0 auto 18px' }}>
        <NorthIndianDiamond chart={chart} />
      </div>

      <ReportSectionTitle>Rashi &amp; Nakshatra Placements</ReportSectionTitle>
      <div className="am-print-block"><VedicRashiTable chart={chart} /></div>
    </div>
  );
}
