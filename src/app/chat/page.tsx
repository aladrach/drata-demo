import type { Metadata } from "next";
import ChatClient from "@/components/ChatClient";

export const metadata: Metadata = {
  title: "Chat Demo",
};

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 min-h-[70svh]">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Chat Demo</h1>
      <div className="rounded-lg border bg-card">
        <div className="h-[600px]">
          <ChatClient />
        </div>
      </div>
    </div>
  );
}


