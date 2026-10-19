import { ChapterLogo } from '@/components/chapter-logo';
import type { Photo } from '@/lib/photos';

/** OU-style crimson page masthead shared by every inner page. */
export function PageHero({
  title,
  lead,
  summary,
  photo,
  children,
}: {
  title: string;
  lead: string;
  summary: string;
  photo: Photo;
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="site-container page-hero-grid">
        <div className="page-hero-copy" data-reveal>
          <h1>{title}</h1>
          <p className="page-hero-lead">{lead}</p>
          <p className="page-hero-summary">{summary}</p>
          {children && <div className="page-hero-actions">{children}</div>}
        </div>
        <figure className="page-hero-figure" data-reveal>
          <img
            className="page-hero-photo"
            src={photo.image.src}
            width={photo.image.width}
            height={photo.image.height}
            alt={photo.alt}
            fetchPriority="high"
          />
          <ChapterLogo className="page-hero-mark" spin />
        </figure>
      </div>
    </section>
  );
}
