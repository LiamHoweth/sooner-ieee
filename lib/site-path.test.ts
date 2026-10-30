import { afterEach, describe, expect, it, vi } from 'vitest';

import { sitePath } from '@/lib/site-path';

afterEach(() => vi.unstubAllEnvs());

describe('site navigation paths', () => {
  it.each(['/', '/news', '/events', '/projects', '/about', '/sponsors', '/contact', '/about#mission', '/contact?topic=Sponsorship'])(
    'keeps %s at the root on Sites and local previews',
    (pathname) => {
      vi.stubEnv('NEXT_PUBLIC_SITE_BASE_PATH', '');
      expect(sitePath(pathname)).toBe(pathname);
    },
  );

  it.each([
    ['/', '/sooner-ieee/'],
    ['/news', '/sooner-ieee/news.html'],
    ['/events', '/sooner-ieee/events.html'],
    ['/projects', '/sooner-ieee/projects.html'],
    ['/about', '/sooner-ieee/about.html'],
    ['/sponsors', '/sooner-ieee/sponsors.html'],
    ['/contact', '/sooner-ieee/contact.html'],
  ])('resolves %s within the GitHub Pages project', (pathname, expected) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_BASE_PATH', '/sooner-ieee');
    expect(sitePath(pathname)).toBe(expected);
  });

  it.each([
    ['/about#mission', '/sooner-ieee/about.html#mission'],
    ['/events#chapter-calendar', '/sooner-ieee/events.html#chapter-calendar'],
    ['/contact?topic=Sponsorship', '/sooner-ieee/contact.html?topic=Sponsorship'],
    ['/post?slug=a%23b', '/sooner-ieee/post.html?slug=a%23b'],
    ['/news?category=Project#grid', '/sooner-ieee/news.html?category=Project#grid'],
    ['/#news', '/sooner-ieee/#news'],
    ['/?from=footer', '/sooner-ieee/?from=footer'],
    ['/about/', '/sooner-ieee/about.html'],
  ])('adds .html to the pathname only for %s', (href, expected) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_BASE_PATH', '/sooner-ieee');
    expect(sitePath(href)).toBe(expected);
  });
});
