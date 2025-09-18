import Section from '@/components/blocks/_Section';
import type { ProductDataCallout as ProductDataCalloutType } from '@/lib/cms/types';
import { fetchMetricsFromSource } from '@/lib/metrics';

async function fetchMetrics(input: {
  source: 'openweather' | 'worldbank';
  query: string;
  metricKeys: string[];
  format?: string;
}) {
  return fetchMetricsFromSource(input.source, input.query, input.metricKeys, input.format);
}

export default async function ProductDataCallout(props: ProductDataCalloutType) {
  const { heading, dataSource, locationOrQuery, metricKeys, format, fallbackText, design } = props;
  const result = await fetchMetrics({ source: dataSource, query: locationOrQuery, metricKeys, format });

  return (
    <Section design={design}>
      <div className="flex flex-col gap-4">
        {heading ? (
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {heading}
          </h2>
        ) : null}
        {result.ok && result.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(result.data).map(([k, v]) => (
              <div
                key={k}
                className="group relative rounded-xl border border-white/15 dark:border-white/[.08] bg-white/25 dark:bg-white/[.06] backdrop-blur-md p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
                <div className="text-3xl font-semibold tabular-nums">{String(v)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">{fallbackText || 'Data unavailable at this time.'}</div>
        )}
      </div>
    </Section>
  );
}


