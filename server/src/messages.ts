import { z } from 'zod';

import { type Db, now } from './db.js';

// The public Contact form posts exactly this shape. Keep the topics in sync with app/contact.
export const TOPICS = ['Sponsorship', 'Membership', 'Events', 'Press', 'Other'] as const;

export const messageSchema = z.object({
  name: z.string().trim().min(1, 'Add your name').max(120, 'Keep your name under 120 characters'),
  email: z.string().trim().toLowerCase().email('Use a valid email').max(200),
  organization: z.string().trim().max(160, 'Keep the organization under 160 characters').default(''),
  topic: z.enum(TOPICS, 'Choose a topic'),
  message: z.string().trim().min(10, 'Write a little more (10 characters or more)').max(5000, 'Keep the message under 5,000 characters'),
  // Honeypot. The route checks it before validation; this only keeps it from failing the schema.
  website: z.string().max(2000).optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

export function saveMessage(db: Db, input: MessageInput) {
  const result = db
    .prepare('INSERT INTO contact_messages (name, email, organization, topic, message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(input.name, input.email, input.organization, input.topic, input.message, now());
  return Number(result.lastInsertRowid);
}

type MessageRow = {
  id: number;
  name: string;
  email: string;
  organization: string;
  topic: (typeof TOPICS)[number];
  message: string;
  read_at: string | null;
  read_by_name: string | null;
  archived_at: string | null;
  archived_by_name: string | null;
  created_at: string;
};

const SELECT_MESSAGE = `SELECT m.*, r.display_name AS read_by_name, x.display_name AS archived_by_name FROM contact_messages m
  LEFT JOIN admins r ON r.id = m.read_by LEFT JOIN admins x ON x.id = m.archived_by`;

export function serializeMessage(row: MessageRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    organization: row.organization,
    topic: row.topic,
    message: row.message,
    createdAt: row.created_at,
    readAt: row.read_at,
    readBy: row.read_by_name,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by_name,
  };
}

export function listMessages(db: Db, filter: 'open' | 'archived' | 'all' = 'all') {
  const where = filter === 'open' ? 'WHERE m.archived_at IS NULL' : filter === 'archived' ? 'WHERE m.archived_at IS NOT NULL' : '';
  return (db.prepare(`${SELECT_MESSAGE} ${where} ORDER BY m.created_at DESC, m.id DESC`).all() as MessageRow[]).map(serializeMessage);
}

export function unreadMessages(db: Db) {
  return (db.prepare('SELECT COUNT(*) AS n FROM contact_messages WHERE read_at IS NULL AND archived_at IS NULL').get() as { n: number }).n;
}

export const messageUpdateSchema = z.object({
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
});

/** Marks a message read/unread and archived/open, remembering which officer did it. */
export function updateMessage(db: Db, id: number, update: z.infer<typeof messageUpdateSchema>, adminId: number) {
  const row = db.prepare('SELECT read_at, read_by, archived_at, archived_by FROM contact_messages WHERE id = ?').get(id) as
    | { read_at: string | null; read_by: number | null; archived_at: string | null; archived_by: number | null }
    | undefined;
  if (!row) return null;
  const stamp = now();
  // Archiving something unread counts as reading it, so it stops counting toward the badge.
  const read = update.read ?? (update.archived ? true : undefined);
  const [readAt, readBy] =
    read === undefined ? [row.read_at, row.read_by] : read ? (row.read_at ? [row.read_at, row.read_by] : [stamp, adminId]) : [null, null];
  const [archivedAt, archivedBy] =
    update.archived === undefined
      ? [row.archived_at, row.archived_by]
      : update.archived
        ? row.archived_at
          ? [row.archived_at, row.archived_by]
          : [stamp, adminId]
        : [null, null];
  db.prepare('UPDATE contact_messages SET read_at = ?, read_by = ?, archived_at = ?, archived_by = ? WHERE id = ?').run(
    readAt,
    readBy,
    archivedAt,
    archivedBy,
    id,
  );
  return serializeMessage(db.prepare(`${SELECT_MESSAGE} WHERE m.id = ?`).get(id) as MessageRow);
}

export function deleteMessage(db: Db, id: number) {
  return db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id).changes > 0;
}
