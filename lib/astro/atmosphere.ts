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

async function fetchWeatherCode(lat: number, lon: number, dateISO: string, utcHour: number): Promise<number> {
  const birthMs = new Date(dateISO + 'T12:00:00Z').getTime();
  const minMs   = new Date('1940-01-01').getTime();
  const maxMs   = Date.now() - 7 * 86400000; // archive lags ~7 days
  if (birthMs < minMs || birthMs > maxMs) return -1;
  try {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start_date=${dateISO}&end_date=${dateISO}&hourly=weather_code&timezone=UTC`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return -1;
    const data = await res.json() as { hourly?: { weather_code?: number[] } };
    return data.hourly?.weather_code?.[utcHour] ?? -1;
  } catch {
    return -1;
  }
}

function categorizeWeather(code: number): BirthAtmosphere['weatherCategory'] {
  if (code < 0)  return 'unknown';
  if (code === 0) return 'clear';
  if (code <= 3)  return 'cloudy';
  if (code <= 48) return 'cloudy'; // fog variants
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  return 'rain'; // thunderstorm
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

  const weatherCode     = await fetchWeatherCode(lat, lng, date, utcHour);
  const weatherCategory = categorizeWeather(weatherCode);

  const theme = selectTheme(isDaytime, sunAlt, moonPhase, weatherCategory);

  return { isDaytime, sunAltDeg: sunAlt, moonPhase, weatherCategory, theme };
}
