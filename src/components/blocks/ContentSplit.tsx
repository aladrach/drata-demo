import Image from 'next/image';
import Section from '@/components/blocks/_Section';
import RichText, { isRichTextDocument } from '@/components/RichText';
import type { ContentSplit as ContentSplitType } from '@/lib/cms/types';

export default function ContentSplit(props: ContentSplitType) {
  const { layout = 'imageRight', image, heading, body, cta, design } = props;
  const imageFirst = layout === 'imageLeft';
  return (
    <Section design={design}>
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center`}>
        {imageFirst ? (
          <div className="relative aspect-[4/3] w-full order-1 md:order-none">
            {image?.url ? <Image src={image.url} alt={heading || ''} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover rounded-xl" /> : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-4">
          {heading ? <h2 className="text-2xl font-semibold">{heading}</h2> : null}
          {isRichTextDocument(body) ? <RichText json={body} /> : null}
          {cta ? (
            <a className="inline-flex rounded-md border px-4 py-2" href={cta.href}>
              {cta.label}
            </a>
          ) : null}
        </div>
        {!imageFirst ? (
          <div className="relative aspect-[4/3] w-full">
            {image?.url ? <Image src={image.url} alt={heading || ''} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover rounded-xl" /> : null}
          </div>
        ) : null}
      </div>
    </Section>
  );
}


