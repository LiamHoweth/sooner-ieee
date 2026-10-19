# Project skills: sources

Vendored 2026-10-19 after code review. Re-review upstream before updating.

| Skill | Upstream | Pinned at | Local changes |
|---|---|---|---|
| design-taste-frontend | github.com/Leonxlnx/taste-skill `skills/taste-skill` (MIT) | v2.1.3 / 63aba5f | none |
| web-design-guidelines | github.com/vercel-labs/agent-skills (MIT) | 063bee9 | rules pinned to `references/guidelines.md` (snapshot of vercel-labs/web-interface-guidelines `command.md`) instead of fetching at runtime |
| vercel-react-best-practices | github.com/vercel-labs/agent-skills `skills/react-best-practices` | 063bee9 | none |
| vercel-composition-patterns | github.com/vercel-labs/agent-skills `skills/composition-patterns` | 063bee9 | none |
| image-to-code | github.com/Leonxlnx/imagegen-skills (MIT) | beb16b0 | manual-only (`disable-model-invocation`), Claude Code adaptation note |
| awesome-design | github.com/VoltAgent/awesome-design-md `design-md/*/DESIGN.md` (MIT) | 3b60532 | wrapper SKILL.md + INDEX.md; files in `library/` |
| playwright-cli | `playwright-cli install --skills` from @playwright/cli 0.1.22 (Apache-2.0) | 0.1.22 | none |

Runtime notes:
- `playwright-cli` binary: `~/.local/share/playwright-cli` (npm prefix, user-owned), linked at `~/.local/bin/playwright-cli`. Session output goes to `.playwright-cli/` (gitignored).
- Taste Skill scripts need Node 22+ and Chrome. They write working files to `.taste-skill/` (gitignored) and a small draw history to `~/.taste-skill/history.json`. `assets.mjs` queries public-domain image APIs (Openverse, Wikimedia, Met, AIC, Internet Archive, NASA).
