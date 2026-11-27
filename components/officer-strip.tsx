'use client';

import { Mail, Pause, Play } from 'lucide-react';
import { useState } from 'react';

import type { Officer } from '@/lib/chapter-content';
import { STILL_GAP, initials, stillLayout, stripDuration, stripRepeats } from '@/lib/officer-strip';

// `position` is the tile's place in the whole track, so the tints alternate across
// copies of the roster too.
function OfficerTile({ officer, position, clone }: { officer: Officer; position: number; clone?: boolean }) {
  const Tag = clone ? 'div' : 'li';
  const Name = clone ? 'p' : 'h3';
  return (
    <Tag className="officer-tile" data-tint={position % 2}>
      <div className="officer-tile-photo">
        {officer.image ? (
          <img src={officer.image} alt="" width={640} height={800} loading="lazy" />
        ) : (
          <span className="officer-tile-initials" aria-hidden="true">
            {initials(officer.name)}
          </span>
        )}
      </div>
      <Name className="officer-tile-name">{officer.name}</Name>
      <p className="person-role">{officer.role}</p>
      {officer.major && <p className="officer-tile-major">{officer.major}</p>}
      {officer.email && (
        <a href={`mailto:${officer.email}`}>
          <Mail aria-hidden="true" />
          {officer.email}
        </a>
      )}
    </Tag>
  );
}

/**
 * The still layout for wide screens, as a media query built from the roster size: from
 * `minWidth` up, every officer sits in an even grid inside the page container, the loop
 * copies and the Pause button disappear, and nothing moves. CSS, not JS, so the page
 * never loads gliding and then snaps still.
 */
function stillCss({ columns, minWidth }: { columns: number; minWidth: number }) {
  return `@media (min-width: ${minWidth}px) {
  .officer-strip .officer-strip-viewport { width: min(100% - 2 * var(--gutter), 1280px); margin-inline: auto; padding-inline: 0; overflow: visible; }
  .officer-strip .officer-strip-track { width: auto; animation: none; transform: none; }
  .officer-strip .officer-strip-list { display: grid; grid-template-columns: repeat(${columns}, minmax(0, 1fr)); gap: 2.5rem ${STILL_GAP}px; }
  .officer-strip .officer-tile { width: auto; margin-inline-end: 0; }
  .officer-strip .officer-tile-name { font-size: clamp(1.375rem, 0.5rem + 1.1vw, 1.5rem); }
  .officer-strip .officer-strip-clones, .officer-strip .officer-strip-toggle { display: none; }
}`;
}

/**
 * Officer portraits for About → Leadership. On wide screens they sit still in one row
 * (see stillLayout). Narrower, they glide across the screen in an endless loop that
 * pauses on hover, on keyboard focus and with its Pause button. With reduced motion
 * the narrow version holds still and scrolls sideways instead (see globals.css).
 */
export function OfficerStrip({ officers, contactEmail }: { officers: Officer[]; contactEmail: string }) {
  const [paused, setPaused] = useState(false);
  const repeats = stripRepeats(officers.length);
  if (repeats === 0) return null;
  const still = stillLayout(officers.length);

  // The first pass is the real list. Every other copy only fills the loop, so it
  // is hidden from screen readers and kept out of the tab order.
  const clones = Array.from({ length: repeats * 2 - 1 }, (_, pass) =>
    officers.map((officer, index) => (
      <OfficerTile
        key={`${pass}-${officer.role}-${officer.name}`}
        officer={officer}
        position={(pass + 1) * officers.length + index}
        clone
      />
    )),
  );

  return (
    <div className="officer-strip" data-paused={paused ? '' : undefined}>
      {still && <style>{stillCss(still)}</style>}
      <div className="officer-strip-viewport" data-reveal>
        <div
          className="officer-strip-track"
          style={{ '--strip-duration': `${stripDuration(officers.length)}s` } as React.CSSProperties}
        >
          <ul className="officer-strip-list" aria-label="Chapter officers">
            {officers.map((officer, index) => (
              <OfficerTile key={`${officer.role}-${officer.name}`} officer={officer} position={index} />
            ))}
          </ul>
          <div className="officer-strip-clones" aria-hidden="true" inert>
            {clones}
          </div>
        </div>
      </div>
      <div className="site-container officer-strip-controls">
        <button
          type="button"
          className="officer-strip-toggle"
          aria-label={paused ? 'Play the officer photos' : 'Pause the officer photos'}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? 'Play' : 'Pause'}
        </button>
        <a className="officer-strip-contact" href={`mailto:${contactEmail}`}>
          <Mail aria-hidden="true" />
          Leadership email: {contactEmail}
        </a>
      </div>
    </div>
  );
}
