import 'server-only';
import { cache } from 'react';
import type {
  Block,
  CTA,
  ContentSplit,
  CTABanner,
  DesignControls,
  FAQ,
  FAQItem,
  FeatureGrid,
  FeatureItem,
  Hero,
  LogoWall,
  Page,
  ProductDataCallout,
  RichTextBlock,
  SEO,
  AIChat,
} from '@/lib/cms/types';

const SPACE = process.env.CONTENTFUL_SPACE_ID as string;
const ENV = process.env.CONTENTFUL_ENV || 'master';
const CDA = process.env.CONTENTFUL_CDA_TOKEN as string;
const CPA = process.env.CONTENTFUL_CPA_TOKEN as string | undefined;

const endpoint = `https://graphql.contentful.com/content/v1/spaces/${SPACE}/environments/${ENV}`;

type GraphQLVariables = Record<string, string | number | boolean | null | undefined | string[] | number[] | boolean[]>;

async function gql<T>(query: string, variables?: GraphQLVariables, { preview = false }: { preview?: boolean } = {}): Promise<T> {
  const token = preview && CPA ? CPA : CDA;
  if (!SPACE || !ENV || !token) {
    throw new Error('Missing Contentful env vars (CONTENTFUL_SPACE_ID, CONTENTFUL_ENV, CONTENTFUL_CDA_TOKEN).');
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    // Cache per Next.js defaults; rely on route-level revalidation for pages
    next: { revalidate: 300 },
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data as T;
}

const PAGE_BY_SLUG = /* GraphQL */ `
query PageBySlug($slug: String!, $preview: Boolean = false) {
  pageCollection(limit: 1, where: { slug: $slug }, preview: $preview) {
    items {
      title
      slug
      theme
      audienceHints
      seo { metaTitle metaDescription canonicalUrl ogImage { url width height } }
      sectionsCollection(limit: 20) {
        items {
          __typename
          ... on Hero { eyebrow headline subhead primaryCta { label href style } secondaryCta { label href style } media { url width height } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on FeatureGrid { heading intro columns design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } }
            itemsCollection(limit: 12) { items { title body icon { url width height } link { label href style } } }
          }
          ... on Testimonial { quote authorName authorTitle authorLogo { url width height } link { label href style } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on CtaBanner { headline bodyText: body cta { label href style } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on LogoWall { heading logosCollection(limit: 24) { items { url width height } } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on ContentSplit { layout image { url width height } heading bodyRich: body { json } cta { label href style } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on Faq { heading itemsCollection(limit: 20) { items { question answer { json } } } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on RichTextBlock { heading bodyRich: body { json } design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on ProductDataCallout { heading dataSource locationOrQuery metricKeys format fallbackText design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
          ... on BlockAiChat { heading design { paddingTop paddingBottom background containerWidth align hideOn variant textTheme backgroundImage { url width height } } }
        }
      }
    }
  }
}`;

const PAGE_SLUGS = /* GraphQL */ `
query PageSlugs($preview: Boolean = false) {
  pageCollection(limit: 100, preview: $preview) {
    items { slug }
  }
}`;

type ContentfulAsset = { url: string; width?: number; height?: number } | null;

type DesignInput = Partial<DesignControls> & { [key: string]: unknown };
function mapDesign(d?: DesignInput): DesignControls | undefined {
  if (!d) return undefined;
  const img = (d as { backgroundImage?: { url?: string; width?: number; height?: number } | null }).backgroundImage ?? null;
  return {
    paddingTop: d.paddingTop ?? undefined,
    paddingBottom: d.paddingBottom ?? undefined,
    background: d.background ?? undefined,
    containerWidth: d.containerWidth ?? undefined,
    align: d.align ?? undefined,
    hideOn: d.hideOn ?? undefined,
    variant: d.variant ?? undefined,
    textTheme: (d as { textTheme?: unknown }).textTheme as DesignControls['textTheme'] | undefined,
    backgroundImage: img && img.url ? { id: img.url, url: img.url } : null,
  };
}

type CTAInput = { label: string; href: string; style?: string } | undefined | null;
function normalizeCTAStyle(style?: string): CTA['style'] | undefined {
  if (style === 'primary' || style === 'secondary' || style === 'link') return style;
  return undefined;
}
function mapCTA(c?: CTAInput): CTA | undefined {
  if (!c) return undefined;
  return { label: c.label, href: c.href, style: normalizeCTAStyle(c.style) };
}

type HeroInput = {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  primaryCTA?: CTAInput;
  secondaryCTA?: CTAInput;
  primaryCta?: CTAInput;
  secondaryCta?: CTAInput;
  media?: { url: string; width?: number; height?: number } | null;
  design?: DesignInput;
};
function mapHero(i: HeroInput): Hero {
  const img: ContentfulAsset = i.media ?? null;
  return {
    __typename: 'hero',
    eyebrow: i.eyebrow ?? undefined,
    headline: i.headline,
    subhead: i.subhead ?? undefined,
    primaryCTA: mapCTA(i.primaryCta),
    secondaryCTA: mapCTA(i.secondaryCta),
    media: img ? { id: img.url, url: img.url, width: img.width, height: img.height } : null,
    design: mapDesign(i.design),
  };
}

type FeatureGridInput = {
  heading?: string;
  intro?: string;
  itemsCollection?: { items: Array<{ title: string; body?: string; icon?: { url: string } | null; link?: CTAInput }>; };
  columns?: 2 | 3 | 4;
  design?: DesignInput;
};
function mapFeatureGrid(i: FeatureGridInput): FeatureGrid {
  const items: FeatureItem[] = (i.itemsCollection?.items ?? []).map((fi) => ({
    title: fi.title,
    body: fi.body ?? undefined,
    icon: fi.icon ? { id: fi.icon.url, url: fi.icon.url } : null,
    link: mapCTA(fi.link),
  }));
  return {
    __typename: 'featureGrid',
    heading: i.heading ?? undefined,
    intro: i.intro ?? undefined,
    items,
    columns: i.columns ?? undefined,
    design: mapDesign(i.design),
  };
}

type Testimonial = import('@/lib/cms/types').Testimonial;
type TestimonialInput = {
  quote: string;
  authorName?: string;
  authorTitle?: string;
  authorLogo?: { url: string } | null;
  link?: CTAInput;
  design?: DesignInput;
};
function mapTestimonial(i: TestimonialInput): Testimonial {
  return {
    __typename: 'testimonial',
    quote: i.quote,
    authorName: i.authorName ?? undefined,
    authorTitle: i.authorTitle ?? undefined,
    authorLogo: i.authorLogo ? { id: i.authorLogo.url, url: i.authorLogo.url } : null,
    link: mapCTA(i.link),
    design: mapDesign(i.design),
  };
}

type CTABannerInput = { headline: string; body?: string; bodyText?: string; cta: CTAInput; design?: DesignInput };
function mapCTABanner(i: CTABannerInput): CTABanner {
  return {
    __typename: 'ctaBanner',
    headline: i.headline,
    body: (i.bodyText ?? i.body) ?? undefined,
    cta: mapCTA(i.cta)!,
    design: mapDesign(i.design),
  };
}

type LogoWallInput = { heading?: string; logosCollection?: { items: Array<{ url: string }> }; design?: DesignInput };
function mapLogoWall(i: LogoWallInput): LogoWall {
  const logos = (i.logosCollection?.items ?? []).map((a) => ({ id: a.url, url: a.url }));
  return { __typename: 'logoWall', heading: i.heading ?? undefined, logos, design: mapDesign(i.design) };
}

type ContentSplitInput = {
  layout?: 'imageLeft' | 'imageRight';
  image?: { url: string } | null;
  heading?: string;
  body?: { json: unknown };
  bodyRich?: { json: unknown };
  cta?: CTAInput;
  design?: DesignInput;
};
function mapContentSplit(i: ContentSplitInput): ContentSplit {
  return {
    __typename: 'contentSplit',
    layout: i.layout ?? undefined,
    image: i.image ? { id: i.image.url, url: i.image.url } : null,
    heading: i.heading ?? undefined,
    body: (i.bodyRich ?? i.body)?.json ?? undefined,
    cta: mapCTA(i.cta),
    design: mapDesign(i.design),
  };
}

type FAQInput = { heading?: string; itemsCollection?: { items: Array<{ question: string; answer?: { json: unknown } }> }; design?: DesignInput };
function mapFAQ(i: FAQInput): FAQ {
  const items: FAQItem[] = (i.itemsCollection?.items ?? []).map((q) => ({
    question: q.question,
    answer: q.answer?.json,
  }));
  return { __typename: 'faq', heading: i.heading ?? undefined, items, design: mapDesign(i.design) };
}

type RichTextBlockInput = { heading?: string; body?: { json: unknown }; design?: DesignInput };
type RichTextBlockInputAliased = { heading?: string; bodyRich?: { json: unknown }; design?: DesignInput };
function mapRichTextBlock(i: RichTextBlockInput | RichTextBlockInputAliased): RichTextBlock {
  const rich = (i as RichTextBlockInputAliased).bodyRich ?? (i as RichTextBlockInput).body;
  return { __typename: 'richTextBlock', heading: i.heading ?? undefined, body: rich?.json, design: mapDesign(i.design) };
}

type ProductDataCalloutInput = {
  heading?: string;
  dataSource: 'openweather' | 'worldbank';
  locationOrQuery: string;
  metricKeys?: string[];
  format?: string;
  fallbackText?: string;
  design?: DesignInput;
};
function mapProductDataCallout(i: ProductDataCalloutInput): ProductDataCallout {
  return {
    __typename: 'productDataCallout',
    heading: i.heading ?? undefined,
    dataSource: i.dataSource,
    locationOrQuery: i.locationOrQuery,
    metricKeys: i.metricKeys ?? [],
    format: i.format ?? undefined,
    fallbackText: i.fallbackText ?? undefined,
    design: mapDesign(i.design),
  };
}

type BlockInput = { __typename?: string } & Record<string, unknown>;
function mapBlock(i: BlockInput): Block | null {
  if (!i || !i.__typename) return null;
  switch (i.__typename) {
    case 'Hero':
      return mapHero(i as HeroInput);
    case 'FeatureGrid':
      return mapFeatureGrid(i as FeatureGridInput);
    case 'Testimonial':
      return mapTestimonial(i as TestimonialInput);
    case 'CtaBanner':
      return mapCTABanner(i as CTABannerInput);
    case 'LogoWall':
      return mapLogoWall(i as LogoWallInput);
    case 'ContentSplit':
      return mapContentSplit(i as ContentSplitInput);
    case 'Faq':
      return mapFAQ(i as FAQInput);
    case 'RichTextBlock':
      return mapRichTextBlock(i as RichTextBlockInput);
    case 'ProductDataCallout':
      return mapProductDataCallout(i as ProductDataCalloutInput);
    case 'BlockAiChat':
      return {
        __typename: 'aiChat',
        heading: (i as { heading?: string }).heading ?? undefined,
        design: mapDesign((i as { design?: DesignInput }).design),
      } as AIChat;
    default:
      return null;
  }
}

export const getPageBySlug = cache(async (slug: string, { preview = false }: { preview?: boolean } = {}): Promise<Page | null> => {
  const data = await gql<unknown>(PAGE_BY_SLUG, { slug, preview }, { preview });
  type PageItem = {
    title: string;
    slug: string;
    theme?: string;
    audienceHints?: string;
    seo?: { metaTitle: string; metaDescription?: string; canonicalUrl?: string; ogImage?: { url: string } | null };
    sectionsCollection?: { items?: unknown[] };
  };
  const item = (data as { pageCollection?: { items?: PageItem[] } })?.pageCollection?.items?.[0];
  if (!item) return null;
  const seo: SEO | undefined = item.seo
    ? {
        metaTitle: item.seo.metaTitle,
        metaDescription: item.seo.metaDescription ?? undefined,
        canonicalUrl: item.seo.canonicalUrl ?? undefined,
        ogImage: item.seo.ogImage ? { id: item.seo.ogImage.url, url: item.seo.ogImage.url } : null,
      }
    : undefined;
  const sectionsSrc = (item as { sectionsCollection?: { items?: unknown[] } }).sectionsCollection?.items ?? [];
  const sections: Block[] = sectionsSrc
    .map((x) => mapBlock(x as BlockInput))
    .filter(Boolean) as Block[];
  const page: Page = {
    title: item.title,
    slug: item.slug,
    theme: item.theme === 'light' || item.theme === 'dark' || item.theme === 'auto' ? item.theme : undefined,
    audienceHints: item.audienceHints ?? undefined,
    seo,
    sections,
  };
  return page;
});

export const listPageSlugs = cache(async ({ preview = false }: { preview?: boolean } = {}): Promise<string[]> => {
  const data = await gql<unknown>(PAGE_SLUGS, { preview }, { preview });
  const items = (data as { pageCollection?: { items?: Array<{ slug?: string }> } })?.pageCollection?.items ?? [];
  return items.map((i) => i.slug || '').filter(Boolean);
});


// Lightweight collection queries to support chatbot CTAs, FAQs, and Featured Pages
const CHATBOT_CTAS = /* GraphQL */ `
query ChatbotCTAs($preview: Boolean = false) {
  chatbotCtAsCollection(limit: 200, preview: $preview) {
    items { ctaName ctaUrl }
  }
}`;

const CHATBOT_FEATURED_PAGES = /* GraphQL */ `
query ChatbotFeaturedPages($preview: Boolean = false) {
  chatbotFeaturedPagesCollection(limit: 200, preview: $preview) {
    items { pageName pageUrl }
  }
}`;

const CHATBOT_FAQS = /* GraphQL */ `
query ChatbotFaqs($preview: Boolean = false) {
  chatbotFaQsCollection(limit: 200, preview: $preview) {
    items { question }
  }
}`;

export const listChatbotCTAs = cache(async ({ preview = false }: { preview?: boolean } = {}): Promise<Array<{ name: string; url: string }>> => {
  const data = await gql<unknown>(CHATBOT_CTAS, { preview }, { preview });
  const items = (data as { chatbotCtAsCollection?: { items?: Array<{ ctaName?: string; ctaUrl?: string }> } })?.chatbotCtAsCollection?.items ?? [];
  return items
    .map((i) => ({ name: String(i.ctaName || ''), url: String(i.ctaUrl || '') }))
    .filter((x) => x.name && x.url);
});

export const listChatbotFeaturedPages = cache(async ({ preview = false }: { preview?: boolean } = {}): Promise<Array<{ name: string; url: string }>> => {
  const data = await gql<unknown>(CHATBOT_FEATURED_PAGES, { preview }, { preview });
  const items = (data as { chatbotFeaturedPagesCollection?: { items?: Array<{ pageName?: string; pageUrl?: string }> } })?.chatbotFeaturedPagesCollection?.items ?? [];
  return items
    .map((i) => ({ name: String(i.pageName || ''), url: String(i.pageUrl || '') }))
    .filter((x) => x.name && x.url);
});

export const listChatbotFaqSuggestions = cache(async ({ preview = false }: { preview?: boolean } = {}): Promise<string[]> => {
  const data = await gql<unknown>(CHATBOT_FAQS, { preview }, { preview });
  const items = (data as { chatbotFaQsCollection?: { items?: Array<{ question?: string }> } })?.chatbotFaQsCollection?.items ?? [];
  const seen = new Set<string>();
  return items
    .map((i) => String(i.question || '').trim())
    .filter((q) => q && !seen.has(q) && (seen.add(q), true));
});


// Chatbot Knowledge Base (for RAG grounding)
const CHATBOT_KNOWLEDGE_BASE = /* GraphQL */ `
query ChatbotKnowledgeBase($preview: Boolean = false, $limit: Int = 200, $skip: Int = 0) {
  chatbotKnowledgeBaseCollection(limit: $limit, skip: $skip, preview: $preview) {
    total
    items {
      contentName
      sourceUrl
      content { json }
    }
  }
}`;

type RichNode = { nodeType?: string; value?: string; content?: RichNode[] } | { [key: string]: unknown };
function flattenRichTextToPlainText(root: { json?: RichNode } | { [key: string]: unknown } | null | undefined, maxLength = 8000): string {
  const docUnknown = (root as { json?: RichNode } | { [key: string]: unknown } | null | undefined);
  const doc: RichNode | undefined = (docUnknown && typeof docUnknown === 'object' && 'json' in docUnknown)
    ? (docUnknown as { json?: RichNode }).json
    : (docUnknown as RichNode);
  if (!doc) return '';
  const parts: string[] = [];
  function walk(node: RichNode) {
    if (!node || typeof node !== 'object') return;
    const value = (node as { value?: unknown }).value;
    if (typeof value === 'string') {
      parts.push(value);
    }
    const kidsRaw = (node as { content?: unknown }).content;
    const kids: RichNode[] = Array.isArray(kidsRaw) ? (kidsRaw as RichNode[]) : [];
    for (const k of kids) walk(k);
  }
  walk(doc);
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

export type ChatbotKBEntry = { name: string; sourceUrl?: string; text: string };
export const listChatbotKnowledgeBase = cache(async ({ preview = false }: { preview?: boolean } = {}): Promise<ChatbotKBEntry[]> => {
  const PAGE_SIZE = 200;
  let all: Array<{ contentName?: string; sourceUrl?: string; content?: { json?: unknown } }> = [];
  // Fetch first page to get total
  const first = await gql<unknown>(CHATBOT_KNOWLEDGE_BASE, { preview, limit: PAGE_SIZE, skip: 0 }, { preview });
  const firstColl = (first as { chatbotKnowledgeBaseCollection?: { total?: number; items?: Array<{ contentName?: string; sourceUrl?: string; content?: { json?: unknown } }> } }).chatbotKnowledgeBaseCollection;
  const total = Math.max(0, Number(firstColl?.total || 0));
  all = (firstColl?.items ?? []).slice();
  // If more pages, iterate
  let fetched = all.length;
  while (fetched < total) {
    const next = await gql<unknown>(CHATBOT_KNOWLEDGE_BASE, { preview, limit: PAGE_SIZE, skip: fetched }, { preview });
    const nextItems = (next as { chatbotKnowledgeBaseCollection?: { items?: Array<{ contentName?: string; sourceUrl?: string; content?: { json?: unknown } }> } }).chatbotKnowledgeBaseCollection?.items ?? [];
    if (!nextItems.length) break;
    all.push(...nextItems);
    fetched += nextItems.length;
  }
  return all
    .map((i) => ({
      name: String(i.contentName || '').trim(),
      sourceUrl: i.sourceUrl || undefined,
      text: flattenRichTextToPlainText(i.content ?? null),
    }))
    .filter((x) => x.name && x.text);
});

