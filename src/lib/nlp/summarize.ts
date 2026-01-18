import { SocialSource, SentimentScore } from '@/types/stock';

export function generateSummary(
  symbol: string,
  sources: SocialSource[],
  sentiment: SentimentScore
): string {
  if (sources.length === 0) {
    return `No recent social media or news data found for ${symbol}.`;
  }

  const sentimentLabel = getSentimentLabel(sentiment.overall);

  const topSources = sources.slice(0, 3);

  const topics = extractTopics(topSources);

  const summary = [
    `Analysis of ${sources.length} recent sources shows ${sentimentLabel} sentiment (${(
      sentiment.overall * 100
    ).toFixed(0)}% score) for ${symbol}.`,
  ];

  if (topics.length > 0) {
    summary.push(`Key discussion topics include: ${topics.join(', ')}.`);
  }

  const redditCount = sources.filter((s) => s.source === 'reddit').length;
  const rssCount = sources.filter((s) => s.source === 'rss').length;

  summary.push(
    `Sources: ${redditCount} Reddit posts and ${rssCount} news articles from the past 24-48 hours.`
  );

  return summary.join(' ');
}

function getSentimentLabel(score: number): string {
  if (score > 0.3) return 'strongly positive';
  if (score > 0.1) return 'moderately positive';
  if (score > -0.1) return 'neutral';
  if (score > -0.3) return 'moderately negative';
  return 'strongly negative';
}

function extractTopics(sources: SocialSource[]): string[] {
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'is',
    'it',
    'that',
    'this',
    'with',
    'as',
    'by',
  ]);

  const wordCounts = new Map<string, number>();

  for (const source of sources) {
    const words = `${source.title} ${source.content}`
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !commonWords.has(w));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return sortedWords;
}

export async function generateLLMSummary(
  symbol: string,
  sources: SocialSource[],
  sentiment: SentimentScore
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateSummary(symbol, sources, sentiment);
  }

  try {
    const prompt = buildPrompt(symbol, sources, sentiment);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('LLM summary failed, using fallback:', error);
    return generateSummary(symbol, sources, sentiment);
  }
}

function buildPrompt(
  symbol: string,
  sources: SocialSource[],
  sentiment: SentimentScore
): string {
  const sourceTexts = sources
    .slice(0, 10)
    .map((s) => `- ${s.title} (${s.source})`)
    .join('\n');

  return `Summarize the sentiment and key themes for stock ${symbol} based on these sources:

${sourceTexts}

Overall sentiment score: ${sentiment.overall.toFixed(2)} (-1 to 1 scale)

Provide a 2-3 sentence summary highlighting the main sentiment and key discussion points.`;
}
