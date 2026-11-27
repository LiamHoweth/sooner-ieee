import { describe, expect, it } from 'vitest';

import {
  MIN_TILES_PER_HALF,
  SECONDS_PER_TILE,
  STILL_GAP,
  STILL_MIN_TILE,
  initials,
  stillLayout,
  stripDuration,
  stripRepeats,
} from './officer-strip';

describe('stillLayout', () => {
  it('puts this year’s seven officers in one still row from about 1,260px', () => {
    // Row + page margins (2 × 48px) + a 16px scrollbar.
    expect(stillLayout(7)).toEqual({ columns: 7, minWidth: 7 * STILL_MIN_TILE + 6 * STILL_GAP + 112 });
    expect(stillLayout(7)?.minWidth).toBe(1258);
  });

  it('never goes still below desktop width', () => {
    expect(stillLayout(3)?.minWidth).toBe(1024);
  });

  it('uses even rows when one row would be too wide', () => {
    expect(stillLayout(8)).toEqual({ columns: 4, minWidth: 1024 });
    expect(stillLayout(9)?.columns).toBe(5);
    expect(stillLayout(14)?.columns).toBe(7);
  });

  it('keeps gliding when the roster is too big to sit still', () => {
    expect(stillLayout(40)).toBeNull();
    expect(stillLayout(0)).toBeNull();
  });

  it('only switches to still above the width where one gliding set would fit on screen', () => {
    // Gliding tile + gap at viewport w: clamp(168, 128 + 0.08w, 240) + clamp(12, 0.015w, 20).
    const glideSet = (count: number, w: number) =>
      count * (Math.min(240, Math.max(168, 128 + 0.08 * w)) + Math.min(20, Math.max(12, 0.015 * w)));
    for (const count of [5, 6, 7]) {
      const layout = stillLayout(count)!;
      expect(glideSet(count, layout.minWidth - 1)).toBeGreaterThan(layout.minWidth - 1);
    }
  });
});

describe('stripRepeats', () => {
  it('fills each half with at least the minimum number of tiles', () => {
    for (const count of [1, 2, 3, 5, 8, 11, 12, 13, 20]) {
      expect(stripRepeats(count) * count).toBeGreaterThanOrEqual(MIN_TILES_PER_HALF);
    }
  });

  it('does not repeat a roster that already fills a half', () => {
    expect(stripRepeats(12)).toBe(1);
    expect(stripRepeats(20)).toBe(1);
  });

  it('repeats short rosters', () => {
    expect(stripRepeats(8)).toBe(2);
    expect(stripRepeats(3)).toBe(4);
  });

  it('always gives each half an even number of tiles', () => {
    for (let count = 1; count <= 30; count++) {
      expect((stripRepeats(count) * count) % 2).toBe(0);
    }
    expect(stripRepeats(13)).toBe(2);
  });

  it('is zero for an empty roster', () => {
    expect(stripRepeats(0)).toBe(0);
  });
});

describe('stripDuration', () => {
  it('keeps the same speed per tile', () => {
    expect(stripDuration(8)).toBe(16 * SECONDS_PER_TILE);
    expect(stripDuration(12)).toBe(12 * SECONDS_PER_TILE);
  });
});

describe('initials', () => {
  it('takes the first letters of the first two words', () => {
    expect(initials('jane q doe')).toBe('JQ');
    expect(initials('  Sam   Lee ')).toBe('SL');
    expect(initials('Prince')).toBe('P');
  });
});
