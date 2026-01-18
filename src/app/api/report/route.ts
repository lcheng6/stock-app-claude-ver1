import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPriceSeries } from '@/lib/market/priceService';
import { fetchAllSources } from '@/lib/osint/sources';
import { aggregateSentiment } from '@/lib/nlp/sentiment';
import { generateLLMSummary } from '@/lib/nlp/summarize';
import { buildReport } from '@/lib/report/render';
import { generatePDF } from '@/lib/report/pdf';
import { SentimentAnalysis } from '@/types/stock';

const bodySchema = z.object({
  symbol: z.string().min(1).max(10),
  useLLM: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bodySchema.parse(body);

    const symbol = validated.symbol.toUpperCase();

    const [priceSeries, sources] = await Promise.all([
      getPriceSeries(symbol, 'polygon', 30),
      fetchAllSources(symbol, 20),
    ]);

    const sentiment = aggregateSentiment(sources);

    const summary = validated.useLLM
      ? await generateLLMSummary(symbol, sources, sentiment)
      : (await import('@/lib/nlp/summarize')).generateSummary(symbol, sources, sentiment);

    const sentimentAnalysis: SentimentAnalysis = {
      symbol,
      sentiment,
      sources,
      summary,
      timestamp: new Date().toISOString(),
    };

    const report = buildReport(symbol, priceSeries, sentimentAnalysis);

    const pdfBuffer = generatePDF(report);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${symbol}_report_${
          new Date().toISOString().split('T')[0]
        }.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Report API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
