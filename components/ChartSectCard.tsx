'use client';

import type { NatalChart } from '@/lib/astro/types';
import type { BodyId } from '@/lib/astro/types';
import Tooltip from '@/components/ui/Tooltip';
import Disclosure from '@/components/ui/Disclosure';

const BODY_NAME: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', jupiter: 'Jupiter', saturn: 'Saturn', venus: 'Venus', mars: 'Mars',
};

const DAY_TEAM: BodyId[]   = ['sun', 'jupiter', 'saturn'];
const NIGHT_TEAM: BodyId[] = ['moon', 'venus', 'mars'];

function TeamRow({ label, team, active }: { label: string; team: BodyId[]; active: boolean }) {
  return (
    <div>
      <p style={{
        margin: '0 0 4px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)', color: active ? 'var(--fg-glyph)' : 'var(--fg-dim)',
        fontWeight: active ? 700 : 400,
      }}>
        {label} {active && '· this chart'}
      </p>
      <p style={{
        margin: 0, fontSize: 13, fontFamily: 'var(--font-mono)',
        color: active ? 'var(--fg)' : 'var(--fg-dim)', fontWeight: active ? 600 : 400,
      }}>
        {team.map(id => BODY_NAME[id]).join(' · ')}
      </p>
    </div>
  );
}

export default function ChartSectCard({ chart }: { chart: NatalChart }) {
  const sect = chart.western.sect;
  const isDay = sect.chartSect === 'day';

  const explainerSentence = isDay
    ? "Born during the day, this chart is organized around the Sun as the sect light. Jupiter and Saturn are more naturally aligned with the chart's diurnal orientation, while Mars tends to carry greater friction or require more deliberate regulation."
    : "Born at night, this chart is organized around the Moon as the sect light. Venus and Mars are more naturally aligned with the chart's nocturnal orientation, while Saturn tends to require more conscious integration.";

  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--bg-raised)', padding: '20px 22px', marginTop: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 38, color: 'var(--fg-glyph)', lineHeight: 1 }}>
          {isDay ? '☉' : '☽'}
        </span>
        <div>
          <p style={{
            margin: 0, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Chart Sect
            <Tooltip
              width={300}
              text="Traditional Western astrology divides charts into day and night sects based on whether the Sun was above or below the horizon at birth. Sect does not make planets simply good or bad — it describes which planetary functions are more naturally aligned with the chart's overall condition."
            >
              <span style={{ cursor: 'help', color: 'var(--fg-dim)', fontSize: 11 }}>ⓘ</span>
            </Tooltip>
          </p>
          <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: 'var(--fg)', lineHeight: 1.05 }}>
            {isDay ? 'Day Chart' : 'Night Chart'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, marginTop: 18, flexWrap: 'wrap' }}>
        <TeamRow label="Day" team={DAY_TEAM} active={isDay} />
        <TeamRow label="Night" team={NIGHT_TEAM} active={!isDay} />
      </div>

      <p style={{ margin: '16px 0 0', fontSize: 13, lineHeight: 1.65, color: 'var(--fg-muted)', maxWidth: 640 }}>
        {explainerSentence}
      </p>

      <div style={{ marginTop: 12 }}>
        <Disclosure label="Learn more about sect">
          <p style={{ margin: 0 }}>
            Traditional Western astrology distinguishes between day and night charts based on whether the Sun was above or below the horizon at birth. This distinction is known as sect.
          </p>
          <p style={{ margin: '10px 0 0' }}>
            In a day chart, the Sun is the sect light, Jupiter is the benefic of sect, and Saturn is the malefic of sect. In a night chart, the Moon is the sect light, Venus is the benefic of sect, and Mars is the malefic of sect.
          </p>
          <p style={{ margin: '10px 0 0' }}>
            Sect does not make a planet simply good or bad. Instead, it describes how naturally a planet&apos;s function fits the overall conditions of the chart. A planet can be very strong by sign while still carrying greater friction because it is contrary to sect, or it can lack essential dignity while being comparatively easier to regulate because it belongs to the sect in favor.
          </p>
          <p style={{ margin: '10px 0 0' }}>
            NatalMatrix interprets sect together with planetary dignity, house placement, aspects, dispositor condition, angularity, and other chart factors rather than using it as a standalone score.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
