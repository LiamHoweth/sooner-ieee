import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { createApp } from '../src/app.js';
import { bootstrapOwner, hashPassword } from '../src/auth.js';
import { loadConfig } from '../src/config.js';
import { type Db, openDatabase } from '../src/db.js';
import { createMailer } from '../src/mail.js';

const SITE = 'http://localhost:4317';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

let dir: string;
let db: Db;
let app: ReturnType<typeof createApp>;
let ownerToken = '';

async function call(method: string, url: string, body?: unknown, token?: string, headers: Record<string, string> = {}) {
  const init: RequestInit = { method, headers: { ...headers } };
  if (token) (init.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await app.request(url, init);
  const type = res.headers.get('content-type') ?? '';
  const data = type.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data: data as any, headers: res.headers };
}

async function signIn(login: string, password: string) {
  const res = await call('POST', '/api/auth/login', { login, password });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.token as string;
}

before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'ieee-api-'));
  const config = loadConfig({ DATA_DIR: dir, ALLOWED_ORIGINS: SITE, PUBLIC_API_URL: 'https://api.test' } as NodeJS.ProcessEnv);
  db = openDatabase(dir);
  bootstrapOwner(db, { username: 'webmaster', email: 'webmaster@gmail.com', passwordHash: await hashPassword('correct horse battery') });
  app = createApp({ db, config, mailer: createMailer(config) });
});

after(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('auth', () => {
  it('reports health', async () => {
    const res = await call('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.ok, true);
  });

  it('rejects a wrong password and accepts the right one by username or email', async () => {
    assert.equal((await call('POST', '/api/auth/login', { login: 'webmaster', password: 'nope nope nope' })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { login: 'nobody', password: 'nope nope nope' })).status, 401);
    ownerToken = await signIn('webmaster', 'correct horse battery');
    await signIn('WEBMASTER@gmail.com', 'correct horse battery');
  });

  it('protects admin routes', async () => {
    assert.equal((await call('GET', '/api/admin/posts')).status, 401);
    assert.equal((await call('GET', '/api/admin/posts', undefined, 'forged-token')).status, 401);
    const me = await call('GET', '/api/auth/me', undefined, ownerToken);
    assert.equal(me.data.admin.username, 'webmaster');
    assert.equal(me.data.admin.password_hash, undefined);
  });

  it('only sends CORS headers to allowed origins', async () => {
    const ok = await call('GET', '/api/health', undefined, undefined, { Origin: SITE });
    assert.equal(ok.headers.get('access-control-allow-origin'), SITE);
    const bad = await call('GET', '/api/health', undefined, undefined, { Origin: 'https://evil.example' });
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
  });
});

describe('admin accounts', () => {
  let adminToken = '';
  let adminId = 0;

  it('lets the owner create an admin with a username, password and Gmail', async () => {
    const weak = await call('POST', '/api/admin/users', { username: 'nathan', email: 'nathan@gmail.com', displayName: 'Nathan', password: 'short' }, ownerToken);
    assert.equal(weak.status, 400);
    const res = await call(
      'POST',
      '/api/admin/users',
      { username: 'nathan', email: 'nathan@gmail.com', displayName: 'Nathan', password: 'vice president 2026' },
      ownerToken,
    );
    assert.equal(res.status, 201, JSON.stringify(res.data));
    adminId = res.data.admin.id;
    adminToken = await signIn('nathan', 'vice president 2026');
    const dupe = await call('POST', '/api/admin/users', { username: 'nathan', email: 'x@gmail.com', displayName: 'X', password: 'vice president 2026' }, ownerToken);
    assert.equal(dupe.status, 409);
  });

  it('keeps account management owner-only', async () => {
    const res = await call('POST', '/api/admin/users', { username: 'sneaky', email: 's@gmail.com', displayName: 'S', password: 'vice president 2026' }, adminToken);
    assert.equal(res.status, 403);
    assert.equal((await call('GET', '/api/admin/export', undefined, adminToken)).status, 403);
  });

  it('never removes the last owner', async () => {
    const owner = (await call('GET', '/api/admin/users', undefined, ownerToken)).data.admins.find((a: any) => a.role === 'owner');
    const res = await call('PATCH', `/api/admin/users/${owner.id}`, { role: 'admin' }, ownerToken);
    assert.equal(res.status, 400);
  });

  it('signs a disabled admin out everywhere', async () => {
    assert.equal((await call('PATCH', `/api/admin/users/${adminId}`, { disabled: true }, ownerToken)).status, 200);
    assert.equal((await call('GET', '/api/auth/me', undefined, adminToken)).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { login: 'nathan', password: 'vice president 2026' })).status, 401);
    await call('PATCH', `/api/admin/users/${adminId}`, { disabled: false }, ownerToken);
  });

  it('changing a password signs out other devices', async () => {
    const second = await signIn('nathan', 'vice president 2026');
    const third = await signIn('nathan', 'vice president 2026');
    const res = await call('POST', '/api/auth/password', { current: 'vice president 2026', next: 'a brand new passphrase' }, second);
    assert.equal(res.status, 200);
    assert.equal((await call('GET', '/api/auth/me', undefined, second)).status, 200);
    assert.equal((await call('GET', '/api/auth/me', undefined, third)).status, 401);
  });
});

describe('posts', () => {
  let imageId = '';

  it('accepts real images and rejects disguised files', async () => {
    const good = new FormData();
    good.append('file', new File([PNG], 'pixel.png', { type: 'image/png' }));
    const res = await call('POST', '/api/admin/uploads', good, ownerToken);
    assert.equal(res.status, 201, JSON.stringify(res.data));
    imageId = res.data.id;
    const served = await app.request(new URL(res.data.url).pathname);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('content-type'), 'image/png');

    const bad = new FormData();
    bad.append('file', new File(['<script>alert(1)</script>'], 'evil.png', { type: 'image/png' }));
    assert.equal((await call('POST', '/api/admin/uploads', bad, ownerToken)).status, 400);
  });

  it('keeps drafts private and publishes on demand', async () => {
    const draft = await call(
      'POST',
      '/api/admin/posts',
      {
        title: 'Region 5 Recap!',
        summary: 'How the weekend went.',
        category: 'Event recap',
        coverUploadId: imageId,
        coverAlt: 'Team photo',
        blocks: [
          { type: 'heading', text: 'Results', level: 2 },
          { type: 'text', text: 'We placed **second** in [circuits](https://example.com).' },
          { type: 'image', uploadId: imageId, alt: 'Podium' },
          { type: 'stats', items: [{ value: '3', label: 'Podiums' }] },
        ],
      },
      ownerToken,
    );
    assert.equal(draft.status, 201, JSON.stringify(draft.data));
    assert.equal(draft.data.post.slug, 'region-5-recap');
    assert.equal((await call('GET', '/api/posts')).data.posts.length, 0);
    assert.equal((await call('GET', '/api/posts/region-5-recap')).status, 404);

    const id = draft.data.post.id;
    const published = await call('PATCH', `/api/admin/posts/${id}`, { ...draft.data.post, coverUploadId: imageId, blocks: draft.data.post.blocks.map(({ url, ...b }: any) => b), status: 'published', publishedAt: undefined }, ownerToken);
    assert.equal(published.status, 200, JSON.stringify(published.data));
    const list = await call('GET', '/api/posts');
    assert.equal(list.data.posts.length, 1);
    assert.match(list.data.posts[0].blocks[2].url, /^https:\/\/api\.test\/uploads\//);
  });

  it('rejects unsafe links and unknown block types', async () => {
    const js = await call('POST', '/api/admin/posts', { title: 'Bad', blocks: [{ type: 'button', label: 'x', url: 'javascript:alert(1)' }] }, ownerToken);
    assert.equal(js.status, 400);
    const html = await call('POST', '/api/admin/posts', { title: 'Bad', blocks: [{ type: 'html', html: '<script>' }] }, ownerToken);
    assert.equal(html.status, 400);
    const video = await call('POST', '/api/admin/posts', { title: 'Bad', blocks: [{ type: 'video', url: 'https://evil.example/x' }] }, ownerToken);
    assert.equal(video.status, 400);
  });

  it('gives duplicate titles unique slugs', async () => {
    const a = await call('POST', '/api/admin/posts', { title: 'General Meeting' }, ownerToken);
    const b = await call('POST', '/api/admin/posts', { title: 'General Meeting' }, ownerToken);
    assert.equal(a.data.post.slug, 'general-meeting');
    assert.equal(b.data.post.slug, 'general-meeting-2');
  });
});

describe('sponsor applications', () => {
  it('stores public applications for admins', async () => {
    const res = await call('POST', '/api/sponsor-applications', {
      organization: '=HYPERLINK("x")',
      contactName: 'Pat Engineer',
      email: 'pat@example.com',
      interests: ['speaker', 'projects'],
      budget: '1000-5000',
      message: 'We would love to host a workshop.',
    });
    assert.equal(res.status, 201, JSON.stringify(res.data));
    const list = await call('GET', '/api/admin/sponsor-applications', undefined, ownerToken);
    assert.equal(list.data.applications.length, 1);
    const csv = await call('GET', '/api/admin/sponsor-applications.csv', undefined, ownerToken);
    assert.match(csv.data, /"'=HYPERLINK/);
  });

  it('silently drops honeypot submissions and validates input', async () => {
    const bot = await call('POST', '/api/sponsor-applications', { organization: 'Spam', contactName: 'Bot', email: 'bot@example.com', fax: 'gotcha' });
    assert.equal(bot.status, 200);
    const bad = await call('POST', '/api/sponsor-applications', { organization: 'X', contactName: 'Y', email: 'not-an-email' });
    assert.equal(bad.status, 400);
    const list = await call('GET', '/api/admin/sponsor-applications', undefined, ownerToken);
    assert.equal(list.data.applications.length, 1);
  });
});

describe('throttling', () => {
  it('locks out repeated bad sign-ins for a username', async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await call('POST', '/api/auth/login', { login: 'target', password: 'wrong password!' })).status;
    assert.equal(last, 429);
  });
});

describe('contact messages', () => {
  const ip = (n: number) => ({ 'X-Forwarded-For': `203.0.113.${n}` });
  const valid = { name: 'Pat Engineer', email: 'Pat@Example.com', organization: 'Acme', topic: 'Sponsorship', message: 'We would like to sponsor a workshop.' };
  let messageId = 0;
  let adminToken = '';

  before(async () => {
    await call('POST', '/api/admin/users', { username: 'inboxer', email: 'inboxer@gmail.com', displayName: 'Inbox Officer', password: 'reads the inbox 2026' }, ownerToken);
    adminToken = await signIn('inboxer', 'reads the inbox 2026');
  });

  it('accepts a valid message with 201 { ok: true } and shows it to any officer', async () => {
    const res = await call('POST', '/api/messages', valid, undefined, ip(1));
    assert.equal(res.status, 201, JSON.stringify(res.data));
    assert.deepEqual(res.data, { ok: true });
    const list = await call('GET', '/api/admin/messages', undefined, adminToken);
    assert.equal(list.status, 200);
    assert.equal(list.data.messages.length, 1);
    assert.equal(list.data.unread, 1);
    const [message] = list.data.messages;
    assert.equal(message.email, 'pat@example.com');
    assert.equal(message.topic, 'Sponsorship');
    assert.equal(message.readAt, null);
    messageId = message.id;
  });

  it('answers honeypot submissions like a success but stores nothing', async () => {
    const bot = await call('POST', '/api/messages', { ...valid, website: 'https://spam.example' }, undefined, ip(2));
    assert.equal(bot.status, 201);
    assert.deepEqual(bot.data, { ok: true });
    // Even an otherwise-invalid bot submission gets the same answer.
    const sloppy = await call('POST', '/api/messages', { website: 'x' }, undefined, ip(2));
    assert.equal(sloppy.status, 201);
    assert.equal((await call('GET', '/api/admin/messages', undefined, ownerToken)).data.messages.length, 1);
  });

  it('validates each field', async () => {
    const cases = [
      { ...valid, name: '' },
      { ...valid, name: 'x'.repeat(121) },
      { ...valid, email: 'not-an-email' },
      { ...valid, organization: 'x'.repeat(161) },
      { ...valid, topic: 'Spam' },
      { ...valid, message: 'too short' },
      { ...valid, message: 'x'.repeat(5001) },
    ];
    for (const [index, body] of cases.entries()) {
      const res = await call('POST', '/api/messages', body, undefined, ip(10 + index));
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
      assert.equal(typeof res.data.error, 'string');
    }
    const optional = await call('POST', '/api/messages', { ...valid, organization: undefined, topic: 'Other' }, undefined, ip(20));
    assert.equal(optional.status, 201);
  });

  it('rate-limits one connection to 5 messages per 10 minutes', async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) last = (await call('POST', '/api/messages', valid, undefined, ip(30))).status;
    assert.equal(last, 429);
  });

  it('rate-limits by the last X-Forwarded-For hop, so a forged first entry does not reset the limit', async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      last = (await call('POST', '/api/messages', valid, undefined, { 'X-Forwarded-For': `10.0.0.${i}, 203.0.113.31` })).status;
    }
    assert.equal(last, 429);
  });

  it('keeps the inbox behind sign-in and delete owner-only', async () => {
    assert.equal((await call('GET', '/api/admin/messages')).status, 401);
    assert.equal((await call('PATCH', `/api/admin/messages/${messageId}`, { read: true })).status, 401);
    assert.equal((await call('DELETE', `/api/admin/messages/${messageId}`, undefined, adminToken)).status, 403);
  });

  it('records who read and archived a message', async () => {
    const read = await call('PATCH', `/api/admin/messages/${messageId}`, { read: true }, adminToken);
    assert.equal(read.status, 200);
    assert.equal(read.data.message.readBy, 'Inbox Officer');
    const unread = await call('PATCH', `/api/admin/messages/${messageId}`, { read: false }, adminToken);
    assert.equal(unread.data.message.readAt, null);

    const archived = await call('PATCH', `/api/admin/messages/${messageId}`, { archived: true }, ownerToken);
    assert.equal(archived.data.message.archivedBy, 'webmaster');
    assert.ok(archived.data.message.readAt, 'archiving marks it read');
    const open = await call('GET', '/api/admin/messages?status=open', undefined, adminToken);
    assert.ok(open.data.messages.every((m: any) => m.id !== messageId));
    const done = await call('GET', '/api/admin/messages?status=archived', undefined, adminToken);
    assert.ok(done.data.messages.some((m: any) => m.id === messageId));

    const reopened = await call('PATCH', `/api/admin/messages/${messageId}`, { archived: false }, adminToken);
    assert.equal(reopened.data.message.archivedAt, null);
    const counts = await call('GET', '/api/admin/inbox/counts', undefined, adminToken);
    assert.equal(typeof counts.data.messages, 'number');
    assert.equal(counts.data.applications, 1);
  });

  it('lets an owner delete a message', async () => {
    assert.equal((await call('DELETE', `/api/admin/messages/${messageId}`, undefined, ownerToken)).status, 200);
    assert.equal((await call('PATCH', `/api/admin/messages/${messageId}`, { read: true }, ownerToken)).status, 404);
  });

  it('emails the alert list with reply-to set when email is on', async () => {
    const sent: { to: string[]; subject: string; replyTo?: string }[] = [];
    const config = loadConfig({ DATA_DIR: dir, ALLOWED_ORIGINS: SITE, NOTIFY_EMAILS: 'president@example.com' } as NodeJS.ProcessEnv);
    const mailing = createApp({ db, config, mailer: { enabled: true, send: async (to, subject, _text, options) => (sent.push({ to, subject, replyTo: options?.replyTo }), true) } });
    const res = await mailing.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip(40) },
      body: JSON.stringify(valid),
    });
    assert.equal(res.status, 201);
    assert.deepEqual(sent, [{ to: ['president@example.com'], subject: 'New sponsorship message: Pat Engineer', replyTo: 'pat@example.com' }]);
  });
});

describe('invites', () => {
  const ip = (n: number) => ({ 'X-Forwarded-For': `198.51.100.${n}` });
  const account = (token: string, name: string) => ({
    token,
    username: name,
    email: `${name}@gmail.com`,
    displayName: name[0].toUpperCase() + name.slice(1),
    password: 'invited officer 2026',
  });
  let adminToken = '';

  before(async () => {
    adminToken = await signIn('inboxer', 'reads the inbox 2026');
  });

  it('is owner-only to create, list and revoke', async () => {
    assert.equal((await call('POST', '/api/admin/invites', { role: 'admin' }, adminToken)).status, 403);
    assert.equal((await call('GET', '/api/admin/invites', undefined, adminToken)).status, 403);
    assert.equal((await call('DELETE', '/api/admin/invites/1', undefined, adminToken)).status, 403);
    assert.equal((await call('POST', '/api/admin/invites', { role: 'admin' })).status, 401);
  });

  it('creates a single-use link that signs the new officer in', async () => {
    const created = await call('POST', '/api/admin/invites', { email: 'Riley@gmail.com', displayName: 'Riley', role: 'admin' }, ownerToken);
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const { token, url, invite, emailed } = created.data;
    assert.equal(emailed, false);
    assert.equal(new URL(url).searchParams.get('invite'), token);
    assert.ok(url.startsWith(`${SITE}/admin?`));
    assert.equal(invite.email, 'riley@gmail.com');
    assert.ok(Date.parse(invite.expiresAt) - Date.now() > 6.9 * 24 * 3600 * 1000);
    const stored = db.prepare('SELECT token_hash FROM admin_invites WHERE id = ?').get(invite.id) as { token_hash: string };
    assert.notEqual(stored.token_hash, token, 'only a hash is stored');

    const pending = await call('GET', '/api/admin/invites', undefined, ownerToken);
    assert.ok(pending.data.invites.some((item: any) => item.id === invite.id));

    const lookup = await call('POST', '/api/invites/lookup', { token }, undefined, ip(1));
    assert.equal(lookup.status, 200);
    assert.deepEqual(lookup.data.invite, { email: 'riley@gmail.com', displayName: 'Riley', role: 'admin', expiresAt: invite.expiresAt });

    const weak = await call('POST', '/api/invites/accept', { ...account(token, 'riley'), password: 'short' }, undefined, ip(1));
    assert.equal(weak.status, 400);

    const accepted = await call('POST', '/api/invites/accept', account(token, 'riley'), undefined, ip(1));
    assert.equal(accepted.status, 201, JSON.stringify(accepted.data));
    assert.equal(typeof accepted.data.token, 'string');
    assert.equal(typeof accepted.data.expiresAt, 'string');
    assert.equal(accepted.data.admin.username, 'riley');
    assert.equal(accepted.data.admin.role, 'admin');
    assert.equal(accepted.data.admin.password_hash, undefined);
    const me = await call('GET', '/api/auth/me', undefined, accepted.data.token);
    assert.equal(me.data.admin.display_name, 'Riley');
    await signIn('riley', 'invited officer 2026');

    // Single use.
    assert.equal((await call('POST', '/api/invites/lookup', { token }, undefined, ip(1))).status, 410);
    assert.equal((await call('POST', '/api/invites/accept', account(token, 'riley2'), undefined, ip(1))).status, 410);
    assert.ok((await call('GET', '/api/admin/invites', undefined, ownerToken)).data.invites.every((item: any) => item.id !== invite.id));
  });

  it('gives an owner invite the owner role', async () => {
    const { token } = (await call('POST', '/api/admin/invites', { role: 'owner' }, ownerToken)).data;
    const accepted = await call('POST', '/api/invites/accept', account(token, 'morgan'), undefined, ip(2));
    assert.equal(accepted.data.admin.role, 'owner');
  });

  it('keeps the link usable when the username is taken', async () => {
    const { token } = (await call('POST', '/api/admin/invites', {}, ownerToken)).data;
    const taken = await call('POST', '/api/invites/accept', { ...account(token, 'riley'), email: 'other@gmail.com' }, undefined, ip(3));
    assert.equal(taken.status, 409);
    assert.equal((await call('POST', '/api/invites/lookup', { token }, undefined, ip(3))).status, 200);
  });

  it('refuses expired, revoked and made-up links', async () => {
    const expired = (await call('POST', '/api/admin/invites', {}, ownerToken)).data;
    db.prepare('UPDATE admin_invites SET expires_at = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), expired.invite.id);
    assert.equal((await call('POST', '/api/invites/lookup', { token: expired.token }, undefined, ip(4))).status, 410);
    assert.equal((await call('POST', '/api/invites/accept', account(expired.token, 'late'), undefined, ip(4))).status, 410);

    const revoked = (await call('POST', '/api/admin/invites', {}, ownerToken)).data;
    assert.equal((await call('DELETE', `/api/admin/invites/${revoked.invite.id}`, undefined, ownerToken)).status, 200);
    assert.equal((await call('DELETE', `/api/admin/invites/${revoked.invite.id}`, undefined, ownerToken)).status, 404);
    assert.equal((await call('POST', '/api/invites/accept', account(revoked.token, 'revoked'), undefined, ip(4))).status, 410);

    assert.equal((await call('POST', '/api/invites/lookup', { token: 'x'.repeat(43) }, undefined, ip(4))).status, 410);
    assert.equal((await call('POST', '/api/auth/login', { login: 'late', password: 'invited officer 2026' })).status, 401);
  });

  it('reports emailed only when the invite email actually sent', async () => {
    const config = loadConfig({ DATA_DIR: dir, ALLOWED_ORIGINS: SITE } as NodeJS.ProcessEnv);
    const invite = async (send: () => Promise<boolean>) => {
      const mailing = createApp({ db, config, mailer: { enabled: true, send } });
      const res = await mailing.request('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ email: 'casey@gmail.com', role: 'admin', sendEmail: true }),
      });
      assert.equal(res.status, 201);
      return (await res.json()) as any;
    };
    assert.equal((await invite(async () => true)).emailed, true);
    for (const failing of [async () => false, async () => Promise.reject(new Error('SMTP down'))]) {
      const res = await invite(failing);
      assert.equal(res.emailed, false);
      assert.equal(typeof res.token, 'string');
      assert.ok(res.url.includes(res.token));
    }
  });

  it('keeps the owner-created password flow working', async () => {
    const res = await call('POST', '/api/admin/users', { username: 'direct', email: 'direct@gmail.com', displayName: 'Direct', password: 'typed by an owner' }, ownerToken);
    assert.equal(res.status, 201);
  });
});

describe('post expiry', () => {
  const hour = 3600 * 1000;
  const at = (offset: number) => new Date(Date.now() + offset).toISOString();

  it('hides expired posts from the list but keeps their link working', async () => {
    const expired = await call(
      'POST',
      '/api/admin/posts',
      { title: 'Career fair today', status: 'published', publishedAt: at(-2 * hour), expiresAt: at(-hour) },
      ownerToken,
    );
    assert.equal(expired.status, 201, JSON.stringify(expired.data));
    assert.ok(Math.abs(Date.parse(expired.data.post.expiresAt) - (Date.now() - hour)) < 60 * 1000);
    const upcoming = await call('POST', '/api/admin/posts', { title: 'Sign up by Friday', status: 'published', expiresAt: at(24 * hour) }, ownerToken);
    assert.equal(upcoming.status, 201);

    const slugs = (await call('GET', '/api/posts?limit=50')).data.posts.map((post: any) => post.slug);
    assert.ok(!slugs.includes('career-fair-today'));
    assert.ok(slugs.includes('sign-up-by-friday'));

    const single = await call('GET', '/api/posts/career-fair-today');
    assert.equal(single.status, 200);
    assert.ok(Date.parse(single.data.post.expiresAt) < Date.now());

    const admin = await call('GET', '/api/admin/posts', undefined, ownerToken);
    assert.ok(admin.data.posts.some((post: any) => post.slug === 'career-fair-today'));
  });

  it('clears "hide after" with null and keeps it when left out', async () => {
    const created = (await call('POST', '/api/admin/posts', { title: 'Expiry edits', expiresAt: at(hour) }, ownerToken)).data.post;
    const kept = await call('PATCH', `/api/admin/posts/${created.id}`, { title: 'Expiry edits' }, ownerToken);
    assert.equal(kept.data.post.expiresAt, created.expiresAt);
    const cleared = await call('PATCH', `/api/admin/posts/${created.id}`, { title: 'Expiry edits', expiresAt: null }, ownerToken);
    assert.equal(cleared.data.post.expiresAt, null);
  });

  it('rejects a "hide after" earlier than the publish date', async () => {
    const res = await call('POST', '/api/admin/posts', { title: 'Backwards', publishedAt: at(2 * hour), expiresAt: at(hour) }, ownerToken);
    assert.equal(res.status, 400);
    assert.equal(res.data.field, 'expiresAt');
  });

  it('checks "hide after" against the stored publish date when publishedAt is left out', async () => {
    const created = await call('POST', '/api/admin/posts', { title: 'Stored date', status: 'published', publishedAt: at(-hour) }, ownerToken);
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const edit = await call('PATCH', `/api/admin/posts/${created.data.post.id}`, { title: 'Stored date', status: 'published', expiresAt: at(-2 * hour) }, ownerToken);
    assert.equal(edit.status, 400);
    assert.equal(edit.data.field, 'expiresAt');
    assert.equal(edit.data.error, '"Hide after" must be later than the publish date.');
    const fresh = await call('POST', '/api/admin/posts', { title: 'Already over', status: 'published', expiresAt: at(-hour) }, ownerToken);
    assert.equal(fresh.status, 400);
    assert.equal(fresh.data.field, 'expiresAt');
  });
});
