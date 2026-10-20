'use client';

import { ImagePlus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { api, ApiError } from '@/lib/api';

import type { UploadItem } from './types';

const MAX_EDGE = 2000;

/** Shrinks photos in the browser before upload so phone pictures stay small. GIFs pass through. */
async function prepareImage(file: File) {
  if (file.type === 'image/gif' || !('createImageBitmap' in window)) return { blob: file as Blob, width: 0, height: 0 };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    return blob ? { blob, width, height } : { blob: file as Blob, width: bitmap.width, height: bitmap.height };
  } catch {
    return { blob: file as Blob, width: 0, height: 0 };
  }
}

export async function uploadImage(file: File) {
  const { blob, width, height } = await prepareImage(file);
  const form = new FormData();
  const name = file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '');
  form.append('file', new File([blob], name || 'image', { type: blob.type }));
  if (width) form.append('width', String(width));
  if (height) form.append('height', String(height));
  return api<{ id: string; url: string }>('/api/admin/uploads', { method: 'POST', body: form, auth: true });
}

export function ImagePicker({
  open,
  onClose,
  onPick,
  multiple = false,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (images: { id: string; url: string }[]) => void;
  multiple?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      setSelected([]);
      setError('');
      api<{ uploads: UploadItem[] }>('/api/admin/uploads', { auth: true })
        .then((data) => setUploads(data.uploads))
        .catch(() => setError('Could not load the image library.'));
    }
    if (!open && element.open) element.close();
  }, [open]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      const added: { id: string; url: string }[] = [];
      for (const file of Array.from(files)) added.push(await uploadImage(file));
      if (!multiple) {
        onPick(added.slice(0, 1));
        return;
      }
      const fresh = await api<{ uploads: UploadItem[] }>('/api/admin/uploads', { auth: true });
      setUploads(fresh.uploads);
      setSelected((current) => [...current, ...added.map((item) => item.id)]);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    if (!multiple) {
      const item = uploads.find((upload) => upload.id === id);
      if (item) onPick([{ id: item.id, url: item.url }]);
      return;
    }
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  return (
    <dialog ref={dialog} className="admin-dialog" onClose={onClose} aria-labelledby="picker-title">
      <div className="admin-dialog-head">
        <h2 id="picker-title">{multiple ? 'Choose images' : 'Choose an image'}</h2>
        <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </div>
      <label className="admin-dropzone">
        <Upload aria-hidden="true" />
        <span>{busy ? 'Uploading…' : 'Upload from your computer or phone'}</span>
        <small>JPEG, PNG, WebP or GIF. Large photos are resized automatically.</small>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={multiple} disabled={busy} onChange={(event) => onFiles(event.target.files)} />
      </label>
      {error && <p className="admin-error">{error}</p>}
      <p className="admin-dialog-sub">Or reuse one from the library</p>
      <div className="admin-library">
        {uploads.map((upload) => (
          <button
            key={upload.id}
            type="button"
            className="admin-library-item"
            aria-pressed={selected.includes(upload.id)}
            onClick={() => toggle(upload.id)}
            title={upload.original_name ?? ''}
          >
            <img src={upload.url} alt={upload.original_name ?? 'Uploaded image'} loading="lazy" />
          </button>
        ))}
        {uploads.length === 0 && <p className="admin-muted">No images yet.</p>}
      </div>
      {multiple && (
        <div className="admin-dialog-actions">
          <button
            type="button"
            className="button button-crimson"
            disabled={selected.length === 0}
            onClick={() =>
              onPick(
                selected
                  .map((id) => uploads.find((upload) => upload.id === id))
                  .filter((item): item is UploadItem => Boolean(item))
                  .map((item) => ({ id: item.id, url: item.url })),
              )
            }
          >
            <ImagePlus aria-hidden="true" />
            Add {selected.length || ''} {selected.length === 1 ? 'image' : 'images'}
          </button>
        </div>
      )}
    </dialog>
  );
}
