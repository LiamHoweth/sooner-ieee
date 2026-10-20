// Emergency password reset for an existing admin, run where the database lives.
// Railway: `railway ssh` into the API service, then: npm run set-password -- <username>
// It can also promote the account to owner: npm run set-password -- <username> --owner
import { randomBytes, scrypt } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { stdin, stdout } from 'node:process';

const [username, flag] = process.argv.slice(2);
if (!username) {
  console.error('Usage: npm run set-password -- <username> [--owner]');
  process.exit(1);
}
const file = path.join(process.env.DATA_DIR || path.resolve('storage'), 'ieee-sooners.sqlite');
if (!existsSync(file)) {
  console.error(`No database at ${file}. Set DATA_DIR (on Railway: DATA_DIR=/data).`);
  process.exit(1);
}

// Hidden input in a terminal; plain lines when piped (for scripts and CI).
let piped = null;
async function prompt(question) {
  if (!stdin.isTTY) {
    piped ??= await new Promise((resolve) => {
      let data = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (chunk) => (data += chunk));
      stdin.on('end', () => resolve(data.split(/\r?\n/)));
    });
    return piped.shift() ?? '';
  }
  return new Promise((resolve) => {
    stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n' || char === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') process.exit(1);
        if (char === '\u007f') value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on('data', onData);
  });
}

const db = new DatabaseSync(file);
const admin = db.prepare('SELECT id, username FROM admins WHERE username = ? OR email = ?').get(username.toLowerCase(), username.toLowerCase());
if (!admin) {
  console.error(`No admin named ${username}.`);
  process.exit(1);
}
const password = await prompt('New password (12+ characters): ');
if (password.length < 12 || password !== (await prompt('Repeat it: '))) {
  console.error('Passwords must match and be at least 12 characters.');
  process.exit(1);
}
const salt = randomBytes(32);
const key = await new Promise((resolve, reject) =>
  scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? reject(e) : resolve(k))),
);
const stamp = new Date().toISOString();
db.prepare('UPDATE admins SET password_hash = ?, disabled_at = NULL, updated_at = ? WHERE id = ?').run(
  `scrypt-v1$${salt.toString('base64url')}$${key.toString('base64url')}`,
  stamp,
  admin.id,
);
if (flag === '--owner') db.prepare("UPDATE admins SET role = 'owner' WHERE id = ?").run(admin.id);
db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(admin.id);
db.prepare('INSERT INTO audit_log (admin_id, action, target, created_at) VALUES (NULL, ?, ?, ?)').run('emergency-password-reset', admin.username, stamp);
console.log(`Password updated for ${admin.username}${flag === '--owner' ? ' (now an owner)' : ''}.`);
