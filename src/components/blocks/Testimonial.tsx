import Image from 'next/image';
import Section from '@/components/blocks/_Section';
import type { Testimonial as TestimonialType } from '@/lib/cms/types';

export default function Testimonial(props: TestimonialType) {
  const { quote, authorName, authorTitle, authorLogo, link, design } = props;
  return (
    <Section design={design}>
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border ring-1 ring-border bg-card/60 backdrop-blur p-8 md:p-10 shadow-sm">
          <blockquote className="text-2xl md:text-3xl font-medium bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent text-center">
            “{quote}”
          </blockquote>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {authorName ? <span className="font-medium">{authorName}</span> : null}
            {authorTitle ? <span className="ml-2">— {authorTitle}</span> : null}
          </div>
          <div className="mt-3 flex justify-center">
            {authorLogo?.url ? <Image src={authorLogo.url} alt={authorName || 'Logo'} width={120} height={40} /> : null}
          </div>
          {link ? (
            <div className="mt-4 text-center">
              <a
                className="text-sm text-primary underline underline-offset-4 decoration-transparent hover:decoration-current transition"
                href={link.href}
              >
                {link.label} →
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}


