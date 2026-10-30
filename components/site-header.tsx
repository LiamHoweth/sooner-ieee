'use client';

import { ArrowUpRight, ChevronDown, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

type NavItem = { href: string; label: string; sections?: { href: string; label: string }[] };

// Section links point at the `id`s on each page's <section>s; keep them in sync.
export const navigation: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/news', label: 'News' },
  {
    href: '/events',
    label: 'Events',
    sections: [
      { href: '/events#upcoming', label: 'Upcoming' },
      { href: '/events#chapter-calendar', label: 'Chapter calendar' },
      { href: '/events#past', label: 'Recent events' },
    ],
  },
  { href: '/projects', label: 'Projects' },
  {
    href: '/about',
    label: 'About',
    sections: [
      { href: '/about#mission', label: 'Why we exist' },
      { href: '/about#marks', label: 'Our official marks' },
      { href: '/about#leadership', label: 'Leadership' },
      { href: '/about#recognition', label: 'Recognition' },
    ],
  },
  {
    href: '/sponsors',
    label: 'Sponsors',
    sections: [
      { href: '/sponsors#why', label: 'Why OU IEEE' },
      { href: '/sponsors#paths', label: 'Ways to partner' },
      { href: '/sponsors#apply', label: 'Apply to sponsor' },
      { href: '/contact?topic=Sponsorship', label: 'Message the officers' },
    ],
  },
  { href: '/contact', label: 'Contact' },
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

// A single post belongs to News, so News stays highlighted (as "true", not "page").
function currentFor(route: string, href: string) {
  if (route === href) return 'page' as const;
  if (href === '/news' && route === '/post') return 'true' as const;
  return undefined;
}

type Open = { href: string; by: 'hover' | 'focus' | 'click' } | null;

/**
 * Desktop navigation. Items with sections get a disclosure panel that opens on
 * hover, on keyboard focus and on a click or tap of the chevron. The top-level
 * link always navigates to its page.
 */
function DesktopNav({ route }: { route: string }) {
  const [open, setOpen] = useState<Open>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  // While a panel is open, Escape and clicks or taps outside the nav close it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const wrapper = navRef.current?.querySelector<HTMLElement>(`[data-nav-item="${open.href}"]`);
      // Focus would otherwise be left inside a hidden panel.
      if (wrapper?.contains(document.activeElement)) wrapper.querySelector<HTMLButtonElement>('button')?.focus();
      setOpen(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    <nav className="desktop-nav" aria-label="Primary navigation" ref={navRef}>
      {navigation.map((item) => {
        if (!item.sections) {
          return (
            <a key={item.href} className="nav-link" href={sitePath(item.href)} aria-current={currentFor(route, item.href)}>
              {item.label}
            </a>
          );
        }

        const isOpen = open?.href === item.href;
        const panelId = `nav-panel-${item.label.toLowerCase()}`;
        return (
          <div
            key={item.href}
            className="nav-item"
            data-nav-item={item.href}
            data-open={isOpen ? '' : undefined}
            onPointerEnter={(event) => {
              if (event.pointerType !== 'mouse') return;
              cancelClose();
              if (!isOpen) setOpen({ href: item.href, by: 'hover' });
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== 'mouse') return;
              cancelClose();
              closeTimer.current = window.setTimeout(
                () => setOpen((value) => (value?.href === item.href && value.by === 'hover' ? null : value)),
                160,
              );
            }}
            onBlur={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setOpen((value) => (value?.href === item.href && value.by !== 'hover' ? null : value));
            }}
          >
            <a
              className="nav-link"
              href={sitePath(item.href)}
              aria-current={currentFor(route, item.href)}
              onFocus={(event) => {
                // Keyboard focus only; a mouse click on the link just navigates.
                if (event.currentTarget.matches(':focus-visible') && !isOpen) setOpen({ href: item.href, by: 'focus' });
              }}
            >
              {item.label}
            </a>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={`${item.label} sections`}
              onClick={() => {
                cancelClose();
                // A hover-opened panel stays put on click; a second click closes it.
                setOpen(isOpen && open?.by === 'click' ? null : { href: item.href, by: 'click' });
              }}
            >
              <ChevronDown aria-hidden="true" />
            </button>
            <div className="nav-panel" id={panelId}>
              <ul>
                {item.sections.map((section) => (
                  <li key={section.href}>
                    <a href={sitePath(section.href)} onClick={() => setOpen(null)}>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
      <a className="nav-join" href={discord.href} target="_blank" rel="noreferrer">
        Join Discord
        <ArrowUpRight aria-hidden="true" />
      </a>
    </nav>
  );
}

export function SiteHeader() {
  const route = currentRoute(usePathname());
  const [menuOpen, setMenuOpen] = useState(false);

  // Same-page section links do not reload the page, so close the sheet first and
  // jump once its scroll lock has let go (it would otherwise undo the jump).
  function closeMenu(event: React.MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false);
    const url = new URL(event.currentTarget.href);
    if (!url.hash || url.pathname !== window.location.pathname || url.search !== window.location.search) return;
    event.preventDefault();
    window.setTimeout(() => {
      if (window.location.hash !== url.hash) window.location.hash = url.hash;
      else document.getElementById(url.hash.slice(1))?.scrollIntoView();
    }, 260);
  }

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

          <DesktopNav route={route} />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
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
                <ul className="mobile-nav-list">
                  {navigation.map((item) => (
                    <li key={item.href}>
                      <a href={sitePath(item.href)} aria-current={currentFor(route, item.href)} onClick={closeMenu}>
                        {item.label}
                      </a>
                      {item.sections && (
                        <ul className="mobile-nav-sub" aria-label={`${item.label} sections`}>
                          {item.sections.map((section) => (
                            <li key={section.href}>
                              <a href={sitePath(section.href)} onClick={closeMenu}>
                                {section.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
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
