import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TocNav from "@/components/TocNav";

export const metadata = {
  title: "Personalization | Drata Marketing Demo",
  description:
    "Implementation plan for account-level personalization at scale: architecture, data flow, CMS integration, rollout, and performance.",
};

export default function PersonalizationPage() {
  const toc = [
    { href: "#overview", label: "Overview" },
    { href: "#architecture", label: "Architecture" },
    { href: "#data-flow", label: "Data flow & performance" },
    { href: "#cms", label: "CMS integration" },
    { href: "#rollout", label: "Rollout strategy" },
    { href: "#prototype", label: "Prototype & code stub" },
    { href: "#edge-caching", label: "Edge caching & revalidation" },
    { href: "#privacy", label: "Privacy & compliance" },
    { href: "#observability", label: "Observability & instrumentation" },
    { href: "#ai", label: "Optional AI/LLM" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <section className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">Plan</Badge>
            <span className="text-xs text-muted-foreground">Account-level personalization</span>
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            Personalization Implementation Plan
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            A practical architecture to deliver dynamic, account-level experiences across thousands of target
            accounts with excellent Core Web Vitals and SEO integrity.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/features/demo-feature">View sample feature page</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/docs">Read full demo docs</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Grid Layout */}
      <section className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* ToC */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-xs font-medium text-muted-foreground mb-3">On this page</div>
            <TocNav items={toc} />
          </div>
        </aside>

        {/* Content */}
        <div className="max-w-none space-y-6 leading-7 [&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:text-xl [&_p]:mt-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:mt-2 [&_pre]:my-4 [&_code]:font-mono [&_hr]:my-10">
          <h2 id="overview">1) Overview</h2>
          <p>
            The goal is to personalize hero copy, CTAs, and supporting modules for thousands of target accounts
            without client-side flicker, while preserving SEO and Core Web Vitals. Personalization decisions are
            made before HTML is streamed, using an edge signal and a small, cached segment map derived from the CDP.
          </p>
          <ul>
            <li><strong>Edge signal</strong>: Detect <code>segmentId</code> per request (cookie, subdomain, IP-to-segment).</li>
            <li><strong>Server-rendered variants</strong>: Components choose variants on the server using a light helper.</li>
            <li><strong>Segment-aware caching</strong>: Cache by <code>default</code> and top segments; fall back gracefully.</li>
          </ul>

          <h2 id="architecture">2) High-level architecture</h2>
          <ul>
            <li>
              <strong>Edge middleware</strong>: Compute a <code>segmentId</code> and forward via <code>x-segment</code> header. Prefer a
              deterministic, low-latency check (cookie → subdomain → geo/IP) and a KV/Edge Config lookup for allowlisted accounts.
            </li>
            <li>
              <strong>Server-only selection</strong>: Pages and server components read <code>x-segment</code> and resolve content variants
              during render. No client runtime branching and no hydration mismatch.
            </li>
            <li>
              <strong>Caching</strong>: ISR for base content; short-TTL, segment-keyed edge cache for prioritized segments. Bots receive
              default content unless whitelisted.
            </li>
          </ul>

          <h2 id="data-flow">3) Data flow & performance</h2>
          <ul>
            <li><strong>CDP → KV</strong>: Hourly export produces a compact map (account → segmentId). Ingest to Edge Config/KV.</li>
            <li><strong>Request</strong>: Middleware checks cookie and KV to set <code>x-segment</code>. Pages read header and choose variants.</li>
            <li><strong>No flicker</strong>: HTML already includes the correct variant; client receives static markup.</li>
            <li><strong>Core Web Vitals</strong>: Minimal client JS, avoid reflows, pre-size media, and server-render all variants.</li>
            <li><strong>SEO</strong>: Canonical URLs per page, consistent HTML per segment; default content for bots unless allowlisted.</li>
          </ul>

          <h2 id="cms">4) Native CMS integration</h2>
          <p>
            Marketers manage variants directly in CMS entries. Each block supports an optional <code>variants[]</code> field keyed
            by <code>segmentId</code>. The base content is always present; variants override specific fields (headline, body, media, CTA).
            The registry maps CMS types to React components, and a small helper applies overrides per segment.
          </p>
          <ul>
            <li><strong>Variant groups</strong>: <code>base</code> + overrides keyed by <code>segmentId</code>.</li>
            <li><strong>Authoring</strong>: Create page → add blocks → add variants for top segments → publish.</li>
            <li><strong>Preview</strong>: <code>?segment=finance</code> query param and a preview cookie enable editorial review.</li>
          </ul>

          <h2 id="rollout">5) Rollout strategy</h2>
          <ol>
            <li>
              <strong>MVP (0–90 days)</strong>: Middleware signal, segment cache key, hero/CTA variants for top 5 segments, editorial
              preview, and basic analytics by segment.
            </li>
            <li>
              <strong>Scale (90–180 days)</strong>: Extend to case studies/videos, CDP webhooks to refresh KV, build segment-aware
              experiments with guardrails.
            </li>
            <li>
              <strong>Long-term</strong>: Self-serve rules in CMS, holdouts, budget checks in CI, and auto backoff on perf regressions.
            </li>
          </ol>

          <h2 id="prototype">6) Prototype & code stub</h2>
          <p>Illustrative stubs showing middleware signal, server selection, and CMS variant resolution.</p>

          <h3>6.1 Edge middleware: derive segment and forward</h3>
          <pre><code>{`// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const cookieSegment = request.cookies.get('segment')?.value;
  const hostnameSegment = inferFromHostname(url.hostname); // e.g., finance.drata.com → "finance"
  const segment = cookieSegment ?? hostnameSegment ?? 'default';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-segment', segment);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
};

function inferFromHostname(hostname: string): string | null {
  // Basic example: map subdomain to a segment allowlist
  const sub = hostname.split('.')[0];
  const allowlist = new Set(['finance', 'healthcare', 'security']);
  return allowlist.has(sub) ? sub : null;
}`}</code></pre>

          <h3>6.2 Server component: choose variants without client flicker</h3>
          <pre><code>{`// app/features/[slug]/page.tsx (excerpt)
import { headers } from 'next/headers';
import { getPageBySlug } from '@/lib/cms/contentful';
import { renderBlocks } from '@/lib/blocks/registry';

export default async function FeaturePage({ params }: { params: { slug: string } }) {
  const segment = headers().get('x-segment') ?? 'default';
  const page = await getPageBySlug(params.slug);
  return renderBlocks(page.blocks, { segment });
}`}</code></pre>

          <h3>6.3 Variant resolver: apply CMS overrides by segment</h3>
          <pre><code>{`// lib/blocks/registry.ts (excerpt)
type Variant = { segmentId: string; overrides: Record<string, unknown> };
type Block = { type: string; props: Record<string, unknown>; variants?: Variant[] };

export function resolveBlockForSegment(block: Block, segment: string): Block {
  if (!block.variants?.length) return block;
  const match = block.variants.find(v => v.segmentId === segment);
  if (!match) return block;
  return { ...block, props: { ...block.props, ...match.overrides } };
}

export function renderBlocks(blocks: Block[], ctx: { segment: string }) {
  return blocks.map((b) => {
    const resolved = resolveBlockForSegment(b, ctx.segment);
    return renderBlockComponent(resolved); // maps type → React component
  });
}`}</code></pre>

          <h2 id="edge-caching">7) Edge caching & revalidation</h2>
          <ul>
            <li>
              <strong>ISR</strong>: Base page paths use ISR (e.g., 60–300s) for CMS content. Keep HTML stable per segment key.
            </li>
            <li>
              <strong>Segment cache</strong>: Cache variants for <code>default</code> and top segments at the edge with short TTL; all others
              fall back to <code>default</code> while still rendering server-side with the correct variant when needed.
            </li>
            <li>
              <strong>Revalidate</strong>: On CDP updates (hourly), refresh KV. On CMS publish, trigger path revalidation.
            </li>
          </ul>

          <h2 id="privacy">8) Privacy & compliance</h2>
          <ul>
            <li><strong>PII minimization</strong>: Use opaque <code>accountId</code> → <code>segmentId</code> mapping; avoid sending PII to the client.</li>
            <li><strong>Consent</strong>: Respect consent for any tracking; personalization logic runs server-side regardless.</li>
            <li><strong>Auditable</strong>: Log segment decisions with request IDs; redact inputs; rotate keys routinely.</li>
          </ul>

          <h2 id="observability">9) Observability & instrumentation</h2>
          <ul>
            <li><strong>Perf by segment</strong>: Report web-vitals with <code>segmentId</code> dimension.</li>
            <li><strong>Coverage</strong>: Monitor % of traffic receiving intended variants; alert on cache misses or KV lag.</li>
            <li><strong>Budgets</strong>: CI checks enforce size and TTFB budgets for personalized pages.</li>
          </ul>

          <h2 id="ai">10) Optional: AI/LLM integration</h2>
          <p>
            Use AI to draft variant copy or summarize case studies for each segment. Run generation server-side with strict
            token caps, cache outputs in CMS as variant fields, and never generate per-request. Avoid PII in prompts and
            provide human-in-the-loop editorial review.
          </p>

          <Separator className="my-8" />
          <div className="text-sm text-muted-foreground">
            Explore source in <code>src/components</code> and API routes in <code>src/app/api</code>. The feature page at
            <Link href="/features/demo-feature" className="ml-1 underline underline-offset-4">/features/demo-feature</Link> shows the block rendering pipeline.
          </div>
          <div className="mt-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Back to top ↑</Link>
          </div>
        </div>
      </section>
    </div>
  );
}


