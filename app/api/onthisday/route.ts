import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type Article = {
  headline: string;
  abstract: string;
  url: string;
  section: string;
  source: 'nyt' | 'guardian';
  score: number;
};

// Section priority — lower index = higher priority
const SECTION_PRIORITY = [
  'science', 'health', 'technology', 'environment', 'education', 'space',
  'world news', 'world', 'international', 'arts', 'culture', 'music', 'film', 'books',
  'society', 'national', 'u.s.', 'business', 'front page',
  'politics', 'washington',
];

const SKIP_SECTIONS = new Set([
  'corrections', 'classifieds', 'real estate', 'style', 'fashion & style',
  'travel', 'food', 'opinion', 'editorial', 'obituaries', 'sport', 'sports',
  'fashion', 'lifestyle',
]);

const MINOR_NEG = /\b(murder|robbery|arrest|indicted|lawsuit|sentenced|convicted|fired|resigned|scandal|fraud|charges|guilty|accused)\b/i;
const MAJOR_SIG = /\b(historic|record|first|discovery|breakthrough|peace|landmark|milestone|launch|cure|treaty|summit|crisis|war|invasion|disaster|earthquake|hurricane|tsunami|announce|award)\b/i;

function scoreArticle(headline: string, abstract: string, section: string): number {
  const secLower = section.toLowerCase();
  const priIdx   = SECTION_PRIORITY.findIndex(s => secLower.includes(s));
  const secScore = priIdx === -1 ? SECTION_PRIORITY.length : priIdx;
  const text     = `${headline} ${abstract}`;
  const negPenalty = MINOR_NEG.test(text) && !MAJOR_SIG.test(text) ? 20 : 0;
  return secScore + negPenalty;
}

async function fetchNyt(year: number, month: number, day: number, key: string): Promise<Article[]> {
  try {
    const url = `https://api.nytimes.com/svc/archive/v1/${year}/${month}.json?api-key=${key}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const docs: { headline: { main: string }; abstract: string; pub_date: string; web_url: string; section_name: string }[] =
      data.response?.docs ?? [];
    return docs
      .filter(doc => {
        const pubDay = new Date(doc.pub_date).getUTCDate();
        const sec    = (doc.section_name ?? '').toLowerCase();
        return pubDay === day && !SKIP_SECTIONS.has(sec);
      })
      .map(doc => ({
        headline: doc.headline.main,
        abstract: doc.abstract ?? '',
        url: doc.web_url,
        section: doc.section_name ?? '',
        source: 'nyt' as const,
        score: scoreArticle(doc.headline.main, doc.abstract ?? '', doc.section_name ?? ''),
      }));
  } catch { return []; }
}

async function fetchGuardian(date: string, key: string): Promise<Article[]> {
  try {
    const params = new URLSearchParams({
      'from-date': date,
      'to-date': date,
      'api-key': key,
      'show-fields': 'headline,trailText',
      'page-size': '50',
      'order-by': 'relevance',
    });
    const res = await fetch(`https://content.guardianapis.com/search?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const results: { webTitle: string; fields?: { headline?: string; trailText?: string }; webUrl: string; sectionName: string }[] =
      data.response?.results ?? [];
    return results
      .filter(r => !SKIP_SECTIONS.has((r.sectionName ?? '').toLowerCase()))
      .map(r => {
        const headline = r.fields?.headline ?? r.webTitle;
        const abstract = r.fields?.trailText ?? '';
        return {
          headline,
          abstract,
          url: r.webUrl,
          section: r.sectionName ?? '',
          source: 'guardian' as const,
          score: scoreArticle(headline, abstract, r.sectionName ?? ''),
        };
      });
  } catch { return []; }
}

// Rough dedup: skip if headline shares 5+ consecutive words with a kept article
function isDuplicate(headline: string, kept: Article[]): boolean {
  const words = headline.toLowerCase().split(/\s+/);
  return kept.some(k => {
    const kwords = k.headline.toLowerCase().split(/\s+/);
    for (let i = 0; i <= words.length - 5; i++) {
      const chunk = words.slice(i, i + 5).join(' ');
      if (kwords.join(' ').includes(chunk)) return true;
    }
    return false;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const [yr, mo, d] = date.split('-');
  const year  = parseInt(yr, 10);
  const month = parseInt(mo, 10);
  const day   = parseInt(d, 10);

  const nytKey      = process.env.NYT_API_KEY ?? '';
  const guardianKey = process.env.GUARDIAN_API_KEY ?? '';

  const [nytArticles, guardianArticles] = await Promise.all([
    nytKey      ? fetchNyt(year, month, day, nytKey)           : Promise.resolve([]),
    guardianKey ? fetchGuardian(date, guardianKey)             : Promise.resolve([]),
  ]);

  // Merge, sort by score, deduplicate, take top 3
  const merged = [...nytArticles, ...guardianArticles].sort((a, b) => a.score - b.score);
  const kept: Article[] = [];
  for (const article of merged) {
    if (kept.length >= 3) break;
    if (!isDuplicate(article.headline, kept)) kept.push(article);
  }

  return NextResponse.json({
    articles: kept.map(({ headline, abstract, url, section, source }) => ({
      headline, abstract, url, section, source,
    })),
  });
}
