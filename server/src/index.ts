import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { bootstrapOwner, pruneExpired } from './auth.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';
import { createMailer } from './mail.js';

const config = loadConfig();
const db = openDatabase(config.dataDir);

if (bootstrapOwner(db, config.bootstrapOwner)) {
  console.log(`[setup] Created owner account "${config.bootstrapOwner?.username}". You can now remove the BOOTSTRAP_OWNER_* variables.`);
}

const mailer = createMailer(config);
const app = createApp({ db, config, mailer });

pruneExpired(db);
const pruneTimer = setInterval(() => pruneExpired(db), 60 * 60 * 1000);

const server = serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`[api] IEEE Sooners API listening on :${info.port} (data: ${config.dataDir}, email: ${mailer.enabled ? 'on' : 'off'})`);
});

function shutdown() {
  clearInterval(pruneTimer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
