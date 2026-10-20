import { describe, expect, it } from 'vitest';

import { videoEmbedUrl } from '@/lib/posts';
import { parseInline, parseRichText } from '@/lib/rich-text';

describe('post rich text', () => {
  it('parses bold, italic, code and safe links', () => {
    expect(parseInline('a **b** *c* `d` [e](https://ieee.org)')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'c' }] },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'd' },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: 'https://ieee.org', children: [{ kind: 'text', text: 'e' }] },
    ]);
  });

  it('drops unsafe link targets but keeps their text', () => {
    expect(parseInline('[click](javascript:alert(1))')).toEqual([{ kind: 'text', text: 'click' }, { kind: 'text', text: ')' }]);
    expect(parseInline('[x](http://plain.example)')).toEqual([{ kind: 'text', text: 'x' }]);
  });

  it('never produces raw HTML', () => {
    const blocks = parseRichText('<script>alert(1)</script>');
    expect(blocks).toEqual([{ kind: 'p', children: [{ kind: 'text', text: '<script>alert(1)</script>' }] }]);
  });

  it('splits paragraphs and lists', () => {
    expect(parseRichText('One\n\n- a\n- b\n\n1. x\n2. y').map((block) => block.kind)).toEqual(['p', 'ul', 'ol']);
  });

  it('only embeds YouTube and Vimeo', () => {
    expect(videoEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123');
    expect(videoEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123');
    expect(videoEmbedUrl('https://vimeo.com/42')).toBe('https://player.vimeo.com/video/42');
    expect(videoEmbedUrl('https://evil.example/video')).toBeNull();
  });
});
