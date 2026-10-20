'use client';

import { ArrowRight, Pin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ChapterLogo } from '@/components/chapter-logo';
import { api, apiConfigured } from '@/lib/api';
import { formatPostDate, type Post } from '@/lib/posts';
import { sitePath } from '@/lib/site-path';

export function postHref(slug: string) {
  return `${sitePath('/post')}?slug=${encodeURIComponent(slug)}`;
}

type State = { status: 'loading' } | { status: 'ready'; posts: Post[] } | { status: 'error' };

function usePosts(limit: number) {
  const [state, setState] = useState<State>(apiConfigured ? { status: 'loading' } : { status: 'error' });
  useEffect(() => {
    if (!apiConfigured) return;
    const controller = new AbortController();
    api<{ posts: Post[] }>(`/api/posts?limit=${limit}`, { signal: controller.signal })
      .then((data) => setState({ status: 'ready', posts: data.posts }))
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [limit]);
  return state;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <a className={`post-card post-accent-${post.accent}`} href={postHref(post.slug)}>
      <div className="post-card-media">
        {post.cover ? (
          <img src={post.cover.url} alt={post.cover.alt} loading="lazy" />
        ) : (
          <div className="post-card-placeholder">
            <ChapterLogo className="post-card-mark" />
          </div>
        )}
        {post.pinned && (
          <span className="post-card-pin">
            <Pin aria-hidden="true" />
            Pinned
          </span>
        )}
      </div>
      <div className="post-card-copy">
        <p className="post-card-meta">
          {post.category} · {formatPostDate(post.publishedAt)}
        </p>
        <h3>{post.title}</h3>
        {post.summary && <p className="post-card-summary">{post.summary}</p>}
        <span className="post-card-more">
          Read post
          <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

/** Every published post, newest (and pinned) first, with a category filter. */
export function PostFeed() {
  const state = usePosts(50);
  const [category, setCategory] = useState<string>('All');

  if (state.status === 'loading') {
    return (
      <div className="post-grid" aria-busy="true" aria-label="Loading posts">
        {[0, 1, 2].map((key) => (
          <div key={key} className="post-card post-card-skeleton" />
        ))}
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="empty-panel">
        <div>
          <h3>Posts are taking a break.</h3>
          <p>We could not load posts right now. Instagram and Discord have the latest in the meantime.</p>
        </div>
      </div>
    );
  }
  if (state.posts.length === 0) {
    return (
      <div className="empty-panel">
        <div>
          <h3>The first post is on its way.</h3>
          <p>Officers share recaps, opportunities and project updates here. Check back soon.</p>
        </div>
      </div>
    );
  }

  const categories = ['All', ...new Set(state.posts.map((post) => post.category))];
  const visible = category === 'All' ? state.posts : state.posts.filter((post) => post.category === category);

  return (
    <>
      {categories.length > 2 && (
        <div className="post-filter" role="toolbar" aria-label="Filter posts by category">
          {categories.map((name) => (
            <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="post-grid">
        {visible.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}

/** The three newest posts for the home page. Renders nothing until posts exist. */
export function LatestPosts() {
  const state = usePosts(3);
  if (state.status !== 'ready' || state.posts.length === 0) return null;
  return (
    <section className="content-section latest-posts" aria-labelledby="latest-title">
      <div className="site-container">
        <div className="section-head">
          <h2 className="display-title" id="latest-title">
            Latest
          </h2>
          <p>Recaps, opportunities and project updates from the officers.</p>
          <a className="button button-outline" href={sitePath('/posts')}>
            All posts
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <div className="post-grid">
          {state.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
