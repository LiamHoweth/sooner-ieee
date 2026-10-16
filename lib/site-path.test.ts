import { afterEach, describe, expect, it, vi } from 'vitest';

import { sitePath } from '@/lib/site-path';

afterEach(() => vi.unstubAllEnvs());

describe('site navigation paths', () => {
  it.each(['/', '/events', '/projects', '/about', '/sponsors'])(
    'keeps %s at the root on Sites and local previews',
    (pathname) => {
      vi.stubEnv('NEXT_PUBLIC_SITE_BASE_PATH', '');
      expect(sitePath(pathname)).toBe(pathname);
    },
  );

  it.each([
    ['/', '/sooner-ieee/'],
    ['/events', '/sooner-ieee/events.html'],
    ['/projects', '/sooner-ieee/projects.html'],
    ['/about', '/sooner-ieee/about.html'],
    ['/sponsors', '/sooner-ieee/sponsors.html'],
  ])('resolves %s within the GitHub Pages project', (pathname, expected) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_BASE_PATH', '/sooner-ieee');
    expect(sitePath(pathname)).toBe(expected);
  });
});
