import type { NatalChart, BodyId } from '@/lib/astro/types';
import { toDMS, signLabel, ASPECT_COLOR } from './tableUtils';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildBodySection, type InterpretSection } from '@/lib/ai/prompts';
import Tooltip from '@/components/ui/Tooltip';

const PLANET_ROWS: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'trueNode', 'southNode', 'chiron', 'blackMoonLilith',
  'partOfFortune', 'asc', 'mc',
];

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N. Node', southNode: 'S. Node', chiron: 'Chiron',
  blackMoonLilith: 'Lilith', partOfFortune: 'Fortune', asc: 'Ascendant', mc: 'Midheaven',
};

const DIGNITY_COLOR: Record<string, string> = {
  domicile:   'var(--aspect-harmonious)',
  exaltation: 'var(--aspect-harmonious)',
  detriment:  'var(--aspect-dynamic)',
  fall:       'var(--aspect-dynamic)',
  peregrine:  'var(--fg-dim)',
};

export default function PlanetTable({ chart, onInterpret }: { chart: NatalChart; onInterpret?: (s: InterpretSection) => void }) {
  const { bodies, dignities } = chart.western;
  void ASPECT_COLOR;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}><Tooltip text="The celestial body. Includes the 10 planets (Sun & Moon are 'luminaries'), plus special points: North Node (karmic destiny axis), Chiron (wounds & healing), Black Moon Lilith (the shadow/instinctual self), Part of Fortune (prosperity), Ascendant (how the world sees you), and Midheaven (career & public role).">Body</Tooltip></th>
            <th style={th}><Tooltip text="The zodiac sign the planet occupies at birth. The sign acts like a lens that colors how the planet's energy expresses itself. Mars in Aries is bold and aggressive; Mars in Libra is indirect and diplomatic. The sign describes the 'how' — the style and manner.">Sign</Tooltip></th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}><Tooltip text="The exact position within the sign, in degrees° minutes' seconds″. Each sign spans 30°. 0° is the very start of the sign; 29° is the final degree. 'R' indicates retrograde — the planet appeared to move backward in the sky from Earth's perspective, turning its energy more inward and reflective.">Position</Tooltip></th>
            <th style={th}><Tooltip text="Which of the 12 houses (life areas) this planet occupies. 1st: identity/body, 2nd: money/values, 3rd: communication/siblings, 4th: home/roots, 5th: creativity/romance, 6th: health/daily work, 7th: partnerships/marriage, 8th: transformation/death/shared resources, 9th: philosophy/travel/higher learning, 10th: career/public status, 11th: friends/community, 12th: unconscious/spirituality/hidden matters." align="center">House</Tooltip></th>
            <th style={th}><Tooltip text="Whether the planet is in a sign that supports or challenges its natural energy. Domicile: the planet rules this sign — most comfortable and powerful. Exaltation: honored guest — very effective. Detriment: opposite of domicile — uncomfortable, energy expressed awkwardly. Fall: opposite of exaltation — most challenged. Peregrine: no special relationship — neutral expression." align="right">Dignity</Tooltip></th>
            {onInterpret && <th style={{ ...th, width: 72, textAlign: 'center' }}><Tooltip align="right" text="Click the circle on any row to generate an AI interpretation for that placement.">Read</Tooltip></th>}
          </tr>
        </thead>
        <tbody>
          {PLANET_ROWS.map(id => {
            const body = bodies[id];
            if (!body) return null;
            const dig = dignities[id];
            const isRetro = body.isRetrograde;
            const glyph = PLANET_GLYPH[id] ?? '';
            const name = BODY_NAME[id] ?? id;
            const digLabel = dig?.label;
            return (
              <tr key={id} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                {/* Body */}
                <td style={{ ...td, color: isRetro ? 'var(--retro)' : 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {isRetro ? '℞ ' : ''}{glyph} {name}
                </td>
                {/* Sign */}
                <td style={td}>{signLabel(body.sign)}</td>
                {/* Position */}
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {toDMS(body.signDegree)}{isRetro ? ' R' : ''}
                </td>
                {/* House */}
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textAlign: 'center' }}>
                  {body.house}
                </td>
                {/* Dignity */}
                <td style={{ ...td, color: digLabel ? DIGNITY_COLOR[digLabel] : 'var(--fg-dim)' }}>
                  {digLabel ? digLabel.charAt(0).toUpperCase() + digLabel.slice(1) : '—'}
                </td>
                {onInterpret && (
                  <td style={{ ...td, textAlign: 'center' }}>
                    <InterpretButton section={buildBodySection(id, chart)} onInterpret={onInterpret} />
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
