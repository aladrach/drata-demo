import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TocNav from "@/components/TocNav";

export const metadata = {
  title: "Documentation | Drata Marketing Demo",
  description: "Architecture, content model, data fetching, personalization, performance, and deployment docs.",
};

export default function DocsPage() {
  const toc = [
    { href: "#content-model", label: "Content model & components" },
    { href: "#landing", label: "Landing page implementation" },
    { href: "#personalization", label: "Personalization at scale" },
    { href: "#performance", label: "Performance & instrumentation" },
    { href: "#run", label: "Run locally & deploy" },
    { href: "#ai", label: "Optional AI/LLM" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <section className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">Docs</Badge>
            <span className="text-xs text-muted-foreground">Updated regularly</span>
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            Drata Marketing Demo Documentation
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Architecture, content model, data fetching, personalization, performance, and operations for this demo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/features/demo-feature">View sample feature page</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/chat">Open AI chat</Link>
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
          <h2 id="content-model">1) Content model and component library</h2>
          <p>
            Pages are composed from modular blocks stored in a headless CMS (Contentful). The library includes blocks
            such as <code>Hero</code>, <code>FeatureGrid</code>, <code>CTABanner</code>, <code>Testimonial</code>, <code>LogoWall</code>,
            <code>ProductDataCallout</code>, and <code>RichTextBlock</code>. Each block is reusable and configurable by
            non-technical editors via fields like background theme, media, copy, and CTAs. The Next.js app maps CMS
            entries to React components via a registry and renders them under the App Router.
          </p>
          <ul>
            <li>
              <strong>Flexible composition</strong>: Editors build pages by ordering blocks. Each block has design fields
              (e.g., background, spacing) and content fields (eyebrow, headline, body, media, CTAs).
            </li>
            <li>
              <strong>Registry mapping</strong>: CMS block type → React component mapping is handled in <code>lib/blocks/registry.ts</code>.
            </li>
            <li>
              <strong>Authoring workflow</strong>: Create a page entry, add blocks, configure fields, publish. The site fetches
              published content at request/build time with caching.
            </li>
          </ul>

          <h3>Schema overview (Contentful)</h3>
          <ul>
            <li><strong>Page</strong>: slug (Symbol), title (Symbol), description (Text), blocks (Array of References)</li>
            <li><strong>Hero</strong>: eyebrow, headline, subhead, primaryCTA, secondaryCTA, media, design</li>
            <li><strong>FeatureGrid</strong>: items[] (icon, title, description), design</li>
            <li><strong>CTABanner</strong>: headline, body, cta, design</li>
            <li><strong>Testimonial</strong>: quote, author, role, company, logo, design</li>
            <li><strong>ProductDataCallout</strong>: title, metric, sourceApi, refreshInterval, design</li>
            <li><strong>RichTextBlock</strong>: richText, design</li>
          </ul>

          <p>
            See code for examples of block implementations in <code>src/components/blocks/*</code> and CMS utilities in
            <code>src/lib/cms/*</code>.
          </p>

          <h2 id="landing">2) Landing page implementation</h2>
          <p>
            The sample landing page at <Link href="/features/demo-feature">/features/demo-feature</Link> renders CMS-defined blocks.
            Real-time data is fetched server-side in components like <code>ProductDataCallout</code>. Data requests run on the server
            with caching (e.g., ISR or in-memory/edge caching) to protect external APIs and keep client bundles lean.
          </p>
          <ul>
            <li>
              <strong>Server-side fetch</strong>: Public API calls use <code>fetch</code> with <code>next: &#123; revalidate: N &#125;</code> or library helpers
              (see <code>lib/fetchInlineMedia.ts</code>) to cache responses for a defined TTL.
            </li>
            <li>
              <strong>Graceful fallback</strong>: If an API fails, components render a cached value when available or display a
              placeholder with contextual messaging while maintaining layout stability.
            </li>
            <li>
              <strong>Core Web Vitals</strong>: Heavy lifting is done on the server; the client receives minimal JS.
            </li>
          </ul>

          <h2 id="personalization">3) Personalization at scale</h2>
          <p>
            Personalization is delivered at the edge using a combination of request-time signals and an hourly-updated CDP dataset.
            The approach avoids client-side flicker by resolving variants before HTML is sent.
          </p>
          <h3>High-level architecture</h3>
          <ul>
            <li><strong>Edge routing</strong>: A middleware analyzes signals (e.g., domain, cookie, IP-to-segment) and attaches a segment to the request.</li>
            <li><strong>Server-rendered variants</strong>: Pages read the segment and select CMS-registered variants for hero, CTAs, or case studies.</li>
            <li><strong>Caching</strong>: Cache by segment key. Use ISR for base content; layer segment-aware caching at the edge with short TTLs.</li>
          </ul>
          <h3>Data flow and performance</h3>
          <ul>
            <li><strong>No flicker</strong>: Variants are chosen server-side; the client never swaps content post-hydration.</li>
            <li><strong>SEO</strong>: Canonical URLs and consistent HTML per segment; bots receive default content unless whitelisted.</li>
            <li><strong>Freshness</strong>: CDP exports a segment map hourly. An ingestion job writes to a KV/Edge Config used at request time.</li>
          </ul>
          <h3>Native CMS integration</h3>
          <ul>
            <li><strong>Variant groups</strong>: Each block supports an optional <code>variants[]</code> field keyed by <code>segmentId</code>.</li>
            <li><strong>Editor workflow</strong>: Marketers create base content, then add variants for key segments inside the same entry.</li>
            <li><strong>Preview</strong>: Editors can append <code>?segment=finance</code> to preview a segment prior to publish.</li>
          </ul>
          <h3>Rollout strategy</h3>
          <ol>
            <li><strong>MVP (0–90 days)</strong>: Edge segment detection, hero/CTA variants for top 5 segments, segment cache key, preview.</li>
            <li><strong>Scale (90–180 days)</strong>: Expand variants to case studies, integrate CDP webhooks, add analytics by segment.</li>
            <li><strong>Long-term</strong>: Self-serve rules in CMS, rules testing, holdouts, and guardrails for performance budgets.</li>
          </ol>

          <h2 id="performance">4) Performance & instrumentation</h2>
          <ul>
            <li><strong>Targets</strong>: LCP &lt; 2.5s, CLS &lt; 0.1, TBT &lt; 200ms.</li>
            <li><strong>Techniques</strong>: Server components, image optimization, font optimization, code splitting, minimal client JS.</li>
            <li><strong>Monitoring</strong>: Field data via web-vitals reporting to analytics and RUM; CI checks on budgets.</li>
          </ul>

          <h2 id="run">5) Running locally and deploy</h2>
          <h3>Local</h3>
          <pre><code>pnpm install
pnpm dev</code></pre>
          <p>
            Configure Contentful credentials via environment variables if fetching from a real space. For this demo, static examples
            are included and dynamic routes like <code>/features/[slug]</code> demonstrate the rendering pipeline.
          </p>
          <h3>Deploy</h3>
          <p>
            Deploy on Vercel for edge rendering and ISR. Set environment variables, attach Contentful tokens, and enable Edge Config/KV
            for personalization segment maps. Configure <code>revalidate</code> on data fetches to balance freshness and cost.
          </p>

          <h2 id="ai">Optional: AI/LLM integration</h2>
          <p>
            AI can assist with content generation and summaries (e.g., generating FAQs or block copy). Use server-side invocations with
            caching and cost controls, and store outputs in CMS to avoid regenerating per-request. For privacy, avoid sending PII,
            and prefer deterministic prompts with strict token caps. See <Link href="/chat">/chat</Link> for an example chat UI.
          </p>

          <Separator className="my-8" />
          <div className="text-sm text-muted-foreground">
            Source: explore components under <code>src/components</code> and API routes under <code>src/app/api</code>.
          </div>
          <div className="mt-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Back to top ↑</Link>
          </div>
        </div>
      </section>
    </div>
  );
}


