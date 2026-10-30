import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

import { NewsRedirect } from '@/components/news-redirect';
import { sitePath } from '@/lib/site-path';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'News has moved',
  description: 'Posts from the IEEE Sooners officers now live on the News page.',
  robots: { index: false },
};

// Old /posts links land here; the page moved to /news. Not linked from the header or footer.
export default function PostsPage() {
  const news = sitePath('/news');

  return (
    <main id="main-content" className="not-found">
      <NewsRedirect href={news} />
      <div className="site-container">
        <div className="not-found-copy">
          <h1>News has moved</h1>
          <p>Posts from the officers now live on the News page.</p>
          <nav className="not-found-links" aria-label="New location">
            <a href={news}>
              Go to News
              <ArrowRight aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </main>
  );
}
