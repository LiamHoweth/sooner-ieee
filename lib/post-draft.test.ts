import { describe, expect, it } from 'vitest';

import {
  addPhotos,
  autoSummary,
  blockProblem,
  dayAfter,
  firstPhoto,
  firstSentence,
  isAutoCover,
  isBlankBlock,
  lastEventDate,
  prepareBlocks,
} from '@/lib/post-draft';
import { type Block, CATEGORIES, emptyBlock } from '@/lib/posts';
import { accentForCategory, TEMPLATES, templateForCategory } from '@/lib/post-templates';

describe('automatic summary', () => {
  it('uses the first sentence of the first text block, without formatting', () => {
    const blocks: Block[] = [
      { type: 'heading', text: 'Ignored', level: 2 },
      { type: 'text', text: '' },
      { type: 'text', text: 'Join us for **pizza** at [Devon](https://ou.edu). Bring a friend!\n\nSecond paragraph.' },
    ];
    expect(autoSummary(blocks)).toBe('Join us for pizza at Devon.');
  });

  it('keeps short text without punctuation and abbreviations mid-sentence', () => {
    expect(firstSentence('GBM Thursday, free pizza')).toBe('GBM Thursday, free pizza');
    expect(firstSentence('Bring snacks, e.g. chips. Then code!')).toBe('Bring snacks, e.g. chips.');
    expect(firstSentence('- First bullet\n- Second')).toBe('First bullet Second');
  });

  it('shortens long sentences at a word', () => {
    const long = `${'word '.repeat(80)}end.`;
    const result = firstSentence(long, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith('word…')).toBe(true);
  });

  it('is empty when there is no text', () => {
    expect(autoSummary([emptyBlock('divider')])).toBe('');
  });
});

describe('automatic cover', () => {
  const gallery: Block = { type: 'gallery', layout: 'grid', images: [{ uploadId: 'a'.repeat(24), url: '/a.webp', alt: 'Team photo' }] };

  it('finds the first photo in an image or gallery block', () => {
    expect(firstPhoto([emptyBlock('image'), gallery])).toEqual({ id: 'a'.repeat(24), url: '/a.webp', alt: 'Team photo' });
    expect(firstPhoto([emptyBlock('text')])).toBeNull();
  });

  it('recognises a saved cover that matches the first photo', () => {
    expect(isAutoCover({ id: 'a'.repeat(24), url: '/a.webp', alt: 'Team photo' }, [gallery])).toBe(true);
    expect(isAutoCover({ id: 'a'.repeat(24), url: '/a.webp', alt: 'Different words' }, [gallery])).toBe(false);
    expect(isAutoCover(null, [gallery])).toBe(false);
  });
});

describe('preparing blocks to save', () => {
  it('drops untouched template blocks so drafts always save', () => {
    const { blocks, problems } = prepareBlocks(TEMPLATES.find((t) => t.id === 'announcement')!.blocks());
    expect(blocks).toEqual([]);
    expect(problems).toEqual([]);
  });

  it('reports half-filled blocks in plain language', () => {
    const event: Block = { ...(emptyBlock('event') as Extract<Block, { type: 'event' }>), location: 'Devon 120' };
    const button: Block = { type: 'button', label: 'RSVP', url: 'https://', style: 'crimson' };
    const { blocks, problems } = prepareBlocks([emptyBlock('text'), event, button]);
    expect(blocks).toHaveLength(2);
    expect(problems).toEqual([
      { index: 1, message: 'Add the event name.' },
      { index: 2, message: expect.stringContaining('https://') },
    ]);
  });

  it('removes empty stat rows and accepts valid blocks', () => {
    const stats: Block = { type: 'stats', items: [{ value: '40', label: 'members' }, { value: '', label: '' }] };
    const { blocks, problems } = prepareBlocks([stats, { type: 'video', url: 'https://youtu.be/abc', caption: '' }]);
    expect(blocks[0]).toEqual({ type: 'stats', items: [{ value: '40', label: 'members' }] });
    expect(problems).toEqual([]);
    expect(blockProblem({ type: 'video', url: 'https://example.com/v', caption: '' })).toMatch(/YouTube/);
  });

  it('never treats a divider as blank', () => {
    expect(isBlankBlock(emptyBlock('divider'))).toBe(false);
  });
});

describe('adding photos', () => {
  const one = [{ id: 'a'.repeat(24), url: '/a.webp' }];
  const three = ['a', 'b', 'c'].map((c) => ({ id: c.repeat(24), url: `/${c}.webp` }));

  it('adds one photo as a Photo block and several as a Gallery', () => {
    expect(addPhotos([emptyBlock('text')], one)[1]).toMatchObject({ type: 'image', uploadId: 'a'.repeat(24), alt: '' });
    const added = addPhotos([emptyBlock('text')], three)[1];
    expect(added).toMatchObject({ type: 'gallery', layout: 'grid' });
    expect(added.type === 'gallery' && added.images.map((image) => image.uploadId)).toEqual(three.map((p) => p.id));
  });

  it('fills an empty template gallery or photo slot first', () => {
    const recap = TEMPLATES.find((t) => t.id === 'recap')!.blocks();
    const filled = addPhotos(recap, three);
    expect(filled).toHaveLength(2);
    expect(filled[1].type === 'gallery' && filled[1].images).toHaveLength(3);

    const withImage = addPhotos([emptyBlock('image')], three);
    expect(withImage).toHaveLength(1);
    expect(withImage[0].type).toBe('gallery');
  });
});

describe('hide after the event', () => {
  it('uses the last event date and hides at the start of the next day', () => {
    const blocks: Block[] = [
      { type: 'event', title: 'A', date: '2026-11-05', time: '', location: '', url: '' },
      { type: 'event', title: 'B', date: '2026-11-12', time: '', location: '', url: '' },
    ];
    expect(lastEventDate(blocks)).toBe('2026-11-12');
    expect(dayAfter('2026-11-12').getTime()).toBe(new Date(2026, 10, 13).getTime());
    expect(dayAfter('2026-12-31').getTime()).toBe(new Date(2027, 0, 1).getTime());
    expect(lastEventDate([emptyBlock('text')])).toBeNull();
  });
});

describe('templates', () => {
  it('use existing categories and valid starter blocks', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['announcement', 'recap', 'opportunity', 'update']);
    for (const template of TEMPLATES) {
      expect(CATEGORIES).toContain(template.category);
      expect(template.blocks()[0].type).toBe('text');
      expect(template.blocks()).not.toBe(template.blocks());
    }
  });

  it('map categories to a default accent', () => {
    expect(accentForCategory('Event recap')).toBe('blue');
    expect(accentForCategory('Something custom')).toBe('crimson');
    for (const category of CATEGORIES) expect(['crimson', 'blue', 'storm']).toContain(accentForCategory(category));
    expect(templateForCategory('Opportunity')?.id).toBe('opportunity');
  });
});
