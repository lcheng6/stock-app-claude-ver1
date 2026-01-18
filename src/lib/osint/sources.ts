import { SocialSource } from '@/types/stock';
import { fetchRedditPosts } from './reddit';
import { fetchRSSFeeds } from './rss';
import { cache } from '@/lib/cache/memory';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchAllSources(
  symbol: string,
  limit: number = 20
): Promise<SocialSource[]> {
  const cacheKey = `sources:${symbol}:${limit}`;

  const cached = cache.get<SocialSource[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const [redditPosts, rssItems] = await Promise.allSettled([
    fetchRedditPosts(symbol, Math.ceil(limit / 2)),
    fetchRSSFeeds(symbol, Math.ceil(limit / 2)),
  ]);

  const sources: SocialSource[] = [];

  if (redditPosts.status === 'fulfilled') {
    sources.push(...redditPosts.value);
  } else {
    console.error('Reddit fetch failed:', redditPosts.reason);
  }

  if (rssItems.status === 'fulfilled') {
    sources.push(...rssItems.value);
  } else {
    console.error('RSS fetch failed:', rssItems.reason);
  }

  const sortedSources = sources
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  cache.set(cacheKey, sortedSources, CACHE_TTL);

  return sortedSources;
}
