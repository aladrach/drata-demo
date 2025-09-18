# Drata Marketing Feature Pages — CMS Schema & Frontend Scaffolding

> Purpose: scaffold a reusable landing-page system with real-time data and room for personalization, aligned with the assessment requirements for modular components, server-side data with caching, and documentation marketers can follow.  &#x20;

---

## Tech assumptions

* Stack: Next.js App Router, React, TypeScript, Tailwind, ShadCN for components/UI, Contentful, Vercel.&#x20;
* Personalization and CWV remain first-class concerns; one block consumes a public API server-side with caching and graceful fallback. &#x20;

---

## Contentful content model (IDs are canonical)

### Core types

**`page`**

* `title` (Symbol, required)
* `slug` (Symbol, required, unique)
* `seo` (Link → `seo`)
* `theme` (Symbol: `light` | `dark` | `auto`)
* `audienceHints` (Symbol)
* `sections` (Array of Links → any block type; orderable)

**`seo`**

* `metaTitle` (Symbol, required, ≤60)
* `metaDescription` (Text, ≤160)
* `ogImage` (Asset)
* `canonicalUrl` (Symbol)

**`cta`**

* `label` (Symbol, required)
* `href` (Symbol, required)
* `style` (Symbol: `primary` | `secondary` | `link`)

**`designControls`**

* `paddingTop`/`paddingBottom` (Symbol: `none|sm|md|lg|xl`)
* `background` (Symbol: `default|subtle|brand|surface|image`)
* `backgroundImage` (Asset, optional)
* `containerWidth` (Symbol: `narrow|default|wide`)
* `align` (Symbol: `start|center|end`)
* `hideOn` (Array\<Symbol: `mobile|tablet|desktop`>)
* `variant` (Symbol)

### Block types

**`hero`**

* `eyebrow` (Symbol)
* `headline` (Symbol, required)
* `subhead` (Text)
* `primaryCTA`/`secondaryCTA` (Link → `cta`)
* `media` (Asset)
* `design` (Link → `designControls`)

**`featureItem`**

* `icon` (Asset)
* `title` (Symbol, required)
* `body` (Text)
* `link` (Link → `cta`)

**`featureGrid`**

* `heading` (Symbol)
* `intro` (Text)
* `items` (Array\<Link→`featureItem`>, 3–12)
* `columns` (Integer: 2|3|4)
* `design` (Link → `designControls`)

**`testimonial`**

* `quote` (Text, required)
* `authorName` (Symbol)
* `authorTitle` (Symbol)
* `authorLogo` (Asset)
* `link` (Link → `cta`)
* `design` (Link → `designControls`)

**`ctaBanner`**

* `headline` (Symbol, required)
* `body` (Text)
* `cta` (Link → `cta`, required)
* `design` (Link → `designControls`)

**`logoWall`**

* `heading` (Symbol)
* `logos` (Array<Asset>, 6–24)
* `design` (Link → `designControls`)

**`contentSplit`**

* `layout` (Symbol: `imageLeft|imageRight`)
* `image` (Asset)
* `heading` (Symbol)
* `body` (RichText)
* `cta` (Link → `cta`)
* `design` (Link → `designControls`)

**`faqItem`**

* `question` (Symbol, required)
* `answer` (RichText, required)

**`faq`**

* `heading` (Symbol)
* `items` (Array\<Link→`faqItem`>, 1–20)
* `design` (Link → `designControls`)

**`richTextBlock`**

* `heading` (Symbol)
* `body` (RichText)
* `design` (Link → `designControls`)

**`productDataCallout`**  *(server-side real-time data)*

* `heading` (Symbol)
* `dataSource` (Symbol: `openweather|worldbank`)
* `locationOrQuery` (Symbol)
* `metricKeys` (Array<Symbol>)
* `format` (Symbol)
* `fallbackText` (Symbol)
* `design` (Link → `designControls`)

> One block must pull real-time data without overloading client or APIs; render with server-side caching and a fallback. &#x20;

---

## Relationships (ASCII)

```
page
 ├─ seo (seo)
 └─ sections[] → (hero | featureGrid | testimonial | ctaBanner | logoWall |
                   contentSplit | faq | richTextBlock | productDataCallout)

hero → primaryCTA/secondaryCTA (cta)
featureGrid → items[] (featureItem)
testimonial → link (cta)
ctaBanner → cta (cta)
contentSplit → cta (cta)
faq → items[] (faqItem)

All blocks → design (designControls)
```

---

## TypeScript domain models (frontend)

```ts
// Shared
type ID = string;

export type CTA = { label: string; href: string; style?: 'primary'|'secondary'|'link' };

export type DesignControls = {
  paddingTop?: 'none'|'sm'|'md'|'lg'|'xl';
  paddingBottom?: 'none'|'sm'|'md'|'lg'|'xl';
  background?: 'default'|'subtle'|'brand'|'surface'|'image';
  backgroundImage?: { id: ID; url: string } | null;
  containerWidth?: 'narrow'|'default'|'wide';
  align?: 'start'|'center'|'end';
  hideOn?: Array<'mobile'|'tablet'|'desktop'>;
  variant?: string;
};

export type SEO = {
  metaTitle: string;
  metaDescription?: string;
  ogImage?: { id: ID; url: string } | null;
  canonicalUrl?: string;
};

// Blocks
export type Hero = {
  __typename: 'hero';
  eyebrow?: string;
  headline: string;
  subhead?: string;
  primaryCTA?: CTA;
  secondaryCTA?: CTA;
  media?: { id: ID; url: string; width?: number; height?: number } | null;
  design?: DesignControls;
};

export type FeatureItem = { title: string; body?: string; icon?: { id: ID; url: string } | null; link?: CTA };
export type FeatureGrid = {
  __typename: 'featureGrid';
  heading?: string;
  intro?: string;
  items: FeatureItem[];
  columns?: 2|3|4;
  design?: DesignControls;
};

export type Testimonial = {
  __typename: 'testimonial';
  quote: string; authorName?: string; authorTitle?: string;
  authorLogo?: { id: ID; url: string } | null; link?: CTA; design?: DesignControls;
};

export type CTABanner = { __typename: 'ctaBanner'; headline: string; body?: string; cta: CTA; design?: DesignControls };
export type LogoWall = { __typename: 'logoWall'; heading?: string; logos: { id: ID; url: string }[]; design?: DesignControls };
export type ContentSplit = {
  __typename: 'contentSplit';
  layout?: 'imageLeft'|'imageRight';
  image?: { id: ID; url: string } | null;
  heading?: string;
  body?: any; // RichText JSON
  cta?: CTA;
  design?: DesignControls;
};
export type FAQItem = { question: string; answer: any };
export type FAQ = { __typename: 'faq'; heading?: string; items: FAQItem[]; design?: DesignControls };
export type RichTextBlock = { __typename: 'richTextBlock'; heading?: string; body: any; design?: DesignControls };

export type ProductDataCallout = {
  __typename: 'productDataCallout';
  heading?: string;
  dataSource: 'openweather'|'worldbank';
  locationOrQuery: string;
  metricKeys: string[];
  format?: string;
  fallbackText?: string;
  design?: DesignControls;
};

// Union
export type Block =
  | Hero | FeatureGrid | Testimonial | CTABanner | LogoWall
  | ContentSplit | FAQ | RichTextBlock | ProductDataCallout;

export type Page = {
  title: string;
  slug: string;
  theme?: 'light'|'dark'|'auto';
  audienceHints?: string;
  seo?: SEO;
  sections: Block[];
};
```

---

## Rendering contract

```ts
// lib/blocks/registry.ts
import Hero from '@/components/blocks/Hero';
import FeatureGrid from '@/components/blocks/FeatureGrid';
import Testimonial from '@/components/blocks/Testimonial';
import CTABanner from '@/components/blocks/CTABanner';
import LogoWall from '@/components/blocks/LogoWall';
import ContentSplit from '@/components/blocks/ContentSplit';
import FAQ from '@/components/blocks/FAQ';
import RichTextBlock from '@/components/blocks/RichTextBlock';
import ProductDataCallout from '@/components/blocks/ProductDataCallout';

export const blockRegistry = {
  hero: Hero,
  featureGrid: FeatureGrid,
  testimonial: Testimonial,
  ctaBanner: CTABanner,
  logoWall: LogoWall,
  contentSplit: ContentSplit,
  faq: FAQ,
  richTextBlock: RichTextBlock,
  productDataCallout: ProductDataCallout,
} as const;
```

```tsx
// app/(marketing)/[slug]/page.tsx
import { getPageBySlug } from '@/lib/cms/contentful';
import { blockRegistry } from '@/lib/blocks/registry';

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await getPageBySlug(params.slug);
  if (!page) return null; // or notFound()

  return (
    <>
      {page.sections.map((s, i) => {
        const Cmp = blockRegistry[(s as any).__typename as keyof typeof blockRegistry];
        return Cmp ? <Cmp key={i} {...s} /> : null;
      })}
    </>
  );
}
```

---

## Tailwind mapping for `designControls`

```ts
export const padMap = { none: '', sm: 'py-4', md: 'py-8', lg: 'py-12', xl: 'py-20' };
export const widthMap = { narrow: 'max-w-3xl', default: 'max-w-6xl', wide: 'max-w-7xl' };
export const alignMap = { start: 'items-start', center: 'items-center', end: 'items-end' };
export const bgMap = {
  default: 'bg-white dark:bg-zinc-900',
  subtle: 'bg-zinc-50 dark:bg-zinc-950',
  brand: 'bg-[var(--brand-50)] dark:bg-[var(--brand-900)]',
  surface: 'bg-transparent',
  image: '' // apply background image inline
};
```

```tsx
// components/blocks/_Section.tsx
export default function Section({ design, children }: { design?: DesignControls; children: React.ReactNode }) {
  const pTop = design?.paddingTop ?? 'md';
  const pBottom = design?.paddingBottom ?? 'md';
  const width = design?.containerWidth ?? 'default';
  const align = design?.align ?? 'start';
  const bg = design?.background ?? 'surface';

  return (
    <section className={`${padMap[pTop]} ${padMap[pBottom]} ${bgMap[bg]}`}>
      <div className={`mx-auto px-4 ${widthMap[width]} grid ${alignMap[align]}`}>{children}</div>
    </section>
  );
}
```

---

## Contentful fetch (CDA GraphQL)

```ts
// lib/cms/contentful.ts
const QUERY = /* GraphQL */ `
query PageBySlug($slug: String!, $preview: Boolean = false) {
  pageCollection(limit: 1, where: { slug: $slug }, preview: $preview) {
    items {
      title
      slug
      theme
      audienceHints
      seo { metaTitle metaDescription canonicalUrl ogImage { url width height } }
      sectionsCollection {
        items {
          __typename
          ... on Hero { eyebrow headline subhead primaryCTA { label href style } secondaryCTA { label href style } media { url width height } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on FeatureGrid { heading intro columns design { paddingTop paddingBottom background containerWidth align hideOn variant }
            itemsCollection { items { title body icon { url width height } link { label href style } } }
          }
          ... on Testimonial { quote authorName authorTitle authorLogo { url width height } link { label href style } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on CtaBanner { headline body cta { label href style } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on LogoWall { heading logosCollection { items { url width height } } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on ContentSplit { layout image { url width height } heading body json cta { label href style } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on Faq { heading itemsCollection { items { question answer { json } } } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on RichTextBlock { heading body { json } design { paddingTop paddingBottom background containerWidth align hideOn variant } }
          ... on ProductDataCallout { heading dataSource locationOrQuery metricKeys format fallbackText design { paddingTop paddingBottom background containerWidth align hideOn variant } }
        }
      }
    }
  }
}
`;
```

---

## Real-time data block contract

* Route handler: `/app/api/data/[source]/route.ts`
* Supported `source`: `openweather`, `worldbank`
* Cache strategy: `fetch(..., { next: { revalidate: 300 } })` or edge cache by key
* Input: `{ source, query, metricKeys, format }`
* Output shape:

```ts
export type LiveMetric = {
  ok: boolean;
  data?: Record<string, number | string>;
  error?: string;
  asOf?: string; // ISO
};
```

* Component behavior:

  1. Server component calls route handler during render.
  2. If `ok`, map `metricKeys` to presentable labels/units.
  3. If not ok, render `fallbackText`.

> Meets the “server-side, cached, graceful fallback” requirement.&#x20;

---

## Personalization extension points (for later)

* Cookie or header provides `accountId` or `segment`.
* Edge middleware resolves `segment` and injects it into request headers.
* Block props accept optional `variantKey` selection; default is global.
* CMS: either segment fields per block or a parallel “variant” entry per block linked by `segmentKey`.

> Architecture should enable account-level variants while keeping CWV green and avoiding client flicker.&#x20;

---

## Routing & pages

* Marketing routes under `/features/[slug]`
* Fallback 404 for missing slugs
* Prebuild common slugs via `generateStaticParams` plus revalidation for freshness

---

## Env & config

* `CONTENTFUL_SPACE_ID`
* `CONTENTFUL_ENV`
* `CONTENTFUL_CDA_TOKEN` (delivery)
* `CONTENTFUL_CPA_TOKEN` (preview, optional)
* `OPENWEATHER_API_KEY` (if used)

---

## Performance defaults

* Hero image eager, others lazy with explicit width/height to avoid CLS.
* Fonts: `display: swap`, subset if needed.
* No client hydration unless interactive.
* LCP target < 2.5s, CLS < 0.1. Track via `web-vitals` and GTM.&#x20;

---

## Authoring workflow (editor-facing)

1. Create `SEO`, `CTA`s, and `DesignControls`.
2. Create blocks (`Hero`, etc.), picking `DesignControls`.
3. Create `Page`, set `slug`, attach `SEO`, and add `sections` in order.
4. Publish and preview.

> Explicitly required: “document the schema and authoring workflow so a marketer could spin up new pages without engineering help.”&#x20;

---

## Migration IDs (for reference)

* Content types: `page`, `seo`, `cta`, `designControls`, `hero`, `featureItem`, `featureGrid`, `testimonial`, `ctaBanner`, `logoWall`, `contentSplit`, `faqItem`, `faq`, `richTextBlock`, `productDataCallout`.

---

## Acceptance checklist

* [ ] `page` renders via section registry
* [ ] One `productDataCallout` block wired to server-side route with cache + fallback
* [ ] Lighthouse green CWV on demo page
* [ ] Docs present for schema and authoring
* [ ] Repo plus Vercel deploy ready for review

---

**End of schema summary.**
