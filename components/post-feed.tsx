'use client';

import { ArrowRight, ArrowUpRight, Pin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ChapterLogo } from '@/components/chapter-logo';
import { api, apiConfigured } from '@/lib/api';
import { socialLinks } from '@/lib/chapter-content';
import { CATEGORIES, formatPostDate, type Post } from '@/lib/posts';
import { sitePath } from '@/lib/site-path';

const discord = socialLinks.find((link) => link.label === 'Discord')!;

export function postHref(slug: string) {
  return sitePath(`/post?slug=${encodeURIComponent(slug)}`);
}

type State = { status: 'loading' } | { status: 'ready'; posts: Post[] } | { status: 'error' };

// The API already leaves out drafts and expired posts.
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

/** The pinned post if there is one, otherwise the newest; the rest keep their order. */
function splitFeatured(posts: Post[]) {
  const featured = posts.find((post) => post.pinned) ?? posts[0];
  return { featured, rest: posts.filter((post) => post !== featured) };
}

function PostMedia({ post, className }: { post: Post; className: string }) {
  return (
    <div className={className}>
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
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <a className={`post-card post-accent-${post.accent}`} href={postHref(post.slug)}>
      <PostMedia post={post} className="post-card-media" />
      <div className="post-card-copy">
        <p className="post-card-meta">
          {post.category} · {formatPostDate(post.publishedAt)}
        </p>
        <h3>{post.title}</h3>
        {post.summary && <p className="post-card-summary">{post.summary}</p>}
        <span className="post-card-more">
          Read more
          <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

/** The lead story: large media beside a tall headline. */
export function FeaturedPost({ post }: { post: Post }) {
  return (
    <a className={`post-feature post-card post-accent-${post.accent}`} href={postHref(post.slug)}>
      <PostMedia post={post} className="post-card-media post-feature-media" />
      <div className="post-feature-copy">
        <p className="post-feature-kicker">
          <span>{post.category}</span>
          {formatPostDate(post.publishedAt)}
        </p>
        <h3>{post.title}</h3>
        {post.summary && <p className="post-feature-summary">{post.summary}</p>}
        <span className="post-card-more">
          Read the story
          <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

function FeedSkeleton({ cards }: { cards: number }) {
  return (
    <div className="news-layout" aria-busy="true" aria-label="Loading news">
      <div className="post-feature post-feature-skeleton" />
      <div className="post-grid">
        {Array.from({ length: cards }, (_, key) => (
          <div key={key} className="post-card post-card-skeleton" />
        ))}
      </div>
    </div>
  );
}

/** Shown when there are no posts yet, and when the API is missing or down. */
function NewsComingSoon() {
  return (
    <div className="news-soon">
      <div className="news-soon-copy">
        <p className="news-soon-kicker">Coming soon</p>
        <h3>Officer updates will appear here.</h3>
        <p>
          Event recaps, opportunities and project news from the officers. Until the first one lands, Discord is where
          the chapter talks day to day.
        </p>
        <a className="button button-light" href={discord.href} target="_blank" rel="noreferrer">
          Join the Discord
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <ChapterLogo className="news-soon-mark" spin />
    </div>
  );
}

/** Every published post: a featured story, then a grid, with category chips. */
export function PostFeed() {
  const state = usePosts(50);
  const [category, setCategory] = useState<string>('All');

  if (state.status === 'loading') return <FeedSkeleton cards={3} />;
  if (state.status === 'error' || state.posts.length === 0) return <NewsComingSoon />;

  const counts = new Map<string, number>();
  for (const post of state.posts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  const categories = ['All', ...new Set([...CATEGORIES, ...counts.keys()])];
  const visible = category === 'All' ? state.posts : state.posts.filter((post) => post.category === category);
  const { featured, rest } = splitFeatured(visible);

  return (
    <div className="news-layout">
      <fieldset className="post-filter">
        <legend className="sr-only">Filter news by category</legend>
        {categories.map((name) => {
          const count = name === 'All' ? state.posts.length : (counts.get(name) ?? 0);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              disabled={count === 0}
              onClick={() => setCategory(name)}
            >
              {name}
              <span className="post-filter-count">{count}</span>
            </button>
          );
        })}
      </fieldset>
      <p className="sr-only" aria-live="polite">
        {category === 'All' ? `Showing all ${visible.length} posts.` : `Showing ${visible.length} ${category} posts.`}
      </p>
      {featured && <FeaturedPost post={featured} />}
      {rest.length > 0 && (
        <div className="post-grid">
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The home page's News section: the lead story, the next three, and a link to the rest. */
export function LatestPosts() {
  const state = usePosts(4);
  const { featured, rest } = state.status === 'ready' ? splitFeatured(state.posts) : { featured: undefined, rest: [] };

  return (
    <section className="news-section" id="news" aria-labelledby="home-news-title">
      <div className="site-container">
        <div className="section-head" data-reveal>
          <h2 className="display-title" id="home-news-title">
            News
          </h2>
          <p>Recaps, opportunities and project updates from the officers.</p>
          <a className="button button-outline" href={sitePath('/news')}>
            All news
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
        {state.status === 'loading' ? (
          <FeedSkeleton cards={3} />
        ) : featured ? (
          <div className="news-layout">
            <FeaturedPost post={featured} />
            {rest.length > 0 && (
              <div className="post-grid">
                {rest.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <NewsComingSoon />
        )}
      </div>
    </section>
  );
}
