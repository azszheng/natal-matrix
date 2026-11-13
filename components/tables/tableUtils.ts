import type { SignId, BodyId } from '@/lib/astro/types';
import { SIGN_GLYPH, PLANET_GLYPH } from '@/components/charts/glyphs';

export function toDMS(deg: number): string {
  // Round the total seconds once, up front, so a seconds value that rounds
  // to 60 carries into minutes (and a minutes value of 60 into degrees)
  // instead of printing e.g. 15°59'60" for 15.999997°.
  const totalSeconds = Math.round(deg * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

export function signLabel(sign: SignId): string {
  return SIGN_GLYPH[sign] + ' ' + sign.charAt(0).toUpperCase() + sign.slice(1);
}

export function bodyLabel(id: BodyId, isRetrograde = false): string {
  const glyph = PLANET_GLYPH[id] ?? id.slice(0, 2);
  const name  = id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1').trim();
  return (isRetrograde ? '℞ ' : '') + glyph + ' ' + name;
}

export const SIGN_RULER: Record<SignId, { trad: string; modern?: string }> = {
  aries:       { trad: 'Mars' },
  taurus:      { trad: 'Venus' },
  gemini:      { trad: 'Mercury' },
  cancer:      { trad: 'Moon' },
  leo:         { trad: 'Sun' },
  virgo:       { trad: 'Mercury' },
  libra:       { trad: 'Venus' },
  scorpio:     { trad: 'Mars',    modern: 'Pluto' },
  sagittarius: { trad: 'Jupiter' },
  capricorn:   { trad: 'Saturn' },
  aquarius:    { trad: 'Saturn',  modern: 'Uranus' },
  pisces:      { trad: 'Jupiter', modern: 'Neptune' },
};

export const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: '☌',
  opposition:  '☍',
  trine:       '△',
  square:      '□',
  sextile:     '⚹',
  quincunx:    '⚻',
};

export const ASPECT_COLOR: Record<string, string> = {
  trine:       'var(--aspect-harmonious)',
  sextile:     'var(--aspect-harmonious)',
  conjunction: 'var(--aspect-neutral)',
  opposition:  'var(--aspect-dynamic)',
  square:      'var(--aspect-dynamic)',
  quincunx:    'var(--aspect-minor)',
};

export function InterpretBtn() {
  return null; // placeholder until Phase 5
}
