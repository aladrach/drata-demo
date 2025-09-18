import Section from '@/components/blocks/_Section';
import { CTAButton } from '@/components/cta';
import type { CTABanner as CTABannerType } from '@/lib/cms/types';

export default function CTABanner(props: CTABannerType) {
  const { headline, body, cta, design } = props;
  return (
    <Section design={design}>
      <div className="mx-auto max-w-3xl text-center flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h2 className="text-2xl font-semibold">{headline}</h2>
        {body ? <p className="text-muted-foreground">{body}</p> : null}
        <div>
          <CTAButton cta={cta} size="lg" />
        </div>
      </div>
    </Section>
  );
}


