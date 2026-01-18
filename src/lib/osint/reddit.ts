import { SocialSource } from '@/types/stock';

const REDDIT_USER_AGENT = 'StockResearchApp/1.0';

export interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    created_utc: number;
    score: number;
    num_comments: number;
    permalink: string;
  };
}

export async function fetchRedditPosts(
  symbol: string,
  limit: number = 10
): Promise<SocialSource[]> {
  const subreddits = ['stocks', 'investing', 'wallstreetbets'];
  const sources: SocialSource[] = [];

  for (const subreddit of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${symbol}&limit=${Math.ceil(
        limit / subreddits.length
      )}&sort=new&restrict_sr=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': REDDIT_USER_AGENT,
        },
      });

      if (!response.ok) {
        console.warn(`Reddit API error for r/${subreddit}: ${response.status}`);
        continue;
      }

      const json = await response.json();
      const posts: RedditPost[] = json.data?.children || [];

      for (const post of posts) {
        sources.push({
          id: post.data.id,
          title: post.data.title,
          content: post.data.selftext || post.data.title,
          url: `https://reddit.com${post.data.permalink}`,
          timestamp: new Date(post.data.created_utc * 1000).toISOString(),
          source: 'reddit',
          author: post.data.author,
          score: post.data.score,
          comments: post.data.num_comments,
        });
      }
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error);
    }
  }

  return sources.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
