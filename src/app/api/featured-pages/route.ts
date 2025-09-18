import { getCached, setCached } from "@/lib/server-cache";
import { listChatbotFeaturedPages } from "@/lib/cms/contentful";

export const runtime = "nodejs";
export const revalidate = 300; // enable ISR at 5 minutes

const CACHE_NAMESPACE = "contentful_chatbot_featured_pages";
const CACHE_KEY = "chatbotFeaturedPages";
const CACHE_TTL_SECONDS = 300;

type FeaturedPage = { name: string; url: string };

export async function GET() {
  try {
    const cached = getCached<FeaturedPage[]>(CACHE_NAMESPACE, CACHE_KEY);
    if (cached) {
      return new Response(JSON.stringify({ items: cached }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
      });
    }

    const items = await listChatbotFeaturedPages();
    setCached(CACHE_NAMESPACE, CACHE_KEY, items, CACHE_TTL_SECONDS);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}


