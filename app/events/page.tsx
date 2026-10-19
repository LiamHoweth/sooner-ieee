import type { Metadata } from 'next';
import { ArrowUpRight, CalendarDays, CalendarPlus, Rss } from 'lucide-react';

import { CalendarEmbed } from '@/components/calendar-embed';
import { EventList } from '@/components/event-list';
import { PageHero } from '@/components/page-hero';
import { getChapterEventFeed } from '@/lib/calendar';
import { chapter, socialLinks } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Upcoming workshops, speakers, project sessions, and professional events from IEEE Sooners, plus the full chapter calendar.',
};

const discord = socialLinks.find((link) => link.label === 'Discord')!;
const subscribeUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
  chapter.calendarIcsUrl.replace(/^https:/, 'webcal:'),
)}`;

export default async function EventsPage() {
  const feed = await getChapterEventFeed();
  const past = feed.past.slice(0, 12);

  return (
    <main id="main-content">
      <PageHero
        title="Events"
        lead="The next good reason to leave the lab."
        summary="Technical workshops, company conversations, project sessions, and socials. OU students are welcome; IEEE membership is not required."
        photo={photos.weatherCenter}
      >
        <a className="button button-light" href="#chapter-calendar">
          <CalendarDays aria-hidden="true" />
          Open the calendar
        </a>
      </PageHero>

      <section className="content-section" aria-labelledby="upcoming-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="upcoming-title">Upcoming</h2>
            <p>
              {feed.upcoming.length > 0
                ? `${feed.upcoming.length} ${feed.upcoming.length === 1 ? 'date' : 'dates'} on the chapter calendar, in Central time.`
                : 'Pulled live from the chapter calendar each time the site is built.'}
            </p>
          </div>

          {feed.upcoming.length > 0 ? (
            <EventList events={feed.upcoming} />
          ) : (
            <div className="empty-panel" data-reveal>
              <CalendarDays aria-hidden="true" />
              <div>
                <h3>
                  {feed.status === 'error'
                    ? 'The calendar is temporarily unavailable.'
                    : 'New dates are being finalized.'}
                </h3>
                <p>
                  {feed.status === 'error'
                    ? 'The rest of the site is working. Try the calendar below or check Discord for the latest.'
                    : 'There are no future dates on the public calendar yet. Join Discord to hear about the next meeting first.'}
                </p>
              </div>
              <a className="button button-crimson" href={discord.href} target="_blank" rel="noreferrer">
                Join the Discord
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="calendar-section" id="chapter-calendar" aria-labelledby="calendar-title">
        <div className="site-container calendar-grid">
          <div className="calendar-copy" data-reveal>
            <h2 className="display-title" id="calendar-title">
              Chapter calendar
            </h2>
            <p>
              The same Google Calendar the officers use. Add it to yours and new
              events show up on your phone automatically.
            </p>
            <div className="calendar-actions">
              <a className="button button-crimson" href={subscribeUrl} target="_blank" rel="noreferrer">
                <CalendarPlus aria-hidden="true" />
                Add to Google Calendar
              </a>
              <a className="button button-outline" href={chapter.calendarIcsUrl} target="_blank" rel="noreferrer">
                <Rss aria-hidden="true" />
                iCal feed for Apple or Outlook
              </a>
            </div>
          </div>
          <div data-reveal>
            <CalendarEmbed src={chapter.calendarUrl} title={chapter.calendarName} />
          </div>
        </div>
      </section>

      {past.length > 0 && (
        <section className="content-section past-section" aria-labelledby="past-title">
          <div className="site-container">
            <div className="section-head" data-reveal>
              <h2 className="display-title" id="past-title">Recently</h2>
              <p>
                The latest {past.length} of {feed.past.length} chapter events
                from the past year, newest first.
              </p>
            </div>
            <EventList events={past} archive />
            <a className="button button-outline archive-more" href={chapter.calendarUrl} target="_blank" rel="noreferrer">
              Browse the full history
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
