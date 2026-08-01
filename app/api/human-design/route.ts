import { NextRequest, NextResponse } from 'next/server';
import type { ResolvedBirth } from '@/lib/astro/types';
import { computeHumanDesignChart } from '@/lib/astro/humandesign';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: ResolvedBirth;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.utc || !body.lat || !body.lng) {
    return NextResponse.json(
      { error: 'Missing required fields: utc, lat, lng' },
      { status: 400 },
    );
  }

  try {
    const chart = computeHumanDesignChart(body);
    return NextResponse.json(chart);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Human Design calculation failed';
    console.error('[human-design/route] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
