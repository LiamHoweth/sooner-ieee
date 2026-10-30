import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, Mail } from 'lucide-react';

import { ContactForm } from '@/components/contact-form';
import { PageHero } from '@/components/page-hero';
import { chapter, officers, socialLinks } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';
import { sitePath } from '@/lib/site-path';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Reach IEEE Sooners: send the student officers a message, email the chapter, or find the chapter on Discord, Instagram and LinkedIn.',
};

// Officer contacts appear only once lib/chapter-content.ts lists real people.
const officerContacts = officers.filter((officer) => officer.email);

export default function ContactPage() {
  return (
    <main id="main-content">
      <PageHero
        title="Contact"
        lead="Questions, ideas and partnerships start here."
        summary="Send the student officers a message, email the chapter, or keep up on the channels members already use."
        photo={photos.lightningNorman}
      >
        <a className="button button-light" href={`mailto:${chapter.email}`}>
          <Mail aria-hidden="true" />
          {chapter.email}
        </a>
      </PageHero>

      <section className="content-section apply-section" id="message" aria-labelledby="message-title">
        <div className="site-container apply-layout">
          <div className="apply-intro" data-reveal>
            <h2 className="display-title" id="message-title">
              Send a message
            </h2>
            <p className="lead-copy">Membership, events, press or anything else. Pick a topic and write a few lines.</p>
            <p>
              Messages go to the student officers. Representing a company? Use the{' '}
              <a href={sitePath('/sponsors#apply')}>sponsor application</a>.
            </p>
          </div>
          <div data-reveal>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="content-section" id="email" aria-labelledby="email-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="email-title">
              Email
            </h2>
            <p>Prefer your own inbox? Write to the chapter.</p>
          </div>
          <div className="people-grid" data-reveal>
            <article className="person-card person-card-crimson">
              <p className="person-role">Student officers</p>
              <h3>Chapter email</h3>
              <a href={`mailto:${chapter.email}`}>
                <Mail aria-hidden="true" />
                {chapter.email}
              </a>
            </article>
            {officerContacts.map((officer) => (
              <article className="person-card" key={`${officer.role}-${officer.name}`}>
                {officer.image && <img src={officer.image} alt="" loading="lazy" />}
                <p className="person-role">{officer.role}</p>
                <h3>{officer.name}</h3>
                <a href={`mailto:${officer.email}`}>
                  <Mail aria-hidden="true" />
                  {officer.email}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section channels-section contact-channels" id="channels" aria-labelledby="channels-title">
        <div className="site-container">
          <div className="section-head" data-reveal>
            <h2 className="display-title" id="channels-title">
              Find the chapter
            </h2>
            <p>Pick the channel that fits how you like to keep up.</p>
            <a className="button button-outline" href={sitePath('/news')}>
              Chapter news
              <ArrowRight aria-hidden="true" />
            </a>
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
