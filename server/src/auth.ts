import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import { audit, type Db, now } from './db.js';

// Same scrypt-v1 format as the OPC Plumbing site, so one hashing script works for both.
const HASH_PREFIX = 'scrypt-v1';
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export const SESSION_HOURS = 12;
export const REMEMBER_DAYS = 30;
export const MIN_PASSWORD_LENGTH = 12;

export type Role = 'owner' | 'admin';

export type Admin = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
};

const ADMIN_COLUMNS = 'id, username, email, display_name, role, created_at, last_login_at, disabled_at';

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

function decodeHash(value: string) {
  const parts = value.split('$');
  if (parts.length !== 3 || parts[0] !== HASH_PREFIX) return null;
  const salt = Buffer.from(parts[1], 'base64url');
  const key = Buffer.from(parts[2], 'base64url');
  if (salt.length !== 32 || key.length !== 64) return null;
  return { salt, key };
}

export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (Buffer.byteLength(password) > 1024) return 'That password is too long.';
  return null;
}

export async function hashPassword(password: string) {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const salt = randomBytes(32);
  const key = await deriveKey(password, salt);
  return `${HASH_PREFIX}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export function isPasswordHash(value: string) {
  return decodeHash(value) !== null;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const parsed = decodeHash(passwordHash);
  if (!parsed || Buffer.byteLength(password) > 1024) return false;
  const actual = await deriveKey(password, parsed.salt);
  return timingSafeEqual(actual, parsed.key);
}

// A real hash to compare against when the username is unknown, so response time
// does not reveal which usernames exist.
let decoyHash: Promise<string> | null = null;
function decoy() {
  decoyHash ??= hashPassword(randomBytes(24).toString('base64url'));
  return decoyHash;
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function newToken() {
  return randomBytes(32).toString('base64url');
}

/** Fixed-window counter persisted in SQLite. Returns false once `limit` is exceeded. */
export function allow(db: Db, key: string, limit: number, windowSeconds: number) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const row = db.prepare('SELECT count, window_start FROM throttles WHERE key = ?').get(key) as
    | { count: number; window_start: number }
    | undefined;
  if (!row || nowSeconds - row.window_start >= windowSeconds) {
    db.prepare(
      'INSERT INTO throttles (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start',
    ).run(key, nowSeconds);
    return true;
  }
  if (row.count >= limit) return false;
  db.prepare('UPDATE throttles SET count = count + 1 WHERE key = ?').run(key);
  return true;
}

export function findAdminByLogin(db: Db, login: string) {
  const value = login.trim().toLowerCase();
  return db
    .prepare(`SELECT ${ADMIN_COLUMNS}, password_hash FROM admins WHERE username = ? OR email = ?`)
    .get(value, value) as (Admin & { password_hash: string }) | undefined;
}

export function getAdmin(db: Db, id: number) {
  return db.prepare(`SELECT ${ADMIN_COLUMNS} FROM admins WHERE id = ?`).get(id) as Admin | undefined;
}

export function listAdmins(db: Db) {
  return db.prepare(`SELECT ${ADMIN_COLUMNS} FROM admins ORDER BY role DESC, username`).all() as Admin[];
}

export async function login(db: Db, loginName: string, password: string, remember: boolean, userAgent: string) {
  const admin = findAdminByLogin(db, loginName);
  if (!admin || admin.disabled_at) {
    await verifyPassword(password, await decoy());
    return null;
  }
  if (!(await verifyPassword(password, admin.password_hash))) return null;

  const token = newToken();
  const expires = new Date(Date.now() + (remember ? REMEMBER_DAYS * 24 : SESSION_HOURS) * 3600 * 1000);
  db.prepare('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)').run(
    sha256(token),
    admin.id,
    now(),
    expires.toISOString(),
    userAgent.slice(0, 200),
  );
  db.prepare('UPDATE admins SET last_login_at = ? WHERE id = ?').run(now(), admin.id);
  audit(db, admin.id, 'login');
  const { password_hash: _hash, ...safe } = admin;
  return { token, expiresAt: expires.toISOString(), admin: safe as Admin };
}

export function adminForToken(db: Db, token: string) {
  const row = db
    .prepare(
      `SELECT a.id, a.username, a.email, a.display_name, a.role, a.created_at, a.last_login_at, a.disabled_at, s.expires_at
       FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ?`,
    )
    .get(sha256(token)) as (Admin & { expires_at: string }) | undefined;
  if (!row || row.disabled_at || Date.parse(row.expires_at) < Date.now()) return null;
  const { expires_at: _expires, ...admin } = row;
  return admin as Admin;
}

export function logout(db: Db, token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function endAllSessions(db: Db, adminId: number) {
  db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(adminId);
}

export function pruneExpired(db: Db) {
  const stamp = now();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(stamp);
  db.prepare('DELETE FROM password_resets WHERE expires_at < ? OR used_at IS NOT NULL').run(stamp);
  db.prepare('DELETE FROM throttles WHERE window_start < ?').run(Math.floor(Date.now() / 1000) - 86400);
}

/** Creates the first owner from environment variables when no admins exist yet. */
export function bootstrapOwner(db: Db, owner: { username: string; email: string; passwordHash: string } | null) {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM admins').get() as { n: number }).n;
  if (count > 0 || !owner) return false;
  if (!isPasswordHash(owner.passwordHash)) {
    throw new Error('BOOTSTRAP_OWNER_PASSWORD_HASH is not a valid scrypt-v1 hash. Run `npm run hash-password`.');
  }
  const stamp = now();
  db.prepare(
    `INSERT INTO admins (username, email, display_name, role, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, 'owner', ?, ?, ?)`,
  ).run(owner.username, owner.email, owner.username, owner.passwordHash, stamp, stamp);
  audit(db, null, 'bootstrap-owner', owner.username);
  return true;
}
