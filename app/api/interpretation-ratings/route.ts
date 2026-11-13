import { createClient } from '@/lib/supabase/server';

type RatingBody = {
  cacheKey: string;
  sectionType: string;
  sectionLabel: string;
  mode: string;
  astrologyAccuracy: number | null;
  specificity: number | null;
  houseTopicAnchoring: number | null;
  userRelatability: number | null;
  emotionalResonance: number | null;
  clarity: number | null;
  overallPreference: 'claude' | 'openai' | null;
};

export async function POST(req: Request) {
  let body: RatingBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!body.cacheKey || !body.sectionType || !body.sectionLabel || !body.mode) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { error } = await supabase.from('interpretation_ratings').insert({
    user_id:                user.id,
    cache_key:              body.cacheKey,
    section_type:           body.sectionType,
    section_label:          body.sectionLabel,
    mode:                   body.mode,
    astrology_accuracy:     body.astrologyAccuracy,
    specificity:            body.specificity,
    house_topic_anchoring:  body.houseTopicAnchoring,
    user_relatability:      body.userRelatability,
    emotional_resonance:    body.emotionalResonance,
    clarity:                body.clarity,
    overall_preference:     body.overallPreference,
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return Response.json({ ok: true });
}
