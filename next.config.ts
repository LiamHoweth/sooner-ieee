import type { NextConfig } from 'next';

const siteBasePath = process.env.GITHUB_ACTIONS ? '/sooner-ieee' : '';

const nextConfig: NextConfig = {
  // GitHub Pages can serve only static assets. Vinext uses this setting to
  // prerender the App Router routes into HTML during the build.
  output: 'export',
  // Project Pages sites live below the repository name rather than at the
  // domain root. Assets need that prefix, while route URLs are adjusted in the
  // deployment workflow after Vinext has prerendered them.
  assetPrefix: siteBasePath,
  // Client-rendered navigation (including the mobile sheet) needs the same
  // Pages paths as the exported HTML; post-build HTML rewriting cannot reach it.
  env: { NEXT_PUBLIC_SITE_BASE_PATH: siteBasePath },
};

export default nextConfig;
