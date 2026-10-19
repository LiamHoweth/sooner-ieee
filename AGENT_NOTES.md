# Project notes

- The site uses Vinext static export and native anchors. Preserve the GitHub Pages asset-prefix, link rewriting, and `.nojekyll` steps in `.github/workflows/deploy-pages.yml`.
- User-supplied logo screenshots in `assets/brand/` are the source of truth. `scripts/cut-logos.mjs` (uses the `sharp` already in node_modules) cuts circular WebP faces into `assets/brand/coin/`; re-run it if the screenshots change. `ChapterLogo` renders small marks; `LogoCoin` is the 3D flip coin (primary front, secondary back). Design rules live in `DESIGN.md`.
- Import logo assets through Vinext so hashed image URLs inherit the configured asset prefix on GitHub Pages and work at the root on Sites/local previews.
- After moving the checkout, delete `.vinext/fonts/*` entries whose `style.css` contains the previous absolute path; Vinext caches filesystem paths and fonts silently fall back otherwise. Font variable classes must stay on `<html>` (tokens in `:root` read them).
- Photos in `assets/photos/` are openly licensed (see `credits.json`, mirrored in `lib/photos.ts` and credited in the footer). `nextjs/no-img-element` is off because the static Pages export cannot use the Next image optimizer; images are pre-sized WebP.
- Project skills for design, audit, React, and browser checks are in `.claude/skills/`; provenance and pinned versions are in `.claude/skills/SOURCES.md`.
- Use `lib/site-path.ts` for internal anchors. `NEXT_PUBLIC_SITE_BASE_PATH` is embedded by `next.config.ts`; GitHub Pages needs `/sooner-ieee/*.html` in client-rendered mobile navigation as well as HTML. Post-build HTML rewriting alone misses the mobile sheet.
