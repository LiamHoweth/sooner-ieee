import alternates from '@/assets/brand/ieee-sooners-alternates.png';
import primary from '@/assets/brand/ieee-sooners-primary.png';
import secondary from '@/assets/brand/ieee-sooners-secondary.png';

const artwork = {
  primary: { image: primary, viewBox: '158 778 802 802' },
  secondary: { image: secondary, viewBox: '162 778 802 802' },
  alternates: { image: alternates, viewBox: '30 795 1065 690' },
};

type ChapterLogoProps = {
  variant?: keyof typeof artwork;
  className?: string;
  label?: string;
};

export function ChapterLogo({
  variant = 'primary',
  className,
  label,
}: ChapterLogoProps) {
  const { image, viewBox } = artwork[variant];

  return (
    <svg
      className={className}
      viewBox={viewBox}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {/* Frame the supplied artwork without changing or recreating the logos. */}
      <image href={image.src} width={image.width} height={image.height} />
    </svg>
  );
}
