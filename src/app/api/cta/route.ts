import { getCached, setCached } from "@/lib/server-cache";
import { listChatbotCTAs } from "@/lib/cms/contentful";

export const runtime = "nodejs";
export const revalidate = 300; // enable ISR at 5 minutes

const CACHE_NAMESPACE = "contentful_chatbot_ctas";
const CACHE_KEY = "chatbotCtAs";
const CACHE_TTL_SECONDS = 300;

type CtaItem = { name: string; url: string };

export async function GET() {
  try {
    const cached = getCached<CtaItem[]>(CACHE_NAMESPACE, CACHE_KEY);
    if (cached) {
      return new Response(JSON.stringify({ items: cached }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
      });
    }

    const items = await listChatbotCTAs();
    setCached(CACHE_NAMESPACE, CACHE_KEY, items, CACHE_TTL_SECONDS);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}


