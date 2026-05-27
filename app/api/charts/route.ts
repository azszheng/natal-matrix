import { createClient } from '@/lib/supabase/server';
import type { NatalChart } from '@/lib/astro/types';
import type { ResolvedBirth } from '@/lib/astro/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data, error } = await supabase
    .from('birth_charts')
    .select('id, label, birth_date, birth_time, birth_location, latitude, longitude, timezone, chart_data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return Response.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body: { birth: ResolvedBirth; chart: NatalChart; label?: string } = await req.json();
  const { birth, chart, label } = body;

  const { data, error } = await supabase.from('birth_charts').insert({
    user_id:        user.id,
    label:          label ?? `${birth.city || birth.region || 'Chart'} ${birth.date}`,
    birth_date:     birth.date,
    birth_time:     birth.time,
    birth_location: [birth.city, birth.region, birth.country].filter(Boolean).join(', '),
    latitude:       birth.lat,
    longitude:      birth.lng,
    timezone:       birth.timezone,
    chart_data:     chart,
  }).select('id').single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return Response.json({ id: data.id });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id }: { id: number } = await req.json();
  const { error } = await supabase
    .from('birth_charts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return Response.json({ ok: true });
}
