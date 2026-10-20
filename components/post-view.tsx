'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { PostArticle } from '@/components/post-content';
import { api, ApiError, apiConfigured } from '@/lib/api';
import type { Post } from '@/lib/posts';
import { sitePath } from '@/lib/site-path';

type Result = { slug: string; status: 'ready'; post: Post } | { slug: string; status: 'missing' | 'error' };

const noSubscribe = () => () => {};
const readSlug = () => new URLSearchParams(window.location.search).get('slug');

/** One post, chosen by ?slug= so the static export needs no page per post. */
export function PostView() {
  // undefined while prerendering; null when the address has no slug.
  const slug = useSyncExternalStore(noSubscribe, readSlug, () => undefined);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!slug || !apiConfigured) return;
    const controller = new AbortController();
    api<{ post: Post }>(`/api/posts/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(({ post }) => {
        document.title = `${post.title} | IEEE Sooners`;
        setResult({ slug, status: 'ready', post });
      })
      .catch((error) => {
        if ((error as Error).name === 'AbortError') return;
        setResult({ slug, status: error instanceof ApiError && error.status === 404 ? 'missing' : 'error' });
      });
    return () => controller.abort();
  }, [slug]);

  const state =
    slug === undefined
      ? ({ status: 'loading' } as const)
      : slug === null
        ? ({ status: 'missing' } as const)
        : !apiConfigured
          ? ({ status: 'error' } as const)
          : result?.slug === slug
            ? result
            : ({ status: 'loading' } as const);

  const back = (
    <div className="site-container post-back">
      <a className="text-link" href={sitePath('/posts')}>
        <ArrowLeft aria-hidden="true" />
        All posts
      </a>
    </div>
  );

  if (state.status === 'ready') {
    return (
      <>
        <PostArticle post={state.post} />
        {back}
      </>
    );
  }

  return (
    <section className="content-section">
      <div className="site-container">
        {state.status === 'loading' ? (
          <div className="post-loading" aria-busy="true">
            Loading post…
          </div>
        ) : (
          <div className="empty-panel">
            <div>
              <h3>{state.status === 'missing' ? 'That post is not here.' : 'This post could not load.'}</h3>
              <p>
                {state.status === 'missing'
                  ? 'It may have been unpublished or renamed.'
                  : 'Check your connection and refresh, or come back in a minute.'}
              </p>
            </div>
            <a className="button button-crimson" href={sitePath('/posts')}>
              See all posts
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
