// Render the IEEE Sooners coin faces, small marks and site icons from the official
// vector logos in assets/brand/svg/. Usage: node scripts/cut-coin.mjs (from the project root)
//
// Coin faces (assets/brand/faces/{primary,secondary}-{320,960}.webp) are the logo disc
// set inside a raised, bevelled metal rim tinted to the face colour. Lighting is
// layered on top of the artwork, never in place of it: flat areas keep the logo's
// exact colours, and only the slopes around the white artwork are shaded so it reads
// as struck in relief. Small marks (assets/brand/marks/) are the plain logos; the
// default (crimson) mark gets a thin white keyline outside the disc so it stays
// visible on the site's crimson grounds. public/favicon.png and
// public/apple-touch-icon.png are the crimson mark.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const require = createRequire(join(root, 'package.json'));
const sharp = require('sharp');
const svgDir = join(root, 'assets/brand/svg');
const coinDir = join(root, 'assets/brand/faces');
const markDir = join(root, 'assets/brand/marks');
const publicDir = join(root, 'public');
mkdirSync(coinDir, { recursive: true });
mkdirSync(markDir, { recursive: true });

const svg = (n) => join(svgDir, `IEEE-LOGO-Final_${n}.svg`);

// #5 is the OU crimson disc with white artwork (primary), #3 the IEEE blue disc (secondary).
const FACES = [
  { name: 'primary', file: svg(5), colour: [0x84, 0x16, 0x17] },
  { name: 'secondary', file: svg(3), colour: [0x00, 0x63, 0x9b] },
];
const MARKS = [
  { name: 'primary', file: svg(5), sizes: [96, 320], keyline: true },
  { name: 'secondary', file: svg(3), sizes: [96, 320] },
  { name: 'alt-crimson', file: svg(5), sizes: [256] },
  { name: 'alt-blue', file: svg(3), sizes: [256] },
  { name: 'alt-red', file: svg(7), sizes: [256] },
  { name: 'alt-black', file: svg(2), sizes: [256] },
  { name: 'alt-red-outline', file: svg(8), sizes: [256] },
];

const WORK = 1920; // faces are lit at 2x, then downsampled
const RIM = 0.1; // rim band as a share of the coin radius
const LIGHT = norm([-0.42, -0.6, 0.68]); // toward the light: top left, in front (y down)
const HALF = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

function norm(v) {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Find the logo disc in SVG units: the bounding box of opaque pixels, ignoring a
// thin margin (one file carries a stray black rule along its top edge).
async function measure(file) {
  const k = 4;
  const { data, info } = await sharp(file, { density: 72 * k }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = 20 * k;
  let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
  for (let y = m; y < info.height - m; y++)
    for (let x = m; x < info.width - m; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { cx: (x0 + x1 + 1) / 2 / k, cy: (y0 + y1 + 1) / 2 / k, r: (x1 - x0 + 1 + (y1 - y0 + 1)) / 4 / k };
}

// The logo rendered so its disc has radius `radius` px, centred in a size×size square,
// with everything outside the disc cleared.
async function logoSquare(file, size, radius) {
  const { cx, cy, r } = await measure(file);
  const scale = radius / r;
  const left = Math.round(cx * scale - size / 2), top = Math.round(cy * scale - size / 2);
  // sharp runs extract before extend within one pipeline, so pad first, then cut.
  const padded = await sharp(file, { density: 72 * scale })
    .ensureAlpha()
    .extend({ top: size, left: size, bottom: size, right: size, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const data = await sharp(padded)
    .extract({ left: left + size, top: top + size, width: size, height: size })
    .raw()
    .toBuffer();
  const c = size / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      data[i + 3] = Math.round(data[i + 3] * clamp(radius - d + 0.5));
    }
  return data;
}

function boxBlur(src, w, radius, passes = 3) {
  let a = Float32Array.from(src), b = new Float32Array(a.length);
  const n = radius * 2 + 1;
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < w; y++) {
      let s = 0;
      for (let x = -radius; x <= radius; x++) s += a[y * w + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = s / n;
        s += a[y * w + Math.min(w - 1, x + radius + 1)] - a[y * w + Math.max(0, x - radius)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -radius; y <= radius; y++) s += b[clamp(y, 0, w - 1) * w + x];
      for (let y = 0; y < w; y++) {
        a[y * w + x] = s / n;
        s += b[Math.min(w - 1, y + radius + 1) * w + x] - b[Math.max(0, y - radius) * w + x];
      }
    }
  }
  return a;
}

// Rim height (px at WORK size) across the band, t = 0 at the field, 1 at the edge:
// a steep inner wall, a flat crown with a fine struck bead, and a chamfered outer bevel
// that rounds over into the coin's edge.
function rimHeight(t) {
  const wall = smooth(0, 0.12, t) * 16;
  const bead = Math.exp(-(((t - 0.2) / 0.025) ** 2)) * 1.6;
  const crown = -t * 2;
  const chamfer = smooth(0.58, 1, t) * 14 + Math.pow(clamp((t - 0.9) / 0.1), 2) * 5;
  return wall + bead + crown - chamfer;
}

// Deterministic concentric lathe marks.
const lathe = (r) => {
  const s = Math.sin(Math.floor(r * 1.3) * 12.9898) * 43758.5453;
  return s - Math.floor(s) - 0.5;
};

async function face({ name, file, colour }) {
  const W = WORK, c = W / 2, R = W / 2 - 0.5, Ri = R * (1 - RIM);
  const logo = await logoSquare(file, W, Ri + 3);
  const px = W * W;

  // Height of the white artwork (letters, ring, tornado, arrow); the coloured field is 0.
  const art = new Float32Array(px);
  for (let i = 0; i < px; i++) {
    const o = i * 4;
    art[i] = smooth(120, 235, Math.min(logo[o], logo[o + 1], logo[o + 2])) * (logo[o + 3] / 255);
  }
  const relief = boxBlur(art, W, 2);
  const cast = boxBlur(art, W, 4);
  const RELIEF_PX = 5.5;
  const sdx = Math.round(-LIGHT[0] * 7), sdy = Math.round(-LIGHT[1] * 7);

  const metal = colour.map((v) => v * 0.5 + 8);
  const tint = colour.map((v) => v + (255 - v) * 0.55);
  const out = Buffer.alloc(px * 4);

  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x, o = i * 4;
      const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy);
      const ux = dx / (r || 1), uy = dy / (r || 1);
      let rgb, alpha = 255;

      if (r >= Ri) {
        // Raised rim: analytic normal from the profile, lit as polished tinted metal.
        const t = (r - Ri) / (R - Ri);
        const slope = (rimHeight(t + 0.002) - rimHeight(t - 0.002)) / (0.004 * (R - Ri));
        const n = norm([-slope * ux, -slope * uy, 1]);
        const diff = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const spec = Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), 60);
        // Polished metal: a conic reflection band (bright toward the light and opposite
        // it), strongest on surfaces facing the viewer, plus lathe grain.
        const angle = Math.atan2(uy, ux) - Math.atan2(LIGHT[1], LIGHT[0]);
        const band = Math.pow(0.5 + 0.5 * Math.cos(2 * angle), 4) * (0.55 + 0.45 * Math.cos(angle));
        const grain = 1 + lathe(r) * 0.09;
        rgb = metal.map((m, k) => m * (0.3 + 1.05 * diff) * grain + tint[k] * (0.9 * spec + 0.42 * band * n[2] ** 6) * grain);
        // Thin dark seam where the rim wall meets the field.
        rgb = rgb.map((v) => v * (0.55 + 0.45 * smooth(0, 0.035, t)));
        alpha = Math.round(255 * clamp(R - r + 0.5));
      } else {
        rgb = [logo[o], logo[o + 1], logo[o + 2]];
        // Struck artwork: shade only the slopes, so flat areas keep their exact colour.
        const gx = (relief[i + 1] - relief[i - 1]) * 0.5 * RELIEF_PX;
        const gy = (relief[i + W] - relief[i - W]) * 0.5 * RELIEF_PX;
        const n = norm([-gx, -gy, 1]);
        const lit = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2] - LIGHT[2];
        const spec = Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), 24) - Math.pow(HALF[2], 24);
        const shadowAt = (y - sdy) * W + (x - sdx);
        const shadow = Math.max(0, (cast[shadowAt] ?? 0) - cast[i]) * (1 - art[i]);
        // The raised rim shades the field just inside it, most on the side facing the light.
        const gap = (Ri - r) / (R * 0.05);
        const facing = clamp(0.35 + 0.65 * -(ux * LIGHT[0] + uy * LIGHT[1]) / Math.hypot(LIGHT[0], LIGHT[1]));
        const rimShade = Math.pow(1 - clamp(gap), 2) * (0.22 + 0.4 * facing);
        const k = (1 + lit * 1.6) * (1 - shadow * 0.55) * (1 - rimShade);
        rgb = rgb.map((v) => v * k + 255 * Math.max(0, spec) * 0.35);
      }
      out[o] = clamp(Math.round(rgb[0]), 0, 255);
      out[o + 1] = clamp(Math.round(rgb[1]), 0, 255);
      out[o + 2] = clamp(Math.round(rgb[2]), 0, 255);
      out[o + 3] = alpha;
    }

  const full = sharp(out, { raw: { width: W, height: W, channels: 4 } });
  for (const size of [960, 320]) {
    await full
      .clone()
      .resize(size, size, { kernel: 'lanczos3' })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(join(coinDir, `${name}-${size}.webp`));
  }
  console.log('face', name);
}

async function mark({ name, file, sizes, keyline = false }) {
  for (const size of sizes) {
    const s = size * 4, R = s / 2 - 2;
    // Keyline: a white ring outside the logo disc, about 3% of the mark's width.
    const ring = keyline ? Math.max(4 * 1.25, s * 0.03) : 0;
    const data = await logoSquare(file, s, R - ring);
    if (ring) {
      const c = s / 2;
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
          const cover = clamp(d - (R - ring) + 0.5) * clamp(R - d + 0.5);
          if (cover <= 0) continue;
          const i = (y * s + x) * 4, a = data[i + 3] / 255;
          const out = cover + a * (1 - cover);
          for (let k = 0; k < 3; k++) data[i + k] = Math.round((255 * cover + data[i + k] * a * (1 - cover)) / out);
          data[i + 3] = Math.round(out * 255);
        }
    }
    await sharp(data, { raw: { width: s, height: s, channels: 4 } })
      .resize(size, size, { kernel: 'lanczos3' })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(join(markDir, `${name}-${size}.webp`));
  }
  console.log('mark', name);
}

// Browser and home-screen icons from the crimson mark, drawn from the vector at 8x.
async function icons() {
  const file = svg(5);
  const fav = 64 * 8;
  const disc = await logoSquare(file, fav, fav / 2 - 4);
  await sharp(disc, { raw: { width: fav, height: fav, channels: 4 } })
    .resize(64, 64, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, 'favicon.png'));
  // iOS fills transparency with black, so the disc sits on a crimson square.
  const touch = 180 * 4;
  const square = await logoSquare(file, touch, touch / 2);
  await sharp(square, { raw: { width: touch, height: touch, channels: 4 } })
    .flatten({ background: '#841617' })
    .resize(180, 180, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('icons');
}

for (const f of FACES) await face(f);
for (const m of MARKS) await mark(m);
await icons();
