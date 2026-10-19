import { ArrowUpRight, Clock3, MapPin } from 'lucide-react';

import type { ChapterEvent } from '@/lib/calendar';

const TIME_ZONE = 'America/Chicago';

function formatTime(event: ChapterEvent) {
  if (event.allDay) return 'All day';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(event.start));
}

function dateParts(event: ChapterEvent) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date(event.start));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || '';

  return { weekday: part('weekday'), month: part('month'), day: part('day'), year: part('year') };
}

export function EventList({
  events,
  compact = false,
  archive = false,
}: {
  events: ChapterEvent[];
  compact?: boolean;
  /** Past events: a dense grid that shows the year instead of the weekday. */
  archive?: boolean;
}) {
  const className = ['event-list', compact && 'event-list-compact', archive && 'event-archive']
    .filter(Boolean)
    .join(' ');

  return (
    <ol className={className}>
      {events.map((event) => {
        const date = dateParts(event);
        return (
          <li className="event-row" key={event.id} data-reveal>
            <time className="event-date" dateTime={event.start}>
              <span className="event-date-month">{date.month}</span>
              <span className="event-date-day">{date.day}</span>
              <span className="event-date-weekday">{archive ? date.year : date.weekday}</span>
            </time>
            <div className="event-copy">
              <h3>{event.title}</h3>
              <p className="event-meta">
                <span>
                  <Clock3 aria-hidden="true" />
                  {formatTime(event)}
                </span>
                {event.location && (
                  <span>
                    <MapPin aria-hidden="true" />
                    {event.location}
                  </span>
                )}
              </p>
              {!compact && !archive && event.description && (
                <p className="event-description">{event.description}</p>
              )}
            </div>
            <a
              className="event-link"
              href={event.calendarUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${event.title} in Google Calendar`}
            >
              <ArrowUpRight aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ol>
  );
}
