'use client';

import { useState, useSyncExternalStore } from 'react';

type Mode = 'MONTH' | 'AGENDA';

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'MONTH', label: 'Month' },
  { mode: 'AGENDA', label: 'Agenda' },
];

const NARROW_QUERY = '(max-width: 700px)';

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function embedUrl(base: string, mode: Mode) {
  const url = new URL(base);
  url.searchParams.set('mode', mode);
  url.searchParams.set('showTitle', '0');
  url.searchParams.set('showPrint', '0');
  url.searchParams.set('showCalendars', '0');
  url.searchParams.set('showTz', '0');
  url.searchParams.set('wkst', '1');
  url.searchParams.set('bgcolor', '#ffffff');
  return url.toString();
}

/** The chapter's public Google Calendar, embedded with a month/agenda switch. */
export function CalendarEmbed({ src, title }: { src: string; title: string }) {
  const [chosen, setChosen] = useState<Mode | null>(null);
  // A month grid is unreadable on a phone, so narrow screens start on the agenda.
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
  const mode = chosen ?? (narrow ? 'AGENDA' : 'MONTH');

  return (
    <div className="calendar-embed">
      <fieldset className="calendar-embed-toolbar">
        <legend className="sr-only">Calendar view</legend>
        {MODES.map((item) => (
          <button
            key={item.mode}
            type="button"
            aria-pressed={mode === item.mode}
            onClick={() => setChosen(item.mode)}
          >
            {item.label}
          </button>
        ))}
      </fieldset>
      <div className="calendar-embed-frame">
        <iframe
          key={mode}
          src={embedUrl(src, mode)}
          title={`${title} — Google Calendar, ${mode === 'MONTH' ? 'month' : 'agenda'} view`}
          loading="lazy"
        />
      </div>
    </div>
  );
}
