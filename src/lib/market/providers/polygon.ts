import { PricePoint, PriceSeries } from '@/types/stock';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';
const POLYGON_BASE_URL = 'https://api.polygon.io/v2';

export interface PolygonBar {
  t: number; // timestamp in ms
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export async function fetchPolygonData(
  symbol: string,
  timespan: 'day' | 'hour' = 'day',
  limit: number = 30
): Promise<PriceSeries> {
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not configured');
  }

  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (timespan === 'day' ? limit : Math.ceil(limit / 24)));

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const url = new URL(
    `${POLYGON_BASE_URL}/aggs/ticker/${symbol}/range/1/${timespan}/${fromStr}/${toStr}`
  );
  url.searchParams.set('adjusted', 'true');
  url.searchParams.set('sort', 'asc');
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('apiKey', POLYGON_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Polygon API error: ${response.status} - ${error}`);
  }

  const json = await response.json();

  if (json.status !== 'OK') {
    throw new Error(`Polygon API returned status: ${json.status}`);
  }

  const bars: PolygonBar[] = json.results || [];

  const data: PricePoint[] = bars.map((bar) => ({
    timestamp: new Date(bar.t).toISOString(),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));

  return {
    symbol,
    data,
    source: 'polygon',
  };
}
