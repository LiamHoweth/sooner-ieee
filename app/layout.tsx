import type { Metadata } from 'next';
import { Barlow_Condensed, Montserrat, Source_Serif_4 } from 'next/font/google';

import { RevealObserver } from '@/components/reveal-observer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

// OU's web type, approximated with open fonts: a tall condensed display face
// (Barlow Condensed), a geometric sans for labels and buttons (Montserrat), and
// a book serif for reading (Source Serif 4).
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';

export const metadata: Metadata = {
  metadataBase: new URL('https://ou-ieee-sooners.liamhoweth.chatgpt.site'),
  title: {
    default: 'IEEE Sooners | University of Oklahoma',
    template: '%s | IEEE Sooners',
  },
  description:
    'The IEEE Student Branch at the University of Oklahoma—events, technical projects, competitions, and professional connections for OU students.',
  icons: {
    icon: [{ url: `${basePath}/favicon.png`, type: 'image/png', sizes: '64x64' }],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${barlowCondensed.variable} ${sourceSerif.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <RevealObserver />
      </body>
    </html>
  );
}
