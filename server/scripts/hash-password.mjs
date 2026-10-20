// Prints a scrypt-v1 password hash for BOOTSTRAP_OWNER_PASSWORD_HASH.
// Usage: npm run hash-password   (you will be prompted; nothing is echoed or saved)
import { randomBytes, scrypt } from 'node:crypto';
import { stdin, stdout } from 'node:process';

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

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

const password = await prompt('New password (12+ characters): ');
const confirm = await prompt('Repeat it: ');
if (password !== confirm) {
  console.error('The passwords did not match.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Use at least 12 characters.');
  process.exit(1);
}
const salt = randomBytes(32);
const key = await new Promise((resolve, reject) =>
  scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, derived) => (error ? reject(error) : resolve(derived))),
);
console.log(`scrypt-v1$${salt.toString('base64url')}$${key.toString('base64url')}`);
