---
name: awesome-design
description: Library of 84 DESIGN.md design-system analyses of real websites (Apple, Linear, Stripe, Vercel, Notion, etc.) covering colors, typography, spacing, radii, buttons, components and layout rules. Use when choosing or documenting a design system, writing a project DESIGN.md, or when the user asks for a page "like <site>" or wants a complete, consistent token set for colors, type, spacing and components.
---

# Awesome DESIGN.md library

Local snapshot of [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(MIT, commit 3b60532, 2026-10-14). Each file in `library/` is one site's design language:
YAML-style tokens (colors, typography, spacing, radii) followed by prose rules for components,
layout, imagery and motion.

## How to use

1. Read `INDEX.md` (one line per site) and shortlist 2–3 entries whose character fits the
   project's subject and audience. Do not read the whole library.
2. Read only the shortlisted `library/<name>.md` files.
3. Use them as a **structure and rigor reference**, not a costume:
   - Borrow the system's discipline: token scale, type ramp, spacing rhythm, component rules,
     what it refuses to do.
   - Keep the project's own identity. Never copy another brand's logo, name, proprietary
     fonts, signature colour or copy. For SOONER IEEE that means the chapter's own logos in
     `assets/brand/`, OU/IEEE-appropriate colours, and the existing shadcn/Tailwind tokens.
4. When the project needs a written design system, produce the project's own `DESIGN.md` in the
   same format (frontmatter tokens + numbered prose sections), filled with this project's values,
   and map the tokens onto the existing CSS variables / Tailwind theme rather than adding a
   parallel system.

## Pairs well with

- `design-taste-frontend` for art direction and the screenshot look-and-fix loop.
- `web-design-guidelines` to audit the result.
