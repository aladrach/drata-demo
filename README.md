## Drata Demo – Next.js + Contentful + AI Chat

A marketing site starter built with Next.js 15, React 19, Tailwind v4, shadcn/ui, and Contentful. Includes a streaming AI chat demo grounded by a Contentful-hosted knowledge base, ISR, and a small data API.

### Prerequisites
- **Node**: 18.18+ (Node 20+ recommended)
- **Package manager**: pnpm (this repo is configured for pnpm)

### Quick start
```bash
pnpm install
# create .env.local and fill in values (see below)
pnpm dev
```
Then open `http://localhost:3000`.

### Build and run
```bash
pnpm build
pnpm start
```

### Lint
```bash
pnpm lint
```

## Environment variables
Create `.env.local` with the following variables:

- CONTENTFUL_SPACE_ID: your Contentful Space ID
- CONTENTFUL_ENV: content environment (default: `master`)
- CONTENTFUL_CDA_TOKEN: Content Delivery API token (GraphQL)
- CONTENTFUL_CPA_TOKEN: Content Preview API token (optional; enables preview)
- AI_GATEWAY_API_KEY: Vercel AI Gateway key (or use VERCEL_AI_GATEWAY_API_KEY)
- AI_GATEWAY_MODEL: model id (default: `openai/gpt-4o-mini`)
- OPENWEATHER_API_KEY: key for the OpenWeather data source
- NEXT_REVALIDATE_SECRET: secret token to protect the revalidation endpoint
- KB_DOCS_LIMIT: cap on KB docs included in chat context (default: 5)

Note: Images from Contentful are allowed via `next.config.ts` remote patterns.

## Scripts
- dev: Next dev (Turbopack)
- build: Next build (Turbopack)
- start: Start production server
- lint: Run ESLint

## Project structure
```
src/
  app/
    page.tsx                // Home
    chat/page.tsx           // Chat demo
    features/[slug]/page.tsx// CMS-driven feature pages (SSG + ISR)
    api/
      chat/stream/route.ts  // Streaming chat endpoint (POST)
      cta/route.ts          // CTAs from Contentful (GET)
      featured-pages/route.ts// Featured pages from Contentful (GET)
      suggestions/route.ts  // FAQ suggestions (GET)
      data/[source]/route.ts// Live metrics (OpenWeather, WorldBank) (GET)
      revalidate/route.ts   // On-demand revalidation (GET/POST)
  components/
    blocks/                 // Page section blocks (Hero, FeatureGrid, etc.)
    ui/                     // shadcn/ui primitives
    ChatClient.tsx          // Chat experience (client component)
  lib/
    cms/                    // Contentful GraphQL queries and types
    blocks/registry.ts      // Maps CMS block types -> React components
    server-cache.ts         // Simple in-memory cache for API responses
    utils.ts                // Utilities
public/                     // Static assets
```

## Routing overview
- `/` home page (static)
- `/chat` AI chat demo (client-side UI; server streams from `/api/chat/stream`)
- `/features/[slug]` CMS-driven pages generated at build with ISR (`revalidate = 300`)

## API reference

### POST `/api/chat/stream`
- Body: `{ "query": string }`
- Returns: `text/plain` stream of the assistant response
- Uses Contentful Knowledge Base documents to ground answers. Controlled by `AI_GATEWAY_*` and `KB_DOCS_LIMIT`.

### GET `/api/cta`
- Returns: `{ items: Array<{ name: string; url: string }> }`
- Sourced from Contentful; cached in-memory and with `s-maxage`.

### GET `/api/featured-pages`
- Returns: `{ items: Array<{ name: string; url: string }> }`

### GET `/api/suggestions`
- Returns: `{ suggestions: string[] }` from Contentful FAQ entries.

### GET `/api/data/[source]`
Supported `source` values:
- `openweather`: Query current weather.
  - Query params: `query` (city name), `format` (optional: `imperial` or metric default), `metricKeys` (optional JSON array string)
  - Requires `OPENWEATHER_API_KEY`.
- `worldbank`: Query country indicator series.
  - Query params: `query` in the form `COUNTRY_CODE:INDICATOR_CODE` (e.g., `US:NY.GDP.MKTP.CD`).

Response shape:
```json
{ "ok": boolean, "data?": Record<string, number|string>, "error?": string, "asOf?": string }
```

### GET/POST `/api/revalidate`
- Protect with `NEXT_REVALIDATE_SECRET` via `?secret=...` or header `x-revalidate-token`.
- Provide paths via:
  - `POST` JSON body: `{ path: string }` or `{ paths: string[] }`
  - Query params: `?path=/features/demo` or `?paths=["/","/features/demo"]`
- Returns: `{ revalidated: boolean, paths: string[], failed: string[], now: string }`

## Contentful setup
This app uses the Contentful GraphQL Content API. Configure:
- Space ID and Environment
- CDA token (required) and CPA token (optional for preview)

Content models expected (field names simplified to match `src/lib/cms/contentful.ts`):
- Pages (`pageCollection`) with fields: `title`, `slug`, `theme`, `seo`, `sectionsCollection`
- Section types used by `blockRegistry`:
  - `Hero`, `FeatureGrid`, `Testimonial`, `CtaBanner`, `LogoWall`, `ContentSplit`, `Faq`, `RichTextBlock`, `ProductDataCallout`, `BlockAiChat`
- Chatbot support collections (optional but recommended):
  - `chatbotCtAsCollection` (name + url)
  - `chatbotFeaturedPagesCollection` (name + url)
  - `chatbotFaQsCollection` (question strings)
  - `chatbotKnowledgeBaseCollection` (name, source URL, rich text content)

## Development guidelines
- Use **pnpm** for all workflows.
- Prefer **TypeScript** strictness and clear, descriptive names.
- Keep page sections composable via `blockRegistry`; add new block components in `src/components/blocks` and wire them in `src/lib/blocks/registry.ts`.
- Co-locate server-only code in server contexts (e.g., API routes, `server-only` imports) and client UI in client components.
- Styling: Tailwind v4; use shadcn/ui components from `src/components/ui` and respect dark mode via `next-themes`.
- Avoid unnecessary re-renders in `ChatClient` and keep streaming handlers resilient.
- Follow caching defaults in API routes (`revalidate` and `s-maxage` headers) and use `/api/revalidate` when publishing new Contentful content.

## Caching & revalidation
- Pages under `/features/[slug]` use ISR with `revalidate = 300` seconds.
- API endpoints set `Cache-Control` headers where safe.
- On updates in Contentful, call `/api/revalidate` for affected paths (or wait for ISR window).

## Troubleshooting
- 401/403 from Contentful: verify `CONTENTFUL_*` tokens and environment.
- 500 from `/api/chat/stream`: ensure `AI_GATEWAY_API_KEY` and model access; consider reducing `KB_DOCS_LIMIT`.
- 200 with `{ ok: false }` from `/api/data/openweather`: confirm `OPENWEATHER_API_KEY` and city spelling.
- Images not loading: ensure the asset domain is included in `next.config.ts` `images.remotePatterns`.

---

Built with Next.js. See the Next.js docs under “App Router” for architecture guidance.
