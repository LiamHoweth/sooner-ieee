import primary320 from '@/assets/brand/marks/primary-320.webp';
import primary96 from '@/assets/brand/marks/primary-96.webp';
import secondary320 from '@/assets/brand/marks/secondary-320.webp';
import secondary96 from '@/assets/brand/marks/secondary-96.webp';
import { cn } from '@/lib/utils';

// Flat marks rendered from the official vector logos in assets/brand/svg/
// (see scripts/cut-coin.mjs). Primary is the OU crimson mark with a thin white
// keyline outside the disc, so it stays visible on the crimson header, page heroes,
// mobile menu and news cards; secondary is the IEEE blue mark.
const marks = {
  primary: { small: primary96, large: primary320 },
  secondary: { small: secondary96, large: secondary320 },
};

export function ChapterLogo({
  variant = 'primary',
  className,
  label,
  spin = false,
}: {
  variant?: keyof typeof marks;
  className?: string;
  label?: string;
  /** Turn the mark like a coin on hover/focus of its link. */
  spin?: boolean;
}) {
  const { small, large } = marks[variant];

  return (
    <img
      className={cn('chapter-logo', spin && 'chapter-logo-spin', className)}
      src={large.src}
      srcSet={`${small.src} 96w, ${large.src} 320w`}
      sizes="(max-width: 600px) 3rem, 6rem"
      width={320}
      height={320}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      decoding="async"
      draggable={false}
    />
  );
}
