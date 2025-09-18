import Image from 'next/image';
import Section from '@/components/blocks/_Section';
import { CTAButton } from '@/components/cta';
import type { Hero as HeroType } from '@/lib/cms/types';

export default function Hero(props: HeroType) {
  const { eyebrow, headline, subhead, primaryCTA, secondaryCTA, media, design } = props;
  return (
    <Section design={design} loading="eager">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col gap-4">
          {eyebrow ? <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</div> : null}
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            {headline}
          </h1>
          {subhead ? <p className="text-lg text-muted-foreground">{subhead}</p> : null}
          <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {primaryCTA ? <CTAButton cta={primaryCTA} size="lg" /> : null}
            {secondaryCTA ? <CTAButton cta={secondaryCTA} size="lg" /> : null}
          </div>
        </div>
        {media?.url ? (
          <div className="relative aspect-[16/10] w-full animate-in fade-in-50 zoom-in-95 duration-700 overflow-hidden rounded-2xl ring-1 ring-border shadow-xl">
            <Image src={media.url} alt={headline} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" loading="eager" fetchPriority='high' />
          </div>
        ) : null}
      </div>
    </Section>
  );
}


