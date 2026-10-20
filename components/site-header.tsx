'use client';

import { ArrowUpRight, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { ChapterLogo } from '@/components/chapter-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { socialLinks } from '@/lib/chapter-content';
import { sitePath } from '@/lib/site-path';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/projects', label: 'Projects' },
  { href: '/posts', label: 'Posts' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
];

const discord = socialLinks.find((link) => link.label === 'Discord')!;

// Map exported Pages URLs (/sooner-ieee/events.html) back to their route.
function currentRoute(pathname: string | null) {
  const base = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';
  let route = pathname ?? '/';
  if (base && route.startsWith(base)) route = route.slice(base.length) || '/';
  route = route.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (route.length > 1) route = route.replace(/\/$/, '');
  return route;
}

export function SiteHeader() {
  const route = currentRoute(usePathname());

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="site-container utility-inner">
          <span>Gallogly College of Engineering · Norman, Oklahoma</span>
          <nav aria-label="University and IEEE links">
            <a href="https://www.ou.edu/" target="_blank" rel="noreferrer">
              OU
            </a>
            <a href="https://www.ou.edu/coe/" target="_blank" rel="noreferrer">
              Gallogly College
            </a>
            <a href="https://www.ieee.org/" target="_blank" rel="noreferrer">
              IEEE
            </a>
          </nav>
        </div>
      </div>

      <div className="brand-bar">
        <div className="site-container brand-inner">
          <a className="brand-lockup" href={sitePath('/')} aria-label="IEEE Sooners home">
            <ChapterLogo className="brand-lockup-mark" spin />
            <span className="brand-lockup-copy">
              <strong>IEEE Sooners</strong>
              <small>
                <span className="brand-lockup-branch">Student Branch · </span>University of Oklahoma
              </small>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={sitePath(item.href)}
                aria-current={route === item.href ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
            <a className="nav-join" href={discord.href} target="_blank" rel="noreferrer">
              Join Discord
              <ArrowUpRight aria-hidden="true" />
            </a>
          </nav>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  className="mobile-menu-trigger"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent className="mobile-nav-sheet" side="right">
              <SheetHeader>
                <ChapterLogo className="mobile-nav-mark" />
                <SheetTitle>IEEE Sooners</SheetTitle>
                <SheetDescription>Student Branch at the University of Oklahoma</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={sitePath(item.href)}
                    aria-current={route === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <a className="button button-crimson mobile-nav-join" href={discord.href} target="_blank" rel="noreferrer">
                Join the Discord
                <ArrowUpRight aria-hidden="true" />
              </a>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
