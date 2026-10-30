'use client';

import { useEffect, useRef } from 'react';

import primary320 from '@/assets/brand/faces/primary-320.webp';
import primary960 from '@/assets/brand/faces/primary-960.webp';
import secondary320 from '@/assets/brand/faces/secondary-320.webp';
import secondary960 from '@/assets/brand/faces/secondary-960.webp';
import { cn } from '@/lib/utils';

// Faces are rendered from the official vector logos by scripts/cut-coin.mjs.
const FACES = {
  front: { label: 'Primary mark · OU crimson', srcSet: `${primary320.src} 320w, ${primary960.src} 960w`, src: primary960.src },
  back: { label: 'Secondary mark · IEEE blue', srcSet: `${secondary320.src} 320w, ${secondary960.src} 960w`, src: secondary960.src },
} as const;

// The coin's edge is a cylinder of narrow reeded strips; CSS lights each one from
// its angle and the coin's current rotation.
const EDGE_STRIPS = 72;

// One toss, a moment after the entrance finishes and the coin is on screen (ms):
// a short crouch, a gravity arc while it flips end over end, then a damped rock.
const TOSS_DELAY_MS = 1500;
const CROUCH_MS = 180;
const AIR_MS = 1250;
const SETTLE_MS = 900;
// Clicks while it's in the air, or this soon after it lands, are ignored.
const CLICK_COOLDOWN_MS = 1000;

// Spin slows from full speed to this fraction by the catch, so it lands turning gently.
const LANDING_SPEED = 0.15;
const WOBBLE_PERIOD_MS = 360;
const WOBBLE_DECAY_MS = 170;

type Face = keyof typeof FACES;

function faceAt(rotation: number): Face {
  const turn = ((rotation % 360) + 360) % 360;
  return turn > 90 && turn < 270 ? 'back' : 'front';
}

// Share of the spin completed at u (0..1) of the flight, for a speed that falls
// linearly from 1 to LANDING_SPEED.
function spinProgress(u: number) {
  const decel = 1 - LANDING_SPEED;
  return (u - (decel / 2) * u * u) / (1 - decel / 2);
}

/**
 * The IEEE Sooners primary and secondary logos struck as one thick 3D challenge
 * coin: OU crimson on the front, IEEE blue on the back. It tosses once after it
 * appears, landing crimson side up, then floats. A click or tap tosses it again.
 * Under reduced motion it is a still image.
 */
export function LogoCoin({
  className,
  size = 'hero',
  caption = true,
  radar = true,
}: {
  className?: string;
  size?: 'hero' | 'feature';
  caption?: boolean;
  radar?: boolean;
}) {
  const stage = useRef<HTMLElement>(null);
  const tossRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let timer: number | undefined;
    // Earliest time another toss may start; covers the flight plus a cooldown.
    let readyAt = 0;

    const paint = (angle: number, lift: number, wobbleY: number, wobbleZ: number) => {
      const radians = (angle * Math.PI) / 180;
      el.style.setProperty('--coin-rotation', `${angle.toFixed(2)}deg`);
      el.style.setProperty('--coin-lift', lift.toFixed(4));
      el.style.setProperty('--coin-wobble-y', `${wobbleY.toFixed(2)}deg`);
      el.style.setProperty('--coin-wobble-z', `${wobbleZ.toFixed(2)}deg`);
      // Faces darken as they turn edge-on to the viewer.
      el.style.setProperty('--coin-shade', (1 - Math.abs(Math.cos(radians))).toFixed(3));
      // The radar rings follow whichever side is facing the viewer.
      el.dataset.face = faceAt(angle);
    };

    // Cap the toss height to the room above the coin inside its section (the home
    // hero clips overflow), keeping a margin for the tilted edge and the swell.
    const fitRise = () => {
      const coin = el.querySelector<HTMLElement>('.coin');
      const section = el.closest('section');
      if (!coin || !section) return;
      const size = coin.offsetHeight;
      const gap = coin.getBoundingClientRect().top - section.getBoundingClientRect().top;
      // Measured: at the top of the arc the float, swell and tilted edge reach about
      // 0.2 coin sizes above the resting top, and each px of rise adds ~0.9 px more.
      const room = (gap - size * 0.2 - 8) / 0.9;
      el.style.setProperty('--coin-rise', `${Math.max(0, Math.min(size * 0.42, room)).toFixed(1)}px`);
    };

    const toss = () => {
      const now = performance.now();
      if (now < readyAt) return;
      readyAt = now + CROUCH_MS + AIR_MS + SETTLE_MS + CLICK_COOLDOWN_MS;
      window.clearTimeout(timer);
      observer.disconnect();
      fitRise();
      // Whole turns only, so it always lands primary (crimson) side up.
      const turns = 3 + Math.floor(Math.random() * 2);
      const to = 360 * turns;
      const lean = Math.random() < 0.5 ? -1 : 1;
      const landingVelocity = (to / AIR_MS) * (LANDING_SPEED / (1 - (1 - LANDING_SPEED) / 2));
      const wobbleOmega = (2 * Math.PI) / WOBBLE_PERIOD_MS;
      const start = now;

      const step = (now: number) => {
        const t = now - start;
        if (t < CROUCH_MS) {
          paint(0, -0.05 * Math.sin((Math.PI * t) / CROUCH_MS), 0, 0);
        } else if (t < CROUCH_MS + AIR_MS) {
          const u = (t - CROUCH_MS) / AIR_MS;
          const arc = Math.sin(Math.PI * u);
          paint(to * spinProgress(u), 4 * u * (1 - u), lean * 16 * arc, lean * -7 * arc);
        } else if (t < CROUCH_MS + AIR_MS + SETTLE_MS) {
          const s = t - CROUCH_MS - AIR_MS;
          const damp = Math.exp(-s / WOBBLE_DECAY_MS);
          const rock = (landingVelocity / wobbleOmega) * damp * Math.sin(wobbleOmega * s);
          paint(to + rock, -0.05 * damp * Math.sin(wobbleOmega * s), 0, lean * 0.4 * rock);
        } else {
          paint(to, 0, 0, 0);
          return;
        }
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    // Toss once, the first time the coin is properly on screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(toss, TOSS_DELAY_MS);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    tossRef.current = toss;

    return () => {
      tossRef.current = null;
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <figure ref={stage} className={cn('coin-stage', `coin-stage-${size}`, className)}>
      {radar && <div className="coin-radar" aria-hidden="true" />}
      <span className="sr-only">
        The IEEE Sooners challenge coin: the crimson primary mark on one side and the blue secondary mark on the other.
      </span>
      <button type="button" className="coin" aria-label="Flip the coin" onClick={() => tossRef.current?.()}>
        <span className="coin-float">
          <span className="coin-enter" aria-hidden="true">
            <span className="coin-body">
              {Array.from({ length: EDGE_STRIPS }, (_, index) => (
                <span
                  key={index}
                  className="coin-edge"
                  style={{ '--edge-angle': `${(index * 360) / EDGE_STRIPS}deg` } as React.CSSProperties}
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
        <figcaption className="coin-caption" aria-hidden="true">
          {FACES.front.label}
        </figcaption>
      )}
    </figure>
  );
}
