"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components as MarkdownComponents } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type Props = {
  children: string;
  components?: MarkdownComponents;
};

export default function MarkdownRenderer({ children, components }: Props) {
  return (
    <ReactMarkdown skipHtml remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {children}
    </ReactMarkdown>
  );
}


