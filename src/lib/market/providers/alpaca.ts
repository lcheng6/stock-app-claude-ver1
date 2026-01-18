import { PricePoint, PriceSeries } from '@/types/stock';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || '';
const ALPACA_BASE_URL = 'https://data.alpaca.markets/v2';

export interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export async function fetchAlpacaData(
  symbol: string,
  timeframe: '1Day' | '1Hour' = '1Day',
  limit: number = 30
): Promise<PriceSeries> {
  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    throw new Error('Alpaca API credentials not configured');
  }

  const url = new URL(`${ALPACA_BASE_URL}/stocks/${symbol}/bars`);
  url.searchParams.set('timeframe', timeframe);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'APCA-API-KEY-ID': ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Alpaca API error: ${response.status} - ${error}`);
  }

  const json = await response.json();

  const bars: AlpacaBar[] = json.bars || [];

  const data: PricePoint[] = bars.map((bar) => ({
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));

  return {
    symbol,
    data,
    source: 'alpaca',
  };
}
