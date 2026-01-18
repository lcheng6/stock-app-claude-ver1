// Core types for the stock research app

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceSeries {
  symbol: string;
  data: PricePoint[];
  source: 'alpaca' | 'polygon';
}

export interface SocialSource {
  id: string;
  title: string;
  url: string;
  content: string;
  timestamp: string;
  source: 'reddit' | 'rss';
  author?: string;
  score?: number;
  comments?: number;
}

export interface SentimentScore {
  overall: number; // -1 to 1
  positive: number;
  negative: number;
  neutral: number;
  confidence: number;
}

export interface SentimentAnalysis {
  symbol: string;
  sentiment: SentimentScore;
  sources: SocialSource[];
  summary: string;
  timestamp: string;
}

export interface StockReport {
  symbol: string;
  generatedAt: string;
  price: {
    current: number;
    change: number;
    changePercent: number;
    series: PricePoint[];
  };
  sentiment: SentimentAnalysis;
  summary: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
