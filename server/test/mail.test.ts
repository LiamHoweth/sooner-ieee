import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

import { CHAPTER_EMAIL, loadConfig } from '../src/config.js';
import { createMailer } from '../src/mail.js';

const SECRET = 'test-secret-0123456789';

// A stand-in for the Apps Script relay: records each request and answers like the real one.
let server: Server;
let relayUrl = '';
const received: Record<string, unknown>[] = [];
let answer: { status: number; body: string } = { status: 200, body: JSON.stringify({ ok: true }) };

before(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      received.push(JSON.parse(raw) as Record<string, unknown>);
      res.writeHead(answer.status, { 'Content-Type': 'application/json' }).end(answer.body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  relayUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/exec`;
});

after(() => server.close());

const relayConfig = (extra: Record<string, string> = {}) =>
  loadConfig({ DATA_DIR: 'unused', MAIL_RELAY_URL: relayUrl, MAIL_RELAY_SECRET: SECRET, ...extra } as NodeJS.ProcessEnv);

describe('mail config', () => {
  it('sends form alerts to the chapter inbox by default', () => {
    assert.deepEqual(loadConfig({ DATA_DIR: 'unused' } as NodeJS.ProcessEnv).notifyEmails, [CHAPTER_EMAIL]);
    assert.equal(CHAPTER_EMAIL, 'ieee@ou.edu');
  });

  it('lets NOTIFY_EMAILS override the alert list', () => {
    const config = loadConfig({ DATA_DIR: 'unused', NOTIFY_EMAILS: 'a@example.com, b@example.com' } as NodeJS.ProcessEnv);
    assert.deepEqual(config.notifyEmails, ['a@example.com', 'b@example.com']);
  });

  it('ignores a relay without a URL or with a short secret', () => {
    assert.equal(loadConfig({ DATA_DIR: 'unused', MAIL_RELAY_SECRET: SECRET } as NodeJS.ProcessEnv).mailRelay, null);
    assert.equal(loadConfig({ DATA_DIR: 'unused', MAIL_RELAY_URL: relayUrl, MAIL_RELAY_SECRET: 'short' } as NodeJS.ProcessEnv).mailRelay, null);
    assert.equal(createMailer(loadConfig({ DATA_DIR: 'unused' } as NodeJS.ProcessEnv)).enabled, false);
  });
});

describe('mail relay', () => {
  it('posts the message with the secret and reports success', async () => {
    received.length = 0;
    answer = { status: 200, body: JSON.stringify({ ok: true }) };
    const mailer = createMailer(relayConfig());
    assert.equal(mailer.enabled, true);
    const ok = await mailer.send(['ieee@ou.edu'], 'New sponsor application: Acme', 'Body text', { replyTo: 'pat@example.com' });
    assert.equal(ok, true);
    assert.deepEqual(received[0], {
      secret: SECRET,
      to: ['ieee@ou.edu'],
      subject: 'New sponsor application: Acme',
      text: 'Body text',
      replyTo: 'pat@example.com',
    });
  });

  it('is used instead of SMTP when both are set', async () => {
    received.length = 0;
    answer = { status: 200, body: JSON.stringify({ ok: true }) };
    const mailer = createMailer(relayConfig({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'u', SMTP_PASS: 'p' }));
    assert.equal(await mailer.send(['ieee@ou.edu'], 'Hi', 'Text'), true);
    assert.equal(received.length, 1);
  });

  it('returns false, without throwing, when the relay refuses or breaks', async () => {
    const mailer = createMailer(relayConfig());
    answer = { status: 200, body: JSON.stringify({ ok: false, error: 'unauthorized' }) };
    assert.equal(await mailer.send(['ieee@ou.edu'], 'Hi', 'Text'), false);
    answer = { status: 500, body: 'oops' };
    assert.equal(await mailer.send(['ieee@ou.edu'], 'Hi', 'Text'), false);
    assert.equal(await mailer.send([], 'Hi', 'Text'), false);
  });
});
