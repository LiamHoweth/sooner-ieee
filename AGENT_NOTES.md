# Project notes

- The site uses Vinext static export and native anchors. Preserve the GitHub Pages asset-prefix, link rewriting, and `.nojekyll` steps in `.github/workflows/deploy-pages.yml`.
- User-supplied logo screenshots are preserved in `assets/brand/`. `components/chapter-logo.tsx` frames the artwork with SVG view boxes so Instagram controls are excluded without recreating the logos. Update those frames if the source images change. The primary mark appears in the shared header/footer; all variants appear on About.
- Import logo assets through Vinext so hashed image URLs inherit the configured asset prefix on GitHub Pages and work at the root on Sites/local previews.
- After moving the checkout, refresh `.vinext/fonts/*/style.css` if exported font URLs contain the previous absolute path; Vinext caches those filesystem paths.
- Use `lib/site-path.ts` for internal anchors. `NEXT_PUBLIC_SITE_BASE_PATH` is embedded by `next.config.ts`; GitHub Pages needs `/sooner-ieee/*.html` in client-rendered mobile navigation as well as HTML. Post-build HTML rewriting alone misses the mobile sheet.
