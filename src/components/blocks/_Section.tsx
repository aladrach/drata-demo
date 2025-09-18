import React from 'react';
import Image from 'next/image';
import type { DesignControls } from '@/lib/cms/types';
import { padTopMap, padBottomMap, widthMap, alignMap, bgMap, variantContainerMap } from '@/lib/design/maps';

type Props = {
  design?: DesignControls;
  children: React.ReactNode;
  loading?: 'eager' | 'lazy';
};

export default function Section({ design, children, loading = 'lazy' }: Props) {
  const paddingTop = design?.paddingTop ?? 'none';
  const paddingBottom = design?.paddingBottom ?? 'none';
  const width = design?.containerWidth ?? 'default';
  const align = design?.align ?? 'start';
  const background = design?.background ?? 'surface';
  const variant = (design?.variant as keyof typeof variantContainerMap | undefined) ?? 'none';
  const hideOn = design?.hideOn ?? [];
  const textTheme = design?.textTheme ?? 'adaptive';
  const effectiveTextTheme = background === 'brand' ? 'light' : textTheme;
  const textThemeClass =
    effectiveTextTheme === 'light' ? 'text-theme-light' : effectiveTextTheme === 'dark' ? 'text-theme-dark' : '';

  // Background image handled via Next/Image overlay for optimization

  const visibility = [
    hideOn.includes('mobile') ? 'hidden sm:block' : '',
    hideOn.includes('tablet') ? 'sm:hidden lg:block' : '',
    hideOn.includes('desktop') ? 'lg:hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={`${bgMap[background]} ${visibility} mx-[calc(50%-50vw)] w-screen ${background === 'subtle' ? 'subtle-gradient-section' : ''} relative overflow-hidden`}>
      {background === 'image' && design?.backgroundImage?.url ? (
        <Image
          src={design.backgroundImage.url}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          priority={loading === 'eager'}
          fetchPriority={loading === 'eager' ? 'high' : 'auto'}
          className="pointer-events-none absolute inset-0 -z-10 object-cover"
        />
      ) : null}
      {background === 'subtle' ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 subtle-gradient subtle-gradient-anim" />
      ) : null}
      {background === 'brand' ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 subtle-gradient subtle-gradient-anim" />
      ) : null}
      <div className={`relative z-10 mx-auto px-4 ${padTopMap[paddingTop]} ${padBottomMap[paddingBottom]} ${widthMap[width]} grid ${alignMap[align]} animate-in fade-in-50 duration-500 ${variantContainerMap[variant]} ${textThemeClass}`}>
        {children}
      </div>
    </section>
  );
}


