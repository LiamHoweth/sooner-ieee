'use client';

import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, ImagePlus, PenLine, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PostArticle } from '@/components/post-content';
import { postHref } from '@/components/post-feed';
import { api, ApiError } from '@/lib/api';
import { type Accent, type Block, BLOCK_LABELS, type BlockType, CATEGORIES, emptyBlock, type Post } from '@/lib/posts';

import { ImagePicker } from './image-picker';

type Draft = {
  title: string;
  slug: string;
  summary: string;
  category: string;
  accent: Accent;
  cover: { id: string; url: string; alt: string } | null;
  blocks: Block[];
  pinned: boolean;
  status: 'draft' | 'published';
  publishedAt: string | null;
};

const EMPTY: Draft = {
  title: '',
  slug: '',
  summary: '',
  category: 'News',
  accent: 'crimson',
  cover: null,
  blocks: [{ type: 'text', text: '' }],
  pinned: false,
  status: 'draft',
  publishedAt: null,
};

const ADDABLE: BlockType[] = ['text', 'heading', 'image', 'gallery', 'quote', 'button', 'callout', 'video', 'stats', 'event', 'columns', 'divider'];

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromPost(post: Post): Draft {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    category: post.category,
    accent: post.accent,
    cover: post.cover,
    blocks: post.blocks,
    pinned: post.pinned,
    status: post.status,
    publishedAt: post.publishedAt,
  };
}

export function PostEditor({ postId, onBack }: { postId: number | null; onBack: () => void }) {
  const [id, setId] = useState<number | null>(postId);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<string>(JSON.stringify(EMPTY));
  const [loading, setLoading] = useState(postId !== null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState<{ multiple: boolean; apply: (images: { id: string; url: string }[]) => void } | null>(null);

  const dirty = JSON.stringify(draft) !== saved;

  useEffect(() => {
    if (postId === null) return;
    api<{ post: Post }>(`/api/admin/posts/${postId}`, { auth: true })
      .then(({ post }) => {
        const next = fromPost(post);
        setDraft(next);
        setSaved(JSON.stringify(next));
      })
      .catch(() => setNotice({ tone: 'error', text: 'Could not load this post.' }))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setBlock = (index: number, block: Block) =>
    setDraft((current) => ({ ...current, blocks: current.blocks.map((item, i) => (i === index ? block : item)) }));
  const moveBlock = (index: number, delta: number) =>
    setDraft((current) => {
      const blocks = [...current.blocks];
      const target = index + delta;
      if (target < 0 || target >= blocks.length) return current;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks };
    });
  const removeBlock = (index: number) => setDraft((current) => ({ ...current, blocks: current.blocks.filter((_, i) => i !== index) }));
  const duplicateBlock = (index: number) =>
    setDraft((current) => ({
      ...current,
      blocks: [...current.blocks.slice(0, index + 1), structuredClone(current.blocks[index]), ...current.blocks.slice(index + 1)],
    }));
  const addBlock = (type: BlockType) => setDraft((current) => ({ ...current, blocks: [...current.blocks, emptyBlock(type)] }));

  async function save(status: 'draft' | 'published') {
    setBusy(true);
    setNotice(null);
    const body = {
      title: draft.title,
      slug: draft.slug || undefined,
      summary: draft.summary,
      category: draft.category || 'News',
      accent: draft.accent,
      coverUploadId: draft.cover?.id ?? null,
      coverAlt: draft.cover?.alt ?? '',
      // Skip empty image slots and galleries so a half-finished block never blocks saving.
      blocks: draft.blocks.filter((block) => !(block.type === 'image' && !block.uploadId) && !(block.type === 'gallery' && block.images.length === 0)),
      pinned: draft.pinned,
      status,
      publishedAt: draft.publishedAt,
    };
    try {
      const { post } = await api<{ post: Post }>(id ? `/api/admin/posts/${id}` : '/api/admin/posts', {
        method: id ? 'PATCH' : 'POST',
        body,
        auth: true,
      });
      const next = fromPost(post);
      setId(post.id);
      setDraft(next);
      setSaved(JSON.stringify(next));
      const scheduled = status === 'published' && post.publishedAt && Date.parse(post.publishedAt) > Date.now();
      setNotice({
        tone: 'info',
        text: status === 'draft' ? 'Draft saved. Only admins can see it.' : scheduled ? 'Scheduled. It goes live at the publish time.' : 'Published. It is live on the site now.',
      });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof ApiError ? error.message : 'Could not save.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm('Delete this post for good? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api(`/api/admin/posts/${id}`, { method: 'DELETE', auth: true });
      onBack();
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof ApiError ? error.message : 'Could not delete.' });
      setBusy(false);
    }
  }

  const previewPost = useMemo(
    () => ({ ...draft, author: null, publishedAt: draft.publishedAt ?? new Date().toISOString() }),
    [draft],
  );

  if (loading) return <p className="admin-muted">Loading post…</p>;

  return (
    <div className="admin-editor">
      <div className="admin-editor-bar">
        <button
          type="button"
          className="admin-link-button"
          onClick={() => {
            if (!dirty || window.confirm('Leave without saving your changes?')) onBack();
          }}
        >
          <ArrowLeft aria-hidden="true" />
          All posts
        </button>
        <span className={dirty ? 'admin-pill admin-pill-warn' : 'admin-pill'}>
          {dirty ? 'Unsaved changes' : draft.status === 'published' ? 'Published' : 'Draft'}
        </span>
        <div className="admin-editor-actions">
          <button type="button" className="button button-outline" onClick={() => setPreview(!preview)}>
            {preview ? <PenLine aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button type="button" className="button button-outline" disabled={busy} onClick={() => save('draft')}>
            <Save aria-hidden="true" />
            {draft.status === 'published' ? 'Unpublish' : 'Save draft'}
          </button>
          <button type="button" className="button button-crimson" disabled={busy || !draft.title.trim()} onClick={() => save('published')}>
            <Send aria-hidden="true" />
            {draft.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>
      {notice && (
        <output className={notice.tone === 'error' ? 'admin-error' : 'admin-info'}>
          {notice.text}{' '}
          {notice.tone === 'info' && draft.status === 'published' && draft.slug && (
            <a href={postHref(draft.slug)} target="_blank" rel="noreferrer">
              View it
            </a>
          )}
        </output>
      )}

      {preview ? (
        <div className="admin-preview">
          <PostArticle post={previewPost} />
        </div>
      ) : (
        <div className="admin-editor-grid">
          <div className="admin-editor-main">
            <input
              className="admin-title-input"
              placeholder="Post title"
              value={draft.title}
              maxLength={160}
              onChange={(event) => set('title', event.target.value)}
              aria-label="Post title"
            />
            <textarea
              className="admin-summary-input"
              placeholder="One or two sentences shown on the posts page"
              value={draft.summary}
              maxLength={400}
              rows={2}
              onChange={(event) => set('summary', event.target.value)}
              aria-label="Summary"
            />

            <ol className="admin-blocks">
              {draft.blocks.map((block, index) => (
                <li key={index} className="admin-block">
                  <div className="admin-block-head">
                    <span>{BLOCK_LABELS[block.type]}</span>
                    <div>
                      <button type="button" className="admin-icon-button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="Move up">
                        <ArrowUp aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === draft.blocks.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown aria-hidden="true" />
                      </button>
                      <button type="button" className="admin-icon-button" onClick={() => duplicateBlock(index)} aria-label="Duplicate">
                        <Copy aria-hidden="true" />
                      </button>
                      <button type="button" className="admin-icon-button" onClick={() => removeBlock(index)} aria-label="Remove block">
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <BlockFields
                    block={block}
                    onChange={(next) => setBlock(index, next)}
                    pickImages={(multiple, apply) => setPicker({ multiple, apply })}
                  />
                </li>
              ))}
            </ol>

            <div className="admin-add-block">
              <p>Add a block</p>
              <div>
                {ADDABLE.map((type) => (
                  <button key={type} type="button" onClick={() => addBlock(type)}>
                    <Plus aria-hidden="true" />
                    {BLOCK_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="admin-editor-side">
            <section>
              <h2>Cover image</h2>
              {draft.cover ? (
                <div className="admin-cover">
                  <img src={draft.cover.url} alt="" />
                  <label>
                    <span>Describe the image</span>
                    <input value={draft.cover.alt} maxLength={300} onChange={(event) => set('cover', { ...draft.cover!, alt: event.target.value })} />
                  </label>
                  <button type="button" className="admin-link-button" onClick={() => set('cover', null)}>
                    <X aria-hidden="true" />
                    Remove cover
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="admin-pick"
                  onClick={() => setPicker({ multiple: false, apply: ([image]) => set('cover', { id: image.id, url: image.url, alt: '' }) })}
                >
                  <ImagePlus aria-hidden="true" />
                  Choose a cover
                </button>
              )}
            </section>
            <section className="admin-form">
              <h2>Settings</h2>
              <label>
                <span>Category</span>
                <input list="post-categories" value={draft.category} maxLength={40} onChange={(event) => set('category', event.target.value)} />
                <datalist id="post-categories">
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </datalist>
              </label>
              <fieldset className="admin-accent">
                <legend>Accent colour</legend>
                {(['crimson', 'blue', 'storm'] as Accent[]).map((accent) => (
                  <label key={accent} className={`admin-accent-${accent}`}>
                    <input type="radio" name="accent" checked={draft.accent === accent} onChange={() => set('accent', accent)} />
                    <span>{accent === 'crimson' ? 'OU crimson' : accent === 'blue' ? 'IEEE blue' : 'Storm'}</span>
                  </label>
                ))}
              </fieldset>
              <label>
                <span>Web address</span>
                <input
                  value={draft.slug}
                  placeholder="made from the title"
                  maxLength={80}
                  onChange={(event) => set('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                />
              </label>
              <label>
                <span>Publish date (leave blank for now)</span>
                <input
                  type="datetime-local"
                  value={toLocalInput(draft.publishedAt)}
                  onChange={(event) => set('publishedAt', event.target.value ? new Date(event.target.value).toISOString() : null)}
                />
              </label>
              <label className="admin-check">
                <input type="checkbox" checked={draft.pinned} onChange={(event) => set('pinned', event.target.checked)} />
                <span>Pin to the top of the posts page</span>
              </label>
            </section>
            {id && (
              <button type="button" className="admin-danger" onClick={remove} disabled={busy}>
                <Trash2 aria-hidden="true" />
                Delete post
              </button>
            )}
            <section className="admin-help">
              <h2>Formatting text</h2>
              <p>
                <code>**bold**</code> · <code>*italic*</code> · <code>[link](https://…)</code>
                <br />
                Start lines with <code>- </code> for bullets or <code>1. </code> for numbers. Leave a blank line between paragraphs.
              </p>
            </section>
          </aside>
        </div>
      )}

      <ImagePicker
        open={picker !== null}
        multiple={picker?.multiple}
        onClose={() => setPicker(null)}
        onPick={(images) => {
          picker?.apply(images);
          setPicker(null);
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}

function BlockFields({
  block,
  onChange,
  pickImages,
}: {
  block: Block;
  onChange: (block: Block) => void;
  pickImages: (multiple: boolean, apply: (images: { id: string; url: string }[]) => void) => void;
}) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="admin-form admin-row">
          <Field label="Heading">
            <input value={block.text} maxLength={160} onChange={(event) => onChange({ ...block, text: event.target.value })} />
          </Field>
          <Field label="Size">
            <select value={block.level} onChange={(event) => onChange({ ...block, level: Number(event.target.value) as 2 | 3 })}>
              <option value={2}>Large</option>
              <option value={3}>Small</option>
            </select>
          </Field>
        </div>
      );
    case 'text':
      return (
        <textarea
          className="admin-textarea"
          rows={6}
          value={block.text}
          placeholder="Write here. **bold**, *italic*, [link](https://…), - bullets"
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          aria-label="Text"
        />
      );
    case 'image':
      return (
        <div className="admin-form">
          {block.url ? (
            <img className="admin-thumb" src={block.url} alt="" />
          ) : (
            <button
              type="button"
              className="admin-pick"
              onClick={() => pickImages(false, ([image]) => onChange({ ...block, uploadId: image.id, url: image.url }))}
            >
              <ImagePlus aria-hidden="true" />
              Choose an image
            </button>
          )}
          <div className="admin-row">
            <Field label="Describe the image (for screen readers)">
              <input value={block.alt} maxLength={300} onChange={(event) => onChange({ ...block, alt: event.target.value })} />
            </Field>
            <Field label="Width">
              <select value={block.width} onChange={(event) => onChange({ ...block, width: event.target.value as 'inline' | 'wide' | 'full' })}>
                <option value="inline">Text width</option>
                <option value="wide">Wide</option>
                <option value="full">Full screen</option>
              </select>
            </Field>
          </div>
          <Field label="Caption (optional)">
            <input value={block.caption} maxLength={300} onChange={(event) => onChange({ ...block, caption: event.target.value })} />
          </Field>
          {block.url && (
            <button
              type="button"
              className="admin-link-button"
              onClick={() => pickImages(false, ([image]) => onChange({ ...block, uploadId: image.id, url: image.url }))}
            >
              Replace image
            </button>
          )}
        </div>
      );
    case 'gallery':
      return (
        <div className="admin-form">
          <div className="admin-gallery">
            {block.images.map((image, index) => (
              <div key={`${image.uploadId}-${index}`} className="admin-gallery-item">
                <img src={image.url} alt="" />
                <input
                  placeholder="Describe it"
                  value={image.alt}
                  maxLength={300}
                  onChange={(event) =>
                    onChange({ ...block, images: block.images.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)) })
                  }
                  aria-label={`Description for image ${index + 1}`}
                />
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label="Remove image"
                  onClick={() => onChange({ ...block, images: block.images.filter((_, i) => i !== index) })}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <div className="admin-row">
            <button
              type="button"
              className="admin-pick"
              onClick={() =>
                pickImages(true, (images) =>
                  onChange({ ...block, images: [...block.images, ...images.map((image) => ({ uploadId: image.id, url: image.url, alt: '' }))].slice(0, 24) }),
                )
              }
            >
              <ImagePlus aria-hidden="true" />
              Add images
            </button>
            <Field label="Layout">
              <select value={block.layout} onChange={(event) => onChange({ ...block, layout: event.target.value as 'grid' | 'carousel' })}>
                <option value="grid">Grid</option>
                <option value="carousel">Swipe carousel</option>
              </select>
            </Field>
          </div>
        </div>
      );
    case 'quote':
      return (
        <div className="admin-form">
          <Field label="Quote">
            <textarea rows={3} value={block.text} maxLength={1200} onChange={(event) => onChange({ ...block, text: event.target.value })} />
          </Field>
          <Field label="Who said it (optional)">
            <input value={block.attribution} maxLength={160} onChange={(event) => onChange({ ...block, attribution: event.target.value })} />
          </Field>
        </div>
      );
    case 'button':
      return (
        <div className="admin-form admin-row">
          <Field label="Button text">
            <input value={block.label} maxLength={80} onChange={(event) => onChange({ ...block, label: event.target.value })} />
          </Field>
          <Field label="Link (https://…)">
            <input value={block.url} maxLength={2000} onChange={(event) => onChange({ ...block, url: event.target.value })} />
          </Field>
          <Field label="Style">
            <select value={block.style} onChange={(event) => onChange({ ...block, style: event.target.value as 'crimson' | 'outline' })}>
              <option value="crimson">Solid</option>
              <option value="outline">Outline</option>
            </select>
          </Field>
        </div>
      );
    case 'callout':
      return (
        <div className="admin-form">
          <div className="admin-row">
            <Field label="Title (optional)">
              <input value={block.title} maxLength={160} onChange={(event) => onChange({ ...block, title: event.target.value })} />
            </Field>
            <Field label="Colour">
              <select value={block.tone} onChange={(event) => onChange({ ...block, tone: event.target.value as typeof block.tone })}>
                <option value="crimson">Crimson</option>
                <option value="blue">IEEE blue</option>
                <option value="storm">Storm</option>
                <option value="cream">Cream</option>
              </select>
            </Field>
          </div>
          <Field label="Text">
            <textarea rows={3} value={block.text} maxLength={4000} onChange={(event) => onChange({ ...block, text: event.target.value })} />
          </Field>
        </div>
      );
    case 'video':
      return (
        <div className="admin-form admin-row">
          <Field label="YouTube or Vimeo link">
            <input value={block.url} maxLength={2000} placeholder="https://www.youtube.com/watch?v=…" onChange={(event) => onChange({ ...block, url: event.target.value })} />
          </Field>
          <Field label="Caption (optional)">
            <input value={block.caption} maxLength={300} onChange={(event) => onChange({ ...block, caption: event.target.value })} />
          </Field>
        </div>
      );
    case 'stats':
      return (
        <div className="admin-form">
          {block.items.map((item, index) => (
            <div key={index} className="admin-row">
              <Field label="Number">
                <input
                  value={item.value}
                  maxLength={24}
                  placeholder="50+"
                  onChange={(event) => onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, value: event.target.value } : it)) })}
                />
              </Field>
              <Field label="Label">
                <input
                  value={item.label}
                  maxLength={80}
                  placeholder="members"
                  onChange={(event) => onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, label: event.target.value } : it)) })}
                />
              </Field>
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Remove stat"
                disabled={block.items.length === 1}
                onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          ))}
          {block.items.length < 6 && (
            <button type="button" className="admin-link-button" onClick={() => onChange({ ...block, items: [...block.items, { value: '', label: '' }] })}>
              <Plus aria-hidden="true" />
              Add a stat
            </button>
          )}
        </div>
      );
    case 'event':
      return (
        <div className="admin-form">
          <Field label="Event name">
            <input value={block.title} maxLength={160} onChange={(event) => onChange({ ...block, title: event.target.value })} />
          </Field>
          <div className="admin-row">
            <Field label="Date">
              <input type="date" value={block.date} onChange={(event) => onChange({ ...block, date: event.target.value })} />
            </Field>
            <Field label="Time (optional)">
              <input value={block.time} maxLength={40} placeholder="7:00 PM" onChange={(event) => onChange({ ...block, time: event.target.value })} />
            </Field>
            <Field label="Location (optional)">
              <input value={block.location} maxLength={160} placeholder="Devon Energy Hall 120" onChange={(event) => onChange({ ...block, location: event.target.value })} />
            </Field>
          </div>
          <Field label="RSVP or details link (optional)">
            <input value={block.url} maxLength={2000} placeholder="https://" onChange={(event) => onChange({ ...block, url: event.target.value })} />
          </Field>
        </div>
      );
    case 'columns':
      return (
        <div className="admin-row admin-columns">
          <textarea className="admin-textarea" rows={5} value={block.left} placeholder="Left column" onChange={(event) => onChange({ ...block, left: event.target.value })} aria-label="Left column" />
          <textarea className="admin-textarea" rows={5} value={block.right} placeholder="Right column" onChange={(event) => onChange({ ...block, right: event.target.value })} aria-label="Right column" />
        </div>
      );
    case 'divider':
      return <hr className="admin-divider" />;
  }
}
