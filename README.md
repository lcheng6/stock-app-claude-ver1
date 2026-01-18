# Stock Research App

A web-based stock research application that provides price data, social sentiment analysis, and downloadable PDF reports.

## Features

- **Real-time Price Data**: Fetch historical price charts from Polygon or Alpaca APIs
- **Sentiment Analysis**: Analyze social media sentiment from Reddit and RSS news feeds
- **Interactive Dashboard**: View price charts, sentiment scores, and recent sources
- **PDF Reports**: Generate and download comprehensive stock research reports

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod
- **PDF Generation**: jsPDF

## Project Structure

```
/
  src/
    app/
      page.tsx                    # Main dashboard UI
      layout.tsx                  # Root layout
      api/
        price/route.ts            # GET price series endpoint
        sentiment/route.ts        # GET sentiment analysis endpoint
        report/route.ts           # POST PDF report endpoint
    lib/
      market/
        providers/
          alpaca.ts               # Alpaca market data provider
          polygon.ts              # Polygon market data provider
        priceService.ts           # Price data service with caching
      osint/
        reddit.ts                 # Reddit post fetcher
        rss.ts                    # RSS feed parser
        sources.ts                # Aggregated source fetcher
      nlp/
        sentiment.ts              # Sentiment analysis (lexicon-based)
        summarize.ts              # Summary generation (with optional LLM)
      report/
        render.ts                 # Report data model builder
        pdf.ts                    # PDF generation
      cache/
        memory.ts                 # In-memory cache
    types/
      stock.ts                    # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- At least one market data API key (Polygon or Alpaca)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stock-app-claude-ver1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your API keys:
```env
POLYGON_API_KEY=your_polygon_api_key_here
# OR
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here

# Optional: For enhanced AI summaries
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### API Keys

- **Polygon.io**: Get a free API key at [polygon.io](https://polygon.io)
- **Alpaca**: Get API keys at [alpaca.markets](https://alpaca.markets)
- **Anthropic** (optional): Get API key at [anthropic.com](https://www.anthropic.com)

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
```bash
npm run build
npm start
```

### Lint

Run ESLint:
```bash
npm run lint
```

## API Endpoints

### GET /api/price

Fetch price series for a stock symbol.

**Query Parameters:**
- `symbol` (required): Stock ticker symbol
- `provider` (optional): "polygon" or "alpaca" (default: "polygon")
- `limit` (optional): Number of data points (default: 30, max: 100)

**Example:**
```
GET /api/price?symbol=AAPL&limit=30
```

### GET /api/sentiment

Analyze sentiment from social media and news sources.

**Query Parameters:**
- `symbol` (required): Stock ticker symbol
- `limit` (optional): Number of sources to analyze (default: 20, max: 50)
- `useLLM` (optional): Use Claude AI for summary (default: false)

**Example:**
```
GET /api/sentiment?symbol=AAPL&limit=20
```

### POST /api/report

Generate a PDF report.

**Body:**
```json
{
  "symbol": "AAPL",
  "useLLM": false
}
```

**Returns:** PDF file download

## Features

### Price Charts
- 30-day historical price data
- Interactive line charts with tooltips
- Current price and price change display

### Sentiment Analysis
- Aggregates data from Reddit (r/stocks, r/investing, r/wallstreetbets)
- Parses RSS feeds from Yahoo Finance and CNBC
- Lexicon-based sentiment scoring
- Optional AI-powered summaries with Claude

### Caching
- In-memory caching to avoid rate limits
- 5-minute cache for price data
- 10-minute cache for social sources
- Automatic cleanup of expired entries

### PDF Reports
- Professional formatted reports
- Price summary with charts
- Sentiment breakdown
- Recent source citations
- Downloadable with one click

## Configuration

### Cache TTL
Modify cache durations in:
- `src/lib/market/priceService.ts`: Price data cache
- `src/lib/osint/sources.ts`: Social source cache

### Sentiment Lexicon
Customize sentiment keywords in:
- `src/lib/nlp/sentiment.ts`: POSITIVE_WORDS and NEGATIVE_WORDS sets

### RSS Feeds
Add/remove RSS feeds in:
- `src/lib/osint/rss.ts`: RSS_FEEDS array

## Conventions

- All external API calls are in `lib/*` services
- API routes validate inputs with Zod
- No secrets in code (use environment variables)
- Error handling in all API endpoints
- Caching to avoid rate limits

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first.
