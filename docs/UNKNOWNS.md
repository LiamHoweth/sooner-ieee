# Unknowns

Things the site either states without a confirmed source, or leaves out until someone confirms them.
Rule: if it isn't confirmed, it stays off the site. Check an item off (or delete it) once answered,
and say where the answer came from.

## 1. Already on the live site: please confirm

- [ ] **Faculty advisor**: removed from the site (2026-10-30) because it wasn't confirmed. Send the current advisor's name and email, and their OK to publish it, to add it back.
- [ ] **Chapter email** ieee@ou.edu. Is it monitored, and by whom? Contact-form notifications will go there.
- [ ] **"More than 50 members"** (Sponsors page). This is inferred from the Outstanding *Large* Student Branch award threshold, not from an actual count. Give a real number or remove it.
- [ ] **Newsletter "biweekly"** (`socialLinks`). Is that the real cadence?
- [ ] **Programs** listed under "What we do": robotics and build teams, technical workshops, industry connections, ECE Research Connect, professional growth. Are all of these running now?
- [ ] **"Open to every OU student" / "IEEE membership not required for events."** Is that official chapter policy?
- [ ] **Discord invite** `discord.gg/uYNjF9tX7D`. Is it a permanent (non-expiring) invite?
- [ ] **Sponsorship packet**: the site links one Drive *file*. Your old doc asked for a Drive *folder*. Which link is right, and is the donation-instructions doc current?
- [ ] **Awards source**: currently a LinkedIn post. OU's news article lists 7 awards from the 2026 Region 5 conference, but the site shows 4. Can the other three (Outstanding Engineering Educator, Outstanding Student Branch Counselor, Individual Member Achievement) be shown with names?
- [ ] **Link-preview address** (`metadataBase` in `app/layout.tsx`): `ou-ieee-sooners.liamhoweth.chatgpt.site`. Is that domain still used? If not, it should be the GitHub Pages (or final) address.

## 2. Content to supply (hidden until it exists)

- [ ] **2026–27 officer roster**: names, roles, @ou.edu emails, and optional headshots, with each officer's OK to publish. Past years too, if you want a by-year view.
- [ ] **Event-type descriptions**: General Body Meetings, professional events, entertainment events, the Annual Dodgeball Tournament, and local hackathons (which ones?). Include what happens and how often.
- [ ] **Real chapter photos**, sorted by academic year, with permission from the people in them. Every photo on the site today is openly licensed stock.
- [ ] **Sponsors**: names, tier names and their order, approved logos, links, and the year each applies to.
- [ ] **Membership**: requirements to count as a member (OU Engage? dues? attendance?), and whether to list alumni and how.
- [ ] **Hero graphic**: is the commissioned graphic still coming? The hero uses an openly licensed campus photo until then.

## 3. Permissions and decisions

- [ ] **IEEE master brand logo** (blue IEEE kite): is the chapter allowed to show it? Left off for now.
- [ ] **Chapter logo files**: are the 18 SVGs in `IEEE-LOGO-SVG` the final approved marks, Liam chose OU crimson (#5) as the site's primary mark and IEEE blue (#3) as secondary (2026-10-30). If the branch has an officially approved primary, confirm it matches.
- [ ] **Coin effects**: is adding lighting, bevel and thickness to the logo on the 3D coin acceptable? DESIGN.md says never to recolour or redraw the logos.
- [ ] **Alternate colorway names** on the About page: they were matched to the SVGs by eye (Crimson = #5, Blue = #3, Red = #7, Black = #2, Red outlined = #8). Confirm the names and the mapping.
- [ ] **Coin caption wording** ("Primary mark · OU crimson" / "Secondary mark · IEEE blue"): approved, or should it say something else?
- [ ] **Discord announcements** for new posts: waiting on server-admin permission, plus a webhook and the channel to post in. Planned only, not built.
- [ ] **Email on the API** (SMTP): **not set up** (checked 2026-10-30). Invite links must be copied by hand, and new messages trigger no email alerts; they still show in the officer Inbox. Decide whether to add an email provider.
- [ ] **Railway redeploy**: needed before the inbox, invite links and post expiry work live. Needs your go-ahead. It hasn't been checked whether a push to `main` redeploys the API automatically.
- [ ] **Discord and scheduled posts**: if a post is scheduled to go live later, should it announce at that moment? The API has no background job yet, so this is undecided.
- [ ] **Region 5 website competition 2027**: entering or not? The rules aren't published yet; the old guidelines link returns a 404.
- [ ] **Domain**: ieeesooners.org is already registered (July 2025, through Cloudflare) and shows a live page titled "IEEE Sooners Student Branch." Who owns it, and can the chapter use it? Alternatives: an ou.edu address through OU IT; ieeesooners.com or ieee-sooners.org (both unregistered when checked on 2026-10-30).
- [ ] **"Sooners" in a domain name**: check with OU (Student Life or Licensing) that a student org may use the trademark in its own domain.
- [ ] **Sooner Racing Team reference**: soonerracing.com currently redirects to an unrelated site. Don't link to it until the team confirms its real domain.
