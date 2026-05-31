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

  const PRIORITY = [
    'Science', 'Health', 'Technology', 'Environment', 'Education', 'Space',
    'Arts', 'Culture', 'World', 'International', 'National',
    'U.S.', 'Business', 'Front Page', 'Politics', 'Washington',
  ];
  const SKIP = new Set(['Corrections', 'Classifieds', 'Real Estate', 'Style', 'Fashion & Style', 'Travel', 'Food', 'Opinion', 'Editorial', 'Obituaries']);

  // Minor-negative keywords — deprioritise unless the story is clearly major
  const MINOR_NEG = /\b(murder|robbery|arrest|indicted|lawsuit|sentenced|convicted|fired|resigned|scandal|fraud)\b/i;
  // Major-event signals that override negativity penalty
  const MAJOR_SIG = /\b(historic|record|first|discovery|breakthrough|peace|landmark|milestone|announced|launch|cure|treaty|summit|crisis|war|invasion|disaster|earthquake|hurricane|tsunami)\b/i;

  const onDay = docs.filter(doc => {
    const pubDay = new Date(doc.pub_date).getUTCDate();
    return pubDay === day && !SKIP.has(doc.section_name);
  });

  function score(doc: typeof docs[0]): number {
    const text    = `${doc.headline.main} ${doc.abstract ?? ''}`;
    const priIdx  = PRIORITY.indexOf(doc.section_name);
    const secScore = priIdx === -1 ? PRIORITY.length : priIdx; // lower = better
    const negPenalty = MINOR_NEG.test(text) && !MAJOR_SIG.test(text) ? 20 : 0;
    return secScore + negPenalty;
  }

  const sorted = [...onDay].sort((a, b) => score(a) - score(b));

  const articles = sorted.slice(0, 3).map(doc => ({
    headline: doc.headline.main,
    abstract: doc.abstract ?? '',
    url: doc.web_url,
    section: doc.section_name ?? '',
  }));

  return NextResponse.json({ articles });
}
