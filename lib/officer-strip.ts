/**
 * Layout math for the About page's officer strip.
 *
 * On wide screens every officer sits still in one row (or a few even rows), so nobody
 * shows twice. Below that width the strip glides: two identical halves side by side,
 * sliding left by exactly one half and starting over, so the jump is invisible. Each
 * half must be wider than the screen or the end of the list would show, so short
 * rosters repeat inside it.
 */

/** Narrowest a tile may get in the still layout (px). */
export const STILL_MIN_TILE = 150;
/** Space between still tiles (px); matches the 1rem column gap in the CSS. */
export const STILL_GAP = 16;
/** The site container's widest content width (px), from `.site-container`. */
const CONTAINER_MAX = 1280;
/** Page margins at desktop widths: 2 × the 3rem gutter, plus 16px for a scrollbar (px). */
const PAGE_MARGINS = 112;
/** The still layout is for desktops; phones and tablets keep the glide. */
const DESKTOP_MIN = 1024;
/** More rows than this and the still layout takes too much room; it glides instead. */
const MAX_ROWS = 3;

/**
 * Columns and the viewport width (px) from which the roster sits still, or null if
 * it never fits. Uses the fewest even rows that fit inside the site container.
 */
export function stillLayout(officerCount: number): { columns: number; minWidth: number } | null {
  if (officerCount <= 0) return null;
  for (let rows = 1; rows <= MAX_ROWS; rows++) {
    const columns = Math.ceil(officerCount / rows);
    const row = columns * STILL_MIN_TILE + (columns - 1) * STILL_GAP;
    if (row <= CONTAINER_MAX) return { columns, minWidth: Math.max(DESKTOP_MIN, row + PAGE_MARGINS) };
  }
  return null;
}

/** Tiles in one half. At the widest tile size (15rem + gap) this is about 3,100px. */
export const MIN_TILES_PER_HALF = 12;

/** Speed: each tile takes this long to slide past, whatever the roster size. */
export const SECONDS_PER_TILE = 5;

/**
 * How many times the roster repeats inside one half of the strip. Each half gets an
 * even number of tiles, so the alternating crimson / black-and-white pattern never
 * puts two of a kind side by side, even where the loop restarts.
 */
export function stripRepeats(officerCount: number): number {
  if (officerCount <= 0) return 0;
  const repeats = Math.ceil(MIN_TILES_PER_HALF / officerCount);
  return (repeats * officerCount) % 2 === 0 ? repeats : repeats + 1;
}

/** Seconds for one full loop (one half sliding past). */
export function stripDuration(officerCount: number): number {
  return stripRepeats(officerCount) * officerCount * SECONDS_PER_TILE;
}

/** Up to two initials, for officers who have no photo yet. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
