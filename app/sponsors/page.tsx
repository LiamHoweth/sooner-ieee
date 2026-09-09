import type { Metadata } from 'next';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Handshake,
  Mail,
  Route,
  Wrench,
} from 'lucide-react';

import { PageIntro } from '@/components/page-intro';
import { chapter, sponsors } from '@/lib/chapter-content';

export const metadata: Metadata = {
  title: 'Sponsors',
  description:
    'Partner with IEEE Sooners to support OU engineering students through projects, events, and professional connections.',
};

const partnershipPaths = [
  {
    icon: BriefcaseBusiness,
    number: '01',
    title: 'Share technical perspective',
    description:
      'Bring engineers and technical leaders into a focused campus conversation about real work and career paths.',
  },
  {
    icon: Wrench,
    number: '02',
    title: 'Support hands-on work',
    description:
      'Help students access project materials, technical workshops, and the resources required to compete well.',
  },
  {
    icon: Route,
    number: '03',
    title: 'Extend student opportunity',
    description:
      'Strengthen the chapter’s ability to travel, meet the wider IEEE community, and represent OU beyond Norman.',
  },
];

export default function SponsorsPage() {
  return (
    <main id="main-content">
      <PageIntro
        index="04"
        eyebrow="PARTNER WITH IEEE SOONERS"
        title="Support the students already leaning in."
        summary="Connect with motivated OU engineering students through thoughtful technical programming, hands-on work, and opportunities with a clear purpose."
      />

      <section className="partner-intro">
        <div className="site-container partner-intro-grid">
          <Handshake aria-hidden="true" />
          <blockquote>
            The best partnership starts with something useful for students.
          </blockquote>
          <p>
            IEEE Sooners is looking to work with companies, recruiters,
            engineering professionals, researchers, and technical organizations
            during the academic year.
          </p>
        </div>
      </section>

      <section className="partnership-paths content-section">
        <div className="site-container">
          <div className="content-section-heading">
            <p className="eyebrow eyebrow-crimson">WAYS TO PARTNER</p>
            <h2>Start with a concrete contribution.</h2>
          </div>
          <div className="partnership-list">
            {partnershipPaths.map((path) => {
              const Icon = path.icon;
              return (
                <article key={path.number}>
                  <span>{path.number}</span>
                  <Icon aria-hidden="true" />
                  <h3>{path.title}</h3>
                  <p>{path.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="current-sponsors content-section">
          <div className="site-container">
            <div className="content-section-heading">
              <p className="eyebrow eyebrow-crimson">CURRENT PARTNERS</p>
              <h2>Organizations backing OU students.</h2>
            </div>
            <div className="sponsor-list">
              {sponsors.map((sponsor) => (
                <a key={sponsor.name} href={sponsor.href} target="_blank" rel="noreferrer">
                  {sponsor.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sponsor-contact section-pad">
        <div className="site-container sponsor-contact-grid">
          <div>
            <p className="eyebrow">CURRENT SPONSORSHIP INFORMATION</p>
            <h2>See the full partnership packet.</h2>
            <p>
              Review the chapter’s published sponsorship information, then email
              the student leadership team to discuss an event or contribution.
            </p>
          </div>
          <div className="sponsor-actions">
            <a className="button button-light" href={chapter.sponsorshipPacket} target="_blank" rel="noreferrer">
              Open sponsorship packet
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="sponsor-email" href={`mailto:${chapter.email}`}>
              <Mail aria-hidden="true" />
              <span>
                Contact the chapter
                <strong>{chapter.email}</strong>
              </span>
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
