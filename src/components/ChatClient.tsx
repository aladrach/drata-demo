"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";

type AssistantExtras = {
  answerText?: string;
  sources?: { title?: string; uri: string }[];
  relatedQuestions?: string[];
  raw?: unknown;
  streaming?: boolean;
};

type ChatMessage =
  | { role: "user"; content: string }
  | ({ role: "assistant"; content: string } & AssistantExtras);

export default function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState<string[]>([]);
  const [featuredPages, setFeaturedPages] = useState<{ name: string; url: string }[]>([]);
  const [ctaItems, setCtaItems] = useState<{ name: string; url: string }[]>([]);
  const lastSentUserIdRef = useRef<number | null>(null);
  const lastSentUserElementRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToUserRef = useRef(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const followModeRef = useRef<"bottom" | "topAnchor" | "manual">("bottom");
  const listenersAttachedRef = useRef(false);
  const manualLockRef = useRef(false);
  const chatWrapperRef = useRef<HTMLDivElement | null>(null);
  const [faqsExpanded, setFaqsExpanded] = useState(false);

  function resolveScrollContainer(): HTMLElement | null {
    if (scrollContainerRef.current && document.contains(scrollContainerRef.current)) {
      return scrollContainerRef.current;
    }
    const wrapper = chatWrapperRef.current;
    const candidates: (HTMLElement | null)[] = [
      scrollContainerRef.current,
      wrapper ? (wrapper.querySelector('.scrollbar-container.ps.ps--active-y') as HTMLElement | null) : null,
      wrapper ? (wrapper.querySelector('.ps') as HTMLElement | null) : null,
      wrapper ? (wrapper.querySelector('ul.flex.flex-col.gap-3') as HTMLElement | null) : null,
      wrapper as HTMLElement | null,
    ];
    for (const el of candidates) {
      if (!el) continue;
      const isScrollable = (el.scrollHeight || 0) > (el.clientHeight || 0) + 1;
      if (isScrollable) {
        scrollContainerRef.current = el;
        return el;
      }
    }
    for (const el of candidates) {
      if (el) {
        scrollContainerRef.current = el;
        return el;
      }
    }
    return null;
  }

  function computeOffsetTop(parent: HTMLElement, el: HTMLElement): number {
    let offset = 0;
    let node: HTMLElement | null = el;
    while (node && node !== parent) {
      offset += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return offset;
  }

  useEffect(() => {
    if (listenersAttachedRef.current) return;
    const container = resolveScrollContainer();
    if (!container) return;
    const stopAuto = () => {
      manualLockRef.current = true;
      followModeRef.current = "manual";
      pendingScrollToUserRef.current = false;
    };
    container.addEventListener("wheel", stopAuto, { passive: true });
    container.addEventListener("pointerdown", stopAuto, { passive: true });
    container.addEventListener("touchstart", stopAuto, { passive: true });
    listenersAttachedRef.current = true;
    return () => {
      try { container.removeEventListener("wheel", stopAuto as EventListener); } catch {}
      try { container.removeEventListener("pointerdown", stopAuto as EventListener); } catch {}
      try { container.removeEventListener("touchstart", stopAuto as EventListener); } catch {}
      listenersAttachedRef.current = false;
    };
  }, [messages.length]);

  useLayoutEffect(() => {
    if (pendingScrollToUserRef.current && lastSentUserElementRef.current) {
      const container = resolveScrollContainer();
      const target = lastSentUserElementRef.current as HTMLElement;
      try {
        if (container) {
          const doScroll = () => {
            const padTop = parseFloat(getComputedStyle(container).paddingTop || "0") || 0;
            const topRaw = computeOffsetTop(container, target);
            const top = Math.max(0, topRaw - padTop);
            container.scrollTop = top;
            setTimeout(() => {
              container.scrollTo({ top, behavior: "smooth" });
            }, 20);
          };
          requestAnimationFrame(() => {
            doScroll();
          });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
        }
      } catch {}
      pendingScrollToUserRef.current = false;
      return;
    }

    if (followModeRef.current === "topAnchor" && lastSentUserElementRef.current) {
      const container = resolveScrollContainer();
      const target = lastSentUserElementRef.current as HTMLElement;
      if (container) {
        const padTop = parseFloat(getComputedStyle(container).paddingTop || "0") || 0;
        const topRaw = computeOffsetTop(container, target);
        const top = Math.max(0, topRaw - padTop);
        container.scrollTop = top;
      }
      return;
    }

    if (followModeRef.current === "bottom") {
      const container = resolveScrollContainer();
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i] as Partial<ChatMessage & AssistantExtras>;
      if (m && m.role === "assistant") {
        console.debug("latest assistant relatedQuestions", m.relatedQuestions);
        break;
      }
    }
  }, [messages]);

  // no-op effect retained for potential layout settling
  useEffect(() => {
    const timer = setTimeout(() => {}, 500);
    return () => clearTimeout(timer);
  }, []);

  // (removed unused parseApiPayload helper)

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/suggestions", { method: "GET", cache: "force-cache" });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json) return;
        const rqs = (json?.suggestions as string[]) || [];
        if (!cancelled && rqs.length) {
          setRecommendedQuestions(rqs);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const candidateKeys = ["q", "query", "prompt", "message"] as const;
      for (const key of candidateKeys) {
        const value = params.get(key);
        if (value && value.trim()) {
          setInput(value);
          break;
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/featured-pages", { method: "GET", cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json) return;
        const items = Array.isArray(json?.items) ? json.items : [];
        if (!cancelled) setFeaturedPages(items);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cta", { method: "GET", cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json) return;
        const items = Array.isArray(json?.items) ? json.items : [];
        if (!cancelled) setCtaItems(items);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function extractProposedFollowUps(input: string): { cleanedText: string; followUps: string[] } {
    if (!input) {
      return { cleanedText: input, followUps: [] };
    }
    const htmlSectionRegex = /(<(?:p|h[1-6])[^>]*>\s*(?:<strong>|<b>)?\s*(?:here\s+are\s+(?:some|the)\s+)?(?:(?:proposed|suggested|recommended)\s+)?(?:next\s+)?(?:follow(?:[-\s\u2011]?up)?\s+)?questions\s*:?(?:<\/strong>|<\/b>)?\s*<\/(?:p|h[1-6])>\s*<ul[^>]*>)([\s\S]*?)(<\/ul>)/i;
    const htmlMatch = input.match(htmlSectionRegex);
    if (htmlMatch) {
      const listHtml = htmlMatch[2] || "";
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const followUps: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = liRegex.exec(listHtml)) !== null) {
        const raw = (m[1] || "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (raw) followUps.push(raw);
      }
      const cleanedText = input.replace(htmlMatch[0], "");
      return { cleanedText, followUps };
    }
    const lines = input.split(/\r?\n/);
    const headingRegexes: RegExp[] = [
      /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:here\s+are\s+(?:some|the)\s+)?(?:(?:proposed|suggested|recommended)\s+)?(?:next\s+)?follow(?:[-\s\u2011]?up)?\s+questions\s*:?(?:\s*\*\*)?\s*$/i,
      /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:here\s+are\s+(?:some|the)\s+)?(?:suggested|recommended|related|next)\s+questions\s*:?(?:\s*\*\*)?\s*$/i,
      /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*here\s+are\s+(?:some|the)\s+follow(?:[-\s\u2011]?up)?\s+questions\s*:?(?:\s*\*\*)?\s*$/i,
    ];
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (headingRegexes.some((re) => re.test(line))) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex === -1) {
      return { cleanedText: input, followUps: [] };
    }
    let idx = headerIndex + 1;
    if (idx < lines.length && /^\s*$/.test(lines[idx])) idx++;
    const bulletRegex = /^\s*(?:[\-\*\u2022\u2013\u2014]|\d+\.)\s+(.*\S)\s*$/;
    const followUps: string[] = [];
    let endIdx = idx;
    while (endIdx < lines.length) {
      const line = lines[endIdx];
      const m = line.match(bulletRegex);
      if (!m) break;
      const text = (m[1] || "").trim();
      if (text) followUps.push(text);
      endIdx++;
    }
    if (followUps.length === 0) {
      return { cleanedText: input, followUps: [] };
    }
    const cleanedLines = lines.slice(0, headerIndex).concat(lines.slice(endIdx));
    const cleanedText = cleanedLines.join("\n");
    return { cleanedText, followUps };
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;
    setIsLoading(true);
    setFaqsExpanded(false);
    const id = Date.now();
    lastSentUserIdRef.current = id;
    pendingScrollToUserRef.current = true;
    manualLockRef.current = false;
    followModeRef.current = "topAnchor";
    setMessages((prev) => [...prev, { role: "user", content: text } as ChatMessage]);
    setInput("");
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok || !res.body) {
        const textBody = await res.text().catch(() => "");
        setMessages((prev) => [...prev, { role: "assistant", content: `Request failed (${res.status})${textBody ? ` - ${textBody}` : ''}` }]);
        return;
      }
      // Maintain streaming state; we do not rely on message IDs for updates
      setIsStreaming(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "", answerText: "", streaming: true } as ChatMessage & AssistantExtras]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          accumulated += chunk;
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              const m = next[i] as ChatMessage & Partial<AssistantExtras>;
              if (m && m.role === "assistant") {
                (m as AssistantExtras).streaming = true;
                (m as AssistantExtras).answerText = accumulated;
                (m as unknown as { content: string }).content = accumulated;
                break;
              }
            }
            return next as ChatMessage[];
          });
        }
      }
      const extraction = extractProposedFollowUps(accumulated);
      const finalAnswer = extraction.cleanedText || accumulated;
      const finalRelated = extraction.followUps.length ? extraction.followUps : undefined;
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          const m = next[i] as ChatMessage & Partial<AssistantExtras>;
          if (m && m.role === "assistant") {
            (m as unknown as { content: string }).content = finalAnswer;
            (m as AssistantExtras).answerText = finalAnswer;
            (m as AssistantExtras).relatedQuestions = finalRelated;
            (m as AssistantExtras).streaming = false;
            break;
          }
        }
        return next as ChatMessage[];
      });
      if (!manualLockRef.current) {
        followModeRef.current = "bottom";
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` } as ChatMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleAsk(question: string) {
    if (isLoading) return;
    const q = (question || "").trim();
    if (!q) return;
    setInput(q);
    void sendMessage(q);
  }

  return (
    <div className="font-sans flex flex-col h-full w-full p-2 sm:p-4 relative embedded-chatbot" style={{background: 'transparent'}}>
      <main className="flex flex-col gap-3 sm:gap-4 items-center sm:items-start w-full max-w-4xl mx-auto flex-1 min-h-0 relative z-10">
        <div className="w-full flex-1 min-h-0">
          <div className="relative flex h-full w-full rounded-2xl border border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-sm overflow-hidden">
            <div className="absolute inset-0 pointer-events-none ring-1 ring-black/5 dark:ring-white/10 rounded-2xl" />
            <div className="w-full flex flex-col gap-4 flex-1 min-h-0 p-3 sm:p-4">
          <div className="w-full flex-1 rounded-lg chat-container min-h-0">
            <div ref={chatWrapperRef} style={{ height: '100%', width: '100%', position: 'relative' }}>
              <PerfectScrollbar 
                key="chat-scrollbar"
                options={{
                  suppressScrollX: true,
                  wheelSpeed: 1,
                  wheelPropagation: true,
                  minScrollbarLength: 20,
                }}
                containerRef={(ref: HTMLElement | null) => { scrollContainerRef.current = ref; }}
                style={{ 
                  height: '100%', 
                  width: '100%',
                  padding: '1rem',
                  boxSizing: 'border-box'
                }}
              >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Ask a question about Drata to get started.
                </p>
                <p className="text-xs text-muted-foreground/70 text-center mt-2">
                  I can help you find information, explain concepts, and answer questions about Drata.
                </p>
                {recommendedQuestions.length > 0 && (
                  <div className="mt-5 w-full max-w-xl">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 text-center">Recommended questions</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {recommendedQuestions.map((q, idx) => (
                        <button
                          key={`${idx}-${q}`}
                          type="button"
                          className="text-xs underline hover:no-underline px-2 py-1 rounded-md related-question-btn text-left cursor-pointer"
                          onClick={() => handleAsk(q)}
                          aria-label={`Use recommended question: ${q}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
              {recommendedQuestions.length > 0 && (
                <div className="sticky top-0 z-20 mb-3 rounded-lg border border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setFaqsExpanded((v) => !v)}
                    aria-expanded={faqsExpanded}
                    aria-controls="faqs-collapse"
                  >
                    <span>FAQs</span>
                    <span className={`inline-block transform transition-transform ${faqsExpanded ? "rotate-180" : "rotate-0"}`} aria-hidden>
                      ▼
                    </span>
                  </button>
                  {faqsExpanded && (
                    <div id="faqs-collapse" className="px-3 pb-3">
                      <div className="flex flex-wrap gap-2">
                        {recommendedQuestions.map((q, idx) => (
                          <button
                            key={`${idx}-${q}`}
                            type="button"
                            className="text-xs underline hover:no-underline px-2 py-1 rounded-md related-question-btn text-left cursor-pointer"
                            onClick={() => handleAsk(q)}
                            aria-label={`Use FAQ: ${q}`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <ul className="flex flex-col gap-3">
                {messages.map((m, i) => {
                  const isAssistant = m.role === "assistant";
                  const messageText = isAssistant ? ((m as AssistantExtras).answerText ?? m.content) : m.content;
                  const isJustSentUser = !isAssistant && i === messages.length - 1;
                  const key = `${m.role}-${i}`;
                  return (
                    <li key={key} className={`${isAssistant ? "flex justify-start" : "flex justify-end"} fade-in`}>
                      <div
                        className={
                          isAssistant
                            ? "max-w-[85%] rounded-2xl px-4 py-2 text-sm message-bubble-assistant"
                            : "max-w-[85%] rounded-2xl px-4 py-2 text-sm message-bubble-user"
                        }
                        ref={isJustSentUser ? lastSentUserElementRef : undefined}
                      >
                        {isAssistant ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none fade-in">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              components={{
                                p: (props) => <p className="mb-4 leading-7" {...props} />,
                                ul: (props) => <ul className="list-disc ml-6 my-3 space-y-1" {...props} />,
                                ol: (props) => <ol className="list-decimal ml-6 my-3 space-y-1" {...props} />,
                                li: (props) => <li className="leading-7" {...props} />,
                                h1: (props) => <h1 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                                h2: (props) => <h2 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                                h3: (props) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
                                a: (props) => <a className="underline hover:no-underline" target="_blank" rel="noreferrer" {...props} />,
                                code: (props) => <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded" {...props} />,
                              }}
                            >
                              {messageText}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{messageText}</span>
                        )}
                        {isAssistant && "sources" in m && m.sources && m.sources.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Sources</div>
                            <div className="flex flex-wrap gap-2">
                              {m.sources.map((s, idx) => (
                                <a
                                  key={`${s.uri}-${idx}`}
                                  className="text-xs underline hover:no-underline px-2 py-1 rounded-md source-link"
                                  href={s.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {s.title || s.uri}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {isAssistant && "relatedQuestions" in m && m.relatedQuestions && m.relatedQuestions.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Suggested questions</div>
                            <div className="flex flex-wrap gap-2">
                              {m.relatedQuestions.map((q, idx) => (
                                <button
                                  key={`${idx}-${q}`}
                                  type="button"
                                  className="text-xs underline hover:no-underline px-2 py-1 rounded-md related-question-btn text-left cursor-pointer"
                                  onClick={() => handleAsk(q)}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                <div ref={messagesEndRef} />
              </ul>
              </>
            )}
            {isStreaming && (
              <div className="mt-2 ml-1 flex items-center gap-2 text-xs text-muted-foreground typing-indicator slide-up">
                <span className="inline-flex gap-1">
                  <span className="inline-block size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                  <span className="inline-block size-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
                  <span className="inline-block size-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
                </span>
                <span className="text-muted-foreground/80">Generating response...</span>
              </div>
            )}
            </PerfectScrollbar>
            </div>
          </div>
          {featuredPages.length > 0 && (
            <div className="w-full slide-up flex-shrink-0">
              <div className="flex flex-wrap gap-2 px-1 pb-1">
                {featuredPages.map((item, idx) => (
                  <a
                    key={`${idx}-${item.url}`}
                    href={item.url}
                    target="_parent"
                    rel="noreferrer noopener"
                    className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          {ctaItems.length > 0 && (
            <div className="w-full slide-up flex-shrink-0">
              {ctaItems.map((item, idx) => (
                <a
                  key={`${idx}-${item.url}`}
                  href={item.url}
                  target="_parent"
                  rel="noreferrer noopener"
                  className="block w-full text-center px-4 py-3 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}
          <div className="flex w-full items-center gap-2 slide-up flex-shrink-0">
            <Input
              placeholder="Type your question and press Enter"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="button" onClick={() => sendMessage()} disabled={isLoading || !input.trim()} className="flex-shrink-0">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span className="hidden sm:inline">Sending</span>
                </span>
              ) : (
                "Send"
              )}
            </Button>
          </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


