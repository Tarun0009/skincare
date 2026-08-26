/**
 * Rewrites every `codegenNativeComponent('Foo')` call in
 * `react-native-svg/lib/module/fabric/*.js` to the classic Paper equivalent
 * `requireNativeComponent('Foo')`.
 *
 * Why: react-native-svg 15.8 only ships Fabric-flavoured JS. When the app is
 * built with New Architecture disabled, Babel's codegen plugin still tries
 * to parse those calls and fails ("Could not find component config for
 * native component") because the type annotation was stripped during the
 * library's own build step. Swapping the runtime call is enough — the Java
 * side has a Paper view manager registered under the same name.
 *
 * Run automatically after `npm install` via patch-package's own hooks —
 * or invoke `npm run patch:svg` manually if you need to reapply after
 * mucking with node_modules.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('node_modules/react-native-svg/lib/module/fabric');
if (!fs.existsSync(root)) {
  console.error(`No fabric dir at ${root} — is react-native-svg installed?`);
  process.exit(1);
}

const files = fs.readdirSync(root).filter((f) => f.endsWith('.js'));
let patched = 0;

for (const file of files) {
  const full = path.join(root, file);
  const src = fs.readFileSync(full, 'utf8');
  if (!src.includes('codegenNativeComponent')) continue;
  const next = src
    .replace(
      /import codegenNativeComponent from 'react-native\/Libraries\/Utilities\/codegenNativeComponent';?/,
      "import { requireNativeComponent } from 'react-native';"
    )
    .replace(/codegenNativeComponent\(/g, 'requireNativeComponent(');
  if (next !== src) {
    fs.writeFileSync(full, next);
    patched++;
  }
}

console.log(`Rewrote codegenNativeComponent -> requireNativeComponent in ${patched} file(s).`);
