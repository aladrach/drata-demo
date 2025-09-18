import { getCached, setCached } from '@/lib/server-cache';

type InlineResult =
  | { kind: 'svg'; svg: string; contentType: string }
  | { kind: 'external'; url: string; contentType?: string };

const NAMESPACE = 'inline-media';

function isSvgContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return ct.includes('image/svg+xml') || ct.startsWith('image/svg');
}

function sanitizeSvg(svg: string): string {
  // Very light sanitation: strip XML declaration and DOCTYPE to avoid parser delays
  // and remove potential script tags. For robust sanitization consider a library.
  let cleaned = svg
    .replace(/<\?xml[^>]*>/gi, '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .trim();
  // Ensure an <svg ...> root exists
  if (!/\<svg[\s>]/i.test(cleaned)) return '';

  // Normalize the root <svg> tag for responsive, non-cropping scaling
  const openingTagMatch = cleaned.match(/<svg[^>]*>/i);
  if (openingTagMatch) {
    const openingTag = openingTagMatch[0];

    // Extract width/height before removing to build a fallback viewBox if needed
    const widthAttr = openingTag.match(/\swidth\s*=\s*"([^"]+)"/i) || openingTag.match(/\swidth\s*=\s*'([^']+)'/i) || openingTag.match(/\swidth\s*=\s*([^\s>"]+)/i);
    const heightAttr = openingTag.match(/\sheight\s*=\s*"([^"]+)"/i) || openingTag.match(/\sheight\s*=\s*'([^']+)'/i) || openingTag.match(/\sheight\s*=\s*([^\s>"]+)/i);
    const widthRaw = widthAttr ? String(widthAttr[1]).trim() : undefined;
    const heightRaw = heightAttr ? String(heightAttr[1]).trim() : undefined;

    let newTag = openingTag
      .replace(/\s(width|height)\s*=\s*"[^"]*"/gi, '')
      .replace(/\s(width|height)\s*=\s*'[^']*'/gi, '')
      .replace(/\s(width|height)\s*=\s*[^\s>"']+/gi, '');

    // Ensure preserveAspectRatio uses 'meet' to avoid cropping, center the graphic
    if (!/preserveAspectRatio\s*=\s*/i.test(newTag)) {
      newTag = newTag.replace(/>$/i, ' preserveAspectRatio="xMidYMid meet">');
    }

    // Ensure style includes width/height 100% so it fills the container
    if (/style\s*=\s*"/i.test(newTag)) {
      newTag = newTag.replace(/style\s*=\s*"([^"]*)"/i, (_m, s) => {
        const style = String(s);
        const additions = ['width:100%', 'height:100%', 'display:block'].filter(rule => !style.includes(rule));
        return `style="${style}${style && !style.trim().endsWith(';') ? ';' : ''}${additions.join(';')}"`;
      });
    } else if (/style\s*=\s*'/i.test(newTag)) {
      newTag = newTag.replace(/style\s*=\s*'([^']*)'/i, (_m, s) => {
        const style = String(s);
        const additions = ['width:100%', 'height:100%', 'display:block'].filter(rule => !style.includes(rule));
        return `style='${style}${style && !style.trim().endsWith(';') ? ';' : ''}${additions.join(';')}'`;
      });
    } else {
      newTag = newTag.replace(/<svg/i, '<svg style="width:100%;height:100%;display:block"');
    }

    // If there is no viewBox but we have numeric width/height, synthesize a viewBox
    if (!/viewBox\s*=\s*/i.test(newTag) && widthRaw && heightRaw) {
      const parseLen = (val: string): number | undefined => {
        const m = val.match(/^(\d*\.?\d+)(px)?$/i);
        return m ? parseFloat(m[1]) : undefined;
      };
      const w = parseLen(widthRaw);
      const h = parseLen(heightRaw);
      if (typeof w === 'number' && typeof h === 'number' && isFinite(w) && isFinite(h) && w > 0 && h > 0) {
        newTag = newTag.replace(/>$/i, ` viewBox="0 0 ${w} ${h}">`);
      }
    }

    cleaned = cleaned.replace(openingTag, newTag);
  }

  return cleaned;
}

export async function fetchInlineMedia(url: string, cacheTtlSeconds = 600): Promise<InlineResult> {
  try {
    const cached = getCached<InlineResult>(NAMESPACE, url);
    if (cached) return cached;

    const res = await fetch(url, { next: { revalidate: cacheTtlSeconds } });
    if (!res.ok) {
      return { kind: 'external', url };
    }
    const contentType = res.headers.get('content-type');
    if (isSvgContentType(contentType)) {
      const text = await res.text();
      const svg = sanitizeSvg(text);
      if (svg) {
        const result: InlineResult = { kind: 'svg', svg, contentType: contentType ?? 'image/svg+xml' };
        setCached(NAMESPACE, url, result, cacheTtlSeconds);
        return result;
      }
    }
    const external: InlineResult = { kind: 'external', url, contentType: contentType ?? undefined };
    setCached(NAMESPACE, url, external, cacheTtlSeconds);
    return external;
  } catch (_err) {
    return { kind: 'external', url };
  }
}


