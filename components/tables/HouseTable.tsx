import type { NatalChart } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import { toDMS, signLabel, SIGN_RULER } from './tableUtils';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildHouseSection, type InterpretSection } from '@/lib/ai/prompts';
import Tooltip from '@/components/ui/Tooltip';

export default function HouseTable({ chart, onInterpret }: { chart: NatalChart; onInterpret?: (s: InterpretSection) => void }) {
  const { cusps } = chart.western.houses;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}><Tooltip text="The house number (1–12). Angular houses (1st, 4th, 7th, 10th — shown bold) are the chart's power angles and the most prominent areas of life. Succedent houses (2nd, 5th, 8th, 11th) are stable and resource-building. Cadent houses (3rd, 6th, 9th, 12th) are transitional and mental. Houses are calculated from your exact birth time — even a few minutes changes them.">House</Tooltip></th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}><Tooltip text="The absolute degree (0°–360°) of the zodiac where this house begins, measured from 0° Aries. This is the 'cusp' of the house — the exact point where its influence begins.">Cusp</Tooltip></th>
            <th style={th}><Tooltip text="The zodiac sign at the start of this house. The sign colors all themes of the house. A 7th house (partnerships) in Scorpio brings intensity and deep bonding; in Gemini it brings variety and communication. Any planets inside the house also add their energy to these themes.">Sign on Cusp</Tooltip></th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}><Tooltip text="The degree within the sign where this house cusp falls (0°–30°). This is the same position expressed relative to the sign, rather than the full zodiac circle.">Degree</Tooltip></th>
            <th style={th}><Tooltip text="The traditional planetary ruler of the sign on this cusp. This planet 'governs' the house — its sign, house placement, and condition in your chart deeply affect how the themes of this house manifest in your life. For example, if your 7th house is in Libra, Venus rules it — the state of your Venus reflects your relationship life.">Trad. Ruler</Tooltip></th>
            <th style={th}><Tooltip text="The modern ruler, assigned after the discovery of the outer planets (Uranus 1781, Neptune 1846, Pluto 1930). Most signs share traditional and modern rulers. Three exceptions: Aquarius (modern ruler: Uranus), Pisces (modern ruler: Neptune), Scorpio (modern ruler: Pluto)." align="right">Modern Ruler</Tooltip></th>
            {onInterpret && <th style={{ ...th, width: 72, textAlign: 'center' }}><Tooltip align="right" text="Click the circle on any row to generate an AI interpretation for that placement.">Read</Tooltip></th>}
          </tr>
        </thead>
        <tbody>
          {cusps.map((lon, i) => {
            const normalized = ((lon % 360) + 360) % 360;
            const signIdx    = Math.floor(normalized / 30);
            const sign       = SIGNS[signIdx];
            const signDeg    = normalized % 30;
            const ruler      = SIGN_RULER[sign];
            const houseNum   = i + 1;
            const isAngular  = [1, 4, 7, 10].includes(houseNum);

            return (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--line)',
                  color: 'var(--fg)',
                  fontWeight: isAngular ? 600 : 400,
                }}
              >
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {houseNum}
                  {houseNum === 1 ? ' (AC)' : houseNum === 4 ? ' (IC)' : houseNum === 7 ? ' (DC)' : houseNum === 10 ? ' (MC)' : ''}
                </td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  {toDMS(normalized)}
                </td>
                <td style={td}>{signLabel(sign)}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {toDMS(signDeg)}
                </td>
                <td style={{ ...td, color: 'var(--fg-muted)' }}>{ruler.trad}</td>
                <td style={{ ...td, color: 'var(--fg-dim)' }}>{ruler.modern ?? '—'}</td>
                {onInterpret && (
                  <td style={{ ...td, textAlign: 'center' }}>
                    <InterpretButton section={buildHouseSection(houseNum, chart)} onInterpret={onInterpret} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: '6px 10px', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' };
const td: React.CSSProperties = { padding: '5px 10px', verticalAlign: 'middle' };
