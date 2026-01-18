'use client';

import { useState } from 'react';
import { PriceSeries, SentimentAnalysis } from '@/types/stock';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceSeries | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const [priceRes, sentimentRes] = await Promise.all([
        fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`),
        fetch(`/api/sentiment?symbol=${encodeURIComponent(symbol)}`),
      ]);

      if (!priceRes.ok || !sentimentRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const price = await priceRes.json();
      const sentiment = await sentimentRes.json();

      setPriceData(price);
      setSentimentData(sentiment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!symbol.trim()) return;

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report');
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentBg = (score: number) => {
    if (score > 0.1) return 'bg-green-50';
    if (score < -0.1) return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Stock Research Dashboard</h1>
          <p className="text-gray-600">
            Get price data, sentiment analysis, and downloadable reports
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4 max-w-2xl mx-auto">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol (e.g., AAPL)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {priceData && sentimentData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{priceData.symbol}</h2>
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Download PDF Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${priceData.data[priceData.data.length - 1]?.close.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${getSentimentBg(sentimentData.sentiment.overall)}`}>
                  <p className="text-sm text-gray-600 mb-1">Sentiment Score</p>
                  <p className={`text-2xl font-bold ${getSentimentColor(sentimentData.sentiment.overall)}`}>
                    {(sentimentData.sentiment.overall * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Sources</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sentimentData.sources.length}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Price Chart (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close']}
                    />
                    <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Sentiment Analysis</h3>
              <p className="text-gray-700 mb-4">{sentimentData.summary}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Positive</p>
                  <p className="text-lg font-semibold text-green-600">
                    {(sentimentData.sentiment.positive * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Negative</p>
                  <p className="text-lg font-semibold text-red-600">
                    {(sentimentData.sentiment.negative * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Neutral</p>
                  <p className="text-lg font-semibold text-gray-600">
                    {(sentimentData.sentiment.neutral * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <h4 className="text-md font-semibold mb-3">Recent Sources</h4>
              <div className="space-y-3">
                {sentimentData.sources.slice(0, 5).map((source) => (
                  <div key={source.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h5 className="font-medium text-gray-900">{source.title}</h5>
                    <p className="text-sm text-gray-600">
                      {source.source} • {new Date(source.timestamp).toLocaleDateString()}
                    </p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View source →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
