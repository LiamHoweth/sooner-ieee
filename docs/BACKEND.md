# Backend (API on Railway)

The website is static (GitHub Pages). Everything officers change while the site is running goes
through a small API in `server/`, hosted on Railway: posts, images, admin accounts and sponsor
applications.

```
Visitor / officer browser
   │  static pages from GitHub Pages (liamhoweth.github.io/sooner-ieee)
   │  JSON + images from the API (https://<railway-domain>)
   ▼
Railway service "ieee-sooners-api"  (server/, Node 22+, Hono)
   └── volume mounted at /data
         ├── ieee-sooners.sqlite   (posts, admins, sessions, applications, audit log)
         └── uploads/              (images officers upload)
```

It follows the same Railway pattern as the OPC Plumbing site: deploy from GitHub with Railpack,
SQLite on a persistent volume, one replica, and scrypt-hashed passwords.

## What the API does

| Area | Routes | Who |
|---|---|---|
| Health | `GET /api/health` | anyone (Railway health check) |
| Posts | `GET /api/posts`, `GET /api/posts/:slug` | anyone, published posts only |
| Images | `GET /uploads/:file` | anyone |
| Sponsor form | `POST /api/sponsor-applications` | anyone (rate-limited, spam trap) |
| Sign in | `POST /api/auth/login`, `/logout`, `/forgot`, `/reset`, `GET/PATCH /api/auth/me`, `POST /api/auth/password` | admins |
| Content | `/api/admin/posts…`, `/api/admin/uploads…`, `/api/admin/sponsor-applications…` | any admin |
| Accounts and backups | `/api/admin/users…`, `/api/admin/export`, `/api/admin/backup.sqlite`, delete application | **owners** only |

Security notes:

- **Passwords:** scrypt hashes, 12 characters minimum. Sign-in is rate-limited per IP and per
  username.
- **Sessions:** random tokens stored as SHA-256 hashes. They last 12 hours, or 30 days with "keep
  me signed in". Changing a password, resetting it, or disabling an account signs that person out.
- **Cross-site requests:** CORS only answers the origins listed in `ALLOWED_ORIGINS`.
- **Post content:** checked against a fixed block schema (`server/src/posts.ts`). There is no raw
  HTML. Links must be `https://`, `mailto:` or a site path, and videos must be YouTube or Vimeo.
- **Uploads:** identified by their file bytes, not their name. Only JPEG, PNG, WebP and GIF up to
  8 MB are accepted.
- **Account safety:** the last owner can never be removed or demoted.

## Environment variables

Set these in Railway → service → **Variables**. Never commit real values.
`server/.env.example` has the same list with comments.

| Variable | Example | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `DATA_DIR` | `/data` | **Required.** The volume mount path. The service refuses to start without it in production. |
| `PUBLIC_API_URL` | `https://ieee-sooners-api.up.railway.app` | The service's public URL, used for image links. |
| `ALLOWED_ORIGINS` | `https://liamhoweth.github.io,http://localhost:4317` | Scheme and host only, no path. Add a custom domain here if you get one. |
| `SITE_URL` | `https://liamhoweth.github.io/sooner-ieee` | |
| `ADMIN_URL` | `https://liamhoweth.github.io/sooner-ieee/admin.html` | Used in password-reset emails. |
| `BOOTSTRAP_OWNER_USERNAME` | `liam` | Creates the first owner **only when no admins exist**. Remove it after the first deploy. |
| `BOOTSTRAP_OWNER_EMAIL` | `you@gmail.com` | |
| `BOOTSTRAP_OWNER_PASSWORD_HASH` | `scrypt-v1$…` | From `cd server && npm run hash-password`. |
| `SMTP_HOST`, `SMTP_PORT` | `smtp.gmail.com`, `465` | Optional email. |
| `SMTP_USER`, `SMTP_PASS` | chapter Gmail and its **App Password** | Turn on 2-Step Verification for the Gmail account, then create an App Password. |
| `SMTP_FROM` | `IEEE Sooners <ieee.sooner@gmail.com>` | |
| `NOTIFY_EMAILS` | `president@gmail.com,webmaster@gmail.com` | Who gets sponsor alerts. Blank means every active admin. |

Without SMTP the site works the same, except that sponsor alerts are not emailed and "Forgot
password" tells people to ask an owner, who can reset it from **Admins**.

## Railway config file deadline

`server/railway.json` uses Railway's Config as Code, which Railway has deprecated. It keeps working
**until 2026-12-01**. After the project exists, migrate it to Infrastructure as Code from `server/`:

```bash
railway config migrate --show
```

```bash
railway config migrate --apply
```

```bash
railway config migrate cutover
```

Commit the generated `.railway/railway.ts`. Delete `railway.json` only after the cutover. See
[Railway's IaC migration guide](https://docs.railway.com/infrastructure-as-code#migrating-from-config-as-code).

## First-time Railway setup

1. **Create the service.** In Railway, choose **New Project → Deploy from GitHub repo** and pick
   `LiamHoweth/sooner-ieee`.
2. **Point it at the API folder.** Under service **Settings → Source**, set **Root Directory** to
   `/server`. Railway then reads `server/railway.json`: Railpack, `npm ci && npm run build`,
   `npm run start`, health check `/api/health`, restart on failure, one replica.
   - Under **Settings → Source → Watch Paths**, add `/server/**` so website-only commits don't
     redeploy the API.
   - Turn on **Wait for CI** so a failing test blocks the deploy.
3. **Attach storage.** Right-click the service → **Attach volume** → mount path `/data`.
4. **Fill in variables.** Add the variables above, including the three `BOOTSTRAP_OWNER_*` values.
5. **Give it a public address.** Under **Settings → Networking**, generate a public domain. Put that
   URL in `PUBLIC_API_URL`, then redeploy.
6. **Check it.** Open `https://<domain>/api/health`. You should see `{"ok":true,…}`.
7. **Connect the website.** In GitHub, go to repo **Settings → Secrets and variables → Actions →
   Variables** and add `IEEE_API_URL` = `https://<domain>`. Then re-run **Deploy GitHub Pages**
   (Actions tab → Run workflow) or push any commit.
8. **First sign-in.** Sign in at `/admin.html` with the bootstrap owner. Then delete the
   `BOOTSTRAP_OWNER_*` variables in Railway; they are ignored once an admin exists.
9. **Turn on backups.** In the service's **Backups** tab, schedule volume backups (daily or weekly).

## Backups and restores

There are three layers. Use at least two.

1. **Railway volume backups** (Backups tab). Restoring creates a new volume from the snapshot and
   redeploys. Restores only work inside the same project. See
   [Railway's backup docs](https://docs.railway.com/volumes/backups).
2. **Owner download** (Admin → My account → Backups):
   - *Database backup* is the full SQLite file: posts, applications and admin accounts with their
     password hashes. Treat it like a password.
   - *Content export (JSON)* is a readable copy of the posts and applications, with image URLs.
3. **Server snapshot**: `railway ssh` into the service, then run
   `DATA_DIR=/data npm run backup`. This writes `ieee-sooners.sqlite` and `uploads/` into
   `/data/backups/<timestamp>/`.

**To restore onto a fresh service:** create the service (steps 1–5 above) and stop it. Copy the
backed-up `ieee-sooners.sqlite` and `uploads/` folder onto the new volume at `/data` (use
`railway ssh` with a file upload, or a temporary service that mounts the volume). Then start it.
Admin accounts and passwords come back with the database.

## Limits and costs

- **One replica only.** SQLite on a single volume is right for a club site. If the site ever needs
  several replicas, move to Postgres and object storage first.
- **Uploads:** about 8 MB each, and the admin page shrinks photos to 2000px WebP before upload.
  A few thousand images fit comfortably in a 5 GB volume.
- **Cost:** Railway bills by usage. A service this small idles at very little, but check the
  current plan in the Railway dashboard. The volume is the main ongoing cost.

## Changing the API

- The post block schema exists twice and must match: `server/src/posts.ts` (validation) and
  `lib/posts.ts` (website rendering and editor).
- Add database changes as a **new** entry at the end of `MIGRATIONS` in `server/src/db.ts`. Never
  edit a migration that has already shipped.
- Run `cd server && npm test` before pushing. The tests cover sign-in, permissions, uploads,
  validation, rate limits and CORS.
