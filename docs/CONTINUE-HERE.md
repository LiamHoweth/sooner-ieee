# Continue here (work in progress, 2026-11-27)

Handoff for whoever picks this up next (human or AI agent, on any OS). Branch:
`feat/railway-web-and-chapter-photos`. Nothing on this branch is live yet: GitHub Pages and the
Railway API still run from `main`. Delete this file once every item below is done.

## What this branch does

1. **Website service on Railway**, so the site and API live in one Railway project.
   - `deploy/web/Dockerfile`: Node 22 builds with `npm ci && npm run build`, then Caddy 2.11.8 serves
     `dist/client`. The build context is the repo root, and `.dockerignore` keeps `server/`, `.env*`,
     `node_modules` and the build caches out.
   - `deploy/web/Caddyfile`: clean URLs (`/about` serves `about.html`, and old `.html` links still
     work), `404.html` for unknown paths, a 1-year cache for `/_next/static`, revalidation for pages,
     `/health` for Railway, and a CSP that only allows `https:` APIs, iframes and images.
   - `server/.railway/railway.ts` adds the `ieee-sooners-web` service (DOCKERFILE builder; watch
     patterns skip `server/**`). `railway config plan` showed **1 to add, 1 to change, 0 to destroy**
     (on 2026-11-26).
     - The "change" is the API's `requiredMountPath: /data` and restart policy. Both were already in
       the file but had never been applied.
     - **Not applied yet**: Railway builds from `main`, so merge first.
   - The full cutover is in [BACKEND.md → Website on Railway](BACKEND.md#website-on-railway-replacing-github-pages).
2. **Real chapter photos instead of stock.** 15 photos are in `assets/photos/chapter/`, registered in
   `chapterPhotos` (`lib/photos.ts`).
   - They were picked from about 825 Drive photos (2024-25 to 2026-27), favouring recent events and
     full rooms.
   - The only stock photo left is the NOAA lightning image behind the Region 5 band (it still has its
     footer credit).
   - `scripts/prepare-photo.mjs` makes web copies. It rotates, resizes to 1600px, takes an optional
     crop and brightness, and strips all metadata including GPS.
   - Every photo slot was checked at 375, 390, 768, 1024, 1280, 1440 and 1920px. The crop rules are
     in `DESIGN.md` §4.
   - Focal points (`position`) are set for the tall shots. `officers-2026` is pre-cropped to the 4:3
     hero frame, and `lumen-talk-2026` is brightened ×1.14.
   - The About page's Recognition section now shows the Region 5 team photo in its native 16:9 frame.

| Slot | Photo (`assets/photos/chapter/`) | Drive event folder · original file |
|---|---|---|
| Home hero (background) | gbm-getting-involved-2026 | 2026-27 / 9/8 IEEE GBM: Getting Involved · 20260908_185826.jpg |
| Home Build tile 1 | antenna-build-2026 | 2026-27 / 11/11 Antenna Building · 20261111_185756.jpg |
| Home Build tile 2 | soldering-gbm-2025 | 2025-26 / September GBM: Mini Football Launcher · IMG_6686.HEIC |
| Home "Take the next step" band | led-tree-gbm-2026 | 2026-27 / 11/17 IEEE GBM: LED Christmas Tree · IMG_2784.HEIC |
| About hero | officers-2026 | Officer photoshoot · _DSC3656.JPG (crop 0.162,0.217,0.624,0.702, width 1320) |
| About "Why we exist" | ou-flag-team-2024 | 2024-25 / Pictures · IMG_0303.HEIC |
| About Recognition | region5-team-2026 | 2025-26 / 2026 IEEE R5 Awards Recap · 20260328_080626.jpg |
| Events hero | sound-workshop-demo-2026 | 2026-27 / 10/14 Build Your Own Sound / Pics · 20261014_184520.jpg (crop 0.02,0.05,0.9,0.9) |
| Projects hero | antenna-group-2026 | 2026-27 / 11/11 Antenna Building · IMG_5650.jpg |
| Projects "Build & compete" | antenna-drill-2026 | 2026-27 / 11/11 Antenna Building · 20261111_185832.jpg |
| Projects "Learn & connect" | study-night-2026 | 2026-27 / 10/1 Study Night / Pics · 20261001_193210.jpg (crop 0,0.4,1,0.5625) |
| Sponsors hero | sound-workshop-room-2026 | 2026-27 / 10/14 Build Your Own Sound / Pics · IMG_8568.JPG (crop 0.04,0.2,0.8,0.8) |
| Sponsors "Ways to partner" tile | board-game-night-2026 | 2026-27 / 9/3 Board Game Night / Pics · 20260903_192816.jpg (crop 0,0.38,1,0.5625) |

Club-only rule (2026-11-27): no photos of company representatives, company talks or company
branding, since those companies never agreed to be shown and may not be sponsors now. The Lumen,
NI, Williams and Texas Instruments photos were replaced with the three club events above.
| News hero | gbm-officers-presenting-2026 | 2026-27 / 9/8 IEEE GBM: Getting Involved · 20260908_185855.jpg |
| Contact hero | microwave-night-2026 | 2026-27 / 10/15 Stuff in a Microwave · DSC00271.ARW |

The Drive folder links are with Liam (the chapter shared them). Don't commit them: this repo is
public, and the folders hold far more photos than the site uses.

## Still to do, in order

1. **Merged: done (2026-11-27).** The API changes went out first (PR #1), then this branch (PR #2).
2. **Railway web service: done except turning off Pages (2026-11-27).** `ieee-sooners-web` is live
   at https://ieee-sooners-web-production.up.railway.app with `NEXT_PUBLIC_API_URL` set. The API
   allows its origin and its `SITE_URL`/`ADMIN_URL` point at it; `metadataBase` follows in the
   follow-up PR. Every page, the forms and the admin sign-in page were checked on the new address
   (signing in and uploading an image need Liam's login).
   - **Left for Liam:** update shared links to the new address, then turn off GitHub Pages
     (docs/BACKEND.md step 7). No custom domain for now.
   - **Also left for Liam:** the email relay (docs/BACKEND.md → Email) and a database backup
     (Admin → My account → Backups).
3. **Officers: done (2026-11-27).** The 7 officers (names, roles, majors, portraits) are in
   `officers` in `lib/chapter-content.ts` and show in `OfficerStrip` on About → Leadership (a still row on wide screens, gliding below).
   - Portraits are 4:5 crops (640px wide) of the Drive "Officer photoshoot" headshots, in
     `assets/photos/officers/`. Liam matched file numbers to names; never match faces yourself.
     _DSC3654 isn't a 2026-27 officer and isn't used.

     | Officer | File | Crop (x,y,w,h) |
     |---|---|---|
     | Logan Tanner | _DSC3637 | 0.1740,0.3821,0.6262,0.5222 |
     | Nathan Schultz | _DSC3624 | 0.1626,0.3629,0.6163,0.5140 |
     | Heba Assi | _DSC3652 | 0.2378,0.3632,0.5128,0.4276 |
     | Drayden Vo | _DSC3627 | 0.2417,0.4021,0.5423,0.4523 |
     | Amen Ftirich | _DSC3632 | 0.0954,0.2723,0.7741,0.6456 |
     | Thawng Mung | _DSC3622 | 0.1547,0.3044,0.6508,0.5428 |
     | Swarga Ribhu | _DSC3640 | 0.0693,0.3684,0.6952,0.5798 |

   - The headshots are shared by link, so originals download with
     `curl -L -o <file> "https://drive.usercontent.google.com/download?id=<fileId>&export=download"`.
     (The Drive connector returns files as base64 text, which truncates 4–5 MB JPGs.) Keep
     originals outside the repo: they carry GPS EXIF.
   - Each year: `node scripts/prepare-photo.mjs <original> assets/photos/officers/<first-last>.webp 640 <x,y,w,h>`,
     import it in `lib/chapter-content.ts`, set `image: <import>.src`, and delete last year's files.
   - The officer slides also list class, hometown and interests. They're left off on purpose; ask
     before adding any of it.
4. **Confirm with the chapter**:
   - That everyone pictured is OK being on the site (see `docs/UNKNOWNS.md`).
   - Whether to replace "More than 50 members" on Sponsors with the packet's **96 active members**
     (as of 12/1/2025).
5. **Optional**: add one recap photo per past event in the Events archive. Each 2026-27 event folder
   in Drive has candidates, which would help the award applications.

## Working on Windows

- Node 22.13 or newer. Run `npm install` at the root and in `server/`. Checks: `npm run lint && npm test`,
  then `cd server && npm test`.
- `.gitattributes` forces LF line endings. Keep it that way: CRLF breaks the Dockerfile and Caddyfile.
- `scripts/prepare-photo.mjs` converts HEIC/RAW with macOS `sips`, which Windows doesn't have.
  Convert those to JPEG first (for example, export from the Photos app), then run the script on the
  JPEG. JPEG, PNG and WebP work everywhere.
- To test the server config locally:
  - Install Caddy (`winget install CaddyServer.Caddy`) and run `npm run build`.
  - In PowerShell: `$env:PORT=4399; $env:SITE_ROOT="C:\path\to\repo\dist\client"; caddy run --config deploy/web/Caddyfile`.
  - The path must not contain spaces.
  - Local builds call the API in `.env.local`. The CSP blocks plain `http://localhost:8080`, so posts
    and admin show "not connected" there. That's expected.
- If fonts fall back after cloning, delete `.vinext/fonts/*` (it caches absolute paths).
