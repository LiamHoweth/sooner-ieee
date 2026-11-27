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
| About hero | officers-2026 | Officer photoshoot · _DSC3656.JPG (crop 0.162,0.15,0.756,0.85) |
| About "Why we exist" | ou-flag-team-2024 | 2024-25 / Pictures · IMG_0303.HEIC |
| About Recognition | region5-team-2026 | 2025-26 / 2026 IEEE R5 Awards Recap · 20260328_080626.jpg |
| Events hero | williams-talk-2026 | 2026-27 / 10/29 Williams Speaker Event · IMG_2362.HEIC |
| Projects hero | antenna-group-2026 | 2026-27 / 11/11 Antenna Building · IMG_5650.jpg |
| Projects "Build & compete" | antenna-drill-2026 | 2026-27 / 11/11 Antenna Building · 20261111_185832.jpg |
| Projects "Learn & connect" | ti-mock-interview-2026 | 2026-27 / 9/16 Texas Instruments' Career Prep · IMG_1291.HEIC |
| Sponsors hero | lumen-talk-2026 | 2025-26 / Lumen Tech Talk · IMG_0953.JPG (brightness 1.14) |
| Sponsors "Ways to partner" tile | ni-talk-2026 | 2026-27 / 11/18 NI - Engineering Your Future · IMG_1997.heic |
| News hero | gbm-officers-presenting-2026 | 2026-27 / 9/8 IEEE GBM: Getting Involved · 20260908_185855.jpg |
| Contact hero | microwave-night-2026 | 2026-27 / 10/15 Stuff in a Microwave · DSC00271.ARW |

The Drive folder links are with Liam (the chapter shared them). Don't commit them: this repo is
public, and the folders hold far more photos than the site uses.

## Still to do, in order

1. **Review and merge** this branch into `main`. Merging redeploys GitHub Pages with the new photos.
   CI runs on the PR.
2. **Create the Railway web service** (needs Liam's go-ahead). Run these from `server/`:
   - `railway link -p "IEEE Sooners" -e production -s ieee-sooners-api` (links are per machine)
   - `railway config plan`: it must say `0 to destroy`. Then `railway config apply`.
   - Then follow steps 3–7 of the cutover in `docs/BACKEND.md`: the `NEXT_PUBLIC_API_URL` variable,
     a domain, the API's `ALLOWED_ORIGINS`/`SITE_URL`/`ADMIN_URL`, testing, `metadataBase` in
     `app/layout.tsx`, and turning off Pages.
   - Liam said to skip the custom domain for now; use the `*.up.railway.app` address.
3. **Officers (blocked on the chapter):** the 2026-27 roster isn't written down anywhere in the repo,
   Drive or email.
   - The only roster found is 2025-26, in "IEEE Sponsorship Packet 2025-26.pdf" (Dec 2025).
   - The Drive folder "Officer photoshoot" (Sept 2026) has headshots of 8 officers: _DSC3622, 3624,
     3627, 3632, 3637 (better take than 3636), 3640, 3652 and 3654 (better than 3655). The "Unused"
     subfolder only holds rejected takes.
   - Once names and roles arrive:
     - Make square face crops with `prepare-photo.mjs`. `.person-card img` is a 5rem circle, so
       about 600px is plenty.
     - Add them to `officers` in `lib/chapter-content.ts`. `Officer.image` is a string, so import the
       webp and pass `.src`.
   - Never guess names from faces.
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
