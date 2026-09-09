export type SocialLink = {
  label: string;
  href: string;
  description: string;
};

export type Officer = {
  name: string;
  role: string;
  email?: string;
  image?: string;
};

export type Program = {
  title: string;
  category: 'build' | 'connect';
  description: string;
  evidence: string;
};

export type Achievement = {
  title: string;
  detail: string;
  year: number;
  source: string;
};

export type Sponsor = {
  name: string;
  href?: string;
  logo?: string;
  tier?: string;
};

export const chapter = {
  name: 'IEEE Sooners',
  formalName: 'IEEE Student Branch at the University of Oklahoma',
  email: 'ieee@ou.edu',
  advisor: {
    name: 'Cliff Fitzmorris',
    role: 'Faculty Advisor',
    email: 'cfitzmorris@ou.edu',
  },
  calendarName: 'OU IEEE Events',
  calendarUrl:
    'https://calendar.google.com/calendar/embed?src=ieee.sooner%40gmail.com&ctz=America%2FChicago',
  calendarIcsUrl:
    'https://calendar.google.com/calendar/ical/ieee.sooner%40gmail.com/public/basic.ics',
  sponsorshipPacket:
    'https://drive.google.com/file/d/1UwPGmbSnmwkbFmB069u5BZVaKgI11fvU/view?usp=sharing',
  donationGuide:
    'https://docs.google.com/document/d/1BPlVcdX2GiiRd4bgk3Iro6EjOaWSVlJKm4sVdEZcFaQ/edit?tab=t.0',
} as const;

export const socialLinks: SocialLink[] = [
  {
    label: 'Discord',
    href: 'https://discord.gg/uYNjF9tX7D',
    description: 'The chapter’s main day-to-day communication channel.',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/ieee_sooners',
    description: 'Event announcements and snapshots from chapter life.',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/ieee-sooners',
    description: 'Chapter news, achievements, and professional connections.',
  },
  {
    label: 'Newsletter',
    href: 'http://eepurl.com/jnyi2A',
    description: 'A biweekly digest of upcoming opportunities.',
  },
  {
    label: 'OU Engage',
    href: 'https://oklahoma.campusgroups.com/IEEE/club_signup',
    description: 'Join the registered OU student organization.',
  },
  {
    label: 'IEEE Membership',
    href: 'https://www.ieee.org/membership/join',
    description: 'Explore global IEEE membership; it is not required for OU events.',
  },
];

export const programs: Program[] = [
  {
    title: 'Robotics & build teams',
    category: 'build',
    description:
      'Work with other students on hands-on engineering challenges, from early prototypes to competition-ready systems.',
    evidence: 'Current chapter robotics program',
  },
  {
    title: 'Regional competitions',
    category: 'build',
    description:
      'Represent OU in circuit design, cybersecurity, presentations, and other IEEE Region 5 challenges.',
    evidence: '2026 IEEE Region 5 results',
  },
  {
    title: 'Technical workshops',
    category: 'build',
    description:
      'Practice with engineering tools and topics outside the classroom through student-led and partner-led sessions.',
    evidence: 'OU IEEE event calendar',
  },
  {
    title: 'Industry connections',
    category: 'connect',
    description:
      'Meet engineers, alumni, recruiters, and technical leaders in focused conversations—not just at career fairs.',
    evidence: 'Chapter speaker and company events',
  },
  {
    title: 'Research connections',
    category: 'connect',
    description:
      'Learn what OU faculty are building and find practical ways to begin contributing as an undergraduate.',
    evidence: 'ECE Research Connect programming',
  },
  {
    title: 'Professional growth',
    category: 'connect',
    description:
      'Strengthen resumes, presentation skills, and peer networks alongside students who are doing the same work.',
    evidence: 'Chapter career programming',
  },
];

const achievementSource =
  'https://www.linkedin.com/posts/logan-larsh-0a895818a_2026-ieee-r5-conference-recap-for-the-university-activity-7444597644733296640-tWdf';

export const achievements: Achievement[] = [
  {
    title: 'Outstanding Large Student Branch',
    detail: 'IEEE Region 5 recognition for a branch with more than 50 members.',
    year: 2026,
    source: achievementSource,
  },
  {
    title: 'Second place · Circuit Design',
    detail: 'Regional competition placement earned by OU student competitors.',
    year: 2026,
    source: achievementSource,
  },
  {
    title: 'Third place · Cyber Challenge',
    detail: 'Regional competition placement earned by OU student competitors.',
    year: 2026,
    source: achievementSource,
  },
  {
    title: 'Third place · Presentation',
    detail: 'Regional competition placement earned by an OU student competitor.',
    year: 2026,
    source: achievementSource,
  },
];

// Add the verified 2026–27 roster here when the chapter supplies it.
// The UI intentionally omits empty collections instead of shipping placeholders.
export const officers: Officer[] = [];

// Add current partners only after the chapter supplies approved names and marks.
export const sponsors: Sponsor[] = [];
