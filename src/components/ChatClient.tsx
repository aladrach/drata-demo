"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState, useLayoutEffect, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components as MarkdownComponents } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type AssistantExtras = {
  answerText?: string;
  raw?: unknown;
  streaming?: boolean;
  kbTitle?: string;
  kbUrl?: string;
  kbRefs?: Array<{ title?: string; url: string }>;
};

type ChatMessage =
  | { id: number; role: "user"; content: string }
  | ({ id: number; role: "assistant"; content: string } & AssistantExtras);

type AssistantMessage = { id: number; role: "assistant"; content: string } & AssistantExtras;

type ChatClientProps = {
  initialRecommendedQuestions?: string[];
  initialFeaturedPages?: { name: string; url: string }[];
  initialCtaItems?: { name: string; url: string }[];
};

export default function ChatClient({
  initialRecommendedQuestions = [],
  initialFeaturedPages = [],
  initialCtaItems = [],
}: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recommendedQuestions = initialRecommendedQuestions;
  const featuredPages = initialFeaturedPages;
  const ctaItems = initialCtaItems;
  const lastSentUserElementRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToUserRef = useRef(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const followModeRef = useRef<"bottom" | "topAnchor" | "manual">("bottom");
  const listenersAttachedRef = useRef(false);
  const manualLockRef = useRef(false);
  const chatWrapperRef = useRef<HTMLDivElement | null>(null);
  const [faqsExpanded, setFaqsExpanded] = useState(false);

  const idCounterRef = useRef<number>(1);
  const nextId = () => (idCounterRef.current += 1);

  const markdownComponents = useMemo<MarkdownComponents>(() => ({
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="mb-4 leading-7" {...props} />,
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc ml-6 my-3 space-y-1" {...props} />,
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-decimal ml-6 my-3 space-y-1" {...props} />,
    li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li className="leading-7" {...props} />,
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="text-xl font-semibold mt-4 mb-2" {...props} />,
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="text-lg font-semibold mt-4 mb-2" {...props} />,
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="underline hover:no-underline" target="_blank" rel="noreferrer" {...props} />,
    code: (props: React.HTMLAttributes<HTMLElement>) => <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded" {...props} />,
  }), []);

  const MessageItem = memo(function MessageItem({
    message,
    isLastUser,
    lastSentUserElementRef,
    markdownComponents,
  }: {
    message: ChatMessage;
    isLastUser: boolean;
    lastSentUserElementRef: React.MutableRefObject<HTMLDivElement | null>;
    markdownComponents: MarkdownComponents | undefined;
  }) {
    const isAssistant = message.role === "assistant";
    const messageText = isAssistant ? ((message as AssistantExtras).answerText ?? message.content) : message.content;
    return (
      <li className={`${isAssistant ? "flex justify-start" : "flex justify-end"} fade-in`}>
        <div
          className={
            isAssistant
              ? "max-w-[85%] rounded-2xl px-4 py-2 text-sm message-bubble-assistant"
              : "max-w-[85%] rounded-2xl px-4 py-2 text-sm message-bubble-user"
          }
          ref={isLastUser ? lastSentUserElementRef : undefined}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none fade-in">
              {messageText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
                  {messageText}
                </ReactMarkdown>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/80" aria-label="Assistant is typing">
                  <span className="inline-flex gap-1">
                    <span className="inline-block size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                    <span className="inline-block size-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
                    <span className="inline-block size-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
                  </span>
                  <span>Thinking…</span>
                </div>
              )}
              {message.role === "assistant" && ((message as AssistantExtras).kbRefs?.length || (message as AssistantExtras).kbUrl) ? (
                <div className="mt-3">
                  {((message as AssistantExtras).kbRefs && (message as AssistantExtras).kbRefs!.length > 1) ? (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">References</div>
                      <ul className="list-disc ml-6 space-y-1">
                        {(message as AssistantExtras).kbRefs!.map((r, idx) => (
                          <li key={`${idx}-${r.url}`} className="text-xs">
                            <a className="underline hover:no-underline" href={r.url} target="_blank" rel="noreferrer">
                              {r.title || r.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <a
                      className="text-xs underline hover:no-underline px-2 py-1 rounded-md"
                      href={((message as AssistantExtras).kbRefs && (message as AssistantExtras).kbRefs![0]?.url) || (message as AssistantExtras).kbUrl!}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {`Learn more${((message as AssistantExtras).kbRefs && (message as AssistantExtras).kbRefs![0]?.title) ? ` about ${(message as AssistantExtras).kbRefs![0]!.title}` : ((message as AssistantExtras).kbTitle ? ` about ${(message as AssistantExtras).kbTitle}` : '')}`}
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <span className="whitespace-pre-wrap break-words">{messageText}</span>
          )}
        </div>
      </li>
    );
  });

  function resolveScrollContainer(): HTMLElement | null {
    if (scrollContainerRef.current && document.contains(scrollContainerRef.current)) {
      return scrollContainerRef.current;
    }
    const wrapper = chatWrapperRef.current;
    const candidates: (HTMLElement | null)[] = [
      scrollContainerRef.current,
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

  // removed: reserved for future debugging hooks

  // removed: no-op layout settling effect

  // (removed unused parseApiPayload helper)

  // suggested FAQs are provided from server props

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

  // featured pages are provided from server props

  // cta items are provided from server props

  // removed related-questions parsing

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;
    setIsLoading(true);
    setFaqsExpanded(false);
    const userId = nextId();
    pendingScrollToUserRef.current = true;
    manualLockRef.current = false;
    followModeRef.current = "topAnchor";
    setMessages((prev) => [...prev, { id: userId, role: "user", content: text } as ChatMessage]);
    setInput("");
    try {
      // Show assistant typing immediately and follow bottom while streaming
      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", answerText: "", streaming: true } as AssistantMessage,
      ]);
      if (!manualLockRef.current) {
        followModeRef.current = "bottom";
      }
      const res = await fetch("/api/chat/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok || !res.body) {
        const textBody = await res.text().catch(() => "");
        const errMsg = `Request failed (${res.status})${textBody ? ` - ${textBody}` : ''}`;
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            const m = next[i] as ChatMessage & Partial<AssistantExtras>;
            if (m && m.role === "assistant") {
              (m as unknown as { content: string }).content = errMsg;
              (m as AssistantExtras).answerText = errMsg;
              (m as AssistantExtras).streaming = false;
              break;
            }
          }
          return next as ChatMessage[];
        });
        return;
      }
      // capture top KB doc headers (if provided)
      const kbTitle = res.headers.get("X-KB-Title") || undefined;
      const kbUrl = res.headers.get("X-KB-Url") || undefined;
      let kbRefs: Array<{ title?: string; url: string }> | undefined;
      const refsHeader = res.headers.get("X-KB-Refs");
      if (refsHeader) {
        try {
          const parsed = JSON.parse(refsHeader);
          if (Array.isArray(parsed)) {
            kbRefs = parsed
              .map((r) => ({ title: typeof r.title === 'string' ? r.title : undefined, url: String(r.url || '') }))
              .filter((r) => !!r.url);
          }
        } catch {}
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let lastFlush = Date.now();
      let scheduled = false;
      const THROTTLE_MS = 50;
      const flushUpdate = () => {
        scheduled = false;
        lastFlush = Date.now();
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            const m = next[i] as ChatMessage & Partial<AssistantExtras>;
            if (m && m.role === "assistant") {
              const updated: AssistantMessage = {
                id: (m as ChatMessage).id,
                role: "assistant",
                content: accumulated,
                answerText: accumulated,
                streaming: true,
                kbTitle: kbTitle ?? (m as AssistantExtras).kbTitle,
                kbUrl: kbUrl ?? (m as AssistantExtras).kbUrl,
                kbRefs: (kbRefs && kbRefs.length ? kbRefs : (m as AssistantExtras).kbRefs) as AssistantMessage["kbRefs"],
              };
              next[i] = updated as unknown as ChatMessage;
              break;
            }
          }
          return next as ChatMessage[];
        });
        // auto-follow bottom while streaming
        if (followModeRef.current === "bottom") {
          const container = resolveScrollContainer();
          if (container) {
            requestAnimationFrame(() => {
              container.scrollTop = container.scrollHeight;
            });
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
          }
        }
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          accumulated += chunk;
          const now = Date.now();
          if (now - lastFlush >= THROTTLE_MS) {
            flushUpdate();
          } else if (!scheduled) {
            scheduled = true;
            setTimeout(() => flushUpdate(), THROTTLE_MS - (now - lastFlush));
          }
        }
      }
      // Determine final refs/title/url from headers only (API does not send trailers)
      const finalKbRefs = (kbRefs && kbRefs.length) ? kbRefs : undefined;
      const finalKbTitle = kbTitle || (finalKbRefs && finalKbRefs[0]?.title) || undefined;
      const finalKbUrl = kbUrl || (finalKbRefs && finalKbRefs[0]?.url) || undefined;

      // Ensure final flush in case last chunk didn't trigger (with stripped content)
      flushUpdate();
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          const m = next[i] as ChatMessage & Partial<AssistantExtras>;
          if (m && m.role === "assistant") {
            const updated: AssistantMessage = {
              id: (m as ChatMessage).id,
              role: "assistant",
              content: accumulated,
              answerText: accumulated,
              streaming: false,
              kbTitle: finalKbTitle ?? (m as AssistantExtras).kbTitle,
              kbUrl: finalKbUrl ?? (m as AssistantExtras).kbUrl,
              kbRefs: (finalKbRefs && finalKbRefs.length ? finalKbRefs : (m as AssistantExtras).kbRefs) as AssistantMessage["kbRefs"],
            };
            next[i] = updated as unknown as ChatMessage;
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
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          const m = next[i] as ChatMessage & Partial<AssistantExtras>;
          if (m && m.role === "assistant") {
            const err = `Error: ${msg}`;
            const updated: AssistantMessage = {
              id: (m as ChatMessage).id,
              role: "assistant",
              content: err,
              answerText: err,
              streaming: false,
              kbTitle: (m as AssistantExtras).kbTitle,
              kbUrl: (m as AssistantExtras).kbUrl,
              kbRefs: (m as AssistantExtras).kbRefs as AssistantMessage["kbRefs"],
            };
            next[i] = updated as unknown as ChatMessage;
            break;
          }
        }
        return next as ChatMessage[];
      });
    } finally {
      setIsLoading(false);
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
              <div
                ref={(ref: HTMLDivElement | null) => { scrollContainerRef.current = ref; }}
                style={{
                  height: '100%',
                  width: '100%',
                  padding: '1rem',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
                className="native-scroll"
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
                {messages.map((m, i) => (
                  <MessageItem
                    key={m.id}
                    message={m}
                    isLastUser={!((m as ChatMessage).role === 'assistant') && i === messages.length - 1}
                    lastSentUserElementRef={lastSentUserElementRef}
                    markdownComponents={markdownComponents}
                  />
                ))}
                <div ref={messagesEndRef} />
              </ul>
              </>
            )}
            {/* bottom typing indicator removed to avoid duplication */}
            </div>
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


