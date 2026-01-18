import { SentimentScore, SocialSource } from '@/types/stock';

const POSITIVE_WORDS = new Set([
  'bullish',
  'bull',
  'moon',
  'rocket',
  'gain',
  'profit',
  'up',
  'rise',
  'rally',
  'positive',
  'strong',
  'buy',
  'good',
  'great',
  'excellent',
  'growth',
  'surge',
  'soar',
  'breakout',
  'outperform',
]);

const NEGATIVE_WORDS = new Set([
  'bearish',
  'bear',
  'crash',
  'fall',
  'drop',
  'loss',
  'down',
  'decline',
  'negative',
  'weak',
  'sell',
  'bad',
  'poor',
  'plunge',
  'dump',
  'tank',
  'collapse',
  'underperform',
  'risk',
  'concern',
]);

export function analyzeSentiment(text: string): SentimentScore {
  const words = text.toLowerCase().split(/\W+/);

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) {
      positiveCount++;
    }
    if (NEGATIVE_WORDS.has(word)) {
      negativeCount++;
    }
  }

  const totalSentiment = positiveCount + negativeCount;
  const neutralCount = words.length - totalSentiment;

  if (totalSentiment === 0) {
    return {
      overall: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      confidence: 0.3,
    };
  }

  const positive = positiveCount / words.length;
  const negative = negativeCount / words.length;
  const neutral = neutralCount / words.length;

  const overall = (positiveCount - negativeCount) / words.length;

  const confidence = Math.min(totalSentiment / 10, 1) * 0.7;

  return {
    overall: Math.max(-1, Math.min(1, overall * 10)),
    positive,
    negative,
    neutral,
    confidence,
  };
}

export function aggregateSentiment(sources: SocialSource[]): SentimentScore {
  if (sources.length === 0) {
    return {
      overall: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      confidence: 0,
    };
  }

  let totalOverall = 0;
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  let totalConfidence = 0;

  for (const source of sources) {
    const sentiment = analyzeSentiment(`${source.title} ${source.content}`);

    let weight = 1;
    if (source.score && source.score > 0) {
      weight = Math.log10(source.score + 1) + 1;
    }

    totalOverall += sentiment.overall * weight;
    totalPositive += sentiment.positive * weight;
    totalNegative += sentiment.negative * weight;
    totalNeutral += sentiment.neutral * weight;
    totalConfidence += sentiment.confidence * weight;
  }

  const weightSum = sources.reduce((sum, source) => {
    const weight = source.score ? Math.log10(source.score + 1) + 1 : 1;
    return sum + weight;
  }, 0);

  return {
    overall: totalOverall / weightSum,
    positive: totalPositive / weightSum,
    negative: totalNegative / weightSum,
    neutral: totalNeutral / weightSum,
    confidence: Math.min(totalConfidence / weightSum, 0.8),
  };
}
