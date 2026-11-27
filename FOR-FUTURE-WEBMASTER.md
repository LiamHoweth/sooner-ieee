# For the future webmaster

Welcome. If you're reading this, you're probably taking over the IEEE Sooners website. This page
explains how the site came to be, where everything lives, and how to keep it going. It links to the
detailed docs instead of repeating them.

You don't need to be a web developer to run this site. Most yearly updates are a few lines in one
file plus a few photos. An AI coding assistant can do the rest, as long as it reads the right files
first (see [For AI coding agents](#for-ai-coding-agents) at the end).

## How this website came to be

The site was started in fall 2026 by Liam Howeth, the chapter's webmaster, working with AI coding
assistants. The commit history tells the story:

| When | What happened |
|---|---|
| Sept 8, 2026 | First version of the site. It was started with OpenAI's site builder, which is why the repo has an `.openai/` folder and the `@openai/sites-vite-plugin` package. |
| Sept 14, 2026 | Published on GitHub Pages. |
| Oct 19, 2026 | Redesigned around the official IEEE Sooners logo, shown as a 3D challenge coin, and an OU-style look (crimson, tall condensed titles). From here on the work was done with Claude Code; those commits carry a `Co-Authored-By: Claude` line. |
| Oct 20, 2026 | Added the API on Railway: an officer admin area, news posts, sponsor applications. Railway settings moved into code (`server/.railway/railway.ts`). |
| Oct 30, 2026 | Added News, the Contact page with a shared officer Inbox, invite links for officer accounts, and a clickable coin. Removed an unconfirmed faculty advisor listing and the newsletter. |
| Nov 27, 2026 | Prepared a Railway service to host the website itself (not switched on yet). Replaced stock photos with real chapter photos from the officers' Drive. |
| Nov 27, 2026 | Shipped the work below: the API first (so the new sponsor form never met the old API), then the website. Created the `ieee-sooners-web` Railway service and moved the API's links to it; GitHub Pages stays on until it's turned off. |
| Late Nov 2026 | Added the 2026–27 officers to the About page as photoshoot portraits (a still row on wide screens, a gliding strip on phones), recropped the About group photo, and made a click flip the coin to its blue side (and back). Rebuilt the sponsor application around the sponsorship packet's levels (form, API and admin inbox), replaced photos of company talks with club-only events, and fixed small phone issues (tap sizes, tiny text). |

Two ideas shaped everything:

- **Facts only.** Nothing on the site is invented: no made-up members, quotes, sponsors or numbers.
  If something couldn't be confirmed, it was left off and listed in
  [docs/UNKNOWNS.md](docs/UNKNOWNS.md).
- **It should outlive one student.** Everything is written down so the next webmaster (you) can pick
  it up.

## What's where

| What | Where it lives | In plain words |
|---|---|---|
| The website | `app/` (pages), `components/` (building blocks), `lib/` (data and helpers) | The pages people see. Built with Vinext, a Next.js-style React framework, into plain files. Served by Railway at https://ieee-sooners-web-production.up.railway.app (GitHub Pages at https://liamhoweth.github.io/sooner-ieee/ runs in parallel until it's turned off). |
| The API | `server/` → Railway | A small server that stores what officers change while the site is live: news posts, uploaded images, officer accounts, sponsor applications and contact messages. |
| Email alerts | A Google Apps Script under the chapter Gmail (code in `server/scripts/mail-relay.gs`) | Every sponsor application and contact message emails `ieee@ou.edu`. Railway's Hobby plan blocks normal email (SMTP), so the API hands each email to this script. Setup: [docs/BACKEND.md → Email](docs/BACKEND.md#email). |
| Events | The chapter's public Google Calendar (`ieee.sooner@gmail.com`) | Pulled in when the site is built and embedded on the Events page. Add events in Google Calendar, not in the code. |
| Officers, sponsors, links | `lib/chapter-content.ts` | Plain lists you edit by hand. Officer portraits are in `assets/photos/officers/`. |
| Chapter photos | `assets/photos/chapter/`, listed in `lib/photos.ts` | Web copies of event photos from the officers' Drive. |
| Logos | `assets/brand/svg/` (official files) | Everything else in `assets/brand/` is generated from these by `scripts/cut-coin.mjs`. |
| Design rules | [DESIGN.md](DESIGN.md) | Colours, fonts, layouts, photo and crop rules. |

## How to continue

### 1. Get the accounts

The site depends on a GitHub repository, a Railway project, the admin area, the chapter Google
account and `ieee@ou.edu`. [docs/HANDOFF.md](docs/HANDOFF.md) lists who owns each one and walks
through transferring them. Do it together with the outgoing webmaster if you can.

### 2. Run it on your computer

Follow [README → Run it on your computer](README.md#run-it-on-your-computer). In short: install
Node 22.13 or newer, run `npm install`, then `npm run dev -- --port 4317` and open
http://localhost:4317. Without the API running, the News, Contact, sponsor form and admin pages show
a friendly "not connected" message. That's expected.

To try those pages too, run the API next to the site: `cd server && npm install && npm run dev`
(it listens on port 8080 and keeps test data in `server/storage/`, which Git ignores). Put
`NEXT_PUBLIC_API_URL=http://localhost:8080` in a `.env.local` file at the repo root, then restart
`npm run dev`. The admin area also needs a local owner account; README explains how.

On Windows, also read [docs/CONTINUE-HERE.md → Working on Windows](docs/CONTINUE-HERE.md#working-on-windows)
(while that file exists). Two things trip people up:

- `npm run lint` reports a pile of errors in `components/ui/`. They aren't real: Windows doesn't
  strip the single quotes in the script's ignore pattern. Run this instead:
  `npx oxlint app lib components --ignore-pattern "components/ui/**"`
- Some files may check out with Windows line endings. Git converts them back on commit, so it's
  harmless, but keep `.gitattributes` as it is.

### 3. Before you publish a change

- Run the checks: lint (above), `npm test`, and `cd server && npm test` if you touched the API.
- Look at every page you changed on a phone-width screen (375px) and on a laptop.
- Pushing to `main` publishes the site. Use a branch and a pull request so CI runs first.

### 4. Every semester

Use the checklist in [docs/HANDOFF.md → Every semester](docs/HANDOFF.md#5-every-semester). The
biggest item is the officer roster.

### 5. Updating the officers each year

The officers are listed in `lib/chapter-content.ts` and appear on the About page as a row of portraits (still on wide screens,
gliding on phones). It adapts to any roster size. Each year:

1. Get the new officers' names, roles and majors from the chapter, plus each officer's OK to be on
   the site.
2. Use the **official photoshoot headshots** only, never casual or social-media photos.
3. **You** decide which photo is which person. If you use an AI assistant, tell it the matches; it
   should never guess who someone is from their face.
4. Download the originals to your computer, **outside the repo** (they carry GPS and camera data).
   In Drive, select the files and click Download. If an AI assistant does it and the files are
   shared by link, it can use
   `curl -L -o <file> "https://drive.usercontent.google.com/download?id=<fileId>&export=download"`.
5. Crop each headshot to 4:5, head and shoulders, with the head about 38% of the height:
   `node scripts/prepare-photo.mjs <original> assets/photos/officers/<first-last>.webp 640 <x,y,w,h>`
   (the crop is fractions of the photo: left, top, width, height). Keep the framing the same for
   everyone so the strip looks like one set. Rules: [DESIGN.md §4](DESIGN.md#4-photography).
6. In `lib/chapter-content.ts`, import each new file and set `image: <import>.src` on that
   officer. Replace last year's entries and delete last year's portrait files.
7. Check the About page at phone and laptop width.

Leave off personal details (personal emails, hometowns, class years) unless the officer agrees.
The strip shows the chapter address `ieee@ou.edu` for everyone.

### 6. Adding chapter photos

Run `node scripts/prepare-photo.mjs <original> assets/photos/chapter/<event-year>.webp`. It rotates
and resizes the photo and **removes all hidden data, including GPS location**. Never commit an
original phone or camera photo. Then add it to `lib/photos.ts` with alt text that names the event
and month. Prefer recent events with full rooms, and make sure the people pictured are OK with it.

Keep the photos **club-only**: no company talks, company representatives or company logos. Those
companies never agreed to appear on the site and may not be sponsors anymore. Sponsors are shown
only in the "Current partners" list on the Sponsors page, after they've agreed.

### Sponsorship levels

The Sponsors page and the application form follow the chapter's sponsorship packet: Crimson
$100+, Gold $1,000+, Diamond $2,500+, and non-monetary support recognized at matching value. If
the packet changes, update the levels in three places that must match:
`components/sponsor-application-form.tsx` (form), `server/src/sponsors.ts` (what the API accepts)
and `components/admin/inbox-panel.tsx` (labels in the officer inbox), plus the steps text in
`app/sponsors/page.tsx`. Keep old values accepted in the API so older applications still display.

### 7. Open questions and unfinished work

- [docs/UNKNOWNS.md](docs/UNKNOWNS.md): things only the chapter can answer (approvals, numbers,
  consent).
- [docs/CONTINUE-HERE.md → Still to do](docs/CONTINUE-HERE.md#still-to-do-in-order): work in
  progress, in order. It's meant to be deleted once everything in it is done.
- [docs/OFFICER-GUIDE.md](docs/OFFICER-GUIDE.md): send this to officers who write news posts or
  answer the Inbox.
- [docs/BACKEND.md](docs/BACKEND.md): the API, Railway, environment variables, backups.

## For AI coding agents

**Webmaster:** when you start a session with an AI coding assistant (Claude Code, Codex, Cursor or
similar), tell it: *"Read FOR-FUTURE-WEBMASTER.md first and follow its agent section."*

**Agent:** the rest of this section is for you.

### Read in this order

1. This file.
2. [AGENT_NOTES.md](AGENT_NOTES.md): technical gotchas.
3. [docs/CONTINUE-HERE.md](docs/CONTINUE-HERE.md), if it exists: work in progress and its order.
4. [DESIGN.md](DESIGN.md): before any visual change.
5. [docs/BACKEND.md](docs/BACKEND.md): before touching `server/`, auth, environment variables or
   deployment.

### Hard rules

- **Facts only.** Never invent members, officers, sponsors, quotes, numbers or events. If something
  is unknown, leave it off and add it to `docs/UNKNOWNS.md`.
- **Never identify people by their faces,** and never match photos to names by comparing faces, even
  with reference photos. The human webmaster matches names to photos. Make it easy for them (for
  example, a page with each photo and a name picker), but don't do the matching yourself.
- **Never commit original photos.** Originals carry GPS and camera data. Always run
  `scripts/prepare-photo.mjs` and keep originals outside the repo.
- **Downloading from Drive:** a Drive connector may return files as base64 text, which truncates
  multi-MB photos. For files shared by link, download them directly with
  `curl -L -o <file> "https://drive.usercontent.google.com/download?id=<fileId>&export=download"`,
  into a folder outside the repo.
- **Club-only photos:** no company talks, company representatives or company branding in site
  photos.
- **Sponsorship levels live in three files that must match** (form, API, admin inbox); see
  "Sponsorship levels" above.
- **Ask before publishing personal details** (personal emails, hometowns, class years) and before
  adding sponsors or sponsor logos.
- **Keep LF line endings.** `.gitattributes` enforces them; CRLF breaks the Dockerfile and Caddyfile.
  When you convert line endings yourself, touch **text files only** (filter by extension, e.g.
  `git diff --name-only -- '*.ts' '*.tsx' '*.css' '*.md' '*.json'`). Running `sed` over an image
  strips bytes and silently breaks it: the browser shows an empty frame. This happened once to the
  About group photo.
- **Post block schemas exist twice** and must match: `server/src/posts.ts` (validation) and
  `lib/posts.ts` (rendering and editor).
- **Database changes** only as new entries at the end of `MIGRATIONS` in `server/src/db.ts`.
- **Railway:** run `railway config plan` from `server/` and require `0 to destroy` before
  `railway config apply`. The volume holds all the data.
- **GitHub Pages:** keep the asset-prefix, link-rewrite and `.nojekyll` steps in
  `.github/workflows/deploy-pages.yml`. Use `lib/site-path.ts` for internal links.
- **Check phone and desktop.** Look at every page you change at 375px wide and at desktop width
  before calling it done. No sideways scrolling.
- **Respect reduced motion.** Anything that moves needs a still version under
  `prefers-reduced-motion`, and anything that moves for more than 5 seconds needs a pause control.
- **Keep the docs current.** Update them when you change auth, environment variables, deploy steps,
  the officer roster or the design rules. Don't commit or push unless the webmaster asks.
