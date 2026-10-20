// Snapshot the database and copy uploaded images into ./backups/<timestamp>/.
// Run where the data lives: locally, or on Railway with `railway ssh` then `npm run backup`.
// Usage: DATA_DIR=/data npm run backup
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dataDir = process.env.DATA_DIR || path.resolve('storage');
const source = path.join(dataDir, 'ieee-sooners.sqlite');
if (!existsSync(source)) {
  console.error(`No database at ${source}. Set DATA_DIR.`);
  process.exit(1);
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.resolve(process.env.BACKUP_DIR || path.join(dataDir, 'backups'), stamp);
mkdirSync(target, { recursive: true });

const db = new DatabaseSync(source);
db.prepare('VACUUM INTO ?').run(path.join(target, 'ieee-sooners.sqlite'));
db.close();
if (existsSync(path.join(dataDir, 'uploads'))) {
  cpSync(path.join(dataDir, 'uploads'), path.join(target, 'uploads'), { recursive: true });
}
console.log(`Backup written to ${target}`);
