import { ArrowRight } from 'lucide-react';

import { LogoCoin } from '@/components/logo-coin';
import { sitePath } from '@/lib/site-path';

const destinations = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
];

export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <div className="site-container not-found-grid">
        <div className="not-found-copy">
          <p className="not-found-code">404</p>
          <h1>Blown off course</h1>
          <p>
            That page is not here. It may have moved when the site was rebuilt.
            Flip the coin for luck, then pick a way back.
          </p>
          <nav className="not-found-links" aria-label="Site pages">
            {destinations.map((item) => (
              <a key={item.href} href={sitePath(item.href)}>
                {item.label}
                <ArrowRight aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
        <LogoCoin size="feature" />
      </div>
    </main>
  );
}
