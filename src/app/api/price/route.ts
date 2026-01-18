import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPriceSeries } from '@/lib/market/priceService';

const querySchema = z.object({
  symbol: z.string().min(1).max(10),
  provider: z.enum(['alpaca', 'polygon']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      symbol: searchParams.get('symbol'),
      provider: searchParams.get('provider'),
      limit: searchParams.get('limit'),
    };

    const validated = querySchema.parse(params);

    const priceSeries = await getPriceSeries(
      validated.symbol.toUpperCase(),
      validated.provider || 'polygon',
      validated.limit || 30
    );

    return NextResponse.json(priceSeries);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Price API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
