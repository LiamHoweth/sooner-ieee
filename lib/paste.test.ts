import { describe, expect, it } from 'vitest';

import { decodeEntities, htmlToRichText, pasteHasLinks } from '@/lib/paste';
import { parseRichText } from '@/lib/rich-text';

describe('pasting HTML into post text', () => {
  it('keeps links as [text](url) and drops other formatting', () => {
    expect(htmlToRichText('Sign up <b>here</b>: <a href="https://forms.gle/abc" style="color:red"><span>RSVP <i>form</i></span></a>!')).toBe(
      'Sign up here: [RSVP form](https://forms.gle/abc)!',
    );
  });

  it('handles Google Docs clipboard markup', () => {
    const html =
      '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1234"><p dir="ltr" style="line-height:1.38"><span style="font-size:11pt">GBM Thursday, </span><span style="font-weight:700">free pizza</span><span>.</span></p><br><p dir="ltr"><span>RSVP at </span><a href="https://www.google.com/url?q=https://forms.gle/xyz&amp;sa=D&amp;ust=1" style="text-decoration:none"><span style="color:#1155cc;text-decoration:underline">this form</span></a></p></b>';
    expect(htmlToRichText(html)).toBe('GBM Thursday, free pizza.\n\nRSVP at [this form](https://forms.gle/xyz)');
  });

  it('handles Discord-style markup with line breaks', () => {
    const html =
      '<div class="markup"><span>Meeting moved to </span><a class="anchor" href="https://ou.edu/map" rel="noreferrer noopener" target="_blank">Devon 120</a><br>Bring a laptop</div>';
    expect(htmlToRichText(html)).toBe('Meeting moved to [Devon 120](https://ou.edu/map)\nBring a laptop');
  });

  it('turns lists into dash and number lines that parse as lists', () => {
    const bullets = htmlToRichText('<p>Bring:</p><ul><li><p>Laptop</p></li><li>Charger <a href="https://ieee.org">info</a></li></ul><p>See you!</p>');
    expect(bullets).toBe('Bring:\n\n- Laptop\n- Charger [info](https://ieee.org)\n\nSee you!');
    expect(parseRichText(bullets).map((block) => block.kind)).toEqual(['p', 'ul', 'p']);

    expect(htmlToRichText('<ol><li>One</li><li>Two</li></ol>')).toBe('1. One\n2. Two');
    expect(htmlToRichText('<ul><li>Parent<ul><li>Child</li></ul></li><li>Next</li></ul>')).toBe('- Parent\n- Child\n- Next');
  });

  it('drops unsafe, relative and empty links but keeps their text', () => {
    expect(htmlToRichText('<a href="javascript:alert(1)">click</a> <a href="http://plain.example">old</a> <a href="/about">here</a>')).toBe(
      'click old here',
    );
    expect(htmlToRichText('<a href="https://ieee.org"><img src="x.png"></a>Text')).toBe('Text');
    expect(htmlToRichText('<a href="mailto:ieee@ou.edu">Email us</a>')).toBe('[Email us](mailto:ieee@ou.edu)');
  });

  it('keeps the link syntax intact when the URL or text has brackets or spaces', () => {
    expect(htmlToRichText('<a href="https://en.wikipedia.org/wiki/IEEE_(org) page">The [IEEE]</a>')).toBe(
      '[The IEEE](https://en.wikipedia.org/wiki/IEEE_%28org%29%20page)',
    );
  });

  it('keeps spaces around links and collapses whitespace', () => {
    expect(htmlToRichText('Go to<a href="https://ieee.org"> the site </a>now.\n\n   Thanks')).toBe('Go to [the site](https://ieee.org) now. Thanks');
  });

  it('strips scripts, styles and comments, and never returns markup', () => {
    const out = htmlToRichText('<!--StartFragment--><style>p{color:red}</style><script>alert(1)</script><p>Hi &amp; welcome&nbsp;all &lt;3</p><!--EndFragment-->');
    expect(out).toBe('Hi & welcome all <3');
    expect(parseRichText(out)).toEqual([{ kind: 'p', children: [{ kind: 'text', text: 'Hi & welcome all <3' }] }]);
  });

  it('makes paragraphs from blocks and double line breaks', () => {
    expect(htmlToRichText('<div>One</div><div>Two</div>')).toBe('One\n\nTwo');
    expect(htmlToRichText('One<br><br>Two<br>Three')).toBe('One\n\nTwo\nThree');
    expect(htmlToRichText('<h2>Title</h2>Body')).toBe('Title\n\nBody');
  });

  it('decodes entities', () => {
    expect(decodeEntities('&quot;a&quot; &#39;b&#39; &#x2014; &rsquo; &bogus;')).toBe('"a" \'b\' — ’ &bogus;');
  });

  it('only takes over pastes that contain links', () => {
    expect(pasteHasLinks('<p>No links</p>')).toBe(false);
    expect(pasteHasLinks('<a class="x" href="https://ieee.org">x</a>')).toBe(true);
  });
});
