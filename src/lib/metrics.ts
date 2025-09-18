import 'server-only';

export type MetricsSource = 'openweather' | 'worldbank';

export type MetricsResult = {
  ok: boolean;
  data?: Record<string, number | string>;
  error?: string;
  asOf?: string;
};

async function fetchOpenWeather(query: string, format?: string): Promise<Record<string, number | string>> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY not set');
  const units = format === 'imperial' ? 'imperial' : 'metric';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=${units}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`OpenWeather error: ${res.status}`);
  const json = await res.json();
  const tempVal = (json.main?.temp as number | undefined) ?? undefined;
  const windVal = (json.wind?.speed as number | undefined) ?? undefined;
  const humidityVal = json.main?.humidity as number | undefined;
  const conditionsVal = json.weather?.[0]?.description as string | undefined;
  const cityVal = json.name as string | undefined;

  const derived: Record<string, number | string> = {};

  if (tempVal != null) derived.temp = Math.round(tempVal);
  if (typeof humidityVal === 'number') derived.humidity = humidityVal;
  if (typeof conditionsVal === 'string') derived.conditions = conditionsVal;
  if (typeof cityVal === 'string') derived.city = cityVal;

  if (units === 'metric') {
    if (tempVal != null) derived.temperatureC = Math.round(tempVal);
    if (windVal != null) derived.windKph = Math.round(windVal * 3.6);
  } else {
    if (tempVal != null) derived.temperatureF = Math.round(tempVal);
    if (windVal != null) derived.windMph = Math.round(windVal);
  }
  return derived;
}

async function fetchWorldBank(query: string): Promise<Record<string, number | string>> {
  const [country, indicator] = query.split(':');
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=1`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`WorldBank error: ${res.status}`);
  const json = await res.json();
  const series = json?.[1]?.[0];
  return {
    country: country,
    indicator: indicator,
    value: series?.value ?? 'n/a',
    date: series?.date,
  } as Record<string, number | string>;
}

export async function fetchMetricsFromSource(
  source: MetricsSource,
  query: string,
  metricKeys: string[] = [],
  format?: string,
): Promise<MetricsResult> {
  try {
    let data: Record<string, number | string> = {};
    if (source === 'openweather') data = await fetchOpenWeather(query, format);
    else if (source === 'worldbank') data = await fetchWorldBank(query);
    else throw new Error('Unsupported source');

    const filtered = metricKeys.length
      ? Object.fromEntries(Object.entries(data).filter(([k]) => metricKeys.includes(k)))
      : data;

    return { ok: true, data: filtered, asOf: new Date().toISOString() };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error: message };
  }
}


