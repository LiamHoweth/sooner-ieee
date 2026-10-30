import { type Accent, type Block, type BlockType, CATEGORIES, emptyBlock } from '@/lib/posts';

// Starting points for "New post". Officers pick what they're posting and get the right
// category, colour and blocks. Hints are placeholder text only: nothing here is saved
// unless an officer types it. Tune these freely; categories must stay in CATEGORIES.

export type TemplateId = 'announcement' | 'recap' | 'opportunity' | 'update';

/** Placeholder text per block field, e.g. { event: { title: 'General body meeting' } }. */
export type BlockHints = Partial<Record<BlockType, Record<string, string>>>;

export type PostTemplate = {
  id: TemplateId;
  label: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  titleHint: string;
  blocks: () => Block[];
  hints: BlockHints;
  /** Shown next to "Hide after". */
  hideAfterHint?: string;
};

export const TEMPLATES: PostTemplate[] = [
  {
    id: 'announcement',
    label: 'Event announcement',
    description: 'A GBM, workshop or social coming up. Date, place and a sign-up button.',
    category: 'Announcement',
    titleHint: 'e.g. GBM Thursday, free pizza',
    blocks: () => [emptyBlock('text'), emptyBlock('event'), { type: 'button', label: '', url: 'https://', style: 'crimson' }],
    hints: {
      text: { text: 'What is happening and why should people come? e.g. Meet the officers, hear about this semester’s projects and grab free pizza.' },
      event: { title: 'e.g. General body meeting', time: '7:00 PM', location: 'Devon Energy Hall 120', url: 'Optional: https://…' },
      button: { label: 'e.g. RSVP', url: 'https://forms.gle/…' },
    },
    hideAfterHint: 'Tip: hide it the day after the event so the News page stays current.',
  },
  {
    id: 'recap',
    label: 'Event recap',
    description: 'How an event went, with a photo gallery.',
    category: 'Event recap',
    titleHint: 'e.g. Recap: fall robotics workshop',
    blocks: () => [emptyBlock('text'), emptyBlock('gallery')],
    hints: {
      text: { text: 'How did it go? Who came, what did people build or learn, and who should we thank?' },
    },
  },
  {
    id: 'opportunity',
    label: 'Opportunity',
    description: 'An internship, scholarship, competition or deadline, with an Apply button.',
    category: 'Opportunity',
    titleHint: 'e.g. Apply: summer internship at …',
    blocks: () => [emptyBlock('text'), { type: 'button', label: '', url: 'https://', style: 'crimson' }],
    hints: {
      text: { text: 'What is it, who can apply, and when is the deadline?' },
      button: { label: 'e.g. Apply', url: 'https://…' },
    },
    hideAfterHint: 'Tip: set this to the deadline so the post disappears when it closes.',
  },
  {
    id: 'update',
    label: 'General update',
    description: 'News for members: a change, a win, a reminder.',
    category: 'News',
    titleHint: 'e.g. New meeting room this semester',
    blocks: () => [emptyBlock('text')],
    hints: {
      text: { text: 'What do members need to know?' },
    },
  },
];

/** Default accent per category; an officer can still pick another under More options. */
export const CATEGORY_ACCENTS: Record<string, Accent> = {
  News: 'crimson',
  Announcement: 'crimson',
  'Event recap': 'blue',
  Opportunity: 'storm',
  Project: 'blue',
  Spotlight: 'storm',
};

export function accentForCategory(category: string): Accent {
  return CATEGORY_ACCENTS[category.trim()] ?? 'crimson';
}

export function getTemplate(id: TemplateId | null | undefined) {
  return TEMPLATES.find((template) => template.id === id) ?? null;
}

/** Best guess at which template an existing post came from, for its placeholder hints. */
export function templateForCategory(category: string) {
  return TEMPLATES.find((template) => template.category === category.trim()) ?? null;
}
