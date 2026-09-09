import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircuitBoard,
  UsersRound,
} from 'lucide-react';

import { EventList } from '@/components/event-list';
import { getChapterEventFeed } from '@/lib/calendar';
import {
  achievements,
  chapter,
  programs,
  socialLinks,
} from '@/lib/chapter-content';

const discord = socialLinks.find((link) => link.label === 'Discord')!;
const newsletter = socialLinks.find((link) => link.label === 'Newsletter')!;

export default async function Home() {
  const eventFeed = await getChapterEventFeed();
  const upcoming = eventFeed.upcoming.slice(0, 3);
  const buildPrograms = programs.filter((program) => program.category === 'build');
  const connectPrograms = programs.filter(
    (program) => program.category === 'connect',
  );

  return (
    <main id="main-content">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-linework" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-copy-inner">
            <p className="eyebrow">IEEE STUDENT BRANCH · UNIVERSITY OF OKLAHOMA</p>
            <h1>
              <span>BUILD.</span>
              <span className="outline-word">COMPETE.</span>
              <span className="serif-word">CONNECT.</span>
            </h1>
            <p className="hero-summary">
              OU’s student community for hands-on engineering, regional
              competition, and the professional connections that carry beyond
              campus.
            </p>
            <div className="hero-actions">
              <a className="button button-light" href={discord.href} target="_blank" rel="noreferrer">
                Join the Discord
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a className="text-link text-link-light" href="/events">
                View all events
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <aside className="hero-event-panel" aria-labelledby="next-event-title">
          <div>
            <p className="eyebrow" id="next-event-title">
              NEXT ON THE CALENDAR
            </p>
            {upcoming.length > 0 ? (
              <>
                <p className="hero-event-date">
                  {new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/Chicago',
                    month: 'short',
                    day: 'numeric',
                  }).format(new Date(upcoming[0].start))}
                </p>
                <h2>{upcoming[0].title}</h2>
                {upcoming[0].location && <p>{upcoming[0].location}</p>}
              </>
            ) : (
              <>
                <CalendarDays aria-hidden="true" className="hero-panel-icon" />
                <h2>Fall events are being finalized.</h2>
                <p>
                  Join Discord for the quickest updates, or subscribe to the
                  chapter calendar.
                </p>
              </>
            )}
          </div>
          <a href={chapter.calendarUrl} target="_blank" rel="noreferrer">
            Open OU IEEE Events
            <ArrowUpRight aria-hidden="true" />
          </a>
        </aside>
      </section>

      <section className="home-events section-pad">
        <div className="site-container">
          <div className="section-heading-grid">
            <span className="section-index">01</span>
            <div>
              <p className="eyebrow eyebrow-crimson">WHAT’S NEXT</p>
              <h2>Show up. Meet people. Make something.</h2>
            </div>
            <p>
              Workshops, speakers, project sessions, and career connections—open
              to OU students without requiring IEEE membership.
            </p>
          </div>

          {upcoming.length > 0 ? (
            <EventList events={upcoming} compact />
          ) : (
            <div className="calendar-empty">
              <div>
                <CalendarDays aria-hidden="true" />
                <p className="eyebrow">CALENDAR UPDATE</p>
              </div>
              <h3>New semester dates are on the way.</h3>
              <p>
                The public calendar has no upcoming dates yet. Discord is the
                best place to hear about the first meeting and fall opportunities.
              </p>
              <a className="text-link" href={discord.href} target="_blank" rel="noreferrer">
                Join the Discord
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="programs-section">
        <div className="site-container programs-grid">
          <div className="program-column program-build">
            <div className="program-heading">
              <CircuitBoard aria-hidden="true" />
              <div>
                <p className="eyebrow">BUILD & COMPETE</p>
                <h2>Turn coursework into working systems.</h2>
              </div>
            </div>
            <ol>
              {buildPrograms.map((program, index) => (
                <li key={program.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="program-column program-connect">
            <div className="program-heading">
              <UsersRound aria-hidden="true" />
              <div>
                <p className="eyebrow">LEARN & CONNECT</p>
                <h2>Find the people behind the opportunities.</h2>
              </div>
            </div>
            <ol>
              {connectPrograms.map((program, index) => (
                <li key={program.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="site-container program-link-row">
          <a className="text-link" href="/projects">
            Explore programs and projects
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="achievement-section section-pad">
        <div className="site-container achievement-grid">
          <div className="achievement-number" aria-hidden="true">
            <span>R5</span>
            <strong>26</strong>
          </div>
          <div className="achievement-copy">
            <p className="eyebrow">IEEE REGION 5 · 2026</p>
            <h2>A branch built to represent Oklahoma.</h2>
            <p>
              OU students returned from the 2026 Region 5 Conference with
              branch recognition and podium finishes across three competitions.
            </p>
            <ul>
              {achievements.map((achievement) => (
                <li key={achievement.title}>{achievement.title}</li>
              ))}
            </ul>
            <a
              className="text-link text-link-light"
              href={achievements[0].source}
              target="_blank"
              rel="noreferrer"
            >
              Read the conference recap
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="home-cta section-pad">
        <div className="site-container cta-grid">
          <p className="eyebrow eyebrow-crimson">YOUR NEXT MOVE</p>
          <h2>Start with one conversation.</h2>
          <p>
            Join the chapter Discord for meeting details and team updates, or
            get the biweekly newsletter if you prefer the highlights.
          </p>
          <div className="cta-actions">
            <a className="button button-dark" href={discord.href} target="_blank" rel="noreferrer">
              Join Discord
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="text-link" href={newsletter.href} target="_blank" rel="noreferrer">
              Get the newsletter
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
