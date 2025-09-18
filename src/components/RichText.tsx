import React from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import type { Document } from '@contentful/rich-text-types';

export function isRichTextDocument(value: unknown): value is Document {
  if (!value || typeof value !== 'object') return false;
  const v = value as { nodeType?: unknown; content?: unknown };
  return v.nodeType === 'document' && Array.isArray(v.content);
}

export default function RichText({ json }: { json: Document }) {
  return <div className="prose dark:prose-invert max-w-none">{documentToReactComponents(json)}</div>;
}


