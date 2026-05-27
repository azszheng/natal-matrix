import type { NatalChart } from '@/lib/astro/types';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { ASPECT_SYMBOL, ASPECT_COLOR } from './tableUtils';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildAspectSection, type InterpretSection } from '@/lib/ai/prompts';
import Tooltip from '@/components/ui/Tooltip';

const BODY_ABBR: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mer', venus: 'Ven', mars: 'Mar',
  jupiter: 'Jup', saturn: 'Sat', uranus: 'Ura', neptune: 'Nep', pluto: 'Plu',
  trueNode: 'Node', southNode: 'SNode', chiron: 'Chi', blackMoonLilith: 'Lil',
  partOfFortune: 'Frt', asc: 'AC', mc: 'MC',
};

export default function AspectTable({ chart, onInterpret }: { chart: NatalChart; onInterpret?: (s: InterpretSection) => void }) {
  const { aspects } = chart.western;

  const sorted = [...aspects].sort((a, b) => a.orb - b.orb);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}><Tooltip text="The two planets forming the aspect. Aspects are sorted by tightness (orb) — the most exact aspects appear first and carry the strongest influence in the chart. An aspect between the Sun, Moon, or Ascendant is generally more significant than one between two outer planets.">Body A</Tooltip></th>
            <th style={{ ...th, textAlign: 'center' }}><Tooltip align="center" text="The aspect type — the geometric angle between the two planets: ☌ Conjunction (0°): planets merge, amplify each other — powerful, for better or worse. ☍ Opposition (180°): tension between opposing forces, often felt through relationships. △ Trine (120°): natural harmony and flow, gifts that come easily. □ Square (90°): friction and challenge — difficult but drives growth. ✶ Sextile (60°): gentle opportunity, requires some effort. ⚻ Quincunx (150°): adjustment needed between incompatible energies.">Asp</Tooltip></th>
            <th style={th}>Body B</th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}><Tooltip text="How many degrees the aspect deviates from exact. A 0° orb is a perfect aspect. The 'orb of influence' allowed before two planets are no longer considered in aspect varies: typically up to 10° for Sun/Moon aspects, 8° for other major aspects. Tighter orbs = stronger aspects.">Orb</Tooltip></th>
            <th style={{ ...th, textAlign: 'center' }}><Tooltip align="right" text="Applying (A): the planets are still moving toward exact alignment. The aspect is building in strength and considered more powerful and 'live.' Separating (S): the exact moment has passed and the planets are moving apart — the influence is present but fading.">A/S</Tooltip></th>
            {onInterpret && <th style={{ ...th, width: 72, textAlign: 'center' }}><Tooltip align="right" text="Click the circle on any row to generate an AI interpretation for that aspect.">Read</Tooltip></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((asp, i) => {
            const color  = ASPECT_COLOR[asp.kind];
            const symbol = ASPECT_SYMBOL[asp.kind] ?? asp.kind;
            const glyphA = PLANET_GLYPH[asp.a] ?? '';
            const glyphB = PLANET_GLYPH[asp.b] ?? '';
            const nameA  = BODY_ABBR[asp.a]  ?? asp.a;
            const nameB  = BODY_ABBR[asp.b]  ?? asp.b;

            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {glyphA} {nameA}
                </td>
                <td style={{ ...td, textAlign: 'center', color, fontWeight: 600, fontSize: 14 }}>
                  {symbol}
                </td>
                <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {glyphB} {nameB}
                </td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {asp.orb.toFixed(2)}°
                </td>
                <td style={{ ...td, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  {asp.applying ? 'A' : 'S'}
                </td>
                {onInterpret && (
                  <td style={{ ...td, textAlign: 'center' }}>
                    <InterpretButton section={buildAspectSection(asp, chart)} onInterpret={onInterpret} />
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
