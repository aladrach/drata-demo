import { NextRequest } from "next/server";
import { streamText } from "ai";
import { gateway } from "@ai-sdk/gateway";
// Using Vercel AI Gateway via model id string and AI_GATEWAY_API_KEY env
import { listChatbotKnowledgeBase } from "@/lib/cms/contentful";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const queryText = (body?.query as string) || "";
    if (!queryText) {
      return new Response(JSON.stringify({ error: "Missing 'query' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiGatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY || "";
    const aiGatewayModel = process.env.AI_GATEWAY_MODEL || "openai/gpt-4o-mini";
    if (!aiGatewayApiKey) {
      return new Response(JSON.stringify({ error: "Missing AI Gateway API key" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Fetch knowledge base entries from Contentful and build a compact, relevant context
    const kbEntries = await listChatbotKnowledgeBase({ preview: false });
    const query = queryText.toLowerCase();
    const stopwords = new Set([
      'the','a','an','and','or','but','if','then','else','of','for','to','in','on','at','by','from','with','about','into','over','after','before','between','through','during','without','within','along','across','behind','beyond','under','above','up','down','out','off','over','again','further','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just'
    ]);
    const tokens = Array.from(new Set(query
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t && !stopwords.has(t))));

    type Ranked = { name: string; url?: string; text: string; score: number; snippet: string };
    function scoreEntry(name: string, text: string): { score: number; snippet: string } {
      const lcName = name.toLowerCase();
      const lcText = text.toLowerCase();
      let score = 0;
      let firstIdx = -1;
      for (const t of tokens) {
        if (!t) continue;
        if (lcName.includes(t)) score += 3;
        const idx = lcText.indexOf(t);
        if (idx >= 0) {
          score += 1;
          if (firstIdx === -1 || idx < firstIdx) firstIdx = idx;
        }
      }
      // Create a focused snippet around the first match
      let snippet = text;
      if (firstIdx >= 0) {
        const start = Math.max(0, firstIdx - 300);
        snippet = text.slice(start, start + 900);
      } else {
        snippet = text.slice(0, 900);
      }
      return { score, snippet };
    }

    const ranked: Ranked[] = kbEntries.map((e) => {
      const { score, snippet } = scoreEntry(e.name, e.text);
      return { name: e.name, url: e.sourceUrl, text: e.text, score, snippet };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

    const maxCtx = 5000; // trim total prompt size for lower latency
    const maxDocs = Math.max(1, Number(process.env.KB_DOCS_LIMIT || 3));
    let ctxUsed = 0;
    const selected: Array<{ name: string; url?: string; text: string }> = [];
    for (const r of ranked.slice(0, Math.max(1, maxDocs))) {
      const trimmed = r.snippet.length > 800 ? r.snippet.slice(0, 800) : r.snippet;
      const chunk = `\n\n### ${r.name}${r.url ? ` (${r.url})` : ""}\n${trimmed}`;
      if (ctxUsed + chunk.length > maxCtx) break;
      selected.push({ name: r.name, url: r.url, text: trimmed });
      ctxUsed += chunk.length;
    }
    const kbContext = selected.length
      ? selected.map((e) => `---\nTitle: ${e.name}\nContent:\n${e.text}`).join("\n\n")
      : "";

    const system = [
      "You are a helpful assistant for Drata.",
      "Use ONLY the provided Knowledge Base context to answer. If none of the context is relevant, say: 'Sorry, I don't know.'",
      "Respond in concise Markdown.",
    ].join("\n");

    const prompt = [
      "Knowledge Base Context (one or more documents):",
      kbContext || "(no relevant knowledge found)",
      "\n---\n",
      `User question: ${queryText}`,
    ].join("\n\n");

    const model = gateway(aiGatewayModel);
    const result = await streamText({
      // Temporary compatibility cast due to type mismatch between ai and gateway versions
      model: model as unknown as never,
      system,
      prompt,
      abortSignal: request.signal,
    });

    // Expose referenced KB docs via headers for the client to link to
    const refs = selected.filter((s) => !!s.url).map((s) => ({ title: s.name, url: s.url! }));
    const topReferenced = refs[0];
    const headers: Record<string, string> = {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
    };
    if (topReferenced) {
      headers["X-KB-Title"] = topReferenced.title;
      headers["X-KB-Url"] = topReferenced.url;
    }
    if (refs.length > 0) {
      try { headers["X-KB-Refs"] = JSON.stringify(refs); } catch {}
    }

    return result.toTextStreamResponse({ headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


