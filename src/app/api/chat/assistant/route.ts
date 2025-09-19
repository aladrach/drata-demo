import { NextRequest } from "next/server";
import OpenAI from "openai";
import { listChatbotKnowledgeBase } from "@/lib/cms/contentful";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { getCached, setCached } from "@/lib/server-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o";

type KBRef = { title?: string; url?: string; text: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const queryText = (body?.query as string) || "";
    // Optional cap for number of KB docs; Infinity means include all
    const kbCacheTtl = Math.max(30, Number(process.env.KB_CACHE_TTL_SECONDS || 300));
    const kbTopK = Math.max(1, Math.min(20, Number(process.env.KB_TOP_K || 5)));
    const perDocChars = Math.max(1, Number(process.env.KB_PER_DOC_CHARS || 4000));
    if (!queryText) {
      return new Response(JSON.stringify({ error: "Missing 'query' in request body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Tool definition: getKBChunks
    async function getKBChunksTool({ query: _query, limit }: { query: string; limit?: number }): Promise<KBRef[]> {
      const cacheKey = `kbRefs:v1:perDoc=${perDocChars}`;
      let all = getCached<KBRef[]>("assistant-kb", cacheKey);
      if (!all) {
        const kbEntries = await listChatbotKnowledgeBase({ preview: false });
        all = kbEntries.map((e) => ({
          title: e.name,
          url: e.sourceUrl,
          text: e.text.length > perDocChars ? e.text.slice(0, perDocChars) : e.text,
        }));
        setCached("assistant-kb", cacheKey, all, kbCacheTtl);
      }
      // Rank by relevance to query (prefer title matches)
      const q = String(_query || '').toLowerCase().trim();
      const tokens = Array.from(new Set(q.split(/\s+/).filter((t) => t.length >= 2)));
      const scored = all.map((r, idx) => {
        const title = String(r.title || '').toLowerCase();
        const text = String(r.text || '').toLowerCase();
        let score = 0;
        if (q && title.includes(q)) score += 20;
        if (q && text.includes(q)) score += 8;
        for (const t of tokens) {
          if (title.includes(t)) score += 5;
          if (text.includes(t)) score += 1;
        }
        return { r, idx, score };
      });
      scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));
      const sorted = scored.map((s) => s.r);
      const requested = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : kbTopK;
      const effectiveLimit = Math.min(sorted.length, requested);
      return sorted.slice(0, effectiveLimit);
    }

    const tools = [
      {
        type: "function" as const,
        function: {
          function: getKBChunksTool,
          parse: JSON.parse,
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
              limit: { type: "number" },
            },
            required: ["query"],
          },
        },
      },
    ];

    const system = [
      "You are a helpful assistant for Drata.",
      "Before answering ANY user query, you MUST call the getKBChunks tool with the user's query to retrieve knowledge.",
      "Use ONLY the knowledge returned by getKBChunks to answer. Prefer documents whose title or content closely matches the user's topic.",
      "If you cite a document, include the title and URL in the answer.",
      "Only if getKBChunks returns zero documents should you say you don't know. Otherwise, provide the best answer grounded in the returned content.",
      "Respond in concise Markdown.",
    ].join("\n");

    const runner = client.chat.completions.runTools({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: queryText },
      ],
      tools: tools as unknown as Parameters<typeof client.chat.completions.runTools>[0]["tools"],
    });

    const finalText = await runner.finalContent();
    // Convert Markdown -> sanitized HTML on the server
    const rawHtml = await marked.parse(String(finalText || ""));
    const safeHtml = sanitizeHtml(String(rawHtml), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1","h2","h3","img","pre","code"]),
      allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt"],
        '*': ["class"],
      },
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer', target: '_blank' }, true),
      },
      // Disallow script/style entirely; sanitize-html blocks by default
    });

    const headers: Record<string, string> = {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
    };
    // No reference headers emitted

    // Stream the final text incrementally to the client to enable progressive UI updates
    const encoder = new TextEncoder();
    const text = String(safeHtml || "");
    const chunkSize = Math.max(16, Math.min(256, Number(process.env.STREAM_CHUNK_SIZE || 64)));
    const delayMs = Math.max(0, Math.min(80, Number(process.env.STREAM_DELAY_MS || 10)));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let i = 0;
        const push = () => {
          if (i >= text.length) {
            try {
              // Append a JSON metadata trailer that includes only the full content
              const trailer = { content: text } as const;
              const PREFIX = "\n<|assistant_metadata|>";
              const SUFFIX = "</|assistant_metadata|>";
              controller.enqueue(encoder.encode(`${PREFIX}${JSON.stringify(trailer)}${SUFFIX}`));
            } catch {}
            controller.close();
            return;
          }
          const next = text.slice(i, i + chunkSize);
          i += chunkSize;
          controller.enqueue(encoder.encode(next));
          if (delayMs > 0) {
            setTimeout(push, delayMs);
          } else {
            // Yield to event loop to avoid blocking
            queueMicrotask(push);
          }
        };
        push();
      },
    });
    return new Response(stream, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}


