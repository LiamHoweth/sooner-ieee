# Webmaster handoff

This is the checklist for passing the IEEE Sooners website to the next webmaster. Do it with them in
person if you can, before your last semester ends.

## 1. What exists

| Thing | Current owner | Where |
|---|---|---|
| Code repository | Liam Howeth (GitHub `LiamHoweth`) | https://github.com/LiamHoweth/sooner-ieee |
| Website hosting | GitHub Pages on that repo | https://liamhoweth.github.io/sooner-ieee/ |
| API and database | Liam Howeth's Railway account | Railway project for `server/` (see docs/BACKEND.md) |
| Admin accounts | Inside the site (Admin → Admins) | `/admin.html` |
| Event calendar | Chapter Google account `ieee.sooner@gmail.com` | Google Calendar |
| Chapter email | `ieee@ou.edu` | OU |
| Email for alerts (optional) | Chapter Gmail with an App Password | Railway variables `SMTP_*` |
| Domain | none yet | If you add one, record the registrar and login owner here. |

> Long-term goal: move the repo into a chapter-owned GitHub organization and the Railway project
> into a chapter-owned workspace, so nothing depends on one student's personal account.

Keep passwords for shared chapter accounts in a password manager that the officers share. Never put
them in this repo, Discord or email.

## 2. Hand over the code (GitHub)

Pick one:

- **Transfer the repository** (recommended): **Settings → General → Danger Zone → Transfer
  ownership** to the new webmaster or to a chapter GitHub organization.
  - The GitHub Pages address changes with the owner
    (`https://<new-owner>.github.io/sooner-ieee/`). Update the `ALLOWED_ORIGINS`, `SITE_URL` and
    `ADMIN_URL` variables on Railway, the Instagram bio and other links.
  - A custom domain avoids this every year.
- **Add them as a collaborator** with Admin access (**Settings → Collaborators**). This is a good
  first step while you're still around.

After transferring, check that **Settings → Pages** still deploys from GitHub Actions, and that the
`IEEE_API_URL` Actions variable still exists.

## 3. Hand over the API (Railway)

Pick one:

- **Transfer the Railway project** (keeps the database, images, variables and history).
  1. In the project, go to **Settings → Transfer Project**.
  2. Choose the new webmaster or a chapter workspace. They must accept within 24 hours, and the
     destination needs a Hobby or Pro plan.
  3. Usage is billed to the destination from then on. See
     [Railway's project docs](https://docs.railway.com/projects).
- **Redeploy from scratch on their account.**
  1. Download a **Database backup** and copy the images (docs/BACKEND.md → Backups).
  2. Follow *First-time Railway setup* on their account.
  3. Restore the backup onto the new volume.
  4. Update the GitHub `IEEE_API_URL` variable to the new Railway domain and redeploy Pages.

Either way, confirm:

- `https://<api-domain>/api/health` returns `ok`.
- Posts appear on `/posts.html`.
- Sign-in works.
- A test sponsor application arrives. Delete it afterwards.

## 4. Hand over the admin area

1. Sign in as an owner and open **Admins**.
2. **Add the new webmaster** with their own username, Gmail and a temporary password. Make them an
   **Owner**.
3. They sign in and change their password under **My account**.
4. **Keep at least two owners** at all times: the webmaster and the president, for example.
5. Disable accounts for officers who have graduated or left. Disabling keeps their posts and shows
   their name on them.

## 5. Every semester

- [ ] Update the officer roster in `lib/chapter-content.ts`
- [ ] Add, enable or disable admin accounts for the new officers
- [ ] Update current sponsors in `lib/chapter-content.ts` (logos need the sponsor's permission)
- [ ] Check that the sponsorship packet link in `lib/chapter-content.ts` is current
- [ ] Download a database backup (Admin → My account → Backups) and store it somewhere private
- [ ] Confirm Railway volume backups are still scheduled
- [ ] Swap in new chapter photos (people pictured must be okay with it) and update the credits
- [ ] Run `npm run lint && npm test` and `cd server && npm test`
- [ ] Check the site on a phone

## 6. When something breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| Posts page says "Posts are taking a break" | API down, or `IEEE_API_URL` wrong | Open `<api>/api/health`. Check Railway deploy logs and the GitHub variable. |
| Admin says "Admin is not connected" | Site built without `IEEE_API_URL` | Set the variable and re-run the Pages workflow. |
| Sign-in works locally but not on the live site | Origin missing from `ALLOWED_ORIGINS` | Add the exact site origin (no path) on Railway and redeploy. |
| Images missing after a deploy | Volume not mounted or `DATA_DIR` wrong | The volume must be at `/data` with `DATA_DIR=/data`. |
| "Too many sign-in attempts" | Rate limit | Wait 15 minutes, or an owner resets the password. |
| Locked out, no owner can sign in | All owners lost their passwords | `railway ssh` into the API service, then run `DATA_DIR=/data npm run set-password -- <username> --owner`. |
| Events page empty | Calendar feed unavailable at build time | Re-run the Pages workflow. Check the calendar is still public. |
| Fonts look wrong locally | Stale `.vinext/fonts` cache after moving the folder | Delete `.vinext/fonts/*` and restart the dev server. |
