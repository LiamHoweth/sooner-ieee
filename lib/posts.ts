// Post content model. Keep in sync with server/src/posts.ts, which validates it.

export type Accent = 'crimson' | 'blue' | 'storm';

export type Block =
  | { type: 'heading'; text: string; level: 2 | 3 }
  | { type: 'text'; text: string }
  | { type: 'image'; uploadId: string; alt: string; caption: string; width: 'inline' | 'wide' | 'full'; url?: string }
  | { type: 'gallery'; images: { uploadId: string; alt: string; url?: string }[]; layout: 'grid' | 'carousel' }
  | { type: 'quote'; text: string; attribution: string }
  | { type: 'button'; label: string; url: string; style: 'crimson' | 'outline' }
  | { type: 'callout'; tone: 'crimson' | 'blue' | 'storm' | 'cream'; title: string; text: string }
  | { type: 'video'; url: string; caption: string }
  | { type: 'stats'; items: { value: string; label: string }[] }
  | { type: 'event'; title: string; date: string; time: string; location: string; url: string }
  | { type: 'columns'; left: string; right: string }
  | { type: 'divider' };

export type BlockType = Block['type'];

export type Post = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  accent: Accent;
  cover: { id: string; url: string; alt: string } | null;
  blocks: Block[];
  status: 'draft' | 'published';
  pinned: boolean;
  author: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORIES = ['News', 'Event recap', 'Opportunity', 'Project', 'Announcement', 'Spotlight'];

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  gallery: 'Gallery',
  quote: 'Quote',
  button: 'Button',
  callout: 'Callout',
  video: 'Video',
  stats: 'Stats',
  event: 'Event',
  columns: 'Two columns',
  divider: 'Divider',
};

export function emptyBlock(type: BlockType): Block {
  switch (type) {
    case 'heading':
      return { type, text: '', level: 2 };
    case 'text':
      return { type, text: '' };
    case 'image':
      return { type, uploadId: '', alt: '', caption: '', width: 'wide' };
    case 'gallery':
      return { type, images: [], layout: 'grid' };
    case 'quote':
      return { type, text: '', attribution: '' };
    case 'button':
      return { type, label: '', url: 'https://', style: 'crimson' };
    case 'callout':
      return { type, tone: 'crimson', title: '', text: '' };
    case 'video':
      return { type, url: '', caption: '' };
    case 'stats':
      return { type, items: [{ value: '', label: '' }] };
    case 'event':
      return { type, title: '', date: new Date().toISOString().slice(0, 10), time: '', location: '', url: '' };
    case 'columns':
      return { type, left: '', right: '' };
    case 'divider':
      return { type };
  }
}

/** Turns a YouTube or Vimeo page link into its privacy-friendly embed URL. */
export function videoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (host === 'youtube.com') {
      const id = parsed.searchParams.get('v') ?? parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') return `https://player.vimeo.com/video/${parsed.pathname.split('/').filter(Boolean)[0]}`;
    if (host === 'player.vimeo.com') return url;
  } catch {
    return null;
  }
  return null;
}

export function isSafeHref(href: string) {
  return /^(https:\/\/|mailto:|\/)/i.test(href);
}

export function formatPostDate(iso: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(iso),
  );
}
