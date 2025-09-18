import { NextRequest } from "next/server";
import OpenAI from "openai";
import { listChatbotKnowledgeBase } from "@/lib/cms/contentful";

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
    const kbLimitEnv = Number(process.env.KB_DOCS_LIMIT);
    const kbLimit = Number.isFinite(kbLimitEnv) && kbLimitEnv > 0 ? kbLimitEnv : Infinity;
    const perDocChars = Math.max(1, Number(process.env.KB_PER_DOC_CHARS || 4000));
    if (!queryText) {
      return new Response(JSON.stringify({ error: "Missing 'query' in request body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Tool definition: getKBChunks
    async function getKBChunksTool({ query, limit }: { query: string; limit?: number }): Promise<KBRef[]> {
      const kbEntries = await listChatbotKnowledgeBase({ preview: false });
      // Return ALL entries (trimmed per doc); ignore limit unless explicitly provided and smaller
      const all = kbEntries.map((e) => ({
        title: e.name,
        url: e.sourceUrl,
        text: e.text.length > perDocChars ? e.text.slice(0, perDocChars) : e.text,
      }));
      const effectiveLimit = (typeof limit === 'number' && Number.isFinite(limit))
        ? Math.max(1, Number(limit))
        : (Number.isFinite(kbLimit) ? kbLimit : all.length);
      return all.slice(0, effectiveLimit);
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
      "Use ONLY knowledge returned by the getKBChunks function. If none is relevant, say you don't know.",
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
    const lastTool: { name?: string; output?: KBRef[] } | undefined = await (runner as unknown as { finalFunctionToolCall: () => Promise<{ name?: string; output?: KBRef[] } | undefined> }).finalFunctionToolCall();

    // Collect references from last tool call if present
    let refs: KBRef[] | undefined;
    try {
      if (lastTool && lastTool.name === "getKBChunks") {
        const out = lastTool.output as KBRef[] | undefined;
        if (Array.isArray(out)) refs = out.filter((r) => r && r.url);
      }
    } catch {}

    const headers: Record<string, string> = {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
    };
    if (refs && refs.length) {
      const top = refs[0];
      if (top?.title) headers["X-KB-Title"] = String(top.title);
      if (top?.url) headers["X-KB-Url"] = String(top.url);
      try { headers["X-KB-Refs"] = JSON.stringify(refs.map((r) => ({ title: r.title, url: r.url! }))); } catch {}
    }

    // Stream the final text incrementally to the client to enable progressive UI updates
    const encoder = new TextEncoder();
    const text = String(finalText || "");
    const chunkSize = Math.max(16, Math.min(256, Number(process.env.STREAM_CHUNK_SIZE || 64)));
    const delayMs = Math.max(0, Math.min(80, Number(process.env.STREAM_DELAY_MS || 10)));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let i = 0;
        const push = () => {
          if (i >= text.length) {
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


