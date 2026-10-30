/**
 * Internal link for a route, optionally with `?query` and `#hash`. On GitHub
 * Pages the export lives below /sooner-ieee and every page is a `.html` file,
 * so `.html` goes on the pathname only: `/about#mission` becomes
 * `/sooner-ieee/about.html#mission`, never `/sooner-ieee/about#mission.html`.
 */
export function sitePath(href: string) {
  const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';
  if (!basePath) return href;

  const split = href.search(/[?#]/);
  const pathname = (split === -1 ? href : href.slice(0, split)).replace(/(.)\/$/, '$1');
  const suffix = split === -1 ? '' : href.slice(split);

  return pathname === '/' || pathname === ''
    ? `${basePath}/${suffix}`
    : `${basePath}${pathname}.html${suffix}`;
}
