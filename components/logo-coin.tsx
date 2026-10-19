'use client';

import { useEffect, useRef, useState } from 'react';

import primary320 from '@/assets/brand/coin/primary-320.webp';
import primary960 from '@/assets/brand/coin/primary-960.webp';
import secondary320 from '@/assets/brand/coin/secondary-320.webp';
import secondary960 from '@/assets/brand/coin/secondary-960.webp';
import { cn } from '@/lib/utils';

const FACES = {
  front: { label: 'Primary mark · IEEE blue', srcSet: `${primary320.src} 320w, ${primary960.src} 960w`, src: primary960.src },
  back: { label: 'Secondary mark · OU crimson', srcSet: `${secondary320.src} 320w, ${secondary960.src} 960w`, src: secondary960.src },
} as const;

// Stacked discs between the two faces read as the coin's milled rim when it turns edge-on.
const RIM_LAYERS = 14;
const FLIP_MS = 1400;

type Face = keyof typeof FACES;

function faceAt(rotation: number): Face {
  const turn = ((rotation % 360) + 360) % 360;
  return turn > 90 && turn < 270 ? 'back' : 'front';
}

/**
 * The IEEE Sooners primary and secondary logos struck as one 3D challenge coin:
 * blue on the front, crimson on the back. Tap, click, press Enter or drag to flip it.
 */
export function LogoCoin({
  className,
  size = 'hero',
  caption = true,
}: {
  className?: string;
  size?: 'hero' | 'feature';
  caption?: boolean;
}) {
  const [rotation, setRotation] = useState(0);
  const [tossing, setTossing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const tossTimer = useRef<number | undefined>(undefined);
  const suppressClick = useRef(false);
  // While a toss is in the air, keep showing the side it left from; the result
  // is announced only once the coin lands.
  const [launchFace, setLaunchFace] = useState<Face>('front');
  const face = tossing ? launchFace : faceAt(rotation);

  useEffect(() => () => window.clearTimeout(tossTimer.current), []);

  const flip = () => {
    // A real toss: several full turns, landing on a random side.
    const lands: Face = Math.random() < 0.5 ? 'front' : 'back';
    const base = Math.round(rotation / 360) * 360;
    setLaunchFace(face);
    setRotation(base + 360 * 3 + (lands === 'back' ? 180 : 0));
    setTossing(true);
    window.clearTimeout(tossTimer.current);
    tossTimer.current = window.setTimeout(() => setTossing(false), FLIP_MS);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { x: event.clientX, start: rotation, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) < 6) return;
    if (!state.moved) {
      state.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setRotation(state.start + dx * 0.9);
  };

  const endDrag = () => {
    const state = drag.current;
    drag.current = null;
    if (!state?.moved) return;
    // The click that follows a drag release should not toss the coin again.
    suppressClick.current = true;
    setDragging(false);
    // Settle on whichever face is closest.
    setRotation((current) => Math.round(current / 180) * 180);
  };

  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    flip();
  };

  return (
    <figure className={cn('coin-stage', `coin-stage-${size}`, className)} data-face={face}>
      <div className="coin-radar" aria-hidden="true" />
      <button
        type="button"
        className={cn('coin', tossing && 'is-tossing', dragging && 'is-dragging')}
        aria-label={`Flip the IEEE Sooners coin. Showing the ${FACES[face].label}.`}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="coin-float">
          <span className="coin-enter">
            <span
              className="coin-body"
              style={{ '--coin-rotation': `${rotation}deg` } as React.CSSProperties}
            >
              {Array.from({ length: RIM_LAYERS }, (_, index) => (
                <span
                  key={index}
                  className="coin-rim"
                  style={{ '--rim-index': index } as React.CSSProperties}
                />
              ))}
              <span className="coin-face coin-front">
                <img src={FACES.front.src} srcSet={FACES.front.srcSet} sizes="(max-width: 700px) 70vw, 30rem" alt="" draggable={false} />
              </span>
              <span className="coin-face coin-back">
                <img src={FACES.back.src} srcSet={FACES.back.srcSet} sizes="(max-width: 700px) 70vw, 30rem" alt="" draggable={false} />
              </span>
            </span>
          </span>
        </span>
      </button>
      <span className="coin-shadow" aria-hidden="true" />
      {caption && (
        <figcaption className="coin-caption">
          <span aria-live="polite">{FACES[face].label}</span>
          <span className="coin-hint">Tap or drag to flip</span>
        </figcaption>
      )}
    </figure>
  );
}
