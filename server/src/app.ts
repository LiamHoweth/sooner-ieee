import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import {
  type Admin,
  adminForToken,
  allow,
  endAllSessions,
  findAdminByLogin,
  getAdmin,
  hashPassword,
  listAdmins,
  login,
  logout,
  newToken,
  passwordProblem,
  sha256,
  verifyPassword,
} from './auth.js';
import type { Config } from './config.js';
import { audit, type Db, now } from './db.js';
import type { Mailer } from './mail.js';
import {
  deletePost,
  getPost,
  getPublished,
  listAll,
  listPublished,
  postInputSchema,
  referencedUploads,
  savePost,
  serializePost,
} from './posts.js';
import {
  applicationSchema,
  applicationsCsv,
  applicationUpdateSchema,
  deleteApplication,
  listApplications,
  saveApplication,
  updateApplication,
} from './sponsors.js';
import { deleteUpload, findUpload, listUploads, MAX_UPLOAD_BYTES, saveUpload, uploadFileName, uploadsExist } from './uploads.js';

type Env = { Variables: { admin: Admin; token: string } };

export const VERSION = '1.0.0';

const loginSchema = z.object({
  login: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(1024),
  remember: z.boolean().default(false),
});

const newAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, 'Usernames are 3–32 letters, numbers, dots, dashes or underscores'),
  email: z.string().trim().toLowerCase().email('Use a valid Gmail or email address').max(200),
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(['owner', 'admin']).default('admin'),
  password: z.string(),
});

const adminUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  role: z.enum(['owner', 'admin']).optional(),
  disabled: z.boolean().optional(),
  password: z.string().optional(),
});

export function createApp({ db, config, mailer }: { db: Db; config: Config; mailer: Mailer }) {
  const app = new Hono<Env>();

  const uploadUrl = (id: string) => {
    const fileName = uploadFileName(db, id);
    return fileName ? `${config.publicApiUrl}/uploads/${fileName}` : '';
  };

  const clientIp = (c: Context) => {
    if (config.trustProxy) {
      const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
      if (forwarded) return forwarded;
    }
    const incoming = (c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined)?.incoming;
    return incoming?.socket?.remoteAddress ?? 'unknown';
  };

  const parse = async <T extends z.ZodTypeAny>(c: Context, schema: T) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return { error: c.json({ error: 'Send JSON.' }, 400) } as const;
    }
    const result = schema.safeParse(body);
    if (!result.success) {
      const issue = result.error.issues[0];
      return { error: c.json({ error: issue?.message ?? 'Check the form.', field: issue?.path.join('.') }, 400) } as const;
    }
    return { data: result.data as z.infer<T> } as const;
  };

  app.use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }));
  app.use(
    '/api/*',
    cors({
      origin: (origin) => (config.allowedOrigins.includes(origin) ? origin : null),
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      maxAge: 600,
    }),
  );
  app.use('/api/*', async (c, next) => {
    await next();
    c.header('Cache-Control', c.res.headers.get('Cache-Control') ?? 'no-store');
  });

  // ------------------------------------------------------------------ public
  app.get('/api/health', (c) => {
    db.prepare('SELECT 1').get();
    return c.json({ ok: true, version: VERSION, email: mailer.enabled });
  });

  app.get('/api/posts', (c) => {
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 12), 1), 50);
    const offset = Math.max(Number(c.req.query('offset') || 0), 0);
    const category = c.req.query('category') || undefined;
    const posts = listPublished(db, limit, offset, category).map((row) => serializePost(row, uploadUrl));
    c.header('Cache-Control', 'public, max-age=30');
    return c.json({ posts });
  });

  app.get('/api/posts/:slug', (c) => {
    const row = getPublished(db, c.req.param('slug'));
    if (!row) return c.json({ error: 'Post not found.' }, 404);
    c.header('Cache-Control', 'public, max-age=30');
    return c.json({ post: serializePost(row, uploadUrl) });
  });

  app.get('/uploads/:file', (c) => {
    const upload = findUpload(db, config.dataDir, c.req.param('file'));
    if (!upload) return c.text('Not found', 404);
    return new Response(Readable.toWeb(upload.stream()) as ReadableStream, {
      headers: {
        'Content-Type': upload.mime,
        'Content-Length': String(upload.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });

  app.post('/api/sponsor-applications', bodyLimit({ maxSize: 64 * 1024 }), async (c) => {
    if (!allow(db, `apply:${clientIp(c)}`, 5, 3600)) {
      return c.json({ error: 'Too many applications from this connection. Email ieee@ou.edu instead.' }, 429);
    }
    const parsed = await parse(c, applicationSchema);
    if ('error' in parsed) return parsed.error;
    const input = parsed.data;
    if (input.fax) return c.json({ ok: true }); // honeypot: pretend success, store nothing
    const id = saveApplication(db, input);
    const recipients = config.notifyEmails.length
      ? config.notifyEmails
      : listAdmins(db).filter((admin) => !admin.disabled_at).map((admin) => admin.email);
    void mailer.send(
      recipients,
      `New sponsor application: ${input.organization}`,
      `${input.contactName} <${input.email}> from ${input.organization} applied to sponsor IEEE Sooners.\n\n` +
        `Interests: ${input.interests.join(', ') || 'not specified'}\nBudget: ${input.budget || 'not specified'}\n` +
        `Timeline: ${input.timeline || 'not specified'}\n\n${input.message}\n\nReview it in the admin area: ${config.adminUrl}`,
    );
    return c.json({ ok: true, id }, 201);
  });

  // -------------------------------------------------------------------- auth
  app.post('/api/auth/login', bodyLimit({ maxSize: 8 * 1024 }), async (c) => {
    const parsed = await parse(c, loginSchema);
    if ('error' in parsed) return parsed.error;
    const { login: name, password, remember } = parsed.data;
    const ip = clientIp(c);
    if (!allow(db, `login-ip:${ip}`, 30, 900) || !allow(db, `login-user:${name.toLowerCase()}`, 10, 900)) {
      return c.json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }, 429);
    }
    const session = await login(db, name, password, remember, c.req.header('user-agent') ?? '');
    if (!session) return c.json({ error: 'That username or password is not right.' }, 401);
    return c.json(session);
  });

  app.post('/api/auth/forgot', bodyLimit({ maxSize: 8 * 1024 }), async (c) => {
    const parsed = await parse(c, z.object({ login: z.string().trim().min(1).max(200) }));
    if ('error' in parsed) return parsed.error;
    const generic = c.json({
      ok: true,
      emailEnabled: mailer.enabled,
      message: mailer.enabled
        ? 'If that account exists, a reset link is on its way to its email.'
        : 'Email is not set up yet. Ask the site owner to reset your password.',
    });
    if (!mailer.enabled || !allow(db, `forgot:${clientIp(c)}`, 5, 3600)) return generic;
    const admin = findAdminByLogin(db, parsed.data.login);
    if (!admin || admin.disabled_at) return generic;
    const token = newToken();
    db.prepare('INSERT INTO password_resets (token_hash, admin_id, expires_at) VALUES (?, ?, ?)').run(
      sha256(token),
      admin.id,
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    );
    void mailer.send(
      [admin.email],
      'Reset your IEEE Sooners admin password',
      `Hi ${admin.display_name},\n\nUse this link within an hour to choose a new password:\n${config.adminUrl}#reset=${token}\n\nIf you did not ask for this, ignore this email.`,
    );
    audit(db, admin.id, 'password-reset-requested');
    return generic;
  });

  app.post('/api/auth/reset', bodyLimit({ maxSize: 8 * 1024 }), async (c) => {
    const parsed = await parse(c, z.object({ token: z.string().min(20).max(200), password: z.string() }));
    if ('error' in parsed) return parsed.error;
    const problem = passwordProblem(parsed.data.password);
    if (problem) return c.json({ error: problem }, 400);
    const row = db
      .prepare('SELECT admin_id, expires_at, used_at FROM password_resets WHERE token_hash = ?')
      .get(sha256(parsed.data.token)) as { admin_id: number; expires_at: string; used_at: string | null } | undefined;
    if (!row || row.used_at || Date.parse(row.expires_at) < Date.now()) {
      return c.json({ error: 'That reset link has expired. Ask for a new one.' }, 400);
    }
    db.prepare('UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      await hashPassword(parsed.data.password),
      now(),
      row.admin_id,
    );
    db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(now(), sha256(parsed.data.token));
    endAllSessions(db, row.admin_id);
    audit(db, row.admin_id, 'password-reset');
    return c.json({ ok: true });
  });

  // Everything below needs a signed-in admin.
  app.use('/api/auth/me', requireAdmin);
  app.use('/api/auth/logout', requireAdmin);
  app.use('/api/auth/password', requireAdmin);
  app.use('/api/admin/*', requireAdmin);

  async function requireAdmin(c: Context<Env>, next: () => Promise<void>) {
    const header = c.req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const admin = token ? adminForToken(db, token) : null;
    if (!admin) return c.json({ error: 'Sign in again.' }, 401);
    c.set('admin', admin);
    c.set('token', token);
    await next();
  }

  const ownerOnly = (c: Context<Env>) =>
    c.get('admin').role === 'owner' ? null : c.json({ error: 'Only an owner can do that.' }, 403);

  app.get('/api/auth/me', (c) => c.json({ admin: c.get('admin'), emailEnabled: mailer.enabled }));

  app.patch('/api/auth/me', async (c) => {
    const parsed = await parse(c, z.object({ displayName: z.string().trim().min(1).max(80), email: z.string().trim().toLowerCase().email().max(200) }));
    if ('error' in parsed) return parsed.error;
    const admin = c.get('admin');
    try {
      db.prepare('UPDATE admins SET display_name = ?, email = ?, updated_at = ? WHERE id = ?').run(
        parsed.data.displayName,
        parsed.data.email,
        now(),
        admin.id,
      );
    } catch {
      return c.json({ error: 'Another admin already uses that email.' }, 409);
    }
    return c.json({ admin: getAdmin(db, admin.id) });
  });

  app.post('/api/auth/logout', (c) => {
    logout(db, c.get('token'));
    return c.json({ ok: true });
  });

  app.post('/api/auth/password', async (c) => {
    const parsed = await parse(c, z.object({ current: z.string().max(1024), next: z.string() }));
    if ('error' in parsed) return parsed.error;
    const admin = c.get('admin');
    const row = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(admin.id) as { password_hash: string };
    if (!(await verifyPassword(parsed.data.current, row.password_hash))) {
      return c.json({ error: 'Your current password is not right.' }, 400);
    }
    const problem = passwordProblem(parsed.data.next);
    if (problem) return c.json({ error: problem }, 400);
    db.prepare('UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?').run(await hashPassword(parsed.data.next), now(), admin.id);
    // Sign out other devices, keep this one.
    db.prepare('DELETE FROM sessions WHERE admin_id = ? AND token_hash != ?').run(admin.id, sha256(c.get('token')));
    audit(db, admin.id, 'password-changed');
    return c.json({ ok: true });
  });

  // ------------------------------------------------------------------- posts
  app.get('/api/admin/posts', (c) => c.json({ posts: listAll(db).map((row) => serializePost(row, uploadUrl)) }));

  app.get('/api/admin/posts/:id', (c) => {
    const row = getPost(db, Number(c.req.param('id')));
    return row ? c.json({ post: serializePost(row, uploadUrl) }) : c.json({ error: 'Post not found.' }, 404);
  });

  const writePost = async (c: Context<Env>, id?: number) => {
    const parsed = await parse(c, postInputSchema);
    if ('error' in parsed) return parsed.error;
    if (!uploadsExist(db, referencedUploads(parsed.data))) {
      return c.json({ error: 'One of the images is missing. Upload it again.' }, 400);
    }
    const savedId = savePost(db, parsed.data, c.get('admin').id, id);
    if (!savedId) return c.json({ error: 'Post not found.' }, 404);
    audit(db, c.get('admin').id, id ? 'post-updated' : 'post-created', String(savedId));
    return c.json({ post: serializePost(getPost(db, savedId)!, uploadUrl) }, id ? 200 : 201);
  };

  app.post('/api/admin/posts', bodyLimit({ maxSize: 1024 * 1024 }), (c) => writePost(c));
  app.patch('/api/admin/posts/:id', bodyLimit({ maxSize: 1024 * 1024 }), (c) => writePost(c, Number(c.req.param('id'))));

  app.delete('/api/admin/posts/:id', (c) => {
    const id = Number(c.req.param('id'));
    if (!deletePost(db, id)) return c.json({ error: 'Post not found.' }, 404);
    audit(db, c.get('admin').id, 'post-deleted', String(id));
    return c.json({ ok: true });
  });

  // ----------------------------------------------------------------- uploads
  app.post('/api/admin/uploads', bodyLimit({ maxSize: MAX_UPLOAD_BYTES + 64 * 1024 }), async (c) => {
    const form = await c.req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return c.json({ error: 'Choose an image to upload.' }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    const dims = { width: Number(form?.get('width')) || undefined, height: Number(form?.get('height')) || undefined };
    const saved = saveUpload(db, config.dataDir, bytes, file.name, c.get('admin').id, dims);
    if ('error' in saved) return c.json({ error: saved.error }, 400);
    audit(db, c.get('admin').id, 'upload', saved.id);
    return c.json({ id: saved.id, url: `${config.publicApiUrl}/uploads/${saved.fileName}` }, 201);
  });

  app.get('/api/admin/uploads', (c) =>
    c.json({
      uploads: listUploads(db).map((row) => ({ ...row, url: `${config.publicApiUrl}/uploads/${row.file_name}` })),
    }),
  );

  app.delete('/api/admin/uploads/:id', (c) => {
    const id = c.req.param('id');
    const inUse = (db.prepare("SELECT COUNT(*) AS n FROM posts WHERE cover_upload_id = ? OR blocks LIKE ?").get(id, `%${id}%`) as { n: number }).n;
    if (inUse) return c.json({ error: 'That image is used in a post. Remove it from the post first.' }, 409);
    if (!deleteUpload(db, config.dataDir, id)) return c.json({ error: 'Image not found.' }, 404);
    audit(db, c.get('admin').id, 'upload-deleted', id);
    return c.json({ ok: true });
  });

  // ---------------------------------------------------- sponsor applications
  app.get('/api/admin/sponsor-applications', (c) => c.json({ applications: listApplications(db) }));

  app.get('/api/admin/sponsor-applications.csv', (c) => {
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="sponsor-applications-${now().slice(0, 10)}.csv"`);
    return c.body(applicationsCsv(db));
  });

  app.patch('/api/admin/sponsor-applications/:id', async (c) => {
    const parsed = await parse(c, applicationUpdateSchema);
    if ('error' in parsed) return parsed.error;
    const updated = updateApplication(db, Number(c.req.param('id')), parsed.data);
    if (!updated) return c.json({ error: 'Application not found.' }, 404);
    audit(db, c.get('admin').id, 'application-updated', c.req.param('id'));
    return c.json({ application: updated });
  });

  app.delete('/api/admin/sponsor-applications/:id', (c) => {
    const denied = ownerOnly(c);
    if (denied) return denied;
    if (!deleteApplication(db, Number(c.req.param('id')))) return c.json({ error: 'Application not found.' }, 404);
    audit(db, c.get('admin').id, 'application-deleted', c.req.param('id'));
    return c.json({ ok: true });
  });

  // ------------------------------------------------------- admin accounts
  app.get('/api/admin/users', (c) => c.json({ admins: listAdmins(db) }));

  app.post('/api/admin/users', async (c) => {
    const denied = ownerOnly(c);
    if (denied) return denied;
    const parsed = await parse(c, newAdminSchema);
    if ('error' in parsed) return parsed.error;
    const input = parsed.data;
    const problem = passwordProblem(input.password);
    if (problem) return c.json({ error: problem, field: 'password' }, 400);
    const stamp = now();
    try {
      const result = db
        .prepare(
          `INSERT INTO admins (username, email, display_name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(input.username, input.email, input.displayName, input.role, await hashPassword(input.password), stamp, stamp);
      audit(db, c.get('admin').id, 'admin-created', input.username);
      return c.json({ admin: getAdmin(db, Number(result.lastInsertRowid)) }, 201);
    } catch {
      return c.json({ error: 'That username or email is already in use.' }, 409);
    }
  });

  app.patch('/api/admin/users/:id', async (c) => {
    const denied = ownerOnly(c);
    if (denied) return denied;
    const parsed = await parse(c, adminUpdateSchema);
    if ('error' in parsed) return parsed.error;
    const id = Number(c.req.param('id'));
    const target = getAdmin(db, id);
    if (!target) return c.json({ error: 'Admin not found.' }, 404);
    const update = parsed.data;
    const me = c.get('admin');

    const owners = listAdmins(db).filter((admin) => admin.role === 'owner' && !admin.disabled_at);
    const losingOwner = target.role === 'owner' && (update.role === 'admin' || update.disabled === true);
    if (losingOwner && owners.length <= 1) {
      return c.json({ error: 'Keep at least one active owner. Promote someone else first.' }, 400);
    }
    if (id === me.id && update.disabled) return c.json({ error: 'You cannot disable your own account.' }, 400);
    if (update.password !== undefined) {
      const problem = passwordProblem(update.password);
      if (problem) return c.json({ error: problem, field: 'password' }, 400);
    }

    try {
      db.prepare(
        `UPDATE admins SET display_name = ?, email = ?, role = ?, disabled_at = ?, updated_at = ? WHERE id = ?`,
      ).run(
        update.displayName ?? target.display_name,
        update.email ?? target.email,
        update.role ?? target.role,
        update.disabled === undefined ? target.disabled_at : update.disabled ? now() : null,
        now(),
        id,
      );
    } catch {
      return c.json({ error: 'Another admin already uses that email.' }, 409);
    }
    if (update.password !== undefined) {
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(await hashPassword(update.password), id);
    }
    if (update.disabled || update.password !== undefined) endAllSessions(db, id);
    audit(db, me.id, 'admin-updated', target.username);
    return c.json({ admin: getAdmin(db, id) });
  });

  // ---------------------------------------------------------------- backups
  app.get('/api/admin/export', (c) => {
    const denied = ownerOnly(c);
    if (denied) return denied;
    audit(db, c.get('admin').id, 'export');
    c.header('Content-Disposition', `attachment; filename="ieee-sooners-export-${now().slice(0, 10)}.json"`);
    return c.json({
      exportedAt: now(),
      version: VERSION,
      admins: listAdmins(db),
      posts: listAll(db).map((row) => serializePost(row, uploadUrl)),
      sponsorApplications: listApplications(db),
      uploads: listUploads(db).map((row) => ({ ...row, url: `${config.publicApiUrl}/uploads/${row.file_name}` })),
    });
  });

  app.get('/api/admin/backup.sqlite', async (c) => {
    const denied = ownerOnly(c);
    if (denied) return denied;
    const file = path.join(tmpdir(), `ieee-backup-${Date.now()}.sqlite`);
    db.prepare('VACUUM INTO ?').run(file);
    const { readFileSync } = await import('node:fs');
    const bytes = readFileSync(file);
    rmSync(file, { force: true });
    audit(db, c.get('admin').id, 'backup-downloaded');
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': `attachment; filename="ieee-sooners-${now().slice(0, 10)}.sqlite"`,
        'Cache-Control': 'no-store',
      },
    });
  });

  app.get('/api/admin/activity', (c) =>
    c.json({
      activity: db
        .prepare(
          `SELECT l.action, l.target, l.created_at, a.display_name FROM audit_log l LEFT JOIN admins a ON a.id = l.admin_id
           ORDER BY l.id DESC LIMIT 100`,
        )
        .all(),
    }),
  );

  app.notFound((c) => c.json({ error: 'Not found.' }, 404));
  app.onError((error, c) => {
    console.error('[api]', error);
    return c.json({ error: 'Something went wrong on the server.' }, 500);
  });

  return app;
}
