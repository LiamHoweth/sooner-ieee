import type { Metadata } from 'next';
import { ArrowUpRight, Mail } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { SponsorApplicationForm } from '@/components/sponsor-application-form';
import { achievements, chapter, sponsors } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Sponsors',
  description:
    'Partner with IEEE Sooners to support OU engineering students through projects, events, and professional connections.',
};

const partnershipPaths = [
  {
    word: 'Speak',
    title: 'Share technical perspective',
    description:
      'Bring engineers and technical leaders into a focused campus conversation about real work and career paths.',
  },
  {
    word: 'Build',
    title: 'Support hands-on work',
    description:
      'Help students access project materials, technical workshops, and the resources required to compete well.',
  },
  {
    word: 'Travel',
    title: 'Extend student opportunity',
    description:
      'Strengthen the chapter’s ability to travel, meet the wider IEEE community, and represent OU beyond Norman.',
  },
];

export default function SponsorsPage() {
  return (
    <main id="main-content">
      <PageHero
        title="Sponsors"
        lead="Support the students already leaning in."
        summary="Reach motivated OU engineering students through technical programming, hands-on work, and opportunities with a clear purpose."
        photo={photos.campusAerial}
      >
        <a className="button button-light" href="#apply">
          Apply to sponsor
        </a>
        <a className="button button-outline-light" href={chapter.sponsorshipPacket} target="_blank" rel="noreferrer">
          Sponsorship packet
          <ArrowUpRight aria-hidden="true" />
        </a>
      </PageHero>

      <section className="content-section" aria-labelledby="why-title">
        <div className="site-container why-grid">
          <div data-reveal>
            <h2 className="display-title" id="why-title">
              Why OU IEEE
            </h2>
            <p className="lead-copy">
              The best partnership starts with something useful for students.
            </p>
            <p>
              IEEE Sooners works with companies, recruiters, engineering
              professionals, researchers, and technical organizations throughout
              the academic year.
            </p>
          </div>
          <dl className="proof-list" data-reveal>
            <div>
              <dt>Region 5 honor</dt>
              <dd>{achievements[0].title}, 2026</dd>
            </div>
            <div>
              <dt>Branch size</dt>
              <dd>More than 50 members</dd>
            </div>
            <div>
              <dt>Home</dt>
              <dd>Gallogly College of Engineering, Norman</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="tile-section" aria-labelledby="paths-title">
        <div className="site-container">
          <h2 className="tile-section-title" id="paths-title" data-reveal>
            Ways to partner
          </h2>
          <div className="tile-grid" data-reveal>
            {partnershipPaths.map((path) => (
              <article className="tile tile-padded" key={path.word}>
                <h3 className="tile-word">{path.word}</h3>
                <p className="tile-lead">{path.title}</p>
                <p className="tile-body">{path.description}</p>
              </article>
            ))}
            <figure className="tile tile-photo">
              <img
                src={photos.weatherCenter.image.src}
                width={photos.weatherCenter.image.width}
                height={photos.weatherCenter.image.height}
                alt={photos.weatherCenter.alt}
                loading="lazy"
              />
            </figure>
          </div>
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="content-section" aria-labelledby="partners-title">
          <div className="site-container">
            <div className="section-head" data-reveal>
              <h2 className="display-title" id="partners-title">
                Current partners
              </h2>
              <p>Organizations backing OU students this year.</p>
            </div>
            <ul className="sponsor-grid" data-reveal>
              {sponsors.map((sponsor) => (
                <li key={sponsor.name}>
                  <a href={sponsor.href} target="_blank" rel="noreferrer">
                    {sponsor.logo ? <img src={sponsor.logo} alt={sponsor.name} loading="lazy" /> : sponsor.name}
                  </a>
                  {sponsor.tier && <span>{sponsor.tier}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="content-section apply-section" id="apply" aria-labelledby="apply-title">
        <div className="site-container apply-layout">
          <div className="apply-intro" data-reveal>
            <h2 className="display-title" id="apply-title">
              Apply to sponsor
            </h2>
            <p className="lead-copy">Tell us what you have in mind. It takes about two minutes.</p>
            <p>
              Applications go straight to the student officers, who reply by email. Prefer to talk first? Email{' '}
              <a href={`mailto:${chapter.email}`}>{chapter.email}</a>.
            </p>
          </div>
          <div data-reveal>
            <SponsorApplicationForm />
          </div>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="contact-title">
        <div className="site-container cta-band-inner cta-band-split" data-reveal>
          <div>
            <h2 className="display-title" id="contact-title">
              Start the conversation
            </h2>
            <p>
              Review the published sponsorship packet, then email the student
              leadership team about an event or contribution.
            </p>
          </div>
          <div className="cta-band-actions cta-band-stack">
            <a className="button button-light" href={chapter.sponsorshipPacket} target="_blank" rel="noreferrer">
              Open the sponsorship packet
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-outline-light" href={`mailto:${chapter.email}`}>
              <Mail aria-hidden="true" />
              {chapter.email}
            </a>
            <a className="text-link text-link-light" href={chapter.donationGuide} target="_blank" rel="noreferrer">
              OU giving instructions
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
