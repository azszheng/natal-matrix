import type { NatalChart, NakshatraId } from './types';

export type DashaLord = 'ketu' | 'venus' | 'sun' | 'moon' | 'mars' | 'rahu' | 'jupiter' | 'saturn' | 'mercury';

export type DashaPeriod = {
  lord: DashaLord;
  startISO: string;
  endISO: string;
  durationYears: number;
};

export type DashaResult = {
  mahadasha: DashaPeriod;
  antardasha: DashaPeriod;
  timeline: DashaPeriod[];  // full mahadasha sequence (birth → 120y)
};

const DASHA_CYCLE: DashaLord[] = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
];

const DASHA_YEARS: Record<DashaLord, number> = {
  ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7,
  rahu: 18, jupiter: 16, saturn: 19, mercury: 17,
};

// Explicitly maps each nakshatra to Rahu vs Ketu (avoids trueNode ambiguity)
const NAKSHATRA_LORD: Record<NakshatraId, DashaLord> = {
  ashwini:           'ketu',    bharani:           'venus',  krittika:          'sun',
  rohini:            'moon',    mrigashira:        'mars',   ardra:             'rahu',
  punarvasu:         'jupiter', pushya:            'saturn', ashlesha:          'mercury',
  magha:             'ketu',    purvaPhalguni:     'venus',  uttaraPhalguni:    'sun',
  hasta:             'moon',    chitra:            'mars',   swati:             'rahu',
  vishakha:          'jupiter', anuradha:          'saturn', jyeshtha:          'mercury',
  mula:              'ketu',    purvaAshadha:      'venus',  uttaraAshadha:     'sun',
  shravana:          'moon',    dhanishta:         'mars',   shatabhisha:       'rahu',
  purvaBhadrapada:   'jupiter', uttaraBhadrapada:  'saturn', revati:            'mercury',
};

const NAKSHATRA_SPAN = 360 / 27; // 13.333...°

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeVimshottariDasha(natal: NatalChart, whenUTC: string): DashaResult {
  const moonVedic = natal.vedic.bodies.moon;
  if (!moonVedic) throw new Error('Moon not found in Vedic chart');

  // Fraction of natal Moon's nakshatra already traversed at birth
  const moonSiderealLon  = moonVedic.longitudeSidereal;
  const withinNakshatra  = ((moonSiderealLon % NAKSHATRA_SPAN) + NAKSHATRA_SPAN) % NAKSHATRA_SPAN;
  const fractionTraversed = withinNakshatra / NAKSHATRA_SPAN;

  const startLord    = NAKSHATRA_LORD[moonVedic.nakshatra];
  const startIdx     = DASHA_CYCLE.indexOf(startLord);
  const birthDate    = new Date(natal.input.utc);

  // Build full mahadasha timeline
  const timeline: DashaPeriod[] = [];
  let cursor = new Date(birthDate);

  // First mahadasha: partial (remaining fraction)
  const firstYears = DASHA_YEARS[startLord] * (1 - fractionTraversed);
  const firstEnd   = addYears(cursor, firstYears);
  timeline.push({ lord: startLord, startISO: toISO(cursor), endISO: toISO(firstEnd), durationYears: firstYears });
  cursor = firstEnd;

  // Remaining full mahadashas (cycle from successor of startLord)
  for (let i = 1; i <= 9; i++) {
    const lord   = DASHA_CYCLE[(startIdx + i) % 9];
    const years  = DASHA_YEARS[lord];
    const endDate = addYears(cursor, years);
    timeline.push({ lord, startISO: toISO(cursor), endISO: toISO(endDate), durationYears: years });
    cursor = endDate;
    if (i === 9) {
      // Wrap: repeat cycle if needed (120 year cycle covers ~120 years total)
      // In practice we stop after one full cycle (9 more lords)
    }
  }

  // Find current mahadasha
  const targetDate = new Date(whenUTC);
  const maha = timeline.find(p => new Date(p.startISO) <= targetDate && targetDate < new Date(p.endISO))
    ?? timeline[timeline.length - 1];

  // Build antardasha sequence within the current mahadasha.
  //
  // Classical Vimshottari proportions are always taken against the
  // mahadasha lord's FULL nominal years -- never the (possibly partial)
  // balance actually tracked in `maha.durationYears`. The birth mahadasha in
  // particular is a partial *remainder* of a longer natural period that
  // began before birth; its antardasha sequence still starts at the
  // mahadasha lord itself and runs through the full cycle, but the portion
  // that elapsed before birth must be skipped so the visible antardashas
  // line up with the actual (partial) mahadasha window.
  const mahaLordIdx         = DASHA_CYCLE.indexOf(maha.lord);
  const mahaFullYears       = DASHA_YEARS[maha.lord];
  const elapsedBeforeWindow = mahaFullYears - maha.durationYears; // 0 for every full (non-birth) mahadasha

  const antardashas: DashaPeriod[] = [];
  let antarCursor = new Date(maha.startISO);
  let cumulative  = 0; // years elapsed in the natural, full-length antardasha sequence

  for (let i = 0; i < 9; i++) {
    const subLord      = DASHA_CYCLE[(mahaLordIdx + i) % 9];
    const fullSubYears = (DASHA_YEARS[subLord] * mahaFullYears) / 120;
    const segStart     = cumulative;
    const segEnd       = cumulative + fullSubYears;
    cumulative = segEnd;

    if (segEnd <= elapsedBeforeWindow + 1e-9) continue; // fully elapsed before this mahadasha's tracked window began

    const visibleYears = segEnd - Math.max(segStart, elapsedBeforeWindow);
    const subEnd        = addYears(antarCursor, visibleYears);
    antardashas.push({ lord: subLord, startISO: toISO(antarCursor), endISO: toISO(subEnd), durationYears: visibleYears });
    antarCursor = subEnd;
  }

  const antar = antardashas.find(p => new Date(p.startISO) <= targetDate && targetDate < new Date(p.endISO))
    ?? antardashas[antardashas.length - 1];

  return { mahadasha: maha, antardasha: antar, timeline };
}
