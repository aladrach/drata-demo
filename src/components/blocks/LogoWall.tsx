import Image from 'next/image';
import Section from '@/components/blocks/_Section';
import type { LogoWall as LogoWallType } from '@/lib/cms/types';

export default function LogoWall(props: LogoWallType) {
  const { heading, logos, design } = props;
  return (
    <Section design={design}>
      <div className="flex flex-col gap-6">
        {heading ? (
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {heading}
          </h2>
        ) : null}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center">
          {logos.map((l, idx) => (
            <div
              key={idx}
              className="group rounded-lg border ring-1 ring-border bg-card/60 p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="relative h-10 grayscale group-hover:grayscale-0 transition">
                <Image src={l.url} alt={heading || 'Logo'} fill sizes="160px" className="object-contain" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}


