# IEEE Sooners website

The website of the IEEE Student Branch at the University of Oklahoma: events, projects, posts,
sponsorship, and an officer-only admin area.

**Future webmaster: start with [docs/HANDOFF.md](docs/HANDOFF.md).**

| Piece | Where it lives | What it does |
|---|---|---|
| Website | `app/`, `components/`, `lib/` → GitHub Pages | Static site built with Vinext (Next.js-style React). Deploys on every push to `main`. |
| API | `server/` → Railway | Node service with SQLite on a Railway volume. Stores posts, images, admin accounts and sponsor applications. |
| Events | Public Google Calendar `ieee.sooner@gmail.com` | Pulled in at build time and embedded on the Events page. |

## Docs

- [docs/HANDOFF.md](docs/HANDOFF.md): accounts, passing the site to the next webmaster, and the yearly checklist
- [docs/BACKEND.md](docs/BACKEND.md): the API and Railway setup, environment variables, backups and restores
- [docs/OFFICER-GUIDE.md](docs/OFFICER-GUIDE.md): for officers who write posts and answer sponsor applications
- [DESIGN.md](DESIGN.md): colours, type, layout patterns, logos and photo rules
- [AGENT_NOTES.md](AGENT_NOTES.md): gotchas for AI coding assistants (and humans)

## Run it on your computer

You need Node 22.13 or newer.

```bash
npm install
cd server && npm install && cp .env.example .env && cd ..
```

Create the first local owner account: run `npm run hash-password` inside `server/`, then put the
username, Gmail and the printed hash into `server/.env` as the `BOOTSTRAP_OWNER_*` values.

```bash
cd server && npm run dev
```

In a second terminal, point the site at the local API and start it:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev -- --port 4317
```

Open http://localhost:4317 for the site and http://localhost:4317/admin for the admin area.

## Checks

```bash
npm run lint && npm test
```

```bash
cd server && npm test
```

CI runs both on every push and pull request (`.github/workflows/ci.yml`).

## Editing content without the admin area

- Officers, sponsors, programs, achievements and links: `lib/chapter-content.ts`
- Photos and their credits: `lib/photos.ts` and `assets/photos/credits.json`
- Logos: `assets/brand/`, cut into coin faces by `scripts/cut-logos.mjs`
