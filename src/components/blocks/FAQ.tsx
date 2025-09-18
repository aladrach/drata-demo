import Section from '@/components/blocks/_Section';
import RichText, { isRichTextDocument } from '@/components/RichText';
import type { FAQ as FAQType } from '@/lib/cms/types';

export default function FAQ(props: FAQType) {
  const { heading, items, design } = props;
  return (
    <Section design={design}>
      <div className="flex flex-col gap-6">
        {heading ? <h2 className="text-2xl font-semibold">{heading}</h2> : null}
        <div className="divide-y">
          {items.map((it, idx) => (
            <div key={idx} className="py-4">
              <div className="font-medium">{it.question}</div>
              {isRichTextDocument(it.answer) ? <RichText json={it.answer} /> : null}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}


