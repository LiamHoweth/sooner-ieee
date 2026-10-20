import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { type Db, now } from './db.js';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const TYPES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/gif', ext: 'gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

/** Identify an image by its bytes, never by the name or type the browser claims. */
export function sniffImage(bytes: Buffer) {
  return TYPES.find((type) => type.test(bytes)) ?? null;
}

export function saveUpload(
  db: Db,
  dataDir: string,
  bytes: Buffer,
  originalName: string,
  adminId: number,
  dims?: { width?: number; height?: number },
) {
  const type = sniffImage(bytes);
  if (!type) return { error: 'Upload a JPEG, PNG, WebP or GIF image.' } as const;
  if (bytes.length > MAX_UPLOAD_BYTES) return { error: 'Images must be 8 MB or smaller.' } as const;

  const id = randomBytes(12).toString('hex');
  const fileName = `${id}.${type.ext}`;
  writeFileSync(path.join(dataDir, 'uploads', fileName), bytes, { flag: 'wx' });
  db.prepare(
    'INSERT INTO uploads (id, file_name, original_name, mime, size, width, height, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, fileName, originalName.slice(0, 200), type.mime, bytes.length, dims?.width ?? null, dims?.height ?? null, adminId, now());
  return { id, fileName, mime: type.mime } as const;
}

export function findUpload(db: Db, dataDir: string, fileName: string) {
  if (!/^[a-f0-9]{24}\.(jpg|png|gif|webp)$/.test(fileName)) return null;
  const row = db.prepare('SELECT mime FROM uploads WHERE file_name = ?').get(fileName) as { mime: string } | undefined;
  const filePath = path.join(dataDir, 'uploads', fileName);
  if (!row || !existsSync(filePath)) return null;
  return { mime: row.mime, size: statSync(filePath).size, stream: () => createReadStream(filePath) };
}

export function listUploads(db: Db) {
  return db.prepare('SELECT id, file_name, original_name, mime, size, width, height, created_at FROM uploads ORDER BY created_at DESC').all() as {
    id: string;
    file_name: string;
    original_name: string | null;
    mime: string;
    size: number;
    width: number | null;
    height: number | null;
    created_at: string;
  }[];
}

export function deleteUpload(db: Db, dataDir: string, id: string) {
  const row = db.prepare('SELECT file_name FROM uploads WHERE id = ?').get(id) as { file_name: string } | undefined;
  if (!row) return false;
  db.prepare('DELETE FROM uploads WHERE id = ?').run(id);
  const filePath = path.join(dataDir, 'uploads', row.file_name);
  if (existsSync(filePath)) unlinkSync(filePath);
  return true;
}

export function uploadFileName(db: Db, id: string) {
  return (db.prepare('SELECT file_name FROM uploads WHERE id = ?').get(id) as { file_name: string } | undefined)?.file_name ?? null;
}

export function uploadsExist(db: Db, ids: string[]) {
  return ids.every((id) => Boolean(uploadFileName(db, id)));
}
