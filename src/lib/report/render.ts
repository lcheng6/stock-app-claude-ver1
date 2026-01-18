import { StockReport, PriceSeries, SentimentAnalysis } from '@/types/stock';
import { calculatePriceChange } from '@/lib/market/priceService';

export function buildReport(
  symbol: string,
  priceSeries: PriceSeries,
  sentimentAnalysis: SentimentAnalysis
): StockReport {
  const priceStats = calculatePriceChange(priceSeries);

  const report: StockReport = {
    symbol,
    generatedAt: new Date().toISOString(),
    price: {
      current: priceStats.current,
      change: priceStats.change,
      changePercent: priceStats.changePercent,
      series: priceSeries.data,
    },
    sentiment: sentimentAnalysis,
    summary: buildExecutiveSummary(symbol, priceStats, sentimentAnalysis),
  };

  return report;
}

function buildExecutiveSummary(
  symbol: string,
  priceStats: { current: number; change: number; changePercent: number },
  sentimentAnalysis: SentimentAnalysis
): string {
  const priceDirection = priceStats.change > 0 ? 'up' : 'down';
  const sentimentLabel =
    sentimentAnalysis.sentiment.overall > 0.1
      ? 'positive'
      : sentimentAnalysis.sentiment.overall < -0.1
      ? 'negative'
      : 'neutral';

  const summary = [
    `Stock Research Report for ${symbol} generated on ${new Date().toLocaleDateString()}.`,
    `Current price: $${priceStats.current.toFixed(2)} (${priceDirection} ${Math.abs(
      priceStats.changePercent
    ).toFixed(2)}% from previous close).`,
    `Social sentiment: ${sentimentLabel} based on ${sentimentAnalysis.sources.length} sources.`,
    sentimentAnalysis.summary,
  ];

  return summary.join(' ');
}
