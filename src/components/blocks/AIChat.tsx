import Section from '@/components/blocks/_Section';
import Chat from '@/components/Chat';
import type { AIChat as AIChatType } from '@/lib/cms/types';

export default function AIChat(props: AIChatType) {
  const { design, heading } = props;
  return (
    <Section design={design}>
      <div className="flex flex-col gap-4 w-full">
        {heading ? <h2 className="text-2xl font-semibold text-center">{heading}</h2> : null}
        <div className="w-full min-h-[520px] h-[560px] md:h-[640px]">
          <Chat />
        </div>
      </div>
    </Section>
  );
}


