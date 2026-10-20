import { isSafeHref } from '@/lib/posts';

// A tiny, safe subset of Markdown for post text. It produces a tree, never HTML,
// so nothing an officer types can run as code on the site.
//   **bold**  *italic*  `code`  [link text](https://…)
//   blank line = new paragraph · "- " bullets · "1. " numbered lists

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'code'; text: string }
  | { kind: 'link'; href: string; children: Inline[] }
  | { kind: 'break' };

export type RichBlock =
  | { kind: 'p'; children: Inline[] }
  | { kind: 'ul'; items: Inline[][] }
  | { kind: 'ol'; items: Inline[][] };

const INLINE = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\n)/g;

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ kind: 'text', text: source.slice(last, index) });
    if (match[2] !== undefined) out.push({ kind: 'strong', children: parseInline(match[2]) });
    else if (match[4] !== undefined) out.push({ kind: 'em', children: parseInline(match[4]) });
    else if (match[6] !== undefined) out.push({ kind: 'code', text: match[6] });
    else if (match[8] !== undefined) {
      const href = match[9];
      out.push(
        isSafeHref(href)
          ? { kind: 'link', href, children: parseInline(match[8]) }
          : { kind: 'text', text: match[8] },
      );
    } else out.push({ kind: 'break' });
    last = index + match[0].length;
  }
  if (last < source.length) out.push({ kind: 'text', text: source.slice(last) });
  return out;
}

export function parseRichText(source: string): RichBlock[] {
  return source
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): RichBlock => {
      const lines = chunk.split('\n');
      if (lines.every((line) => /^[-*] /.test(line))) {
        return { kind: 'ul', items: lines.map((line) => parseInline(line.slice(2))) };
      }
      if (lines.every((line) => /^\d+[.)] /.test(line))) {
        return { kind: 'ol', items: lines.map((line) => parseInline(line.replace(/^\d+[.)] /, ''))) };
      }
      return { kind: 'p', children: parseInline(chunk) };
    });
}
