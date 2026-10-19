import type { Metadata } from 'next';
import { ArrowUpRight, Mail } from 'lucide-react';

import { alternateMarks } from '@/components/chapter-logo';
import { LogoCoin } from '@/components/logo-coin';
import { PageHero } from '@/components/page-hero';
import { achievements, chapter, officers, socialLinks } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet IEEE Sooners: the IEEE Student Branch at the University of Oklahoma, its leadership, official logos, and how to reach the chapter.',
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
        photo={photos.bizzellLibrary}
      >
        <a className="button button-light" href={`mailto:${chapter.email}`}>
          <Mail aria-hidden="true" />
          {chapter.email}
        </a>
      </PageHero>

      <section className="content-section" aria-labelledby="mission-title">
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
              src={photos.campusAerial.image.src}
              width={photos.campusAerial.image.width}
              height={photos.campusAerial.image.height}
              alt={photos.campusAerial.alt}
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

      <section className="marks-section" aria-labelledby="marks-title">
        <div className="site-container marks-grid">
          <LogoCoin size="feature" className="marks-coin" />
          <div className="marks-copy" data-reveal>
            <h2 className="display-title" id="marks-title">
              Our official marks
            </h2>
            <p>
              The IEEE Sooners name and logos were approved for the branch this
              fall. The tornado is Norman’s weather; the arrow is the current
              rising through it. Blue is the primary mark, crimson the
              secondary.
            </p>
            <p className="marks-hint">Flip the coin to see both sides.</p>
            <ul className="alternate-marks" aria-label="Alternate logo colorways">
              {alternateMarks.map((mark) => (
                <li key={mark.label}>
                  <img src={mark.image.src} width={128} height={128} alt="" loading="lazy" />
                  <span>{mark.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="content-section leadership-section" aria-labelledby="leadership-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="leadership-title">
              Leadership
            </h2>
            <p>A direct line to the people running the branch.</p>
          </div>
          <div className="people-grid" data-reveal>
            {officers.map((officer) => (
              <article className="person-card" key={`${officer.role}-${officer.name}`}>
                {officer.image && <img src={officer.image} alt="" loading="lazy" />}
                <p className="person-role">{officer.role}</p>
                <h3>{officer.name}</h3>
                {officer.email && (
                  <a href={`mailto:${officer.email}`}>
                    <Mail aria-hidden="true" />
                    {officer.email}
                  </a>
                )}
              </article>
            ))}
            <article className="person-card">
              <p className="person-role">{chapter.advisor.role}</p>
              <h3>{chapter.advisor.name}</h3>
              <a href={`mailto:${chapter.advisor.email}`}>
                <Mail aria-hidden="true" />
                {chapter.advisor.email}
              </a>
            </article>
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
      </section>

      <section className="recognition-section" aria-labelledby="recognition-title">
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

      <section className="content-section channels-section" aria-labelledby="channels-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="channels-title">
              Find the chapter
            </h2>
            <p>Pick the channel that fits how you like to keep up.</p>
          </div>
          <div className="channel-grid" data-reveal>
            {socialLinks.map((link) => (
              <a key={link.label} className="channel-card" href={link.href} target="_blank" rel="noreferrer">
                <h3>{link.label}</h3>
                <p>{link.description}</p>
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
