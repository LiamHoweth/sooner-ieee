// Image upload rules. These mirror server/src/uploads.ts (MAX_UPLOAD_BYTES and the sniffed
// types), which stays the real check; the browser repeats them only to explain problems early.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const UPLOAD_ACCEPT = UPLOAD_TYPES.join(',');

const TYPE_HELP = 'Use a JPEG, PNG, WebP or GIF. Screenshots and phone photos usually are.';

function megabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Checked before resizing: is this a picture at all? */
export function fileProblem(file: { name: string; type: string }) {
  if (file.type && !file.type.startsWith('image/')) return `“${file.name}” isn't a photo. ${TYPE_HELP}`;
  return null;
}

/** Checked after resizing, on what will actually be sent. */
export function uploadProblem(name: string, blob: { type: string; size: number }) {
  // An empty type means the browser could not tell; the server sniffs the bytes and decides.
  if (blob.type && !UPLOAD_TYPES.includes(blob.type)) return `“${name}” is a format the site can't show. ${TYPE_HELP}`;
  if (blob.size > MAX_UPLOAD_BYTES) {
    const gif = blob.type === 'image/gif' ? ' GIFs are not shrunk automatically.' : '';
    return `“${name}” is too big (${megabytes(blob.size)}). Photos must be 8 MB or smaller.${gif}`;
  }
  return null;
}
