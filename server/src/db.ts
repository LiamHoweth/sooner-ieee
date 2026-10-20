import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

/**
 * Schema migrations, applied in order and recorded in `schema_migrations`.
 * Never edit a shipped migration; append a new one.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE admins (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT,
    disabled_at TEXT
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    user_agent TEXT
  );
  CREATE INDEX sessions_admin ON sessions(admin_id);

  CREATE TABLE password_resets (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT
  );

  CREATE TABLE throttles (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    window_start INTEGER NOT NULL
  );

  CREATE TABLE uploads (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    original_name TEXT,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    uploaded_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'News',
    accent TEXT NOT NULL DEFAULT 'crimson',
    cover_upload_id TEXT REFERENCES uploads(id) ON DELETE SET NULL,
    cover_alt TEXT NOT NULL DEFAULT '',
    blocks TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    pinned INTEGER NOT NULL DEFAULT 0,
    author_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX posts_published ON posts(status, published_at);

  CREATE TABLE sponsor_applications (
    id INTEGER PRIMARY KEY,
    organization TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    interests TEXT NOT NULL DEFAULT '[]',
    budget TEXT NOT NULL DEFAULT '',
    timeline TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'accepted', 'declined')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  `,
];

export function openDatabase(dataDir: string): Db {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'ieee-sooners.sqlite'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  migrate(db);
  return db;
}

export function openMemoryDatabase(): Db {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(db: Db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const row = db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get() as { version: number | null };
  const current = row.version ?? 0;
  for (let index = current; index < MIGRATIONS.length; index++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[index]);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(index + 1, now());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

export function now() {
  return new Date().toISOString();
}

export function audit(db: Db, adminId: number | null, action: string, target = '') {
  db.prepare('INSERT INTO audit_log (admin_id, action, target, created_at) VALUES (?, ?, ?, ?)').run(
    adminId,
    action,
    target,
    now(),
  );
}
