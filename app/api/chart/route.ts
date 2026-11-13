import { NextRequest, NextResponse } from 'next/server';
import type { ResolvedBirth } from '@/lib/astro/types';
import { computeNatalChart } from '@/lib/astro/natal';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: ResolvedBirth;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.utc || typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json(
      { error: 'Missing required fields: utc, lat, lng' },
      { status: 400 },
    );
  }

  try {
    const chart = computeNatalChart(body);
    return NextResponse.json(chart);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chart calculation failed';
    console.error('[chart/route] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
