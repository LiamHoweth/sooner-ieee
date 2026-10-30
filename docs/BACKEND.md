# Backend (API on Railway)

The website is static (GitHub Pages). Everything officers change while the site is running goes
through a small API in `server/`, hosted on Railway: news posts, images, admin accounts, sponsor
applications and contact messages.

```
Visitor / officer browser
   │  static pages from GitHub Pages (liamhoweth.github.io/sooner-ieee)
   │  JSON + images from the API (https://<railway-domain>)
   ▼
Railway service "ieee-sooners-api"  (server/, Node 22+, Hono)
   └── volume mounted at /data
         ├── ieee-sooners.sqlite   (posts, admins, sessions, invites, applications, messages, audit log)
         └── uploads/              (images officers upload)
```

It follows the same Railway pattern as the OPC Plumbing site: deploy from GitHub with Railpack,
SQLite on a persistent volume, one replica, and scrypt-hashed passwords.

## What the API does

| Area | Routes | Who |
|---|---|---|
| Health | `GET /api/health` | anyone (Railway health check) |
| News posts | `GET /api/posts`, `GET /api/posts/:slug` | anyone, published posts only (the list leaves out expired posts) |
| Images | `GET /uploads/:file` | anyone |
| Sponsor form | `POST /api/sponsor-applications` | anyone (rate-limited, spam trap) |
| Contact form | `POST /api/messages` | anyone (rate-limited, spam trap) |
| Invite links | `POST /api/invites/lookup`, `POST /api/invites/accept` | anyone holding a valid invite token |
| Sign in | `POST /api/auth/login`, `/logout`, `/forgot`, `/reset`, `GET/PATCH /api/auth/me`, `POST /api/auth/password` | admins |
| Content | `/api/admin/posts…`, `/api/admin/uploads…`, `/api/admin/sponsor-applications…` | any admin |
| Inbox | `GET /api/admin/messages`, `PATCH /api/admin/messages/:id`, `GET /api/admin/inbox/counts` | any admin |
| Accounts and backups | `/api/admin/users…`, `/api/admin/invites…`, `/api/admin/export`, `/api/admin/backup.sqlite`, delete application or message | **owners** only |

The public site is moving its posts page from `/posts` to `/news`. The API paths stay `/api/posts`.

### Contact messages

`POST /api/messages` takes JSON:

| Field | Rule |
|---|---|
| `name` | required, 1–120 characters |
| `email` | required, valid email (stored lowercase) |
| `organization` | optional, up to 160 characters |
| `topic` | one of `Sponsorship`, `Membership`, `Events`, `Press`, `Other` |
| `message` | required, 10–5000 characters |
| `website` | honeypot. Leave it empty; real visitors never see it |

Replies: `201 {"ok":true}` when stored. A non-empty `website` also gets `201 {"ok":true}`, but nothing
is stored. `400 {"error","field"}` when a field fails validation, `429 {"error"}` after 5 messages from
one IP in 10 minutes, and `413` above 64 KB. When email is on, `NOTIFY_EMAILS` (or every active admin)
gets an alert with Reply-To set to the sender.

Admin routes (any signed-in officer):
- `GET /api/admin/messages?status=open|archived|all` (default `open`) returns
  `{ messages: [{ id, name, email, organization, topic, message, createdAt, readAt, readBy, archivedAt, archivedBy }], unread }`.
  `readBy` and `archivedBy` are officer display names.
- `PATCH /api/admin/messages/:id` with `{ read?: boolean, archived?: boolean }` returns `{ message }`.
  Archiving also marks the message read.
- `DELETE /api/admin/messages/:id` is **owner-only**.
- `GET /api/admin/inbox/counts` returns `{ messages, applications }`: unread open messages, and
  sponsor applications still marked `new`. These feed the nav badge.

### Invite links for officer accounts

Owners can still create an account with a typed password (`POST /api/admin/users`). Invites are the
other option:

- `POST /api/admin/invites` (owner) with `{ email?, displayName?, role: "admin"|"owner", sendEmail? }`
  returns `201 { invite, token, url, emailed }`. `url` is `ADMIN_URL?invite=<token>`. The token is
  random and only its SHA-256 hash is stored, so the link is shown once. It works once and expires
  after 7 days. With `sendEmail: true`, an email address and SMTP set up, the link is emailed too.
- `GET /api/admin/invites` (owner) lists pending invites (not used, revoked or expired).
- `DELETE /api/admin/invites/:id` (owner) revokes one.
- `POST /api/invites/lookup` with `{ token }` returns `{ invite: { email, displayName, role, expiresAt } }`,
  or `410` if the link is unknown, used, revoked or expired.
- `POST /api/invites/accept` with `{ token, username, password, displayName, email, remember? }`
  creates the account with the invite's role, uses up the token and returns the same
  `{ token, expiresAt, admin }` as sign-in. A taken username or email returns `409`, and the link
  still works for another try.

Tokens go in the request body, not the URL path, so they stay out of Railway's request logs. Both
public invite routes share a limit of 30 requests per IP per 15 minutes.

### Post expiry ("Hide after")

Posts have an optional `expiresAt` (ISO time, or `null`). After it passes, the post drops out of
`GET /api/posts`, which feeds the News page and the home page. `GET /api/posts/:slug` still returns
it, so shared links keep working. In `PATCH`, `expiresAt: null` clears it, and leaving it out keeps the
saved value. It must be later than `publishedAt` when both are sent.

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
| `NOTIFY_EMAILS` | `president@gmail.com,webmaster@gmail.com` | Who gets sponsor-application and contact-message alerts. Blank means every active admin. |

Without SMTP the site works the same, except:
- sponsor and contact alerts aren't emailed (they still appear in the Inbox)
- invite links have to be copied by hand
- "Forgot password" tells people to ask an owner, who can reset it from **Admins**

`ADMIN_URL` is also the base of invite links, so it must be the real admin page address.

## Current deployment

| | |
|---|---|
| Railway project | **IEEE Sooners** (workspace "Liam Howeth's Projects") |
| Service | `ieee-sooners-api`, deployed from GitHub `LiamHoweth/sooner-ieee`, branch `main`, root `/server` |
| Public URL | https://ieee-sooners-api-production.up.railway.app |
| Volume | `ieee-sooners-api-volume`, 5 GB, mounted at `/data` |
| Website variable | GitHub Actions variable `IEEE_API_URL` = the public URL above |

Pushes to `main` that change `server/**` redeploy the API automatically. Website-only pushes don't.

## Infrastructure as code

The service's settings live in **`server/.railway/railway.ts`**, using Railway Infrastructure as
Code:
- the GitHub source and `/server` root
- the build and start commands
- the health check and restart policy
- one replica
- the required `/data` mount and the volume

Environment variables are **not** in that file (they're "unmanaged"), so no secrets are in the repo.

To change a setting, edit the file and run these from `server/`:

```bash
railway config plan
```

Read the plan. **It must say `0 to destroy`.** Never apply a plan that detaches or removes
`ieee-sooners-api-volume`: that is every post, image and admin account.

```bash
railway config apply
```

The old `server/railway.json` (Config as Code, which Railway retires on 2026-12-01) has been
removed. Nothing reads it any more.

## Setting it up again from scratch (new account)

1. Install the CLI (`brew install railway`) and sign in (`railway login`).
2. In `server/`, create a project: `railway init --name "IEEE Sooners"`.
3. Add the service, a volume and a domain:
   - `railway add --service ieee-sooners-api`
   - `railway service link ieee-sooners-api`
   - `railway volume add --mount-path /data`
   - `railway domain --service ieee-sooners-api --port 8080`
4. Set the variables from the table above with
   `railway variable set KEY=value --service ieee-sooners-api --skip-deploys`. Include `PORT=8080`
   and the `BOOTSTRAP_OWNER_*` values.
5. Run `npm install`, then `railway config plan`. If it shows **0 to destroy**, run
   `railway config apply`. This connects the GitHub repo with root `/server` and starts a deploy.
   - If the repo has a new owner, change the `github('…')` line in `.railway/railway.ts` first.
   - Railway's GitHub app must have access to the repo.
6. Check `https://<domain>/api/health`. It should return `{"ok":true,…}`.
7. In GitHub, go to **Settings → Secrets and variables → Actions → Variables** and set
   `IEEE_API_URL` = `https://<domain>`. Then re-run **Deploy GitHub Pages**.
8. Sign in at `/admin.html` with the bootstrap owner, then delete the `BOOTSTRAP_OWNER_*` variables.
9. Optional: under the service **Settings**, turn on **Wait for CI** so a failing test blocks
   API deploys.

## Adding the first owner to an existing deployment

The API runs fine with no admin accounts. To create the first owner:

1. On your computer, run `cd server && npm run hash-password` and type the password.
2. Set the variables. Setting them redeploys the service, which creates the owner because no admins
   exist yet:
   - `railway variable set BOOTSTRAP_OWNER_USERNAME=… BOOTSTRAP_OWNER_EMAIL=… --service ieee-sooners-api --skip-deploys`
   - `railway variable set BOOTSTRAP_OWNER_PASSWORD_HASH='scrypt-v1$…' --service ieee-sooners-api`
3. Sign in, then delete the three variables.

## Backups and restores

There are three layers. Use every one that's available to you.

1. **Railway volume backups** need a **Pro** workspace. The current Hobby workspace can't schedule
   them. If the chapter moves to Pro, turn on daily and weekly backups in the service's Backups tab.
   See [Railway's backup docs](https://docs.railway.com/volumes/backups). Until then, rely on 2 and
   3, and download a backup every semester.
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

## Planned: Discord announcements

Not built. It's waiting on permission from the Discord server's admins.

The design:
- A `DISCORD_WEBHOOK_URL` variable on Railway holds a webhook for the announcements channel. Without
  it, nothing is sent.
- The first time a post is published (or a scheduled post goes live), the API sends the webhook a
  short message: title, summary and a link to the post. It's fire-and-forget, like email: a Discord
  failure never blocks publishing. Later edits don't post again.
- The editor gets an opt-out checkbox ("Don't announce on Discord") for posts that shouldn't be
  announced.
- Still needed: a decision on how scheduled posts trigger it. The API has no background job today.

## Database migrations

`MIGRATIONS` in `server/src/db.ts` runs on start, in order:

| # | Change |
|---|---|
| 1 | Original schema |
| 2 | `posts.expires_at` ("Hide after") |
| 3 | `contact_messages` table |
| 4 | `admin_invites` table |

**The inbox, invite links and post expiry need the Railway API redeployed with these changes.** A
push to `main` that touches `server/**` does that. Migrations run on their own at startup, and existing
data is kept. Until the redeploy, the Contact form gets 404s and the admin Inbox shows an error.

## Changing the API

- The post block schema exists twice and must match: `server/src/posts.ts` (validation) and
  `lib/posts.ts` (website rendering and editor).
- Add database changes as a **new** entry at the end of `MIGRATIONS` in `server/src/db.ts`. Never
  edit a migration that has already shipped.
- Run `cd server && npm test` before pushing. The tests cover sign-in, permissions, uploads,
  validation, rate limits, CORS, contact messages, invites and post expiry.
