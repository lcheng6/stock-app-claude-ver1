import { SocialSource } from '@/types/stock';

export interface RSSFeed {
  url: string;
  name: string;
}

const RSS_FEEDS: RSSFeed[] = [
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline', name: 'Yahoo Finance' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC' },
];

export async function fetchRSSFeeds(
  symbol: string,
  limit: number = 10
): Promise<SocialSource[]> {
  const sources: SocialSource[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url);

      if (!response.ok) {
        console.warn(`RSS feed error for ${feed.name}: ${response.status}`);
        continue;
      }

      const xml = await response.text();

      const items = parseRSSItems(xml, symbol);

      for (const item of items.slice(0, Math.ceil(limit / RSS_FEEDS.length))) {
        sources.push({
          id: `rss-${feed.name}-${Date.now()}-${Math.random()}`,
          title: item.title,
          content: item.description || item.title,
          url: item.link,
          timestamp: item.pubDate || new Date().toISOString(),
          source: 'rss',
          author: feed.name,
        });
      }
    } catch (error) {
      console.error(`Error fetching RSS feed ${feed.name}:`, error);
    }
  }

  return sources.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

interface RSSItem {
  title: string;
  description?: string;
  link: string;
  pubDate?: string;
}

function parseRSSItems(xml: string, symbol: string): RSSItem[] {
  const items: RSSItem[] = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title>([\s\S]*?)<\/title>/i;
  const descRegex = /<description>([\s\S]*?)<\/description>/i;
  const linkRegex = /<link>([\s\S]*?)<\/link>/i;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = titleRegex.exec(itemXml);
    const descMatch = descRegex.exec(itemXml);
    const linkMatch = linkRegex.exec(itemXml);
    const pubDateMatch = pubDateRegex.exec(itemXml);

    if (!titleMatch || !linkMatch) continue;

    const title = cleanXmlText(titleMatch[1]);
    const description = descMatch ? cleanXmlText(descMatch[1]) : undefined;

    const combinedText = `${title} ${description || ''}`.toLowerCase();
    if (!combinedText.includes(symbol.toLowerCase())) {
      continue;
    }

    items.push({
      title,
      description,
      link: cleanXmlText(linkMatch[1]),
      pubDate: pubDateMatch ? new Date(cleanXmlText(pubDateMatch[1])).toISOString() : undefined,
    });
  }

  return items;
}

function cleanXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}
