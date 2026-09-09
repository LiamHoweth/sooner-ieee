'use client';

import { ExternalLink, Menu } from 'lucide-react';

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

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
];

const discord = socialLinks.find((link) => link.label === 'Discord')!;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="site-container utility-inner">
          <span>Norman, Oklahoma</span>
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
          <a className="text-lockup" href="/" aria-label="IEEE Sooners home">
            <span className="text-lockup-mark" aria-hidden="true">
              <span>OU</span>
            </span>
            <span className="text-lockup-copy">
              <strong>IEEE SOONERS</strong>
              <small>Student Branch at the University of Oklahoma</small>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a className="nav-join" href={discord.href} target="_blank" rel="noreferrer">
              Join Discord
              <ExternalLink aria-hidden="true" />
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
                <SheetTitle>IEEE Sooners</SheetTitle>
                <SheetDescription>
                  Student Branch at the University of Oklahoma
                </SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ))}
                <a href={discord.href} target="_blank" rel="noreferrer">
                  Join the Discord
                  <ExternalLink aria-hidden="true" />
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
