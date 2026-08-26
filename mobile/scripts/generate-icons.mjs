/**
 * Rasterises the SVG sources under `assets/icon/` into every PNG size that
 * Android and iOS need. Idempotent — safe to re-run any time you tweak the
 * source SVGs.
 *
 *   npm run icons
 *
 * Requires: sharp (installed as a dev dep in mobile/).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(here, '..');
const src = path.join(mobileRoot, 'assets', 'icon');

const androidRes = path.join(mobileRoot, 'android', 'app', 'src', 'main', 'res');
const iosAppIcon = path.join(mobileRoot, 'ios', 'selfcare', 'Images.xcassets', 'AppIcon.appiconset');

// Android launcher icon (legacy square + round). Sizes are per density bucket.
const ANDROID_MIPMAPS = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// Adaptive icon foreground/background — always 108dp × 108dp, one file per density.
// The design's safe zone is the inner 66/108 ≈ 61%.
const ANDROID_ADAPTIVE = ANDROID_MIPMAPS;

// iOS icon slots, per Apple's asset spec. We render a single 1024 and let
// Xcode pick sub-sizes — but including a few common ones inline lets the
// project run without Xcode intervention.
const IOS_ICONS = [
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 },
];

async function rasterise(svgPath, outPath, size) {
  const svg = await fs.readFile(svgPath);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(svg, { density: 384 }).resize(size, size, { fit: 'contain' }).png().toFile(outPath);
}

async function makeRoundMask(size) {
  // Circle mask used to build ic_launcher_round.png from the opaque icon.
  const svg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`;
  return Buffer.from(svg);
}

async function generateAndroidLegacy() {
  const opaqueSvg = path.join(src, 'icon.svg');
  for (const { dir, size } of ANDROID_MIPMAPS) {
    const outDir = path.join(androidRes, dir);
    await rasterise(opaqueSvg, path.join(outDir, 'ic_launcher.png'), size);
    // Round variant: composite the same PNG through a circular mask.
    const roundOut = path.join(outDir, 'ic_launcher_round.png');
    const base = await sharp(await fs.readFile(opaqueSvg), { density: 384 })
      .resize(size, size)
      .png()
      .toBuffer();
    await sharp(base)
      .composite([{ input: await makeRoundMask(size), blend: 'dest-in' }])
      .toFile(roundOut);
    console.log(`✓ ${dir}/ic_launcher(_round).png @ ${size}px`);
  }
}

async function generateAndroidAdaptive() {
  const fg = path.join(src, 'icon-foreground.svg');
  const bg = path.join(src, 'icon-background.svg');
  const mono = path.join(src, 'icon-monochrome.svg');
  for (const { dir, size } of ANDROID_ADAPTIVE) {
    const outDir = path.join(androidRes, dir);
    await rasterise(fg, path.join(outDir, 'ic_launcher_foreground.png'), size);
    await rasterise(bg, path.join(outDir, 'ic_launcher_background.png'), size);
    await rasterise(mono, path.join(outDir, 'ic_launcher_monochrome.png'), size);
    console.log(`✓ ${dir}/ic_launcher_{foreground,background,monochrome}.png @ ${size}px`);
  }
}

async function generateIos() {
  const svgPath = path.join(src, 'icon.svg');
  try {
    await fs.access(iosAppIcon);
  } catch {
    console.log(`(skipping iOS — ${path.relative(mobileRoot, iosAppIcon)} not found)`);
    return;
  }
  for (const { name, size } of IOS_ICONS) {
    await rasterise(svgPath, path.join(iosAppIcon, name), size);
    console.log(`✓ ios/${name} @ ${size}px`);
  }
}

async function main() {
  console.log('Generating icons from assets/icon/*.svg …');
  await generateAndroidLegacy();
  await generateAndroidAdaptive();
  await generateIos();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
