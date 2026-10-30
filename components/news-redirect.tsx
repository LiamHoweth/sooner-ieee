'use client';

import { useEffect } from 'react';

/** Sends old /posts links on to /news without leaving /posts in the history. */
export function NewsRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return null;
}
