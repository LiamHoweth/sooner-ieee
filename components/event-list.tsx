import { ArrowUpRight, Clock3, MapPin } from 'lucide-react';

import type { ChapterEvent } from '@/lib/calendar';

const TIME_ZONE = 'America/Chicago';

function formatDate(event: ChapterEvent) {
  const date = new Date(event.start);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

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
    month: 'short',
    day: '2-digit',
  }).formatToParts(new Date(event.start));

  return {
    month: parts.find((part) => part.type === 'month')?.value || '',
    day: parts.find((part) => part.type === 'day')?.value || '',
  };
}

export function EventList({
  events,
  compact = false,
}: {
  events: ChapterEvent[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'event-list event-list-compact' : 'event-list'}>
      {events.map((event) => {
        const date = dateParts(event);
        return (
          <article className="event-row" key={event.id}>
            <time className="event-date" dateTime={event.start}>
              <span>{date.month}</span>
              <strong>{date.day}</strong>
            </time>
            <div className="event-copy">
              <p className="event-full-date">{formatDate(event)}</p>
              <h3>{event.title}</h3>
              <div className="event-meta">
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
              </div>
              {!compact && event.description && (
                <p className="event-description">{event.description}</p>
              )}
            </div>
            <a
              className="event-link"
              href={event.calendarUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open calendar for ${event.title}`}
            >
              <ArrowUpRight aria-hidden="true" />
            </a>
          </article>
        );
      })}
    </div>
  );
}
