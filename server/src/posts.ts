import { z } from 'zod';

import { type Db, now } from './db.js';

// Keep in sync with lib/posts.ts on the website, which renders these blocks.
const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => /^(https:\/\/|mailto:|\/)/i.test(value), 'Links must start with https://, mailto: or /');

const uploadId = z.string().regex(/^[a-z0-9]{24}$/);
const text = (max: number) => z.string().trim().max(max);

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), text: text(160).min(1), level: z.union([z.literal(2), z.literal(3)]) }),
  z.object({ type: z.literal('text'), text: text(20000) }),
  z.object({
    type: z.literal('image'),
    uploadId,
    alt: text(300),
    caption: text(300).default(''),
    width: z.enum(['inline', 'wide', 'full']).default('wide'),
  }),
  z.object({
    type: z.literal('gallery'),
    images: z.array(z.object({ uploadId, alt: text(300) })).min(1).max(24),
    layout: z.enum(['grid', 'carousel']).default('grid'),
  }),
  z.object({ type: z.literal('quote'), text: text(1200).min(1), attribution: text(160).default('') }),
  z.object({
    type: z.literal('button'),
    label: text(80).min(1),
    url: safeUrl,
    style: z.enum(['crimson', 'outline']).default('crimson'),
  }),
  z.object({
    type: z.literal('callout'),
    tone: z.enum(['crimson', 'blue', 'storm', 'cream']).default('crimson'),
    title: text(160).default(''),
    text: text(4000),
  }),
  z.object({
    type: z.literal('video'),
    url: safeUrl.refine(
      (value) => /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//i.test(value),
      'Use a YouTube or Vimeo link',
    ),
    caption: text(300).default(''),
  }),
  z.object({
    type: z.literal('stats'),
    items: z.array(z.object({ value: text(24).min(1), label: text(80).min(1) })).min(1).max(6),
  }),
  z.object({
    type: z.literal('event'),
    title: text(160).min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: text(40).default(''),
    location: text(160).default(''),
    url: safeUrl.or(z.literal('')).default(''),
  }),
  z.object({ type: z.literal('columns'), left: text(8000), right: text(8000) }),
  z.object({ type: z.literal('divider') }),
]);

export type Block = z.infer<typeof blockSchema>;

export const postInputSchema = z.object({
  title: text(160).min(1, 'Add a title'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes')
    .optional(),
  summary: text(400).default(''),
  category: text(40).min(1).default('News'),
  accent: z.enum(['crimson', 'blue', 'storm']).default('crimson'),
  coverUploadId: uploadId.nullable().default(null),
  coverAlt: text(300).default(''),
  blocks: z.array(blockSchema).max(200).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  pinned: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
});

export type PostInput = z.infer<typeof postInputSchema>;

type PostRow = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  accent: string;
  cover_upload_id: string | null;
  cover_alt: string;
  blocks: string;
  status: 'draft' | 'published';
  pinned: number;
  author_id: number | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  );
}

function uniqueSlug(db: Db, base: string, excludeId?: number) {
  let candidate = base;
  for (let n = 2; ; n++) {
    const row = db.prepare('SELECT id FROM posts WHERE slug = ?').get(candidate) as { id: number } | undefined;
    if (!row || row.id === excludeId) return candidate;
    candidate = `${base}-${n}`.slice(0, 80);
  }
}

export function serializePost(row: PostRow, uploadUrl: (id: string) => string) {
  const blocks = JSON.parse(row.blocks) as Block[];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    accent: row.accent,
    cover: row.cover_upload_id ? { id: row.cover_upload_id, url: uploadUrl(row.cover_upload_id), alt: row.cover_alt } : null,
    blocks: blocks.map((block) => withUrls(block, uploadUrl)),
    status: row.status,
    pinned: Boolean(row.pinned),
    author: row.author_name,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function withUrls(block: Block, uploadUrl: (id: string) => string) {
  if (block.type === 'image') return { ...block, url: uploadUrl(block.uploadId) };
  if (block.type === 'gallery') {
    return { ...block, images: block.images.map((image) => ({ ...image, url: uploadUrl(image.uploadId) })) };
  }
  return block;
}

const SELECT_POST = `SELECT p.*, a.display_name AS author_name FROM posts p LEFT JOIN admins a ON a.id = p.author_id`;

export function listPublished(db: Db, limit: number, offset: number, category?: string) {
  const filter = category ? 'AND p.category = ?' : '';
  const args: (string | number)[] = category ? [now(), category, limit, offset] : [now(), limit, offset];
  return db
    .prepare(
      `${SELECT_POST} WHERE p.status = 'published' AND p.published_at <= ? ${filter}
       ORDER BY p.pinned DESC, p.published_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...args) as PostRow[];
}

export function getPublished(db: Db, slug: string) {
  return db
    .prepare(`${SELECT_POST} WHERE p.slug = ? AND p.status = 'published' AND p.published_at <= ?`)
    .get(slug, now()) as PostRow | undefined;
}

export function listAll(db: Db) {
  return db.prepare(`${SELECT_POST} ORDER BY p.updated_at DESC`).all() as PostRow[];
}

export function getPost(db: Db, id: number) {
  return db.prepare(`${SELECT_POST} WHERE p.id = ?`).get(id) as PostRow | undefined;
}

export function referencedUploads(input: PostInput) {
  const ids = new Set<string>();
  if (input.coverUploadId) ids.add(input.coverUploadId);
  for (const block of input.blocks) {
    if (block.type === 'image') ids.add(block.uploadId);
    if (block.type === 'gallery') block.images.forEach((image) => ids.add(image.uploadId));
  }
  return [...ids];
}

export function savePost(db: Db, input: PostInput, authorId: number, id?: number) {
  const existing = id ? getPost(db, id) : undefined;
  if (id && !existing) return null;
  const slug = uniqueSlug(db, input.slug || slugify(input.title), id);
  const stamp = now();
  // Keep the original publish date when a published post is edited.
  const publishedAt =
    input.status === 'published'
      ? input.publishedAt ?? existing?.published_at ?? stamp
      : input.publishedAt ?? existing?.published_at ?? null;
  const values = [
    slug,
    input.title,
    input.summary,
    input.category,
    input.accent,
    input.coverUploadId,
    input.coverAlt,
    JSON.stringify(input.blocks),
    input.status,
    input.pinned ? 1 : 0,
    publishedAt,
    stamp,
  ];

  if (existing) {
    db.prepare(
      `UPDATE posts SET slug = ?, title = ?, summary = ?, category = ?, accent = ?, cover_upload_id = ?, cover_alt = ?,
       blocks = ?, status = ?, pinned = ?, published_at = ?, updated_at = ? WHERE id = ?`,
    ).run(...values, existing.id);
    return existing.id;
  }
  const result = db
    .prepare(
      `INSERT INTO posts (slug, title, summary, category, accent, cover_upload_id, cover_alt, blocks, status, pinned,
       published_at, updated_at, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(...values, authorId, stamp);
  return Number(result.lastInsertRowid);
}

export function deletePost(db: Db, id: number) {
  return db.prepare('DELETE FROM posts WHERE id = ?').run(id).changes > 0;
}
