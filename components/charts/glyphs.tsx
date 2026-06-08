import type { BodyId, SignId } from '@/lib/astro/types';

// U+FE0E after each glyph forces monochrome text presentation (not color emoji)
const VS = '︎';

export const PLANET_GLYPH: Record<BodyId, string> = {
  sun:             '☉' + VS,
  moon:            '☽' + VS,
  mercury:         '☿' + VS,
  venus:           '♀' + VS,
  mars:            '♂' + VS,
  jupiter:         '♃' + VS,
  saturn:          '♄' + VS,
  uranus:          '♅' + VS,
  neptune:         '♆' + VS,
  pluto:           '♇' + VS,
  trueNode:        '☊' + VS,
  southNode:       '☋' + VS,
  chiron:          '⚷' + VS,
  blackMoonLilith: '⚸' + VS,
  ceres:           '⚳' + VS,
  pallas:          '⚴' + VS,
  juno:            '⚵' + VS,
  vesta:           '⚶' + VS,
  partOfFortune:   '⊗' + VS,
  vertex:          'Vx',
  asc:             'AC',
  mc:              'MC',
};

export const SIGN_GLYPH: Record<SignId, string> = {
  aries:       '♈' + VS,
  taurus:      '♉' + VS,
  gemini:      '♊' + VS,
  cancer:      '♋' + VS,
  leo:         '♌' + VS,
  virgo:       '♍' + VS,
  libra:       '♎' + VS,
  scorpio:     '♏' + VS,
  sagittarius: '♐' + VS,
  capricorn:   '♑' + VS,
  aquarius:    '♒' + VS,
  pisces:      '♓' + VS,
};

export const SIGN_ABBR: Record<SignId, string> = {
  aries: 'Ar', taurus: 'Ta', gemini: 'Ge', cancer: 'Cn',
  leo: 'Le', virgo: 'Vi', libra: 'Li', scorpio: 'Sc',
  sagittarius: 'Sg', capricorn: 'Cp', aquarius: 'Aq', pisces: 'Pi',
};

// Bodies shown on the wheel (skip asc/mc — drawn separately as angle lines)
export const WHEEL_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode',
  'chiron', 'blackMoonLilith', 'partOfFortune',
];
