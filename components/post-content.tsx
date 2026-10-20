import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { Fragment } from 'react';

import { type Block, formatPostDate, type Post, videoEmbedUrl } from '@/lib/posts';
import { type Inline, parseRichText } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case 'text':
            return <Fragment key={index}>{node.text}</Fragment>;
          case 'strong':
            return (
              <strong key={index}>
                <InlineNodes nodes={node.children} />
              </strong>
            );
          case 'em':
            return (
              <em key={index}>
                <InlineNodes nodes={node.children} />
              </em>
            );
          case 'code':
            return <code key={index}>{node.text}</code>;
          case 'link': {
            const external = node.href.startsWith('https://');
            return (
              <a key={index} href={node.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                <InlineNodes nodes={node.children} />
              </a>
            );
          }
          case 'break':
            return <br key={index} />;
        }
      })}
    </>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('rich-text', className)}>
      {parseRichText(text).map((block, index) => {
        if (block.kind === 'p')
          return (
            <p key={index}>
              <InlineNodes nodes={block.children} />
            </p>
          );
        const List = block.kind === 'ul' ? 'ul' : 'ol';
        return (
          <List key={index}>
            {block.items.map((item, i) => (
              <li key={i}>
                <InlineNodes nodes={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

function eventDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function PostBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? <h2 className="pb-heading">{block.text}</h2> : <h3 className="pb-subheading">{block.text}</h3>;
    case 'text':
      return <RichText text={block.text} />;
    case 'image':
      if (!block.url) return null;
      return (
        <figure className={`pb-image pb-image-${block.width}`} data-reveal>
          <img src={block.url} alt={block.alt} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case 'gallery':
      return (
        <div className={`pb-gallery pb-gallery-${block.layout}`} data-reveal>
          {block.images
            .filter((image) => image.url)
            .map((image) => (
              <img key={image.uploadId} src={image.url} alt={image.alt} loading="lazy" />
            ))}
        </div>
      );
    case 'quote':
      return (
        <blockquote className="pb-quote" data-reveal>
          <p>{block.text}</p>
          {block.attribution && <cite>{block.attribution}</cite>}
        </blockquote>
      );
    case 'button': {
      const external = block.url.startsWith('https://');
      return (
        <p className="pb-button">
          <a
            className={block.style === 'outline' ? 'button button-outline' : 'button button-crimson'}
            href={block.url}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            {block.label}
            {external && <ArrowUpRight aria-hidden="true" />}
          </a>
        </p>
      );
    }
    case 'callout':
      return (
        <aside className={`pb-callout pb-callout-${block.tone}`} data-reveal>
          {block.title && <p className="pb-callout-title">{block.title}</p>}
          <RichText text={block.text} />
        </aside>
      );
    case 'video': {
      const src = videoEmbedUrl(block.url);
      if (!src) return null;
      return (
        <figure className="pb-video" data-reveal>
          <div className="pb-video-frame">
            <iframe src={src} title={block.caption || 'Video'} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }
    case 'stats':
      return (
        <dl className="pb-stats" data-reveal>
          {block.items.map((item, index) => (
            <div key={index}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'event':
      return (
        <aside className="pb-event" data-reveal>
          <p className="pb-event-title">{block.title}</p>
          <p className="pb-event-meta">
            <span>
              <CalendarDays aria-hidden="true" />
              {eventDate(block.date)}
              {block.time && ` · ${block.time}`}
            </span>
            {block.location && (
              <span>
                <MapPin aria-hidden="true" />
                {block.location}
              </span>
            )}
          </p>
          {block.url && (
            <a className="button button-light" href={block.url} target="_blank" rel="noreferrer">
              Details
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </aside>
      );
    case 'columns':
      return (
        <div className="pb-columns">
          <RichText text={block.left} />
          <RichText text={block.right} />
        </div>
      );
    case 'divider':
      return <hr className="pb-divider" />;
  }
}

/** A full post: masthead, cover and body blocks. Shared by /post and the admin preview. */
export function PostArticle({ post }: { post: Pick<Post, 'title' | 'summary' | 'category' | 'accent' | 'cover' | 'blocks' | 'author' | 'publishedAt'> }) {
  return (
    <article className={`post-article post-accent-${post.accent}`}>
      <header className="post-masthead">
        <div className="site-container post-masthead-inner">
          <p className="post-category">{post.category}</p>
          <h1>{post.title || 'Untitled post'}</h1>
          {post.summary && <p className="post-summary">{post.summary}</p>}
          <p className="post-byline">
            {[post.author, formatPostDate(post.publishedAt)].filter(Boolean).join(' · ') || 'Not published yet'}
          </p>
        </div>
      </header>
      {post.cover?.url && (
        <div className="site-container">
          <img className="post-cover" src={post.cover.url} alt={post.cover.alt} />
        </div>
      )}
      <div className="site-container post-body">
        {post.blocks.map((block, index) => (
          <PostBlock key={index} block={block} />
        ))}
      </div>
    </article>
  );
}
