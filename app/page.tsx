import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';

import { EventList } from '@/components/event-list';
import { LogoCoin } from '@/components/logo-coin';
import { LatestPosts } from '@/components/post-feed';
import { RegionResults } from '@/components/region-results';
import { getChapterEventFeed } from '@/lib/calendar';
import { achievements, chapter, programs, socialLinks } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';
import { sitePath } from '@/lib/site-path';

const discord = socialLinks.find((link) => link.label === 'Discord')!;
const joinLinks = ['Discord', 'Newsletter', 'OU Engage', 'IEEE Membership'].map(
  (label) => socialLinks.find((link) => link.label === label)!,
);
const joinActions: Record<string, string> = {
  Discord: 'Join the server',
  Newsletter: 'Subscribe',
  'OU Engage': 'Join on Engage',
  'IEEE Membership': 'Explore IEEE',
};

function nextEventLabel(start: string, allDay: boolean) {
  const date = new Date(start);
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
  if (allDay) return day;
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return `${day} · ${time}`;
}

export default async function Home() {
  const eventFeed = await getChapterEventFeed();
  const upcoming = eventFeed.upcoming.slice(0, 3);
  const next = upcoming[0];
  const buildPrograms = programs.filter((program) => program.category === 'build');
  const connectPrograms = programs.filter((program) => program.category === 'connect');

  return (
    <main id="main-content">
      <section className="home-hero">
        <img
          className="home-hero-photo"
          src={photos.stormRadar.image.src}
          width={photos.stormRadar.image.width}
          height={photos.stormRadar.image.height}
          alt=""
          fetchPriority="high"
        />
        <div className="site-container home-hero-grid">
          <div className="home-hero-copy">
            <h1>
              <span>Build. Compete.</span>
              <span>Connect.</span>
            </h1>
            <p className="home-hero-summary">
              The IEEE student branch at the University of Oklahoma. Hands-on
              projects, Region 5 competitions, and engineers worth meeting, open
              to every OU student.
            </p>
            <div className="hero-actions">
              <a className="button button-crimson" href={discord.href} target="_blank" rel="noreferrer">
                Join the Discord
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a className="button button-outline-light" href={sitePath('/events')}>
                See upcoming events
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
          <LogoCoin className="home-hero-coin" />
        </div>

        <div className="next-up">
          <div className="site-container next-up-inner">
            <p className="next-up-label">Next up</p>
            {next ? (
              <>
                <p className="next-up-title">{next.title}</p>
                <p className="next-up-meta">
                  <span>
                    <CalendarDays aria-hidden="true" />
                    {nextEventLabel(next.start, next.allDay)}
                  </span>
                  {next.location && (
                    <span>
                      <MapPin aria-hidden="true" />
                      {next.location}
                    </span>
                  )}
                </p>
                <a className="next-up-link" href={sitePath('/events')}>
                  All events
                  <ArrowRight aria-hidden="true" />
                </a>
              </>
            ) : (
              <>
                <p className="next-up-title">New dates are on the way.</p>
                <a className="next-up-link" href={discord.href} target="_blank" rel="noreferrer">
                  Hear first on Discord
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="home-events section-pad" aria-labelledby="home-events-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="home-events-title">Events</h2>
            <p>
              Workshops, speakers, project nights, and company visits. Open to
              every OU student.
            </p>
            <a className="button button-outline" href={sitePath('/events')}>
              Full calendar
              <ArrowRight aria-hidden="true" />
            </a>
          </div>

          {upcoming.length > 0 ? (
            <EventList events={upcoming} compact />
          ) : (
            <div className="empty-panel" data-reveal>
              <CalendarDays aria-hidden="true" />
              <div>
                <h3>New semester dates are on the way.</h3>
                <p>
                  The public calendar has no upcoming dates yet. Discord is the
                  fastest way to hear about the first meeting.
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

      <LatestPosts />

      <section className="tile-section" aria-labelledby="home-programs-title">
        <div className="site-container">
          <h2 className="tile-section-title" id="home-programs-title" data-reveal>
            What we do
          </h2>
          <div className="tile-grid" data-reveal>
            <article className="tile">
              <h3 className="tile-word">Build</h3>
              <p className="tile-lead">Turn coursework into working systems.</p>
              <ul className="tile-list">
                {buildPrograms.map((program) => (
                  <li key={program.title}>{program.title}</li>
                ))}
              </ul>
              <a className="tile-button" href={sitePath('/projects')}>
                See projects
              </a>
            </article>
            <figure className="tile tile-photo">
              <img
                src={photos.electronicsBench.image.src}
                width={photos.electronicsBench.image.width}
                height={photos.electronicsBench.image.height}
                alt={photos.electronicsBench.alt}
                loading="lazy"
              />
            </figure>
            <figure className="tile tile-photo">
              <img
                src={photos.oscilloscope.image.src}
                width={photos.oscilloscope.image.width}
                height={photos.oscilloscope.image.height}
                alt={photos.oscilloscope.alt}
                loading="lazy"
              />
            </figure>
            <article className="tile">
              <h3 className="tile-word">Connect</h3>
              <p className="tile-lead">Meet the people behind the opportunities.</p>
              <ul className="tile-list">
                {connectPrograms.map((program) => (
                  <li key={program.title}>{program.title}</li>
                ))}
              </ul>
              <a className="tile-button" href={sitePath('/about')}>
                Meet the chapter
              </a>
            </article>
          </div>
        </div>
      </section>

      <RegionResults id="home-results-title" title="Region 5, 2026">
        <p>
          OU came home from the IEEE Region 5 Conference as the{' '}
          <strong>{achievements[0].title}</strong>, with podium finishes in
          three competitions.
        </p>
      </RegionResults>

      <section className="join-section" aria-labelledby="home-join-title">
        <img
          className="join-section-photo"
          src={photos.bizzellLibrary.image.src}
          width={photos.bizzellLibrary.image.width}
          height={photos.bizzellLibrary.image.height}
          alt=""
          loading="lazy"
        />
        <div className="site-container">
          <h2 className="display-title" id="home-join-title" data-reveal>
            Take the next step
          </h2>
          <div className="join-grid" data-reveal>
            {joinLinks.map((link) => (
              <a key={link.label} className="join-card" href={link.href} target="_blank" rel="noreferrer">
                <h3>{link.label}</h3>
                <p>{link.description}</p>
                <span className="join-card-action">
                  {joinActions[link.label]}
                  <ArrowUpRight aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
          <p className="join-note" data-reveal>
            Questions first? Email{' '}
            <a href={`mailto:${chapter.email}`}>{chapter.email}</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
