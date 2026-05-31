import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date'); // YYYY-MM-DD
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const [yr, mo, d] = date.split('-');
  const year  = parseInt(yr, 10);
  const month = parseInt(mo, 10);
  const day   = parseInt(d, 10);

  const key = process.env.NYT_API_KEY;
  if (!key) return NextResponse.json({ error: 'NYT_API_KEY not configured' }, { status: 500 });

  // NYT Archive API returns all articles for the given month
  const url = `https://api.nytimes.com/svc/archive/v1/${year}/${month}.json?api-key=${key}`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
  if (!res.ok) return NextResponse.json({ error: 'NYT API error' }, { status: 502 });

  const data = await res.json();
  const docs: {
    headline: { main: string };
    abstract: string;
    pub_date: string;
    web_url: string;
    section_name: string;
  }[] = data.response?.docs ?? [];

  // Prioritise human-interest sections; skip political/fluff
  const PRIORITY = ['Science', 'Health', 'Technology', 'Environment', 'Education', 'Space', 'Arts', 'Culture', 'World', 'International', 'National', 'U.S.', 'Business', 'Front Page'];
  const SKIP     = new Set(['Corrections', 'Classifieds', 'Real Estate', 'Style', 'Fashion & Style', 'Sports', 'Travel', 'Food', 'Politics', 'Washington', 'Opinion', 'Editorial']);

  const onDay = docs.filter(doc => {
    const pubDay = new Date(doc.pub_date).getUTCDate();
    return pubDay === day && !SKIP.has(doc.section_name);
  });

  // Sort: priority sections first, then everything else
  const sorted = [
    ...onDay.filter(d => PRIORITY.includes(d.section_name)),
    ...onDay.filter(d => !PRIORITY.includes(d.section_name)),
  ];

  const articles = sorted.slice(0, 2).map(doc => ({
    headline: doc.headline.main,
    abstract: doc.abstract ?? '',
    url: doc.web_url,
    section: doc.section_name ?? '',
  }));

  return NextResponse.json({ articles });
}
