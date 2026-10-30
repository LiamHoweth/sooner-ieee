'use client';

import { ArrowDown, ArrowLeft, ArrowUp, CalendarClock, Copy, Eye, ImagePlus, PenLine, Plus, Save, Send, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PostArticle } from '@/components/post-content';
import { PostCard } from '@/components/post-feed';
import { api, ApiError } from '@/lib/api';
import { addPhotos, autoSummary, dayAfter, firstPhoto, isAutoCover, lastEventDate, prepareBlocks } from '@/lib/post-draft';
import { accentForCategory, getTemplate, type TemplateId, templateForCategory } from '@/lib/post-templates';
import { type Accent, type Block, type BlockType, CATEGORIES, emptyBlock, type Post } from '@/lib/posts';
import { UPLOAD_ACCEPT } from '@/lib/upload-limits';

import { ALT_LABEL, BlockFields, EDITOR_LABELS } from './block-fields';
import { ImagePicker, uploadImage } from './image-picker';
import { PublishSuccess } from './publish-success';
import { TemplateChooser } from './template-chooser';

type Draft = {
  title: string;
  slug: string;
  /** Blank means "use the first sentence", filled in when saving. */
  summary: string;
  category: string;
  accent: Accent;
  /** null means "use the first photo", filled in when saving. */
  cover: { id: string; url: string; alt: string } | null;
  blocks: Block[];
  pinned: boolean;
  status: 'draft' | 'published';
  publishedAt: string | null;
  expiresAt: string | null;
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
  expiresAt: null,
};

/** Simple mode shows these; "Photo(s)" is handled separately because it uploads straight away. */
const BASIC_BLOCKS: BlockType[] = ['text', 'button', 'event', 'video'];
const MORE_BLOCKS: BlockType[] = ['heading', 'quote', 'callout', 'stats', 'columns', 'divider'];
const MAX_PHOTOS = 24;

const ACCENT_NAMES: Record<Accent, string> = { crimson: 'OU crimson', blue: 'IEEE blue', storm: 'Storm' };

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

const shortDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Saved posts come back with the automatic summary and cover filled in; show those as automatic again. */
function fromPost(post: Post): Draft {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary && post.summary === autoSummary(post.blocks) ? '' : post.summary,
    category: post.category,
    accent: post.accent,
    cover: isAutoCover(post.cover, post.blocks) ? null : post.cover,
    blocks: post.blocks,
    pinned: post.pinned,
    status: post.status,
    publishedAt: post.publishedAt,
    expiresAt: post.expiresAt,
  };
}

const isFuture = (iso: string | null) => iso !== null && Date.parse(iso) > Date.now();
const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files');

export function PostEditor({ postId, onBack }: { postId: number | null; onBack: () => void }) {
  const [id, setId] = useState<number | null>(postId);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<string>(JSON.stringify(EMPTY));
  const [loading, setLoading] = useState(postId !== null);
  const [chosen, setChosen] = useState(postId !== null);
  const [kind, setKind] = useState<TemplateId | null>(null);
  const [accentAuto, setAccentAuto] = useState(true);
  const [moreBlocks, setMoreBlocks] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [checkBlocks, setCheckBlocks] = useState(false);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [success, setSuccess] = useState(false);
  const [picker, setPicker] = useState<{ multiple: boolean; apply: (images: { id: string; url: string }[]) => void } | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number; name: string } | null>(null);
  const [uploadResult, setUploadResult] = useState<{ added: number; errors: string[] } | null>(null);
  const [dragging, setDragging] = useState(false);

  const titleInput = useRef<HTMLInputElement>(null);
  const scheduleInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(draft) !== saved;
  const template = getTemplate(kind);

  useEffect(() => {
    if (postId === null) return;
    api<{ post: Post }>(`/api/admin/posts/${postId}`, { auth: true })
      .then(({ post }) => {
        const next = fromPost(post);
        setDraft(next);
        setSaved(JSON.stringify(next));
        setKind(templateForCategory(post.category)?.id ?? null);
        setAccentAuto(post.accent === accentForCategory(post.category));
        // Posts that already use advanced blocks open with all blocks available.
        setMoreBlocks(post.blocks.some((block) => MORE_BLOCKS.includes(block.type)));
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

  useEffect(() => {
    if (scheduling) scheduleInput.current?.focus();
  }, [scheduling]);

  // A photo dropped just outside the editor would otherwise open in the tab and lose the draft.
  useEffect(() => {
    const guard = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
    };
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', guard);
    return () => {
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', guard);
    };
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setCategory = (category: string) =>
    setDraft((current) => ({ ...current, category, accent: accentAuto ? accentForCategory(category) : current.accent }));
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
  const insertPhotos = (images: { id: string; url: string }[]) => setDraft((current) => ({ ...current, blocks: addPhotos(current.blocks, images) }));

  function choose(templateId: TemplateId | null) {
    const picked = getTemplate(templateId);
    const next: Draft = picked
      ? { ...EMPTY, category: picked.category, accent: accentForCategory(picked.category), blocks: picked.blocks() }
      : { ...EMPTY, blocks: [emptyBlock('text')] };
    setDraft(next);
    setSaved(JSON.stringify(next));
    setKind(templateId);
    setAccentAuto(true);
    setChosen(true);
    requestAnimationFrame(() => titleInput.current?.focus());
  }

  // ---------------------------------------------------------------- photos
  async function uploadFiles(files: File[]) {
    if (files.length === 0 || uploading) return;
    const errors: string[] = [];
    if (files.length > MAX_PHOTOS) errors.push(`Only the first ${MAX_PHOTOS} photos were added. A gallery holds up to ${MAX_PHOTOS}.`);
    const batch = files.slice(0, MAX_PHOTOS);
    const added: { id: string; url: string }[] = [];
    setUploadResult(null);
    for (const [index, file] of batch.entries()) {
      setUploading({ done: index, total: batch.length, name: file.name });
      try {
        added.push(await uploadImage(file));
      } catch (error) {
        errors.push(error instanceof ApiError ? error.message : `“${file.name}” could not be uploaded. Try again.`);
      }
    }
    setUploading(null);
    if (added.length) insertPhotos(added);
    setUploadResult({ added: added.length, errors });
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    setDragging(false);
    if (!success) void uploadFiles(Array.from(event.dataTransfer.files));
  }

  // ---------------------------------------------------------------- saving
  async function save(status: 'draft' | 'published', publishedAt: string | null = draft.publishedAt) {
    const snapshot = draft;
    setNotice(null);
    if (!snapshot.title.trim()) {
      setNotice({ tone: 'error', text: 'Add a title first.' });
      titleInput.current?.focus();
      return false;
    }
    const { blocks, problems } = prepareBlocks(snapshot.blocks);
    if (problems.length) {
      setCheckBlocks(true);
      setNotice({
        tone: 'error',
        text: problems.length === 1 ? 'One block needs fixing before this can be saved. It is marked below.' : `${problems.length} blocks need fixing before this can be saved. They are marked below.`,
      });
      setView('edit');
      requestAnimationFrame(() => document.getElementById(`post-block-${problems[0].index}`)?.focus());
      return false;
    }
    const cover = snapshot.cover ?? firstPhoto(blocks);
    setBusy(true);
    try {
      const { post } = await api<{ post: Post }>(id ? `/api/admin/posts/${id}` : '/api/admin/posts', {
        method: id ? 'PATCH' : 'POST',
        auth: true,
        body: {
          title: snapshot.title,
          slug: snapshot.slug || undefined,
          summary: snapshot.summary.trim() || autoSummary(blocks),
          category: snapshot.category.trim() || 'News',
          accent: snapshot.accent,
          coverUploadId: cover?.id ?? null,
          coverAlt: cover?.alt ?? '',
          blocks,
          pinned: snapshot.pinned,
          status,
          publishedAt,
          expiresAt: snapshot.expiresAt,
        },
      });
      // Keep the editor's own blocks (including blank template blocks) and automatic fields;
      // take what the server decided: id, web address, status and dates.
      const meta = { slug: post.slug, status: post.status, publishedAt: post.publishedAt, expiresAt: post.expiresAt };
      setId(post.id);
      setDraft((current) => ({ ...current, ...meta }));
      setSaved(JSON.stringify({ ...snapshot, ...meta }));
      setCheckBlocks(false);
      if (status === 'published') setSuccess(true);
      else setNotice({ tone: 'info', text: snapshot.status === 'published' ? 'Unpublished. It is a draft again, so only officers can see it.' : 'Draft saved. Only officers can see it.' });
      return true;
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof ApiError ? error.message : 'Could not save. Check your connection and try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function publishNow() {
    // A future publish date would schedule it; "now" means now. Past dates (already published) are kept.
    void save('published', isFuture(draft.publishedAt) ? new Date().toISOString() : draft.publishedAt);
  }

  function openSchedule() {
    if (scheduling) {
      setScheduling(false);
      return;
    }
    setScheduleAt(isFuture(draft.publishedAt) ? toLocalInput(draft.publishedAt) : '');
    setScheduling(true);
  }

  async function confirmSchedule() {
    const when = fromLocalInput(scheduleAt);
    if (!when || Date.parse(when) <= Date.now() + 60_000) {
      setNotice({ tone: 'error', text: 'Pick a date and time in the future to schedule it.' });
      scheduleInput.current?.focus();
      return;
    }
    if (await save('published', when)) setScheduling(false);
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

  // --------------------------------------------------------------- preview
  const prepared = useMemo(() => prepareBlocks(draft.blocks), [draft.blocks]);
  const summaryHint = useMemo(() => autoSummary(draft.blocks), [draft.blocks]);
  const autoCover = useMemo(() => firstPhoto(draft.blocks), [draft.blocks]);
  const problemAt = useMemo(
    () => new Map(checkBlocks ? prepared.problems.map((problem) => [problem.index, problem.message]) : []),
    [checkBlocks, prepared.problems],
  );
  const previewPost: Post = useMemo(
    () => ({
      id: id ?? 0,
      slug: draft.slug || 'preview',
      title: draft.title,
      summary: draft.summary.trim() || summaryHint,
      category: draft.category || 'News',
      accent: draft.accent,
      cover: draft.cover ?? autoCover,
      blocks: prepared.blocks,
      status: draft.status,
      pinned: draft.pinned,
      author: null,
      publishedAt: draft.publishedAt ?? new Date().toISOString(),
      expiresAt: draft.expiresAt,
      createdAt: '',
      updatedAt: '',
    }),
    [id, draft, summaryHint, autoCover, prepared.blocks],
  );

  if (loading) return <p className="admin-muted">Loading post…</p>;
  if (!chosen) return <TemplateChooser onChoose={choose} onBack={onBack} />;

  const scheduled = draft.status === 'published' && isFuture(draft.publishedAt);
  const live = draft.status === 'published' && !scheduled;
  const eventDate = lastEventDate(draft.blocks);
  const hideAfterEvent = eventDate ? dayAfter(eventDate) : null;
  const leave = () => {
    if (!dirty || window.confirm('Leave without saving your changes?')) onBack();
  };

  return (
    <div
      className="admin-editor"
      onDragEnter={(event) => {
        if (!hasFiles(event) || success) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = success ? 'none' : 'copy';
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <div className="admin-editor-bar">
        <button type="button" className="admin-link-button" onClick={leave}>
          <ArrowLeft aria-hidden="true" />
          All news posts
        </button>
        <span className={dirty ? 'admin-pill admin-pill-warn' : live ? 'admin-pill admin-pill-live' : 'admin-pill'}>
          {dirty ? 'Unsaved changes' : scheduled ? 'Scheduled' : live ? 'Live' : 'Draft'}
        </span>
        {!success && (
          <div className="admin-editor-actions">
            <button type="button" className="button button-outline admin-preview-toggle" aria-pressed={view === 'preview'} onClick={() => setView(view === 'edit' ? 'preview' : 'edit')}>
              {view === 'preview' ? <PenLine aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {view === 'preview' ? 'Back to editing' : 'Preview'}
            </button>
            <button type="button" className="button button-outline" disabled={busy} onClick={() => save('draft')}>
              <Save aria-hidden="true" />
              {live ? 'Unpublish' : 'Save draft'}
            </button>
            {!live && (
              <button type="button" className="button button-outline" disabled={busy} aria-expanded={scheduling} aria-controls="admin-schedule" onClick={openSchedule}>
                <CalendarClock aria-hidden="true" />
                {scheduled ? 'Reschedule…' : 'Schedule…'}
              </button>
            )}
            <button type="button" className="button button-crimson" disabled={busy} onClick={publishNow}>
              <Send aria-hidden="true" />
              {live ? 'Update post' : 'Publish now'}
            </button>
          </div>
        )}
      </div>

      {scheduling && !success && (
        <div id="admin-schedule" className="admin-schedule">
          <p>
            <strong>Schedule this post.</strong> It stays hidden until this time, then appears on the site by itself.
          </p>
          <label>
            <span>Publish on</span>
            <input
              ref={scheduleInput}
              type="datetime-local"
              value={scheduleAt}
              min={toLocalInput(new Date().toISOString())}
              onChange={(event) => setScheduleAt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setScheduling(false);
                if (event.key === 'Enter') void confirmSchedule();
              }}
            />
          </label>
          <div className="admin-row-actions">
            <button type="button" className="button button-crimson" disabled={busy} onClick={confirmSchedule}>
              <CalendarClock aria-hidden="true" />
              Schedule post
            </button>
            <button type="button" className="admin-link-button" onClick={() => setScheduling(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {notice && <output className={notice.tone === 'error' ? 'admin-error' : 'admin-info'}>{notice.text}</output>}

      <output className="admin-upload-status">
        {uploading && (
          <>
            <span>
              Uploading {uploading.total > 1 ? `photo ${uploading.done + 1} of ${uploading.total}` : 'photo'}: {uploading.name}
            </span>
            <progress max={uploading.total} value={uploading.done} />
          </>
        )}
        {uploadResult && uploadResult.added > 0 && (
          <span>
            Added {uploadResult.added} {uploadResult.added === 1 ? 'photo' : 'photos'}. Describe {uploadResult.added === 1 ? 'it' : 'each one'} for someone who can’t see it.
          </span>
        )}
      </output>
      {uploadResult && uploadResult.errors.length > 0 && (
        <div className="admin-upload-errors">
          <ul>
            {uploadResult.errors.map((error) => (
              <li key={error} className="admin-error">
                {error}
              </li>
            ))}
          </ul>
          <button type="button" className="admin-link-button" onClick={() => setUploadResult({ ...uploadResult, errors: [] })}>
            Dismiss
          </button>
        </div>
      )}

      {success ? (
        <PublishSuccess
          title={draft.title}
          slug={draft.slug}
          publishedAt={draft.publishedAt}
          onKeepEditing={() => {
            setSuccess(false);
            requestAnimationFrame(() => titleInput.current?.focus());
          }}
          onBack={onBack}
        />
      ) : (
        <div className="admin-compose" data-view={view}>
          <div className="admin-compose-edit">
            <input
              ref={titleInput}
              className="admin-title-input"
              placeholder={template?.titleHint ?? 'Post title'}
              value={draft.title}
              maxLength={160}
              onChange={(event) => set('title', event.target.value)}
              aria-label="Post title"
            />
            <textarea
              className="admin-summary-input"
              placeholder={summaryHint ? `Summary (optional). Leave blank to use: “${summaryHint}”` : 'Summary (optional). Leave blank to use your first sentence.'}
              value={draft.summary}
              maxLength={400}
              rows={2}
              onChange={(event) => set('summary', event.target.value)}
              aria-label="Summary for the News page (optional)"
            />

            <ol className="admin-blocks" aria-label="Post content">
              {draft.blocks.map((block, index) => {
                const problem = problemAt.get(index);
                return (
                  <li
                    key={index}
                    id={`post-block-${index}`}
                    tabIndex={-1}
                    className={problem ? 'admin-block admin-block-problem' : 'admin-block'}
                    aria-label={`Block ${index + 1}: ${EDITOR_LABELS[block.type]}`}
                  >
                    <div className="admin-block-head">
                      <span>{EDITOR_LABELS[block.type]}</span>
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
                    {problem && <p className="admin-error">{problem}</p>}
                    <BlockFields
                      block={block}
                      hints={template?.hints[block.type]}
                      onChange={(next) => setBlock(index, next)}
                      pickImages={(multiple, apply) => setPicker({ multiple, apply })}
                    />
                  </li>
                );
              })}
            </ol>

            <div className="admin-add-block">
              <p>Add to the post</p>
              <div>
                <button type="button" onClick={() => addBlock('text')}>
                  <Plus aria-hidden="true" />
                  {EDITOR_LABELS.text}
                </button>
                <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading !== null}>
                  <Upload aria-hidden="true" />
                  Photo(s)
                </button>
                {BASIC_BLOCKS.filter((type) => type !== 'text').map((type) => (
                  <button key={type} type="button" onClick={() => addBlock(type)}>
                    <Plus aria-hidden="true" />
                    {EDITOR_LABELS[type]}
                  </button>
                ))}
                <button type="button" className="admin-add-more" aria-expanded={moreBlocks} aria-controls="admin-more-blocks" onClick={() => setMoreBlocks(!moreBlocks)}>
                  {moreBlocks ? 'Fewer blocks' : 'More blocks'}
                </button>
              </div>
              {moreBlocks && (
                <div id="admin-more-blocks">
                  {MORE_BLOCKS.map((type) => (
                    <button key={type} type="button" onClick={() => addBlock(type)}>
                      <Plus aria-hidden="true" />
                      {EDITOR_LABELS[type]}
                    </button>
                  ))}
                </div>
              )}
              <p className="admin-hint">
                Tip: drag photos from your computer anywhere onto this page. One photo becomes a Photo, several become a gallery.{' '}
                <button type="button" className="admin-link-button" onClick={() => setPicker({ multiple: true, apply: insertPhotos })}>
                  Reuse photos from the library
                </button>
              </p>
              <input
                ref={fileInput}
                type="file"
                accept={UPLOAD_ACCEPT}
                multiple
                hidden
                onChange={(event) => {
                  void uploadFiles(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
            </div>

            <section className="admin-card admin-form admin-post-details" aria-labelledby="admin-details-title">
              <h2 id="admin-details-title">Post details</h2>
              <div className="admin-cover-field">
                <p className="admin-field-label">Cover photo (optional)</p>
                {draft.cover ? (
                  <div className="admin-cover">
                    <img src={draft.cover.url} alt="" />
                    <label>
                      <span>{ALT_LABEL}</span>
                      <input value={draft.cover.alt} maxLength={300} onChange={(event) => set('cover', { ...draft.cover!, alt: event.target.value })} />
                    </label>
                    <button type="button" className="admin-link-button" onClick={() => set('cover', null)}>
                      <X aria-hidden="true" />
                      Remove cover (use the first photo instead)
                    </button>
                  </div>
                ) : (
                  <div className="admin-cover-auto">
                    {autoCover?.url && <img src={autoCover.url} alt="" />}
                    <div>
                      <small>{autoCover ? 'Using your first photo. Pick another if you like.' : "Uses your first photo if you don't pick one."}</small>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => setPicker({ multiple: false, apply: ([image]) => set('cover', { id: image.id, url: image.url, alt: '' }) })}
                      >
                        <ImagePlus aria-hidden="true" />
                        Choose a cover
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <label>
                <span>Category</span>
                <input list="post-categories" value={draft.category} maxLength={40} onChange={(event) => setCategory(event.target.value)} />
                <datalist id="post-categories">
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </datalist>
              </label>
              <div className="admin-hide-after">
                <label>
                  <span>Hide after (optional)</span>
                  <input
                    type="datetime-local"
                    value={toLocalInput(draft.expiresAt)}
                    min={toLocalInput(draft.publishedAt)}
                    onChange={(event) => set('expiresAt', fromLocalInput(event.target.value))}
                  />
                  <small>{template?.hideAfterHint ?? 'For deadlines and one-day events.'} Afterwards it leaves the News and home pages, but its link still works.</small>
                </label>
                <div className="admin-row-actions">
                  {hideAfterEvent && (
                    <button
                      type="button"
                      className="admin-chip"
                      aria-pressed={draft.expiresAt !== null && Date.parse(draft.expiresAt) === hideAfterEvent.getTime()}
                      onClick={() => set('expiresAt', hideAfterEvent.toISOString())}
                    >
                      The day after the event ({shortDay.format(hideAfterEvent)})
                    </button>
                  )}
                  {draft.expiresAt && (
                    <button type="button" className="admin-link-button" onClick={() => set('expiresAt', null)}>
                      Don’t hide it
                    </button>
                  )}
                </div>
              </div>
            </section>

            <details className="admin-card admin-more-options">
              <summary>More options</summary>
              <div className="admin-form">
                <fieldset className="admin-accent">
                  <legend>Accent colour</legend>
                  <label className={`admin-accent-${accentForCategory(draft.category)}`}>
                    <input
                      type="radio"
                      name="accent"
                      checked={accentAuto}
                      onChange={() => {
                        setAccentAuto(true);
                        set('accent', accentForCategory(draft.category));
                      }}
                    />
                    <span>Match the category ({ACCENT_NAMES[accentForCategory(draft.category)]})</span>
                  </label>
                  {(['crimson', 'blue', 'storm'] as Accent[]).map((accent) => (
                    <label key={accent} className={`admin-accent-${accent}`}>
                      <input
                        type="radio"
                        name="accent"
                        checked={!accentAuto && draft.accent === accent}
                        onChange={() => {
                          setAccentAuto(false);
                          set('accent', accent);
                        }}
                      />
                      <span>{ACCENT_NAMES[accent]}</span>
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
                  <span>Publish date and time</span>
                  <input type="datetime-local" value={toLocalInput(draft.publishedAt)} onChange={(event) => set('publishedAt', fromLocalInput(event.target.value))} />
                  <small>Leave blank to use the moment you publish. Use Schedule… to post later.</small>
                </label>
                <label className="admin-check">
                  <input type="checkbox" checked={draft.pinned} onChange={(event) => set('pinned', event.target.checked)} />
                  <span>Pin to the top of the News page</span>
                </label>
                <p className="admin-hint">
                  Text formatting: <code>**bold**</code> · <code>*italic*</code> · <code>[link](https://…)</code> · start lines with <code>- </code> for bullets.
                  Links pasted from Google Docs or Discord are kept.
                </p>
              </div>
            </details>

            {id && (
              <button type="button" className="admin-danger" onClick={remove} disabled={busy}>
                <Trash2 aria-hidden="true" />
                Delete post
              </button>
            )}
          </div>

          <aside className="admin-compose-preview" aria-labelledby="admin-preview-title">
            <p id="admin-preview-title" className="admin-preview-label">
              Preview: the post page
            </p>
            <div className="admin-preview-frame">
              <PostArticle post={previewPost} />
            </div>
            <p className="admin-preview-label">On the News page</p>
            <div className="admin-preview-card" inert>
              <PostCard post={previewPost} />
            </div>
          </aside>
        </div>
      )}

      {dragging && (
        <div className="admin-drop-overlay" aria-hidden="true">
          <Upload />
          <span>Drop photos to add them to the post</span>
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
