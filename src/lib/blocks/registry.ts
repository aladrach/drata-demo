import Hero from '@/components/blocks/Hero';
import FeatureGrid from '@/components/blocks/FeatureGrid';
import Testimonial from '@/components/blocks/Testimonial';
import CTABanner from '@/components/blocks/CTABanner';
import LogoWall from '@/components/blocks/LogoWall';
import ContentSplit from '@/components/blocks/ContentSplit';
import FAQ from '@/components/blocks/FAQ';
import RichTextBlock from '@/components/blocks/RichTextBlock';
import ProductDataCallout from '@/components/blocks/ProductDataCallout';
import AIChat from '@/components/blocks/AIChat';

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
  aiChat: AIChat,
} as const;


