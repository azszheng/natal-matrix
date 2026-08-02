import type { NatalChart, BodyId } from '@/lib/astro/types';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { toDMS, signLabel } from './tableUtils';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildVedicBodySection, type InterpretSection } from '@/lib/ai/prompts';
import Tooltip from '@/components/ui/Tooltip';

const VEDIC_ROWS: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'trueNode', 'southNode',
];

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', trueNode: 'Rahu', southNode: 'Ketu',
};

const LORD_GLYPH: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', trueNode: '☊', southNode: '☋',
};

export default function VedicRashiTable({ chart, onInterpret }: { chart: NatalChart; onInterpret?: (s: InterpretSection) => void }) {
  const { bodies } = chart.vedic;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}><Tooltip text="The Vedic grahas (planets). Rahu (North Node) and Ketu (South Node) are shadow bodies — the points where the Moon's orbit crosses the ecliptic. They are not physical planets but carry immense karmic weight. Rahu represents worldly desire and the path forward; Ketu represents past-life mastery, spiritual gifts, and renunciation.">Planet</Tooltip></th>
            <th style={th}><Tooltip text="The Vedic zodiac sign (rashi). Because the sidereal zodiac is tied to fixed stars rather than seasons, it runs about 23° behind the tropical (Western) zodiac. This means most people will have one or more planets in a different sign than their Western chart shows.">Rashi</Tooltip></th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}><Tooltip text="The exact position within the rashi in degrees° minutes' seconds″. Each rashi spans 30°.">Degree</Tooltip></th>
            <th style={th}><Tooltip text="One of 27 lunar mansions — arguably the most important layer of Vedic astrology. The entire 360° zodiac is divided into 27 nakshatras of 13°20' each. Every nakshatra has a ruling deity, a ruling planet, a symbol, and a distinct quality. The Moon's nakshatra at birth determines which Dasha period you start life in. Nakshatras are also central to Vedic compatibility analysis.">Nakshatra</Tooltip></th>
            <th style={{ ...th, textAlign: 'center' }}><Tooltip align="center" text="Each nakshatra is divided into 4 padas (quarters) of 3°20' each. The padas cycle through the 12 signs in order — pada 1 has Aries energy, pada 2 has Taurus energy, etc. The pada adds a sign-based sub-quality to the nakshatra. Padas also form the basis of the Navamsha divisional chart, which is crucial for marriage and the soul's dharma.">Pada</Tooltip></th>
            <th style={th}><Tooltip text="The ruling planet of this nakshatra. The nakshatra lord governs the Vimshottari Dasha period associated with this nakshatra — so if your Moon is in Rohini (nakshatra lord: Moon), your life begins in a Moon Mahadasha. The lord's strength in your chart affects that entire Dasha period.">Lord</Tooltip></th>
            <th style={{ ...th, textAlign: 'center' }}><Tooltip align="right" text="Whole Sign house (bhava). In Vedic astrology, each house corresponds to one complete sign. The sign of your Ascendant is the 1st house, the next sign is always the 2nd house, and so on — regardless of the degree. This makes house placements clean and sign-based, unlike Western Placidus houses which vary in size.">House</Tooltip></th>
            {onInterpret && <th style={{ ...th, width: 72, textAlign: 'center' }}><Tooltip align="right" text="Click the circle on any row to generate an AI interpretation for that Vedic placement.">Read</Tooltip></th>}
          </tr>
        </thead>
        <tbody>
          {VEDIC_ROWS.map(id => {
            const body = bodies[id];
            if (!body) return null;

            const glyph   = PLANET_GLYPH[id] ?? '';
            const name    = BODY_NAME[id] ?? id;
            const isRetro = body.isRetrograde;
            const lordGlyph = LORD_GLYPH[body.nakshatraLord] ?? '';
            const lordName  = BODY_NAME[body.nakshatraLord] ?? body.nakshatraLord;
            const nakName   = body.nakshatra.charAt(0).toUpperCase() + body.nakshatra.slice(1).replace(/([A-Z])/g, ' $1').trim();

            return (
              <tr key={id} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                <td style={{ ...td, color: isRetro ? 'var(--retro)' : 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {isRetro ? '℞ ' : ''}{glyph} {name}
                </td>
                <td style={td}>{signLabel(body.sign)}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {toDMS(body.signDegree)}{isRetro ? ' R' : ''}
                </td>
                <td style={{ ...td, color: 'var(--fg-muted)' }}>{nakName}</td>
                <td style={{ ...td, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  {body.nakshatraPada}
                </td>
                <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {lordGlyph} {lordName}
                </td>
                <td style={{ ...td, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  {body.house}
                </td>
                {onInterpret && (
                  <td style={{ ...td, textAlign: 'center' }}>
                    <InterpretButton section={buildVedicBodySection(id, chart)} onInterpret={onInterpret} />
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

const th: React.CSSProperties = { padding: '9px 12px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' };
const td: React.CSSProperties = { padding: '9px 12px', verticalAlign: 'middle' };
