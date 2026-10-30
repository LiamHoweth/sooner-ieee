import { isSafeHref } from '@/lib/posts';

// Turns HTML from the clipboard (Google Docs, Discord, web pages) into post text.
// Links become [text](https://…), the only inline syntax worth keeping from a paste;
// paragraphs, line breaks and list items keep their shape; everything else is dropped.
// Pure string work (no DOM), so it runs in tests and can never execute pasted markup.

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'p', 'pre', 'section', 'table', 'tr',
]);
const SKIP_TAGS = new Set(['script', 'style', 'head', 'title', 'template', 'noscript', 'svg', 'iframe', 'object', 'select', 'textarea']);
const VOID_TAGS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'wbr', 'col', 'area', 'base', 'source']);

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', hellip: '…', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™', zwj: '', zwnj: '',
};

export function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

function attribute(attrs: string, name: string) {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(attrs);
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? '') : null;
}

/** Unwraps Google's redirect links (https://www.google.com/url?q=…) and makes the href safe for the link syntax. */
function cleanHref(raw: string) {
  let href = raw.trim();
  try {
    const url = new URL(href);
    if (/^(www\.)?google\.[a-z.]+$/.test(url.hostname) && url.pathname === '/url') href = url.searchParams.get('q') ?? url.searchParams.get('url') ?? href;
  } catch {
    // Relative or malformed: judged by isSafeHref below.
  }
  // The link syntax ends at ")" or whitespace, so encode those.
  return href.replace(/\s/g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

const TAG = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!doctype[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/gi;

export function htmlToRichText(html: string): string {
  let out = '';
  let pending = 0; // 0 nothing, 1 line break, 2 paragraph break, waiting for the next text
  let prefix = ''; // list marker waiting for the item's first text
  const lists: { ordered: boolean; count: number }[] = [];
  let inItem = 0;
  let skip: string | null = null;
  let link: { href: string; text: string } | null = null;

  const atLineStart = () => out === '' || pending > 0 || out.endsWith('\n');
  const lineBreak = (level: 1 | 2) => {
    if (out !== '') pending = Math.max(pending, level);
  };
  const emit = (value: string) => {
    if (!value) return;
    if (pending > 0) {
      out = out.replace(/[ \t]+$/, '') + (pending === 2 ? '\n\n' : '\n');
      pending = 0;
    }
    if (prefix) {
      out += prefix;
      prefix = '';
    }
    out += value;
  };
  const text = (raw: string) => {
    let value = decodeEntities(raw).replace(/[\s ]+/g, ' ');
    if (link) {
      link.text += value;
      return;
    }
    if (atLineStart() || out.endsWith(' ')) value = value.replace(/^ /, '');
    if (value) emit(value);
  };

  let last = 0;
  for (const match of html.matchAll(TAG)) {
    const index = match.index ?? 0;
    if (index > last && !skip) text(html.slice(last, index));
    last = index + match[0].length;
    const name = match[2]?.toLowerCase();
    if (!name) continue; // comment, doctype, CDATA
    const closing = match[1] === '/';
    const attrs = match[3] ?? '';

    if (skip) {
      if (closing && name === skip) skip = null;
      continue;
    }
    if (SKIP_TAGS.has(name)) {
      if (!closing && !match[4] && !VOID_TAGS.has(name)) skip = name;
      continue;
    }

    if (name === 'a') {
      if (!closing && !link) link = { href: attribute(attrs, 'href') ?? '', text: '' };
      else if (closing && link) {
        const current = link;
        link = null;
        const label = current.text.replace(/\s+/g, ' ');
        const core = label.trim().replace(/[[\]]/g, '');
        if (/^\s/.test(label)) text(' ');
        const href = cleanHref(current.href);
        if (core) emit(href && isSafeHref(href) && !href.startsWith('/') ? `[${core}](${href})` : core);
        if (/\s$/.test(label) && core) text(' ');
      }
      continue;
    }
    if (name === 'br') {
      if (link) link.text += ' ';
      else if (inItem) text(' ');
      else {
        // Each <br> adds a line; two in a row make a new paragraph.
        if (out !== '') pending = Math.min(2, pending + 1);
      }
      continue;
    }
    if (name === 'ul' || name === 'ol') {
      // Post text has no nested lists, so inner lists continue the outer one line by line.
      if (closing) lists.pop();
      else lists.push({ ordered: name === 'ol', count: 0 });
      lineBreak(lists.length > (closing ? 0 : 1) ? 1 : 2);
      continue;
    }
    if (name === 'li') {
      if (closing) {
        inItem = Math.max(0, inItem - 1);
        prefix = '';
        continue;
      }
      const list = lists.at(-1);
      lineBreak(1);
      if (list) list.count += 1;
      prefix = list?.ordered ? `${list.count}. ` : '- ';
      inItem += 1;
      continue;
    }
    if (name === 'td' || name === 'th') {
      if (closing) text(' ');
      continue;
    }
    if (BLOCK_TAGS.has(name)) {
      // Inside a list item, paragraphs (Google Docs wraps every item in <p>) stay on the item's line.
      if (!inItem) lineBreak(2);
    }
    // Everything else (span, b, strong, i, em, font, img, …) is dropped; its text is kept.
  }
  if (last < html.length && !skip) text(html.slice(last));
  if (link) emit(link.text.trim());

  return out
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, '').replace(/ {2,}/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** True when clipboard HTML has links worth converting; otherwise the browser's plain-text paste is fine. */
export function pasteHasLinks(html: string) {
  return /<a\s[^>]*href\s*=/i.test(html);
}
