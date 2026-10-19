'use client';

import { useEffect } from 'react';

/**
 * Fades sections in as they enter the viewport. Content is visible by default;
 * it is only held back once this script runs and the visitor allows motion.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const viewport = window.innerHeight;
    // Anything already on screen stays put; only content below the fold animates.
    const pending = targets.filter((el) => el.getBoundingClientRect().top > viewport * 0.92);
    if (pending.length === 0) return;

    pending.forEach((el) => el.classList.add('reveal-pending'));
    root.classList.add('reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    pending.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
