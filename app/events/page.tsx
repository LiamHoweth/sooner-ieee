import type { Metadata } from 'next';
import { ArrowUpRight, CalendarDays, MessageCircle } from 'lucide-react';

import { EventList } from '@/components/event-list';
import { PageIntro } from '@/components/page-intro';
import { getChapterEventFeed } from '@/lib/calendar';
import { chapter, socialLinks } from '@/lib/chapter-content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Upcoming workshops, speakers, project sessions, and professional events from IEEE Sooners.',
};

const discord = socialLinks.find((link) => link.label === 'Discord')!;

export default async function EventsPage() {
  const feed = await getChapterEventFeed();

  return (
    <main id="main-content">
      <PageIntro
        index="01"
        eyebrow="OU IEEE EVENTS"
        title="The next good reason to leave the lab."
        summary="Technical workshops, company conversations, project sessions, and the occasional event that is simply worth showing up for. OU students are welcome; IEEE membership is not required."
      />

      <section className="content-section event-section">
        <div className="site-container">
          <div className="content-section-heading">
            <p className="eyebrow eyebrow-crimson">UPCOMING</p>
            <h2>On the calendar</h2>
            <a className="text-link" href={chapter.calendarUrl} target="_blank" rel="noreferrer">
              Open full calendar
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>

          {feed.upcoming.length > 0 ? (
            <EventList events={feed.upcoming} />
          ) : (
            <div className="event-status-panel">
              <CalendarDays aria-hidden="true" />
              <div>
                <h3>
                  {feed.status === 'error'
                    ? 'The calendar is temporarily unavailable.'
                    : 'Fall events are being finalized.'}
                </h3>
                <p>
                  {feed.status === 'error'
                    ? 'The rest of the site is working. Try the public calendar directly or check Discord for the latest update.'
                    : 'There are no future dates on the public calendar yet. Join Discord to hear about the first meeting as soon as it is announced.'}
                </p>
              </div>
              <a className="button button-dark" href={discord.href} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden="true" />
                Join Discord
              </a>
            </div>
          )}
        </div>
      </section>

      {feed.past.length > 0 && (
        <section className="content-section past-events-section">
          <div className="site-container">
            <div className="content-section-heading">
              <p className="eyebrow">PAST 12 MONTHS</p>
              <h2>Recent chapter activity</h2>
              <p>
                A factual record from the same public calendar, kept here so new
                members can see the range of chapter programming.
              </p>
            </div>
            <EventList events={feed.past} />
          </div>
        </section>
      )}
    </main>
  );
}
