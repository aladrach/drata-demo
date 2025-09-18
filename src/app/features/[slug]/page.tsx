import { notFound } from 'next/navigation';
import { getPageBySlug, listPageSlugs } from '@/lib/cms/contentful';
import { blockRegistry } from '@/lib/blocks/registry';
import type { Block } from '@/lib/cms/types';
import type React from 'react';
import type { Metadata } from 'next';


type Params = { slug: string };

type Registry = typeof blockRegistry;

type BlockKey = keyof Registry;

type ComponentPropsFor<K extends BlockKey> = K extends keyof Registry
  ? Registry[K] extends React.ComponentType<infer P>
    ? P
    : never
  : never;

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await listPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page?.seo) return {};
  const { metaTitle, metaDescription, canonicalUrl, ogImage } = page.seo;
  return {
    title: metaTitle,
    description: metaDescription,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: ogImage
      ? { images: [{ url: ogImage.url }], title: metaTitle, description: metaDescription }
      : { title: metaTitle, description: metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getPageBySlug("features/" + slug);
  if (!page) return notFound();
  return (
    <>
      {page.sections.map((s: Block, i: number) => {
        const key = s.__typename as BlockKey;
        const Cmp = blockRegistry[key] as React.ComponentType<ComponentPropsFor<typeof key>> | undefined;
        return Cmp ? <Cmp key={i} {...(s as unknown as ComponentPropsFor<typeof key>)} /> : null;
      })}
    </>
  );
}


