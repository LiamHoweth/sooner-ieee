'use client';

import { ImagePlus, Plus, X } from 'lucide-react';
import { useRef } from 'react';

import { htmlToRichText, pasteHasLinks } from '@/lib/paste';
import type { Block, BlockType } from '@/lib/posts';

export type PickImages = (multiple: boolean, apply: (images: { id: string; url: string }[]) => void) => void;

/** Editor names for blocks. lib/posts.ts BLOCK_LABELS stays as the shared list. */
export const EDITOR_LABELS: Record<BlockType, string> = {
  text: 'Text',
  image: 'Photo',
  gallery: 'Photo gallery',
  button: 'Link button',
  event: 'Event details',
  video: 'Video',
  heading: 'Heading',
  quote: 'Quote',
  callout: 'Callout',
  stats: 'Stats',
  columns: 'Two columns',
  divider: 'Divider',
};

export const ALT_LABEL = "Describe the photo for someone who can't see it";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}

/**
 * A textarea for post text. Pasting from Google Docs, Discord or a web page keeps links
 * as [text](https://…) and drops other formatting (lib/paste.ts).
 */
export function RichTextArea({
  value,
  onChange,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = event.clipboardData.getData('text/html');
    if (!html || !pasteHasLinks(html)) return; // plain paste already does the right thing
    const converted = htmlToRichText(html);
    if (!converted) return;
    event.preventDefault();
    const element = event.currentTarget;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const next = value.slice(0, start) + converted + value.slice(end);
    onChange(props.maxLength ? next.slice(0, props.maxLength) : next);
    const caret = start + converted.length;
    requestAnimationFrame(() => ref.current?.setSelectionRange(caret, caret));
  }

  return <textarea ref={ref} {...props} value={value} onChange={(event) => onChange(event.target.value)} onPaste={onPaste} />;
}

export function BlockFields({
  block,
  onChange,
  pickImages,
  hints,
}: {
  block: Block;
  onChange: (block: Block) => void;
  pickImages: PickImages;
  /** Placeholder text from the post's template, keyed by field name. */
  hints?: Record<string, string>;
}) {
  const hint = (field: string, fallback?: string) => hints?.[field] ?? fallback;
  switch (block.type) {
    case 'heading':
      return (
        <div className="admin-form admin-row">
          <Field label="Heading">
            <input value={block.text} maxLength={160} placeholder={hint('text')} onChange={(event) => onChange({ ...block, text: event.target.value })} />
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
        <RichTextArea
          className="admin-textarea"
          rows={6}
          maxLength={20000}
          value={block.text}
          placeholder={hint('text', 'Write here. **bold**, *italic*, [link](https://…), - bullets')}
          onChange={(text) => onChange({ ...block, text })}
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
              Choose a photo
            </button>
          )}
          <div className="admin-row">
            <Field label={ALT_LABEL}>
              <input value={block.alt} maxLength={300} placeholder="e.g. Officers at the fall involvement fair" onChange={(event) => onChange({ ...block, alt: event.target.value })} />
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
              Replace photo
            </button>
          )}
        </div>
      );
    case 'gallery':
      return (
        <div className="admin-form">
          {block.images.length > 0 ? (
            <p className="admin-hint">{ALT_LABEL}, under each photo.</p>
          ) : (
            <p className="admin-hint">Drag photos onto the page or use Add photos.</p>
          )}
          <div className="admin-gallery">
            {block.images.map((image, index) => (
              <div key={`${image.uploadId}-${index}`} className="admin-gallery-item">
                <img src={image.url} alt="" />
                <input
                  placeholder="Describe the photo"
                  value={image.alt}
                  maxLength={300}
                  onChange={(event) =>
                    onChange({ ...block, images: block.images.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)) })
                  }
                  aria-label={`Photo ${index + 1}: describe it for someone who can't see it`}
                />
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label={`Remove photo ${index + 1}`}
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
              Add photos
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
            <textarea rows={3} value={block.text} maxLength={1200} placeholder={hint('text')} onChange={(event) => onChange({ ...block, text: event.target.value })} />
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
            <input value={block.label} maxLength={80} placeholder={hint('label', 'e.g. Sign up')} onChange={(event) => onChange({ ...block, label: event.target.value })} />
          </Field>
          <Field label="Link (https://…)">
            <input
              type="url"
              inputMode="url"
              value={block.url}
              maxLength={2000}
              placeholder={hint('url', 'https://…')}
              onChange={(event) => onChange({ ...block, url: event.target.value })}
            />
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
            <RichTextArea rows={3} value={block.text} maxLength={4000} onChange={(text) => onChange({ ...block, text })} />
          </Field>
        </div>
      );
    case 'video':
      return (
        <div className="admin-form admin-row">
          <Field label="YouTube or Vimeo link">
            <input
              type="url"
              inputMode="url"
              value={block.url}
              maxLength={2000}
              placeholder="https://www.youtube.com/watch?v=…"
              onChange={(event) => onChange({ ...block, url: event.target.value })}
            />
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
            <input value={block.title} maxLength={160} placeholder={hint('title')} onChange={(event) => onChange({ ...block, title: event.target.value })} />
          </Field>
          <div className="admin-row">
            <Field label="Date">
              <input type="date" value={block.date} onChange={(event) => onChange({ ...block, date: event.target.value })} />
            </Field>
            <Field label="Time (optional)">
              <input value={block.time} maxLength={40} placeholder={hint('time', '7:00 PM')} onChange={(event) => onChange({ ...block, time: event.target.value })} />
            </Field>
            <Field label="Location (optional)">
              <input
                value={block.location}
                maxLength={160}
                placeholder={hint('location', 'Devon Energy Hall 120')}
                onChange={(event) => onChange({ ...block, location: event.target.value })}
              />
            </Field>
          </div>
          <Field label="RSVP or details link (optional)">
            <input
              type="url"
              inputMode="url"
              value={block.url}
              maxLength={2000}
              placeholder={hint('url', 'https://')}
              onChange={(event) => onChange({ ...block, url: event.target.value })}
            />
          </Field>
        </div>
      );
    case 'columns':
      return (
        <div className="admin-row admin-columns">
          <RichTextArea className="admin-textarea" rows={5} maxLength={8000} value={block.left} placeholder="Left column" onChange={(left) => onChange({ ...block, left })} aria-label="Left column" />
          <RichTextArea className="admin-textarea" rows={5} maxLength={8000} value={block.right} placeholder="Right column" onChange={(right) => onChange({ ...block, right })} aria-label="Right column" />
        </div>
      );
    case 'divider':
      return <hr className="admin-divider" />;
  }
}
