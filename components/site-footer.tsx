import { ArrowUpRight } from 'lucide-react';

import { chapter, socialLinks } from '@/lib/chapter-content';

const footerNav = [
  { href: '/events', label: 'Events' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-rule" />
      <div className="site-container footer-grid">
        <div className="footer-identity">
          <p className="eyebrow">IEEE STUDENT BRANCH · OU</p>
          <p className="footer-statement">
            A place for Sooners to build, compete, and grow together.
          </p>
        </div>

        <div>
          <h2>Explore</h2>
          <nav aria-label="Footer navigation">
            {footerNav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h2>Keep up</h2>
          <nav aria-label="Social links">
            {socialLinks.slice(0, 4).map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h2>Contact</h2>
          <a className="footer-email" href={`mailto:${chapter.email}`}>
            {chapter.email}
          </a>
          <p>
            Faculty advisor: {chapter.advisor.name}
            <br />
            Gallogly College of Engineering
            <br />
            Norman, Oklahoma
          </p>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>© {new Date().getFullYear()} IEEE Sooners</span>
        <span>Student-led at the University of Oklahoma</span>
      </div>
    </footer>
  );
}
