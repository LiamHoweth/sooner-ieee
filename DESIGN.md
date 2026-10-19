---
name: IEEE Sooners
description: OU-familiar crimson system for the IEEE Student Branch at the University of Oklahoma, with the chapter's tornado logo struck as a flippable 3D challenge coin.

colors:
  crimson: "#841617"        # OU crimson: header, page heroes, tiles, buttons
  crimson-deep: "#4e0002"   # footer
  crimson-hover: "#6a1112"
  cream: "#fdf9d8"          # accents on crimson/dark (leads, highlights)
  ieee-blue: "#00629b"      # only alongside the primary (blue) mark
  ink: "#141414"
  charcoal: "#323232"       # secondary text
  gray: "#5c5c5c"           # meta text
  fog: "#f4f2ee"            # light section ground, cards
  line: "#ddd8cf"
  storm: "#0c0f14"          # dark storm sections behind photos and the coin

typography:
  display: "Barlow Condensed 800, uppercase, leading 0.84–0.9 (stand-in for OU's Mongoose)"
  ui: "Montserrat 600–800 for nav, buttons, labels, event titles"
  reading: "Source Serif 4 for body and leads (OU's serif voice)"
  scale: "display clamp(3.75rem→8.75rem) · title clamp(2.75rem→5.25rem) · heading clamp(1.875rem→2.375rem) · lead 1.375rem · body 1.125rem · small 0.875rem"

spacing:
  gutter: "clamp(1rem, 4vw, 3rem)"
  section: "clamp(5rem, 3rem + 7vw, 9.5rem)"
  container: "1280px"

radii: "Square corners everywhere; circles only for the logo marks and the event link button."
---

# IEEE Sooners design system

## 1. Character

Familiar to anyone who uses ou.edu: a crimson header bar, tall condensed uppercase section titles
("EVENTS", "WHAT WE DO"), crimson tile grids ruled with white lines and corner buttons, serif
reading text. The chapter's own flair sits on top: the approved tornado logo as a 3D challenge
coin, Norman storm photography, and a radar sweep behind the coin. The radar nods to OU's
RaXPol storm radar and the National Weather Center.

## 2. Logos

- Sources of truth: the approved logo screenshots in `assets/brand/`.
- `scripts/cut-logos.mjs` cuts circular WebP faces into `assets/brand/coin/`. Re-run it if the
  source images change.
- `ChapterLogo` renders the small marks. The header and page heroes use primary (blue); the footer
  uses secondary (crimson). Marks spin like a coin on hover.
- `LogoCoin` is the 3D coin, with primary on the front and secondary on the back. Click, tap, Enter
  or drag to flip it. It appears in the home hero, the About "Our official marks" section and the
  404 page. Use it on dark (storm) grounds only.
- Never recolour, redraw or crop into the logos.

## 3. Layout patterns

| Pattern | Class | Use |
|---|---|---|
| Page masthead | `PageHero` | Every inner page: crimson band, one-word title, italic cream lead, framed photo with a spinning mark |
| Section title | `.display-title` | Crimson condensed uppercase; white on dark/crimson grounds |
| Section header | `.section-head` | Title, one sentence, optional outline button |
| Tile grid | `.tile-grid` / `.tile` | OU APPLY/VISIT/GIVE-style crimson tiles with white rules and corner buttons |
| Storm band | `RegionResults` / `.storm-section` | Dark photo band with the Region 5 podium |
| Event rows | `EventList` | Crimson date stub + fog card; `archive` for a dense past-events grid |
| CTA band | `.cta-band` | Crimson closing band; `.cta-band-split` puts actions on the right |

Neighbouring sections alternate grounds (white → fog → crimson → storm) instead of using rules.

## 4. Photography

Openly licensed pictures of the chapter's world only (campus, Norman storms, lab equipment), listed
in `lib/photos.ts` and `assets/photos/credits.json`. They are credited in the footer. Never present a
found photo as chapter members or a chapter event. Replace them with the chapter's own photos when
they exist, and keep the credits in sync.

## 5. Motion

The coin spins in on load, floats, and tosses on click. The radar sweeps behind it. Sections fade up
as they scroll in (`data-reveal`). Marks spin on hover. Under `prefers-reduced-motion`, all of this
is still or instant; the coin still flips, without animation.

## 6. Content rules

- Facts only: no invented members, quotes, sponsors or numbers. Officers and sponsors render only
  when `lib/chapter-content.ts` has real entries.
- Events come from the public Google Calendar at build time. The Events page also embeds the live
  calendar.
