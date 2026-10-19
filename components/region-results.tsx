import { ArrowUpRight } from 'lucide-react';

import { achievements } from '@/lib/chapter-content';
import { photos } from '@/lib/photos';

const ORDINALS: Record<string, string> = { First: '1st', Second: '2nd', Third: '3rd' };

const podium = achievements.slice(1).map((achievement) => {
  const [place, event] = achievement.title.split(' · ');
  const word = place.replace(' place', '');
  return { place: ORDINALS[word] ?? word, event };
});

/** The 2026 Region 5 results over the NOAA lightning photograph from Norman. */
export function RegionResults({
  id,
  title,
  children,
  linkLabel = 'Read the recap',
  compact = false,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  linkLabel?: string;
  compact?: boolean;
}) {
  return (
    <section className={compact ? 'storm-section storm-section-compact' : 'storm-section'} aria-labelledby={id}>
      <img
        className="storm-section-photo"
        src={photos.lightningNorman.image.src}
        width={photos.lightningNorman.image.width}
        height={photos.lightningNorman.image.height}
        alt=""
        loading="lazy"
      />
      <div className="site-container storm-grid">
        <div className="storm-copy" data-reveal>
          <h2 className="display-title" id={id}>
            {title}
          </h2>
          {children}
          <a className="button button-outline-light" href={achievements[0].source} target="_blank" rel="noreferrer">
            {linkLabel}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <ol className="podium" data-reveal>
          {podium.map((result) => (
            <li key={result.event}>
              <span className="podium-place">{result.place}</span>
              <span className="podium-event">{result.event}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
