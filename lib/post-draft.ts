import { type Block, isSafeHref } from '@/lib/posts';

// Editor helpers that fill in sensible defaults when an officer leaves something out.
// Pure functions over the shared block model (lib/posts.ts); nothing here changes it.

export type Photo = { id: string; url: string; alt: string };

/** Post text without the formatting marks: links become their text, bullets lose their dash. */
export function plainText(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[ \t]*(?:[-*]|\d+[.)])[ \t]+/gm, '');
}

/** The first sentence of the first paragraph, shortened at a word if it runs long. */
export function firstSentence(markdown: string, max = 200) {
  const paragraph =
    plainText(markdown)
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((chunk) => chunk.replace(/\s+/g, ' ').trim())
      .find(Boolean) ?? '';
  // A sentence ends at . ! or ? followed by a capital, digit or quote (so "e.g. pizza" keeps going).
  const sentence = /^(.+?[.!?])(?=\s+["“'(]?[A-Z0-9])/.exec(paragraph)?.[1] ?? paragraph;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,;:]+$/, '')}…`;
}

/** What the summary becomes if it's left blank. */
export function autoSummary(blocks: Block[]) {
  for (const block of blocks) {
    if (block.type === 'text' && block.text.trim()) return firstSentence(block.text);
  }
  return '';
}

/** The first uploaded photo in the post, used as the cover when none is chosen. */
export function firstPhoto(blocks: Block[]): Photo | null {
  for (const block of blocks) {
    if (block.type === 'image' && block.uploadId) return { id: block.uploadId, url: block.url ?? '', alt: block.alt };
    if (block.type === 'gallery') {
      const image = block.images.find((item) => item.uploadId);
      if (image) return { id: image.uploadId, url: image.url ?? '', alt: image.alt };
    }
  }
  return null;
}

/** True when a saved cover is just the automatic one (same photo, same description). */
export function isAutoCover(cover: Photo | null, blocks: Block[]) {
  const photo = firstPhoto(blocks);
  return Boolean(cover && photo && cover.id === photo.id && cover.alt === photo.alt);
}

/** A block nobody has filled in yet. These are left out when saving instead of failing validation. */
export function isBlankBlock(block: Block) {
  switch (block.type) {
    case 'text':
      return !block.text.trim();
    case 'heading':
    case 'quote':
      return !block.text.trim();
    case 'image':
      return !block.uploadId;
    case 'gallery':
      return block.images.length === 0;
    case 'button':
      return !block.label.trim() && ['', 'https://'].includes(block.url.trim());
    case 'callout':
      return !block.title.trim() && !block.text.trim();
    case 'video':
      return !block.url.trim();
    case 'stats':
      return block.items.every((item) => !item.value.trim() && !item.label.trim());
    case 'event':
      // The date is pre-filled, so it doesn't count as filled in.
      return !block.title.trim() && !block.time.trim() && !block.location.trim() && !block.url.trim();
    case 'columns':
      return !block.left.trim() && !block.right.trim();
    case 'divider':
      return false;
  }
}

const LINK_HELP = 'The link must start with https:// (or mailto: for email).';

function validLink(url: string) {
  const value = url.trim();
  return value !== 'https://' && isSafeHref(value);
}

/** A plain-language reason the server would reject a half-filled block, or null. Mirrors server/src/posts.ts. */
export function blockProblem(block: Block): string | null {
  switch (block.type) {
    case 'heading':
      return block.text.trim() ? null : 'Add the heading text.';
    case 'quote':
      return block.text.trim() ? null : 'Add the quote.';
    case 'button':
      if (!block.label.trim()) return 'Add the words to show on the button.';
      return validLink(block.url) ? null : LINK_HELP;
    case 'video':
      return /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//i.test(block.url.trim())
        ? null
        : 'Paste a YouTube or Vimeo link that starts with https://';
    case 'stats':
      return block.items.every((item) => item.value.trim() && item.label.trim()) ? null : 'Each stat needs a number and a label.';
    case 'event':
      if (!block.title.trim()) return 'Add the event name.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(block.date)) return 'Pick the event date.';
      return !block.url.trim() || validLink(block.url) ? null : LINK_HELP;
    default:
      return null;
  }
}

/** Blocks ready to send: blank ones dropped, empty stat rows removed, plus any problems by block index. */
export function prepareBlocks(blocks: Block[]) {
  const ready: Block[] = [];
  const problems: { index: number; message: string }[] = [];
  blocks.forEach((original, index) => {
    const block: Block =
      original.type === 'stats' ? { ...original, items: original.items.filter((item) => item.value.trim() || item.label.trim()) } : original;
    if (isBlankBlock(block)) return;
    const message = blockProblem(block);
    if (message) problems.push({ index, message });
    ready.push(block);
  });
  return { blocks: ready, problems };
}

/**
 * Adds uploaded photos to a post. One photo becomes a Photo block, several become a Gallery.
 * An empty photo or gallery block (for example from a template) is filled first.
 */
export function addPhotos(blocks: Block[], photos: { id: string; url: string }[]): Block[] {
  if (photos.length === 0) return blocks;
  const images = photos.map((photo) => ({ uploadId: photo.id, url: photo.url, alt: '' }));
  const slot = blocks.findIndex((block) => (block.type === 'image' && !block.uploadId) || (block.type === 'gallery' && block.images.length === 0));
  const target = slot === -1 ? null : blocks[slot];
  let next: Block;
  if (target?.type === 'gallery') next = { ...target, images: images.slice(0, 24) };
  else if (images.length === 1) next = target?.type === 'image' ? { ...target, uploadId: images[0].uploadId, url: images[0].url } : { type: 'image', uploadId: images[0].uploadId, url: images[0].url, alt: '', caption: '', width: 'wide' };
  else next = { type: 'gallery', images: images.slice(0, 24), layout: 'grid' };
  return slot === -1 ? [...blocks, next] : blocks.map((block, index) => (index === slot ? next : block));
}

/** The date of the last event block in the post, as YYYY-MM-DD. */
export function lastEventDate(blocks: Block[]) {
  const dates = blocks.flatMap((block) => (block.type === 'event' && /^\d{4}-\d{2}-\d{2}$/.test(block.date) ? [block.date] : []));
  return dates.sort().at(-1) ?? null;
}

/** Midnight at the start of the day after `date` (YYYY-MM-DD), in the browser's time zone. */
export function dayAfter(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day + 1, 0, 0, 0, 0);
}
