import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getChapterEventFeed,
  parseChapterCalendar,
  sanitizeCalendarText,
} from '@/lib/calendar';

const NOW = new Date('2026-09-08T17:00:00.000Z');

const TIMEZONE = `
BEGIN:VTIMEZONE
TZID:America/Chicago
BEGIN:DAYLIGHT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
TZNAME:CDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;

function calendar(...events: string[]) {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OU IEEE Tests//EN
${TIMEZONE}
${events.join('\n')}
END:VCALENDAR`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sanitizeCalendarText', () => {
  it('removes HTML and decodes escaped calendar text', () => {
    expect(
      sanitizeCalendarText('<p>Bring a laptop<br>Teams\\, welcome &amp; ready.</p>'),
    ).toBe('Bring a laptop\nTeams, welcome & ready.');
  });
});

describe('parseChapterCalendar', () => {
  it('parses timed and all-day events and separates past from upcoming', () => {
    const result = parseChapterCalendar(
      calendar(
        `BEGIN:VEVENT
UID:future-timed
DTSTART;TZID=America/Chicago:20260910T183000
DTEND;TZID=America/Chicago:20260910T200000
SUMMARY:Build Night
LOCATION:REPF 200
DESCRIPTION:Bring a laptop
END:VEVENT`,
        `BEGIN:VEVENT
UID:past-all-day
DTSTART;VALUE=DATE:20260414
DTEND;VALUE=DATE:20260415
SUMMARY:Giving Day
END:VEVENT`,
      ),
      NOW,
    );

    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0]).toMatchObject({
      title: 'Build Night',
      allDay: false,
      location: 'REPF 200',
    });
    expect(result.upcoming[0].start).toBe('2026-09-10T23:30:00.000Z');
    expect(result.past).toHaveLength(1);
    expect(result.past[0]).toMatchObject({ title: 'Giving Day', allDay: true });
  });

  it('expands recurrence rules, honors the date window, and deduplicates occurrences', () => {
    const recurring = `BEGIN:VEVENT
UID:weekly-workshop
DTSTART:20260910T230000Z
DTEND:20260911T000000Z
RRULE:FREQ=WEEKLY;COUNT=3
SUMMARY:Weekly Workshop
END:VEVENT`;
    const duplicate = `BEGIN:VEVENT
UID:weekly-workshop
DTSTART:20260910T230000Z
DTEND:20260911T000000Z
SUMMARY:Weekly Workshop
END:VEVENT`;
    const result = parseChapterCalendar(calendar(recurring, duplicate), NOW);

    expect(result.upcoming.map((event) => event.start)).toEqual([
      '2026-09-10T23:00:00.000Z',
      '2026-09-17T23:00:00.000Z',
      '2026-09-24T23:00:00.000Z',
    ]);
  });

  it('allows missing location and description fields', () => {
    const result = parseChapterCalendar(
      calendar(`BEGIN:VEVENT
UID:minimal
DTSTART:20260912T160000Z
DTEND:20260912T170000Z
SUMMARY:Open Meeting
END:VEVENT`),
      NOW,
    );

    expect(result.upcoming[0].location).toBeUndefined();
    expect(result.upcoming[0].description).toBeUndefined();
  });
});

describe('getChapterEventFeed', () => {
  it('returns a safe error state when the feed is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(getChapterEventFeed(NOW)).resolves.toEqual({
      status: 'error',
      upcoming: [],
      past: [],
    });
  });

  it('returns a safe error state for malformed calendar content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not a calendar', { status: 200 })),
    );
    await expect(getChapterEventFeed(NOW)).resolves.toEqual({
      status: 'error',
      upcoming: [],
      past: [],
    });
  });
});
