import ICAL from 'ical.js';

import { chapter } from '@/lib/chapter-content';

export type ChapterEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  calendarUrl: string;
};

export type ChapterEventFeed = {
  status: 'ok' | 'error';
  upcoming: ChapterEvent[];
  past: ChapterEvent[];
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_RECURRENCE_ITERATIONS = 5000;

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function sanitizeCalendarText(value?: string | null) {
  if (!value) return undefined;

  const cleaned = decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned || undefined;
}

function eventFromOccurrence(
  event: ICAL.Event,
  start: ICAL.Time,
  end: ICAL.Time,
): ChapterEvent {
  const startDate = start.toJSDate();
  const endDate = end.toJSDate();
  const recurrenceStamp = startDate.toISOString();
  const componentUrl = event.component.getFirstPropertyValue('url');

  return {
    id: `${event.uid || 'event'}-${recurrenceStamp}`,
    title: sanitizeCalendarText(event.summary) || 'OU IEEE event',
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    allDay: start.isDate,
    location: sanitizeCalendarText(event.location),
    description: sanitizeCalendarText(event.description),
    calendarUrl:
      typeof componentUrl === 'string' ? componentUrl : chapter.calendarUrl,
  };
}

export function parseChapterCalendar(
  ics: string,
  now = new Date(),
): Omit<ChapterEventFeed, 'status'> {
  const rangeStart = new Date(now.getTime() - 365 * DAY);
  const rangeEnd = new Date(now.getTime() + 365 * DAY);
  const root = new ICAL.Component(ICAL.parse(ics));
  const calendarEvents = root.getAllSubcomponents('vevent');
  const collected: ChapterEvent[] = [];

  for (const component of calendarEvents) {
    const event = new ICAL.Event(component);

    if (!event.isRecurring()) {
      const start = event.startDate;
      const end = event.endDate;
      const startDate = start.toJSDate();
      if (startDate >= rangeStart && startDate <= rangeEnd) {
        collected.push(eventFromOccurrence(event, start, end));
      }
      continue;
    }

    const iterator = event.iterator();
    let iteration = 0;
    let next: ICAL.Time | null;

    while (
      iteration < MAX_RECURRENCE_ITERATIONS &&
      (next = iterator.next())
    ) {
      iteration += 1;
      const occurrenceDate = next.toJSDate();
      if (occurrenceDate > rangeEnd) break;
      if (occurrenceDate < rangeStart) continue;

      const occurrence = event.getOccurrenceDetails(next);
      collected.push(
        eventFromOccurrence(
          occurrence.item,
          occurrence.startDate,
          occurrence.endDate,
        ),
      );
    }
  }

  const unique = [...new Map(collected.map((event) => [event.id, event])).values()];
  unique.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

  return {
    upcoming: unique.filter((event) => Date.parse(event.end) >= now.getTime()),
    past: unique
      .filter((event) => Date.parse(event.end) < now.getTime())
      .sort((a, b) => Date.parse(b.start) - Date.parse(a.start)),
  };
}

export async function getChapterEventFeed(
  now = new Date(),
): Promise<ChapterEventFeed> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(chapter.calendarIcsUrl, {
      next: { revalidate: 900 },
      signal: controller.signal,
      headers: { Accept: 'text/calendar' },
    });

    if (!response.ok) throw new Error(`Calendar returned ${response.status}`);
    const ics = await response.text();
    return { status: 'ok', ...parseChapterCalendar(ics, now) };
  } catch {
    return { status: 'error', upcoming: [], past: [] };
  } finally {
    clearTimeout(timeout);
  }
}
