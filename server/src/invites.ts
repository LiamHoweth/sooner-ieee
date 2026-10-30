import { z } from 'zod';

import { newToken, sha256 } from './auth.js';
import { type Db, now } from './db.js';

export const INVITE_DAYS = 7;

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Use a valid Gmail or email address').max(200).or(z.literal('')).default(''),
  displayName: z.string().trim().max(80).default(''),
  role: z.enum(['owner', 'admin']).default('admin'),
  sendEmail: z.boolean().default(false),
});

export type InviteInput = z.infer<typeof inviteSchema>;

type InviteRow = {
  id: number;
  email: string;
  display_name: string;
  role: 'owner' | 'admin';
  created_by_name: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

const SELECT_INVITE = `SELECT i.*, a.display_name AS created_by_name FROM admin_invites i LEFT JOIN admins a ON a.id = i.created_by`;

export function serializeInvite(row: InviteRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdBy: row.created_by_name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

/** Stores a new invite and returns the raw token. Only its hash is kept, so the link can't be shown again. */
export function createInvite(db: Db, input: InviteInput, createdBy: number) {
  const token = newToken();
  const result = db
    .prepare(
      'INSERT INTO admin_invites (token_hash, email, display_name, role, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      sha256(token),
      input.email,
      input.displayName,
      input.role,
      createdBy,
      now(),
      new Date(Date.now() + INVITE_DAYS * 24 * 3600 * 1000).toISOString(),
    );
  const row = db.prepare(`${SELECT_INVITE} WHERE i.id = ?`).get(Number(result.lastInsertRowid)) as InviteRow;
  return { token, invite: serializeInvite(row) };
}

export function listPendingInvites(db: Db) {
  return (
    db
      .prepare(`${SELECT_INVITE} WHERE i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > ? ORDER BY i.created_at DESC`)
      .all(now()) as InviteRow[]
  ).map(serializeInvite);
}

/** The invite behind a token, or null when it is unknown, used, revoked or expired. */
export function pendingInvite(db: Db, token: string) {
  const row = db.prepare(`${SELECT_INVITE} WHERE i.token_hash = ?`).get(sha256(token)) as InviteRow | undefined;
  if (!row || row.used_at || row.revoked_at || Date.parse(row.expires_at) <= Date.now()) return null;
  return serializeInvite(row);
}

export function revokeInvite(db: Db, id: number) {
  return db.prepare('UPDATE admin_invites SET revoked_at = ? WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL').run(now(), id).changes > 0;
}

/** Burns the invite. Returns false if someone else used or revoked it first. */
export function useInvite(db: Db, id: number, adminId: number) {
  return (
    db.prepare('UPDATE admin_invites SET used_at = ?, used_by = ? WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL').run(now(), adminId, id)
      .changes > 0
  );
}
