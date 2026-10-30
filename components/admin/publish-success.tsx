'use client';

import { ArrowLeft, Check, Copy, ExternalLink, PenLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { postHref } from '@/components/post-feed';

import { formatDateTime } from './types';

/** Shown after Publish now or Schedule: where the post is and how to share it. */
export function PublishSuccess({
  title,
  slug,
  publishedAt,
  onKeepEditing,
  onBack,
}: {
  title: string;
  slug: string;
  publishedAt: string | null;
  onKeepEditing: () => void;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => Date.now());
  const scheduled = publishedAt !== null && Date.parse(publishedAt) > now;
  const href = postHref(slug);
  const url = typeof window === 'undefined' ? href : new URL(href, window.location.href).href;

  useEffect(() => heading.current?.focus(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked: select the link so it can be copied by hand.
      (document.getElementById('admin-post-url') as HTMLInputElement | null)?.select();
    }
  }

  return (
    <section className="admin-success" aria-labelledby="success-title">
      <Check className="admin-success-mark" aria-hidden="true" />
      <h2 id="success-title" ref={heading} tabIndex={-1}>
        {scheduled ? 'Scheduled' : 'Published'}
      </h2>
      <p>
        <strong>{title}</strong> {scheduled ? `goes live ${formatDateTime(publishedAt)}.` : 'is live on the News page now.'}
      </p>
      <div className="admin-invite-link">
        <label>
          <span>Link to the post</span>
          <input id="admin-post-url" value={url} readOnly onFocus={(event) => event.currentTarget.select()} />
        </label>
        <button type="button" className="button button-crimson" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <small>
          <output>{copied ? 'Copied. ' : ''}</output>Share it in Discord so members see it{scheduled ? ' (the link works once it goes live)' : ''}.
        </small>
      </div>
      <div className="admin-row-actions">
        {!scheduled && (
          <a className="button button-outline" href={href} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            View on site
          </a>
        )}
        <button type="button" className="admin-link-button" onClick={onKeepEditing}>
          <PenLine aria-hidden="true" />
          Keep editing
        </button>
        <button type="button" className="admin-link-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          All news posts
        </button>
      </div>
    </section>
  );
}
