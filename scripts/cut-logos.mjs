// Cut the circular IEEE Sooners logos out of the supplied Instagram screenshots
// into transparent WebP coin faces. Usage: node scripts/cut-logos.mjs (from the project root)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const require = createRequire(join(root, 'package.json'));
const sharp = require('sharp');
const brand = join(root, 'assets/brand');
const out = join(root, 'assets/brand/coin');
mkdirSync(out, { recursive: true });

const isInk = (r, g, b, kind) => {
  if (kind === 'blue') return b > r + 50 && b > 90;
  if (kind === 'red') return r > g + 60 && r > 90;
  if (kind === 'black') return r < 60 && g < 60 && b < 60;
  return false;
};

async function load(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  return { data, info, px };
}

// Fit the disc from two horizontal chords, scanning inward from a window's edges so
// glows above the badge and neighbouring badges never count.
function chord(img, y, x0, x1, kind) {
  const { px } = img;
  let L = null, R = null;
  for (let x = x0; x <= x1; x++) if (isInk(...px(x, y), kind)) { L = x; break; }
  for (let x = x1; x >= x0; x--) if (isInk(...px(x, y), kind)) { R = x; break; }
  return { mid: (L + R) / 2, half: (R - L) / 2 };
}
function measure(img, sx, sy, kind, span) {
  const x0 = Math.max(0, sx - span), x1 = Math.min(img.info.width - 1, sx + span);
  const d = Math.round(span * 0.35);
  const a = chord(img, sy - d, x0, x1, kind), b = chord(img, sy + d, x0, x1, kind);
  // half^2 + (y - cy)^2 = r^2 for both rows
  const y1 = sy - d, y2 = sy + d;
  const cy = (b.half ** 2 - a.half ** 2 + y2 ** 2 - y1 ** 2) / (2 * (y2 - y1));
  const r = Math.sqrt(a.half ** 2 + (y1 - cy) ** 2);
  return { cx: (a.mid + b.mid) / 2, cy, r };
}

async function cut(file, { cx, cy, r }, name, sizes, inset = 2) {
  const rr = r - inset;
  const left = Math.round(cx - rr), top = Math.round(cy - rr), d = Math.round(rr * 2);
  for (const size of sizes) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
    await sharp(file)
      .extract({ left, top, width: d, height: d })
      .resize(size, size, { kernel: 'lanczos3' })
      .ensureAlpha()
      .composite([{ input: mask, blend: 'dest-in' }])
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(join(out, `${name}-${size}.webp`));
  }
  console.log(name, { cx, cy, r, crop: d });
}

const primaryFile = join(brand, 'ieee-sooners-primary.png');
const secondaryFile = join(brand, 'ieee-sooners-secondary.png');
const altFile = join(brand, 'ieee-sooners-alternates.png');

// The outer ring is the brand colour; seed just inside the left rim on the centre row.
const p = await load(primaryFile);
const pm = measure(p, 560, 1179, 'blue', 520);
await cut(primaryFile, pm, 'primary', [960, 320, 96]);

const s = await load(secondaryFile);
const sm = measure(s, 560, 1179, 'red', 520);
await cut(secondaryFile, sm, 'secondary', [960, 320, 96]);

// Alternates: 3 × 2 grid of badge centres in the 1125px screenshot (white badge skipped).
const a = await load(altFile);
const alts = [
  ['alt-crimson', 187, 953, 'red'],
  ['alt-blue', 562, 953, 'blue'],
  ['alt-red', 937, 953, 'red'],
  ['alt-black', 187, 1331, 'black'],
  ['alt-red-outline', 937, 1331, 'red'],
];
for (const [name, x, y, kind] of alts) {
  const m = measure(a, x, y, kind, 190);
  await cut(altFile, m, name, [256], 1);
}
