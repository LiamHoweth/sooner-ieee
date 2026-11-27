import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, Mail } from 'lucide-react';

import { OfficerStrip } from '@/components/officer-strip';
import { PageHero } from '@/components/page-hero';
import { achievements, chapter, officers } from '@/lib/chapter-content';
import { chapterPhotos } from '@/lib/photos';
import { sitePath } from '@/lib/site-path';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet IEEE Sooners: the IEEE Student Branch at the University of Oklahoma, its leadership, recognition, and how to reach the chapter.',
};

const facts = [
  { value: 'Norman, Oklahoma', detail: 'Home at the Gallogly College of Engineering, University of Oklahoma.' },
  { value: 'IEEE Region 5', detail: 'A student branch within the IEEE Oklahoma City Section.' },
  { value: 'IEEE worldwide', detail: 'Part of the largest technical professional organization for engineering and technology.' },
];

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageHero
        title="About"
        lead="Global engineering. Local community."
        summary="The University of Oklahoma Student Branch brings IEEE’s professional network to campus through technical work, peer leadership, and direct connections to faculty and industry."
        photo={chapterPhotos.officers}
      >
        <a className="button button-light" href={`mailto:${chapter.email}`}>
          <Mail aria-hidden="true" />
          {chapter.email}
        </a>
      </PageHero>

      <section className="content-section" id="mission" aria-labelledby="mission-title">
        <div className="site-container mission-grid">
          <div className="mission-copy" data-reveal>
            <h2 className="display-title" id="mission-title">
              Why we exist
            </h2>
            <p className="lead-copy">
              To make engineering feel less solitary. IEEE Sooners gives
              students a place to work alongside people learning the same hard
              things, and to meet professionals who show where those skills lead.
            </p>
            <p>
              The branch welcomes students in electrical and computer
              engineering, computer science, robotics, research, and every
              adjacent technical field. Chapter events are open to all OU
              students without paid IEEE membership.
            </p>
          </div>
          <figure className="mission-photo" data-reveal>
            <img
              src={chapterPhotos.ouFlagTeam.image.src}
              width={chapterPhotos.ouFlagTeam.image.width}
              height={chapterPhotos.ouFlagTeam.image.height}
              alt={chapterPhotos.ouFlagTeam.alt}
              style={{ objectPosition: chapterPhotos.ouFlagTeam.position }}
              loading="lazy"
            />
          </figure>
        </div>
        <div className="site-container fact-grid" data-reveal>
          {facts.map((fact) => (
            <article key={fact.value}>
              <h3>{fact.value}</h3>
              <p>{fact.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section leadership-section" id="leadership" aria-labelledby="leadership-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="leadership-title">
              Leadership
            </h2>
            <p>A direct line to the people running the branch.</p>
          </div>
        </div>
        {officers.length > 0 ? (
          <OfficerStrip officers={officers} contactEmail={chapter.email} />
        ) : (
          <div className="site-container">
            <div className="people-grid" data-reveal>
              <article className="person-card person-card-crimson">
                <p className="person-role">Student officers</p>
                <h3>Chapter leadership</h3>
                <a href={`mailto:${chapter.email}`}>
                  <Mail aria-hidden="true" />
                  {chapter.email}
                </a>
              </article>
            </div>
          </div>
        )}
      </section>

      <section className="recognition-section" id="recognition" aria-labelledby="recognition-title">
        <div className="site-container recognition-grid">
          <div data-reveal>
            <h2 className="display-title" id="recognition-title">
              Recognition
            </h2>
            <p>Earned together at the 2026 IEEE Region 5 Conference.</p>
            <a className="button button-outline" href={achievements[0].source} target="_blank" rel="noreferrer">
              View source
              <ArrowUpRight aria-hidden="true" />
            </a>
            <figure className="recognition-photo">
              <img
                src={chapterPhotos.region5Team.image.src}
                width={chapterPhotos.region5Team.image.width}
                height={chapterPhotos.region5Team.image.height}
                alt={chapterPhotos.region5Team.alt}
                style={{ objectPosition: chapterPhotos.region5Team.position }}
                loading="lazy"
              />
              <figcaption>The OU team at the Region 5 Conference, March 2026.</figcaption>
            </figure>
          </div>
          <ol className="recognition-list" data-reveal>
            {achievements.map((achievement) => (
              <li key={achievement.title}>
                <h3>{achievement.title}</h3>
                <p>{achievement.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="content-section about-contact" id="contact" aria-labelledby="about-contact-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="about-contact-title">
              Find the chapter
            </h2>
            <p>The message form, chapter email and every channel, from Discord to OU Engage, are on the Contact page.</p>
            <a className="button button-outline" href={sitePath('/contact')}>
              Contact the chapter
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
