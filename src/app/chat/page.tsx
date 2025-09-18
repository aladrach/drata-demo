import type { Metadata } from "next";
import Chat from "@/components/Chat";

export const metadata: Metadata = {
  title: "Chat Demo",
};

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 min-h-[70svh]">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Chat Demo</h1>
      <div className="text-sm text-muted-foreground mb-4">
        <p>
          This chat UI is powered by <code>ChatClient.tsx</code>, a client component that streams assistant responses,
          renders Markdown, and supports references, FAQs, and CTAs from CMS.
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>
            <strong>Server props</strong>: The server component <code>Chat</code> loads recommended questions, featured pages, and CTAs
            from CMS and passes them as initial props.
          </li>
          <li>
            <strong>Streaming</strong>: Messages post to <code>/api/chat/assistant</code> and stream the response via <code>ReadableStream</code>,
            throttled for smooth UI updates.
          </li>
          <li>
            <strong>Rendering</strong>: Markdown is rendered with <code>react-markdown</code> and GFM. Assistant control tags are sanitized.
          </li>
          <li>
            <strong>References</strong>: Optional knowledge base metadata (title, url, refs) is read from response headers and displayed.
          </li>
          <li>
            <strong>UX</strong>: Smart auto-scroll modes keep focus on the latest content without layout jank.
          </li>
        </ul>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="h-[600px]">
          <Chat />
        </div>
      </div>
    </div>
  );
}


