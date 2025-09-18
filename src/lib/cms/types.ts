// Domain models that mirror the schema in implementation-plan.md

export type ID = string;

export type CTA = {
  label: string;
  href: string;
  style?: 'primary' | 'secondary' | 'link';
};

export type DesignControls = {
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'subtle' | 'brand' | 'surface' | 'image';
  backgroundImage?: { id: ID; url: string } | null;
  containerWidth?: 'narrow' | 'default' | 'wide';
  align?: 'start' | 'center' | 'end';
  hideOn?: Array<'mobile' | 'tablet' | 'desktop'>;
  variant?: string;
  textTheme?: 'adaptive' | 'light' | 'dark';
};

export type SEO = {
  metaTitle: string;
  metaDescription?: string;
  ogImage?: { id: ID; url: string } | null;
  canonicalUrl?: string;
};

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

export type FeatureItem = {
  title: string;
  body?: string;
  icon?: { id: ID; url: string } | null;
  link?: CTA;
};

export type FeatureGrid = {
  __typename: 'featureGrid';
  heading?: string;
  intro?: string;
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  design?: DesignControls;
};

export type Testimonial = {
  __typename: 'testimonial';
  quote: string;
  authorName?: string;
  authorTitle?: string;
  authorLogo?: { id: ID; url: string } | null;
  link?: CTA;
  design?: DesignControls;
};

export type CTABanner = {
  __typename: 'ctaBanner';
  headline: string;
  body?: string;
  cta: CTA;
  design?: DesignControls;
};

export type LogoWall = {
  __typename: 'logoWall';
  heading?: string;
  logos: { id: ID; url: string }[];
  design?: DesignControls;
};

export type ContentSplit = {
  __typename: 'contentSplit';
  layout?: 'imageLeft' | 'imageRight';
  image?: { id: ID; url: string } | null;
  heading?: string;
  body?: unknown; // RichText JSON
  cta?: CTA;
  design?: DesignControls;
};

export type FAQItem = { question: string; answer: unknown };

export type FAQ = {
  __typename: 'faq';
  heading?: string;
  items: FAQItem[];
  design?: DesignControls;
};

export type RichTextBlock = {
  __typename: 'richTextBlock';
  heading?: string;
  body: unknown;
  design?: DesignControls;
};

export type ProductDataCallout = {
  __typename: 'productDataCallout';
  heading?: string;
  dataSource: 'openweather' | 'worldbank';
  locationOrQuery: string;
  metricKeys: string[];
  format?: string;
  fallbackText?: string;
  design?: DesignControls;
};

export type AIChat = {
  __typename: 'aiChat';
  heading?: string;
  design?: DesignControls;
};

export type Block =
  | Hero
  | FeatureGrid
  | Testimonial
  | CTABanner
  | LogoWall
  | ContentSplit
  | FAQ
  | RichTextBlock
  | ProductDataCallout
  | AIChat;

export type Page = {
  title: string;
  slug: string;
  theme?: 'light' | 'dark' | 'auto';
  audienceHints?: string;
  seo?: SEO;
  sections: Block[];
};


