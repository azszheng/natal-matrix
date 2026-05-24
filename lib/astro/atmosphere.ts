import type { NatalChart } from './types';

export type AtmosphericTheme =
  | 'night-clear'
  | 'night-fullmoon'
  | 'night-clouds'
  | 'night-rain'
  | 'day-golden'
  | 'day-clear'
  | 'day-clouds'
  | 'day-rain';

export type BirthAtmosphere = {
  isDaytime: boolean;
  sunAltDeg: number;
  moonPhase: number;
  weatherCategory: 'clear' | 'cloudy' | 'rain' | 'snow' | 'unknown';
  theme: AtmosphericTheme;
};

// Simplified but accurate solar position (good to ~1°)
function sunAltitudeDeg(lat: number, lon: number, utcMs: number): number {
  const n = utcMs / 86400000 - 10957.5; // days from J2000.0
  const L = (280.46 + 0.9856474 * n) % 360;
  const gRad = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
  const lambdaRad = (L + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad)) * (Math.PI / 180);
  const epsRad = 23.439 * (Math.PI / 180);
  const dec = Math.asin(Math.sin(epsRad) * Math.sin(lambdaRad));
  const GMST = ((280.46061837 + 360.98564736629 * n) % 360 + 360) % 360;
  const LMST = ((GMST + lon) % 360 + 360) % 360;
  const raDeg = Math.atan2(Math.cos(epsRad) * Math.sin(lambdaRad), Math.cos(lambdaRad)) * (180 / Math.PI);
  const HA = ((LMST - raDeg + 360) % 360) * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);
  const sinAlt = Math.sin(latRad) * Math.sin(dec) + Math.cos(latRad) * Math.cos(dec) * Math.cos(HA);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * (180 / Math.PI);
}

type WeatherCat = BirthAtmosphere['weatherCategory'];

// ERA5 reanalysis: global coverage, every point on Earth, 1940-present.
// Requests physical components (precip, cloud_cover, snowfall) which are
// directly available in ERA5 — more reliable than derived weather codes.
async function fetchFromERA5(lat: number, lon: number, dateISO: string, utcHour: number): Promise<WeatherCat> {
  try {
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
      `&start_date=${dateISO}&end_date=${dateISO}` +
      `&hourly=precipitation,snowfall,cloud_cover` +
      `&models=era5_seamless&timezone=UTC`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return 'unknown';
    const data = await res.json() as {
      hourly?: { precipitation?: number[]; snowfall?: number[]; cloud_cover?: number[] };
    };
    const h = data.hourly;
    if (!h) return 'unknown';
    const precip  = h.precipitation?.[utcHour]  ?? -1;
    const snow    = h.snowfall?.[utcHour]        ?? -1;
    const cloud   = h.cloud_cover?.[utcHour]     ?? -1;
    if (precip < 0 && snow < 0 && cloud < 0) return 'unknown';
    if (snow   > 0.01)  return 'snow';
    if (precip > 0.05)  return 'rain';
    if (cloud  > 60)    return 'cloudy';
    return 'clear';
  } catch {
    return 'unknown';
  }
}

// Station-based fallback via WMO weather codes.
async function fetchFromStations(lat: number, lon: number, dateISO: string, utcHour: number): Promise<WeatherCat> {
  try {
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
      `&start_date=${dateISO}&end_date=${dateISO}` +
      `&hourly=weather_code&timezone=UTC`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return 'unknown';
    const data = await res.json() as { hourly?: { weather_code?: number[] } };
    const code = data.hourly?.weather_code?.[utcHour] ?? -1;
    if (code < 0)   return 'unknown';
    if (code === 0) return 'clear';
    if (code <= 48) return 'cloudy';
    if (code <= 67) return 'rain';
    if (code <= 77) return 'snow';
    if (code <= 82) return 'rain';
    if (code <= 86) return 'snow';
    return 'rain';
  } catch {
    return 'unknown';
  }
}

async function fetchWeatherCategory(lat: number, lon: number, dateISO: string, utcHour: number): Promise<WeatherCat> {
  const birthMs = new Date(dateISO + 'T12:00:00Z').getTime();
  const minMs   = new Date('1940-01-01').getTime();
  const maxMs   = Date.now() - 5 * 86400000; // ERA5 lags ~5 days
  if (birthMs < minMs || birthMs > maxMs) return 'unknown';

  // ERA5 is the primary source — global coverage, no station gaps.
  const era5 = await fetchFromERA5(lat, lon, dateISO, utcHour);
  if (era5 !== 'unknown') return era5;

  // Station observations as fallback (better precision where available).
  return fetchFromStations(lat, lon, dateISO, utcHour);
}

function selectTheme(
  isDaytime: boolean,
  sunAlt: number,
  moonPhase: number,
  weather: BirthAtmosphere['weatherCategory'],
): AtmosphericTheme {
  // Golden hour / twilight zone (sun within 6° of horizon either side)
  if (sunAlt >= -6 && sunAlt <= 6) return 'day-golden';

  if (isDaytime) {
    if (weather === 'rain' || weather === 'snow') return 'day-rain';
    if (weather === 'cloudy') return 'day-clouds';
    return 'day-clear';
  }

  // Nighttime
  if (weather === 'rain' || weather === 'snow') return 'night-rain';
  if (weather === 'cloudy') return 'night-clouds';
  if (moonPhase >= 150 && moonPhase <= 210) return 'night-fullmoon';
  return 'night-clear';
}

export async function computeAtmosphere(chart: NatalChart): Promise<BirthAtmosphere> {
  const { lat, lng, utc, date } = chart.input;
  const utcMs   = new Date(utc).getTime();
  const utcHour = new Date(utc).getUTCHours();

  const sunAlt   = sunAltitudeDeg(lat, lng, utcMs);
  const isDaytime = sunAlt > -0.833; // standard civil definition

  const sunLon  = chart.western.bodies.sun?.longitude  ?? 0;
  const moonLon = chart.western.bodies.moon?.longitude ?? 0;
  const moonPhase = ((moonLon - sunLon) % 360 + 360) % 360;

  const weatherCategory = await fetchWeatherCategory(lat, lng, date, utcHour);

  const theme = selectTheme(isDaytime, sunAlt, moonPhase, weatherCategory);

  return { isDaytime, sunAltDeg: sunAlt, moonPhase, weatherCategory, theme };
}
