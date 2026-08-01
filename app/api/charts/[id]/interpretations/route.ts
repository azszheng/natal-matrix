import { createClient } from '@/lib/supabase/server';

type Entry = { cache_key: string; content: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const chartId = parseInt(id, 10);
  if (isNaN(chartId)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data, error } = await supabase
    .from('chart_interpretations')
    .select('cache_key, content')
    .eq('chart_id', chartId)
    .eq('user_id', user.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const result: Record<string, string> = {};
  for (const row of data ?? []) result[row.cache_key] = row.content;
  return Response.json(result);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const chartId = parseInt(id, 10);
  if (isNaN(chartId)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body: Entry | Entry[] = await req.json();
  const entries = Array.isArray(body) ? body : [body];

  const rows = entries.map(({ cache_key, content }) => ({
    chart_id: chartId,
    user_id:  user.id,
    cache_key,
    content,
  }));

  const { error } = await supabase
    .from('chart_interpretations')
    .upsert(rows, { onConflict: 'chart_id,cache_key' });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return Response.json({ ok: true });
}
