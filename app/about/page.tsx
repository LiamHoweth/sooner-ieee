import type { Metadata } from 'next';
import {
  ArrowUpRight,
  Award,
  Globe2,
  Mail,
  MapPin,
  RadioTower,
} from 'lucide-react';

import { PageIntro } from '@/components/page-intro';
import {
  achievements,
  chapter,
  officers,
  socialLinks,
} from '@/lib/chapter-content';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet IEEE Sooners and learn how the student branch connects OU students with engineering projects, people, and opportunities.',
};

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageIntro
        index="03"
        eyebrow="ABOUT IEEE SOONERS"
        title="Global engineering. Local community."
        summary="The University of Oklahoma Student Branch brings IEEE’s professional network into a campus setting through technical work, peer leadership, and direct connections to faculty and industry."
      />

      <section className="about-mission content-section">
        <div className="site-container about-mission-grid">
          <div>
            <p className="eyebrow eyebrow-crimson">WHY WE EXIST</p>
            <h2>To make engineering feel less solitary.</h2>
          </div>
          <div className="about-mission-copy">
            <p className="lead-copy">
              IEEE Sooners gives students a place to work alongside people who
              are learning the same hard things—and to meet professionals who
              can show where those skills lead.
            </p>
            <p>
              The branch welcomes students interested in electrical engineering,
              computer engineering, computing, robotics, research, and adjacent
              technical fields. OU events are open without requiring paid IEEE
              membership.
            </p>
          </div>
        </div>
      </section>

      <section className="identity-band">
        <div className="site-container identity-grid">
          <article>
            <MapPin aria-hidden="true" />
            <p className="eyebrow">HOME</p>
            <h2>Norman, Oklahoma</h2>
            <p>Gallogly College of Engineering at the University of Oklahoma.</p>
          </article>
          <article>
            <RadioTower aria-hidden="true" />
            <p className="eyebrow">BRANCH</p>
            <h2>IEEE Region 5</h2>
            <p>A student branch within the Oklahoma City Section.</p>
          </article>
          <article>
            <Globe2 aria-hidden="true" />
            <p className="eyebrow">NETWORK</p>
            <h2>IEEE</h2>
            <p>A global professional community for engineering and technology.</p>
          </article>
        </div>
      </section>

      <section className="leadership-section content-section">
        <div className="site-container leadership-grid">
          <header>
            <p className="eyebrow eyebrow-crimson">CHAPTER CONTACT</p>
            <h2>A direct line to the people running the branch.</h2>
          </header>
          <div className="contact-ledger">
            <article>
              <span>Main point of contact</span>
              <h3>IEEE Sooners</h3>
              <a href={`mailto:${chapter.email}`}>
                <Mail aria-hidden="true" />
                {chapter.email}
              </a>
            </article>
            <article>
              <span>{chapter.advisor.role}</span>
              <h3>{chapter.advisor.name}</h3>
              <a href={`mailto:${chapter.advisor.email}`}>
                <Mail aria-hidden="true" />
                {chapter.advisor.email}
              </a>
            </article>
          </div>
        </div>

        {officers.length > 0 && (
          <div className="site-container officer-list">
            {officers.map((officer) => (
              <article key={`${officer.role}-${officer.name}`}>
                <p>{officer.role}</p>
                <h3>{officer.name}</h3>
                {officer.email && <a href={`mailto:${officer.email}`}>{officer.email}</a>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="recognition-section content-section">
        <div className="site-container recognition-grid">
          <header>
            <Award aria-hidden="true" />
            <p className="eyebrow">VERIFIED 2026 RESULTS</p>
            <h2>Recognition earned together.</h2>
          </header>
          <div className="recognition-list">
            {achievements.map((achievement) => (
              <article key={achievement.title}>
                <span>{achievement.year}</span>
                <div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.detail}</p>
                </div>
              </article>
            ))}
            <a className="text-link text-link-light" href={achievements[0].source} target="_blank" rel="noreferrer">
              View source
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="social-ledger content-section">
        <div className="site-container">
          <div className="content-section-heading">
            <p className="eyebrow eyebrow-crimson">FIND THE CHAPTER</p>
            <h2>Choose the channel that fits.</h2>
          </div>
          <div className="social-link-list">
            {socialLinks.map((link, index) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                <span>0{index + 1}</span>
                <div>
                  <h3>{link.label}</h3>
                  <p>{link.description}</p>
                </div>
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
