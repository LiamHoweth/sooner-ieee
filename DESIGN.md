---
name: IEEE Sooners
description: OU-familiar crimson system for the IEEE Student Branch at the University of Oklahoma, with the chapter's tornado logo struck as a thick 3D challenge coin.

colors:
  crimson: "#841617"        # OU crimson: header, page heroes, tiles, buttons
  crimson-deep: "#4e0002"   # footer
  crimson-hover: "#6a1112"
  cream: "#fdf9d8"          # accents on crimson/dark (leads, highlights)
  ieee-blue: "#00629b"      # only alongside the secondary (blue) mark
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

- Sources of truth: the official vector logos in `assets/brand/svg/` (`IEEE-LOGO-Final_*.svg`;
  #5, the OU crimson disc, is the primary mark; #3, the IEEE blue disc, is the secondary; the
  all-variants sheet #9 is not copied). The older
  screenshots in `assets/brand/*.png` are no longer used.
- `scripts/cut-coin.mjs` renders everything from those SVGs: the lit coin faces in
  `assets/brand/faces/`, the flat marks in `assets/brand/marks/`, and `public/favicon.png` (64px)
  and `public/apple-touch-icon.png` (180px, crimson square) from the crimson mark. Re-run it
  (`node scripts/cut-coin.mjs`) if the SVGs change.
- `ChapterLogo` renders the small flat marks. The default is primary (crimson) with a thin white
  keyline outside the disc, so it stays visible on crimson grounds (header, mobile menu, page heroes,
  news cards). `variant="secondary"` is the blue mark; the footer uses it on crimson-deep. Marks spin
  like a coin on hover.
- `LogoCoin` is the thick 3D challenge coin, with the crimson mark on the front and the blue mark on
  the back. It shows crimson at rest and its one toss lands crimson side up. Each face sets the logo disc inside a raised, bevelled metal rim tinted to the face
  colour; lighting on the white artwork makes it read as struck in relief. The edge is a ring of
  reeded strips, crimson metal on the front half and blue on the back. The radar rings behind it
  follow the side facing the viewer. It is not interactive. It
  appears in the home hero, the About "Our official marks" section and the 404 page. Use it on dark
  (storm) grounds only.
- The coin's lighting sits on top of the artwork; its shapes and flat colours stay as drawn.
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

The coin eases in on load, tosses once (end over end, with a gravity arc and a damped settle) a
moment after it is on screen, then just floats. The radar sweeps behind it. Sections fade up as they
scroll in (`data-reveal`). Marks spin on hover. Under `prefers-reduced-motion`, all of this is still
or instant; the coin is a still image, turned slightly to show its edge.

## 6. Content rules

- Facts only: no invented members, quotes, sponsors or numbers. Officers and sponsors render only
  when `lib/chapter-content.ts` has real entries.
- Events come from the public Google Calendar at build time. The Events page also embeds the live
  calendar.
