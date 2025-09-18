import { NextResponse } from "next/server";
import { listChatbotFaqSuggestions } from "@/lib/cms/contentful";

export const runtime = "edge";
export const revalidate = 300; // 5min cache

export async function GET() {
  const names = await listChatbotFaqSuggestions();
  return NextResponse.json(
    { suggestions: names },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}


