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
  // NEXT_PUBLIC_API_URL points at the Railway API (server/). Locally it comes from
  // .env.local; on GitHub Pages from the IEEE_API_URL repository variable.
  env: {
    NEXT_PUBLIC_SITE_BASE_PATH: siteBasePath,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
};

export default nextConfig;
