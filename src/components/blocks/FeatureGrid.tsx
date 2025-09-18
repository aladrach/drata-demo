import Section from '@/components/blocks/_Section';
import Image from 'next/image';
import type { FeatureGrid as FeatureGridType } from '@/lib/cms/types';

export default function FeatureGrid(props: FeatureGridType) {
  const { heading, intro, items, columns = 3, design } = props;
  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  return (
    <Section design={design}>
      <div className="flex flex-col gap-6">
        {heading ? (
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {heading}
          </h2>
        ) : null}
        {intro ? <p className="text-muted-foreground">{intro}</p> : null}
        <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
          {items.map((it, idx) => (
            <div
              key={idx}
              className="group rounded-xl border ring-1 ring-border bg-card/60 backdrop-blur p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-3">
                {it.icon ? (
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary ring-1 ring-border">
                    {it.icon.url.toLowerCase().endsWith('.svg') ? (
                      <span
                        aria-hidden
                        className="h-5 w-5"
                        style={{
                          WebkitMaskImage: `url(${it.icon.url})`,
                          maskImage: `url(${it.icon.url})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          backgroundColor: 'currentColor',
                          display: 'inline-block',
                        }}
                      />
                    ) : (
                      <Image src={it.icon.url} alt="" width={20} height={20} className="h-5 w-5" />
                    )}
                  </div>
                ) : null}
                <div className="text-base font-semibold">{it.title}</div>
                {it.body ? <p className="text-sm text-muted-foreground">{it.body}</p> : null}
                {it.link ? (
                  <a
                    className="text-sm text-primary underline underline-offset-4 decoration-transparent hover:decoration-current transition"
                    href={it.link.href}
                  >
                    {it.link.label} →
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}


