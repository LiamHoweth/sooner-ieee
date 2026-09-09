import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  CircuitBoard,
  Presentation,
  Trophy,
  UsersRound,
  Wrench,
} from 'lucide-react';

import { PageIntro } from '@/components/page-intro';
import { achievements, programs, socialLinks } from '@/lib/chapter-content';

export const metadata: Metadata = {
  title: 'Projects & Programs',
  description:
    'Build teams, regional competitions, workshops, and professional programs from the OU IEEE Student Branch.',
};

const discord = socialLinks.find((link) => link.label === 'Discord')!;

const buildPrograms = programs.filter((program) => program.category === 'build');
const connectPrograms = programs.filter((program) => program.category === 'connect');

export default function ProjectsPage() {
  return (
    <main id="main-content">
      <PageIntro
        index="02"
        eyebrow="PROJECTS & PROGRAMS"
        title="Engineering happens when the notes close."
        summary="The chapter balances hands-on technical work with the professional relationships that help students decide where their engineering can go next."
      />

      <section className="projects-manifesto">
        <div className="site-container projects-manifesto-grid">
          <div className="manifesto-label">
            <Wrench aria-hidden="true" />
            <p className="eyebrow">THE WORK</p>
          </div>
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

      <section className="program-detail-section">
        <div className="site-container program-detail-grid">
          <header>
            <CircuitBoard aria-hidden="true" />
            <p className="eyebrow eyebrow-crimson">BUILD & COMPETE</p>
            <h2>Make the theory answer back.</h2>
          </header>
          <div className="program-detail-list">
            {buildPrograms.map((program, index) => (
              <article key={program.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <small>{program.evidence}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="program-detail-section program-detail-dark">
        <div className="site-container program-detail-grid">
          <header>
            <UsersRound aria-hidden="true" />
            <p className="eyebrow">LEARN & CONNECT</p>
            <h2>Meet people doing the work already.</h2>
          </header>
          <div className="program-detail-list">
            {connectPrograms.map((program, index) => (
              <article key={program.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <small>{program.evidence}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="results-strip">
        <div className="site-container results-grid">
          <div>
            <Trophy aria-hidden="true" />
            <p className="eyebrow">2026 REGION 5</p>
            <h2>Practice turned into podium finishes.</h2>
          </div>
          <ul>
            {achievements.slice(1).map((achievement) => (
              <li key={achievement.title}>
                <Presentation aria-hidden="true" />
                <span>{achievement.title}</span>
              </li>
            ))}
          </ul>
          <a href={achievements[0].source} target="_blank" rel="noreferrer">
            Verified conference recap
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="project-cta section-pad">
        <div className="site-container cta-grid">
          <p className="eyebrow eyebrow-crimson">FIND YOUR PLACE</p>
          <h2>You do not need a finished idea to begin.</h2>
          <p>
            Start in Discord, ask what is active this semester, and meet the
            students already working on it.
          </p>
          <div className="cta-actions">
            <a className="button button-dark" href={discord.href} target="_blank" rel="noreferrer">
              Join Discord
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="text-link" href="/events">
              Find the next event
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
