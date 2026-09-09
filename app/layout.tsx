import type { Metadata } from 'next';
import {
  Barlow_Condensed,
  Open_Sans,
  Source_Serif_4,
} from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ou-ieee-sooners.liamhoweth.chatgpt.site'),
  title: {
    default: 'IEEE Sooners | University of Oklahoma',
    template: '%s | IEEE Sooners',
  },
  description:
    'The IEEE Student Branch at the University of Oklahoma—events, technical projects, competitions, and professional connections for OU students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${barlowCondensed.variable} ${sourceSerif.variable}`}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
