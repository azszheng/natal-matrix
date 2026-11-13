import { NextRequest, NextResponse } from 'next/server';
import type { GeoResult } from '@/lib/astro/types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const UA = process.env.NOMINATIM_USER_AGENT ?? 'NatalMatrix/1.0 (azszheng@gmail.com)';

// In-memory rate limit: Nominatim requires max 1 req/sec.
// Requests are serialized through a promise chain rather than a bare
// read-then-write of `lastRequestAt` -- two concurrent requests reading the
// same stale timestamp before either updates it would otherwise compute
// similar wait times and fire at nearly the same moment. This only
// serializes requests handled by the same running instance; it cannot
// enforce the limit across multiple serverless instances without an
// external shared store (e.g. Redis), which is out of scope here.
let lastRequestAt = 0;
const MIN_INTERVAL_MS = 1100;
let requestQueue: Promise<void> = Promise.resolve();

function throttle(): Promise<void> {
  const turn = requestQueue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
  });
  // Keep the chain alive even if this turn's caller later throws.
  requestQueue = turn.catch(() => {});
  return turn;
}

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    country_code?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    county?: string;
    region?: string;
    province?: string;
  };
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  await throttle();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q.trim());
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');

  let raw: NominatimResult[];
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': UA },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 });
    }
    raw = await res.json();
  } catch {
    return NextResponse.json({ error: 'Geocoding request failed' }, { status: 502 });
  }

  const results: GeoResult[] = raw.map((r) => {
    const addr = r.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
    const region = addr.state ?? addr.county ?? addr.region ?? addr.province ?? '';
    const country = addr.country ?? '';
    const countryCode = addr.country_code?.toUpperCase() ?? '';

    return {
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      city,
      region,
      country,
      countryCode,
    };
  });

  return NextResponse.json(results);
}
