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
