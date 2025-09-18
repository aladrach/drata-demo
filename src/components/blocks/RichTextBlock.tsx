import Section from '@/components/blocks/_Section';
import RichText, { isRichTextDocument } from '@/components/RichText';
import type { RichTextBlock as RichTextBlockType } from '@/lib/cms/types';

export default function RichTextBlock(props: RichTextBlockType) {
  const { heading, body, design } = props;
  return (
    <Section design={design}>
      <div className="flex flex-col gap-4">
        {heading ? <h2 className="text-2xl font-semibold">{heading}</h2> : null}
        {isRichTextDocument(body) ? <RichText json={body} /> : null}
      </div>
    </Section>
  );
}


