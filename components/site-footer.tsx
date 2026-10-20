import { ArrowUpRight } from 'lucide-react';

import { ChapterLogo } from '@/components/chapter-logo';
import { chapter, socialLinks } from '@/lib/chapter-content';
import { photoList } from '@/lib/photos';
import { sitePath } from '@/lib/site-path';

const footerNav = [
  { href: '/events', label: 'Events' },
  { href: '/projects', label: 'Projects' },
  { href: '/posts', label: 'Posts' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div className="footer-identity">
          <ChapterLogo className="footer-mark" variant="secondary" spin />
          <p className="footer-wordmark">IEEE Sooners</p>
          <p>The IEEE Student Branch at the University of Oklahoma. Est. 2024.</p>
        </div>

        <div className="footer-column">
          <h2>Explore</h2>
          <nav aria-label="Footer navigation">
            {footerNav.map((item) => (
              <a key={item.href} href={sitePath(item.href)}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer-column">
          <h2>Keep up</h2>
          <nav aria-label="Social links">
            {socialLinks.slice(0, 5).map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>

        <div className="footer-column">
          <h2>Contact</h2>
          <a className="footer-email" href={`mailto:${chapter.email}`}>
            {chapter.email}
          </a>
          <p>
            {chapter.advisor.role}: {chapter.advisor.name}
            <br />
            Gallogly College of Engineering
            <br />
            Norman, Oklahoma
          </p>
        </div>
      </div>

      <div className="site-container footer-credits">
        <p>
          Photographs:{' '}
          {photoList.map((photo, index) => (
            <span key={photo.credit.page}>
              <a href={photo.credit.page} target="_blank" rel="noreferrer">
                {photo.credit.title}
              </a>{' '}
              by {photo.credit.creator},{' '}
              <a href={photo.credit.licenseUrl} target="_blank" rel="noreferrer">
                {photo.credit.license}
              </a>
              {index < photoList.length - 1 ? '; ' : '. '}
            </span>
          ))}
          Via Wikimedia Commons. Logos © IEEE Sooners, used with approval.
        </p>
      </div>

      <div className="footer-bottom">
        <div className="site-container footer-bottom-inner">
          <span>© {new Date().getFullYear()} IEEE Sooners</span>
          <span>Student-led at the University of Oklahoma</span>
        </div>
      </div>
    </footer>
  );
}
