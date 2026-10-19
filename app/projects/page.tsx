import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { RegionResults } from '@/components/region-results';
import { programs, socialLinks } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';
import { sitePath } from '@/lib/site-path';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Projects & Programs',
  description:
    'Build teams, regional competitions, workshops, and professional programs from the OU IEEE Student Branch.',
};

const discord = socialLinks.find((link) => link.label === 'Discord')!;

const tracks = [
  {
    id: 'build',
    title: 'Build & compete',
    lead: 'Make the theory answer back.',
    photo: photos.electronicsBench,
    programs: programs.filter((program) => program.category === 'build'),
  },
  {
    id: 'connect',
    title: 'Learn & connect',
    lead: 'Meet the people already doing the work.',
    photo: photos.campusAerial,
    programs: programs.filter((program) => program.category === 'connect'),
  },
];

export default function ProjectsPage() {
  return (
    <main id="main-content">
      <PageHero
        title="Projects"
        lead="Engineering happens when the notes close."
        summary="The chapter balances hands-on technical work with the relationships that help students decide where their engineering goes next."
        photo={photos.oscilloscope}
      >
        <a className="button button-light" href={discord.href} target="_blank" rel="noreferrer">
          Ask what is active
          <ArrowUpRight aria-hidden="true" />
        </a>
      </PageHero>

      <section className="manifesto" aria-label="How the chapter works">
        <div className="site-container manifesto-grid" data-reveal>
          <blockquote>
            Build something real. Explain it clearly. Learn from the person next
            to you.
          </blockquote>
          <p>
            That cycle connects the chapter’s competition work, technical
            sessions, research introductions, and career programming.
          </p>
        </div>
      </section>

      {tracks.map((track, trackIndex) => (
        <section
          key={track.id}
          className={trackIndex % 2 ? 'track-section track-section-flip' : 'track-section'}
          aria-labelledby={`${track.id}-title`}
        >
          <div className="site-container track-grid">
            <figure className="track-photo" data-reveal>
              <img
                src={track.photo.image.src}
                width={track.photo.image.width}
                height={track.photo.image.height}
                alt={track.photo.alt}
                loading="lazy"
              />
            </figure>
            <div className="track-copy" data-reveal>
              <h2 className="display-title" id={`${track.id}-title`}>
                {track.title}
              </h2>
              <p className="track-lead">{track.lead}</p>
              <ul className="track-list">
                {track.programs.map((program) => (
                  <li key={program.title}>
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                    <small>{program.evidence}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <RegionResults id="results-title" title="Practice, then podiums" linkLabel="Conference recap" compact>
        <p>
          At the 2026 IEEE Region 5 Conference, OU students placed in three
          competitions.
        </p>
      </RegionResults>

      <section className="cta-band" aria-labelledby="projects-cta-title">
        <div className="site-container cta-band-inner cta-band-split" data-reveal>
          <div>
            <h2 className="display-title" id="projects-cta-title">
              No finished idea needed
            </h2>
            <p>
              Start in Discord, ask what is active this semester, and meet the
              students already working on it.
            </p>
          </div>
          <div className="cta-band-actions cta-band-stack">
            <a className="button button-light" href={discord.href} target="_blank" rel="noreferrer">
              Join the Discord
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-outline-light" href={sitePath('/events')}>
              Find the next event
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
