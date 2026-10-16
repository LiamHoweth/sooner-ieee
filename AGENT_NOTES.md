# Project notes

- The site uses Vinext static export and native anchors. Preserve the GitHub Pages asset-prefix, link rewriting, and `.nojekyll` steps in `.github/workflows/deploy-pages.yml`.
- User-supplied logo screenshots are preserved in `assets/brand/`. `components/chapter-logo.tsx` frames the artwork with SVG view boxes so Instagram controls are excluded without recreating the logos. Update those frames if the source images change. The primary mark appears in the shared header/footer; all variants appear on About.
- Import logo assets through Vinext so hashed image URLs inherit the configured asset prefix on GitHub Pages and work at the root on Sites/local previews.
