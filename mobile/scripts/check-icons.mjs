/**
 * Sanity check before `npm run android`. Verifies every launcher-icon PNG
 * that Android's build expects to find in `res/mipmap-*` is present. If any
 * are missing, silently regenerates from `assets/icon/*.svg` so the build
 * doesn't fail with a cryptic AAPT resource-not-found error.
 *
 * `gradle clean` does not touch these files (they live in `src/main/res/`,
 * not `build/`), so this only fires if someone deletes them by hand or a
 * merge drops one.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(here, '..');
const res = path.join(mobileRoot, 'android', 'app', 'src', 'main', 'res');

const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const FILES_PER_DENSITY = [
  'ic_launcher.png',
  'ic_launcher_round.png',
  'ic_launcher_foreground.png',
  'ic_launcher_background.png',
  'ic_launcher_monochrome.png',
];

const missing = [];
for (const d of DENSITIES) {
  for (const f of FILES_PER_DENSITY) {
    const p = path.join(res, `mipmap-${d}`, f);
    if (!fs.existsSync(p)) missing.push(path.relative(mobileRoot, p));
  }
}

// Adaptive-icon XML wrappers (referenced by the launcher on Android 26+).
const ADAPTIVE_XMLS = [
  path.join(res, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
  path.join(res, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'),
];
for (const p of ADAPTIVE_XMLS) {
  if (!fs.existsSync(p)) missing.push(path.relative(mobileRoot, p));
}

if (missing.length === 0) {
  process.exit(0);
}

console.log(
  `[check-icons] ${missing.length} icon file(s) missing — regenerating from SVG:`
);
for (const m of missing.slice(0, 5)) console.log(`  · ${m}`);
if (missing.length > 5) console.log(`  · … and ${missing.length - 5} more`);

// generate-icons.mjs runs `main()` at import time, so this triggers regen.
await import('./generate-icons.mjs');
