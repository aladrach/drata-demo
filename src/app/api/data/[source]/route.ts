import { NextRequest, NextResponse } from 'next/server';
import { fetchMetricsFromSource } from '@/lib/metrics';

export const runtime = 'edge';

export const revalidate = 300;

type LiveMetric = {
  ok: boolean;
  data?: Record<string, number | string>;
  error?: string;
  asOf?: string;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params;
  const typedSource = source as 'openweather' | 'worldbank';
  const query = req.nextUrl.searchParams.get('query') || '';
  const metricKeysParam = req.nextUrl.searchParams.get('metricKeys');
  const format = req.nextUrl.searchParams.get('format') || undefined;
  const metricKeys: string[] = metricKeysParam ? JSON.parse(metricKeysParam) : [];

  const result = await fetchMetricsFromSource(typedSource, query, metricKeys, format);
  if (result.ok) {
    const response: LiveMetric = { ok: true, data: result.data, asOf: result.asOf };
    return NextResponse.json(response, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } });
  }
  const response: LiveMetric = { ok: false, error: result.error };
  return NextResponse.json(response, { status: 200, headers: { 'Cache-Control': 's-maxage=60' } });
}


