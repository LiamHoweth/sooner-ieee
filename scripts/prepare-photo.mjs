// Turns an original chapter photo into a web-ready WebP for assets/photos/chapter/.
//
//   node scripts/prepare-photo.mjs <original> <output.webp> [width] [crop] [brightness]
//
// - width: longest useful width in pixels (default 1600, like the other site photos).
// - crop: optional "x,y,w,h" in fractions of the original (e.g. "0.16,0.15,0.76,0.85"), or "-"
//   for none. Crop to the slot's aspect ratio when it is fixed (page heroes are 4:3) or when a
//   frame has a lot of empty wall or ceiling. Otherwise leave it and set `position` in
//   lib/photos.ts, because the CSS crops each slot differently per screen size.
// - brightness: optional multiplier for dim photos (e.g. 1.12).
//
// It applies the camera's rotation, then drops ALL metadata (EXIF, GPS location, camera serials)
// by re-encoding without it. iPhone HEIC and camera RAW files (ARW, DNG, CR2, NEF) are first
// converted with macOS `sips`, because sharp's prebuilt libvips can't decode them.
// Photos must have the chapter's OK to publish; see DESIGN.md §4.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const [input, output, widthArg, focusArg, brightnessArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/prepare-photo.mjs <original> <output.webp> [width] [x,y,w,h|-] [brightness]');
  process.exit(1);
}
const width = Number(widthArg ?? 1600);

let source = input;
let tempDir;
if (/\.(heic|heif|arw|dng|cr2|cr3|nef|raf|orf)$/i.test(input)) {
  if (process.platform !== 'darwin') {
    console.error('HEIC/RAW conversion uses macOS sips. Convert to JPEG first on other systems.');
    process.exit(1);
  }
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prepare-photo-'));
  source = path.join(tempDir, 'converted.tif');
  execFileSync('sips', ['-s', 'format', 'tiff', input, '--out', source], { stdio: 'ignore' });
}

try {
  // rotate() with no angle applies EXIF orientation, so the pixels end up upright.
  const upright = await sharp(source).rotate().toBuffer({ resolveWithObject: true });
  let pipeline = sharp(upright.data);
  if (focusArg && focusArg !== '-') {
    const [x, y, w, h] = focusArg.split(',').map(Number);
    const { width: W, height: H } = upright.info;
    pipeline = pipeline.extract({
      left: Math.round(x * W),
      top: Math.round(y * H),
      width: Math.round(w * W),
      height: Math.round(h * H),
    });
  }
  if (brightnessArg) pipeline = pipeline.modulate({ brightness: Number(brightnessArg) });
  // No withMetadata(): sharp writes no EXIF/XMP/ICC-identifying data by default.
  const info = await pipeline
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(output);
  console.log(`${path.basename(output)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
} finally {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
}
