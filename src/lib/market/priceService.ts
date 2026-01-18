import { PriceSeries } from '@/types/stock';
import { fetchAlpacaData } from './providers/alpaca';
import { fetchPolygonData } from './providers/polygon';
import { cache } from '@/lib/cache/memory';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getPriceSeries(
  symbol: string,
  provider: 'alpaca' | 'polygon' = 'polygon',
  limit: number = 30
): Promise<PriceSeries> {
  const cacheKey = `price:${symbol}:${provider}:${limit}`;

  const cached = cache.get<PriceSeries>(cacheKey);
  if (cached) {
    return cached;
  }

  let series: PriceSeries;

  try {
    if (provider === 'alpaca') {
      series = await fetchAlpacaData(symbol, '1Day', limit);
    } else {
      series = await fetchPolygonData(symbol, 'day', limit);
    }

    cache.set(cacheKey, series, CACHE_TTL);
    return series;
  } catch (error) {
    if (provider === 'polygon') {
      console.warn('Polygon failed, trying Alpaca fallback:', error);
      try {
        series = await fetchAlpacaData(symbol, '1Day', limit);
        cache.set(cacheKey, series, CACHE_TTL);
        return series;
      } catch {
        throw new Error(`Both providers failed: ${error}`);
      }
    }
    throw error;
  }
}

export function calculatePriceChange(series: PriceSeries) {
  if (series.data.length < 2) {
    return { current: 0, change: 0, changePercent: 0 };
  }

  const current = series.data[series.data.length - 1].close;
  const previous = series.data[series.data.length - 2].close;
  const change = current - previous;
  const changePercent = (change / previous) * 100;

  return {
    current,
    change,
    changePercent,
  };
}
