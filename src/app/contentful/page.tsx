import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TocNav from "@/components/TocNav";

export const metadata = {
  title: "Contentful | Drata Marketing Demo",
  description: "Contentful features, schema, and how the CMS maps to React blocks in this demo.",
};

export default function ContentfulPage() {
  const toc = [
    { href: "#overview", label: "Overview" },
    { href: "#content-types", label: "Content types & fields" },
    { href: "#blocks-registry", label: "Block → Component mapping" },
    { href: "#editorial", label: "Editorial workflow" },
    { href: "#api-webhooks", label: "APIs, caching & webhooks" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <section className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">Contentful</Badge>
            <span className="text-xs text-muted-foreground">Schema & features</span>
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            Contentful Features and Schema
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            How this demo models content in Contentful and renders pages from modular blocks with strong editorial
            workflows, caching, and performance.
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
          <h2 id="overview">Overview</h2>
          <p>
            Content is managed in Contentful using a modular, block-based model. Editors compose pages from reusable
            blocks (e.g., Hero, FeatureGrid, CTABanner) and publish without code deploys. The Next.js app fetches
            published entries and maps each block type to a React component via a registry.
          </p>
          <ul>
            <li><strong>Decoupled</strong>: Clear separation of content and presentation.</li>
            <li><strong>Reusable</strong>: The same block types power multiple pages with different props.</li>
            <li><strong>Performant</strong>: Server-rendered blocks with caching and minimal client JS.</li>
          </ul>

          <h2 id="content-types">Content types & fields</h2>
          <p>
            A minimal schema supports a rich marketing site. Example content types and key fields:
          </p>
          <ul>
            <li><strong>Page</strong>: slug (Symbol), title (Symbol), description (Text), sections (Array&lt;Reference&gt;)</li>
            <li><strong>Hero</strong>: eyebrow, headline, subhead, primaryCTA, secondaryCTA, media, design</li>
            <li><strong>FeatureGrid</strong>: items[] (icon, title, description), design</li>
            <li><strong>CTABanner</strong>: headline, body, cta, design</li>
            <li><strong>Testimonial</strong>: quote, author, role, company, logo, design</li>
            <li><strong>ProductDataCallout</strong>: title, metric, sourceApi, refreshInterval, design</li>
            <li><strong>RichTextBlock</strong>: richText, design</li>
          </ul>

          <h2 id="blocks-registry">Block → Component mapping</h2>
          <p>
            The app maintains a mapping between Contentful block types and React components in a registry. When a page
            is requested, its sections are iterated and rendered by looking up the corresponding component.
          </p>
          <pre><code>{`// lib/blocks/registry.ts (conceptual)
export const blockRegistry = {
  Hero: HeroBlock,
  FeatureGrid: FeatureGridBlock,
  CTABanner: CTABannerBlock,
  Testimonial: TestimonialBlock,
  ProductDataCallout: ProductDataCallout,
  RichTextBlock: RichTextBlock,
};`}</code></pre>
          <p>
            This keeps the CMS schema flexible while ensuring type-safe, maintainable component code.
          </p>

          <h2 id="editorial">Editorial workflow</h2>
          <ol>
            <li>Create a <strong>Page</strong> entry with slug, title, and description.</li>
            <li>Add and configure reusable <strong>blocks</strong> (design theme, media, copy, CTAs).</li>
            <li>Preview changes, then <strong>publish</strong>. The site revalidates at the configured TTL.</li>
          </ol>
          <p>
            For personalization, blocks can optionally include <code>variants[]</code> keyed by <code>segmentId</code>.
          </p>

          <h2 id="api-webhooks">APIs, caching & webhooks</h2>
          <ul>
            <li><strong>CDA/CMA</strong>: Read published content via the Delivery API; manage via the Management API.</li>
            <li><strong>Caching</strong>: Use ISR or short TTL revalidation on server-side fetches.</li>
            <li><strong>Webhooks</strong>: On publish, trigger path revalidation to refresh cached HTML.
            </li>
          </ul>

          <Separator className="my-8" />
          <div className="text-sm text-muted-foreground">
            Explore components under <code>src/components/blocks</code> and CMS utilities in <code>src/lib/cms</code>.
          </div>
          <div className="mt-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Back to top ↑</Link>
          </div>
        </div>
      </section>
    </div>
  );
}


