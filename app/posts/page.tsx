import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { PostFeed } from '@/components/post-feed';
import { socialLinks } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Recaps, opportunities, project updates and announcements from the IEEE Sooners officers.',
};

const instagram = socialLinks.find((link) => link.label === 'Instagram')!;

export default function PostsPage() {
  return (
    <main id="main-content">
      <PageHero
        title="Posts"
        lead="News from the branch, written by the people running it."
        summary="Event recaps, internship and research opportunities, project updates and chapter announcements."
        photo={photos.stormRadar}
      >
        <a className="button button-light" href={instagram.href} target="_blank" rel="noreferrer">
          Follow on Instagram
          <ArrowUpRight aria-hidden="true" />
        </a>
      </PageHero>
      <section className="content-section" aria-label="All posts">
        <div className="site-container">
          <PostFeed />
        </div>
      </section>
    </main>
  );
}
