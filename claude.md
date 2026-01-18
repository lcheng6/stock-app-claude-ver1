# Claude Code Instructions

## Project
Web-based stock research app:
- Show recent price chart
- Pull OSINT/social sources (start: Reddit + RSS)
- Compute sentiment + summarize
- Generate downloadable PDF report

## Stack
- Next.js App Router + TypeScript
- Tailwind
- Recharts for charts
- API routes under app/api/*
- Zod for input validation

## Conventions
- All external calls go in lib/* services, not directly in route.ts
- API routes validate inputs with Zod and return JSON with stable schemas
- No secrets in code; use env vars only
- Add basic caching to avoid rate limits

## Quality gates
- `npm run lint` passes
- API endpoints have basic error handling
- Add minimal unit tests for sentiment and parsing if time permits

## Project layout
Please follow this layout for project layout: 
```text
/
  app/
    page.tsx                    # search + dashboard
    api/
      price/route.ts            # GET price series
      sentiment/route.ts        # GET sentiment summary + sources
      report/route.ts           # POST → returns PDF
  lib/
    market/
      providers/
        alpaca.ts
        polygon.ts
      priceService.ts
    osint/
      reddit.ts
      rss.ts
      sources.ts
    nlp/
      sentiment.ts              # lexicon baseline + LLM option
      summarize.ts              # LLM summary
    report/
      render.ts                 # build report data model
      pdf.ts                    # generate pdf bytes
    cache/
      memory.ts                 # simple in-memory cache for v0
  types/
    stock.ts
  README.md
```