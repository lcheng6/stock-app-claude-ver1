import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchAllSources } from '@/lib/osint/sources';
import { aggregateSentiment } from '@/lib/nlp/sentiment';
import { generateLLMSummary } from '@/lib/nlp/summarize';
import { SentimentAnalysis } from '@/types/stock';

const querySchema = z.object({
  symbol: z.string().min(1).max(10),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  useLLM: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      symbol: searchParams.get('symbol'),
      limit: searchParams.get('limit'),
      useLLM: searchParams.get('useLLM'),
    };

    const validated = querySchema.parse(params);

    const symbol = validated.symbol.toUpperCase();
    const sources = await fetchAllSources(symbol, validated.limit || 20);

    const sentiment = aggregateSentiment(sources);

    const summary = validated.useLLM
      ? await generateLLMSummary(symbol, sources, sentiment)
      : (await import('@/lib/nlp/summarize')).generateSummary(symbol, sources, sentiment);

    const analysis: SentimentAnalysis = {
      symbol,
      sentiment,
      sources,
      summary,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Sentiment API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
