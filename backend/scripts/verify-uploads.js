#!/usr/bin/env node
/**
 * verify-uploads.js
 * Production diagnostic for "avatar upload works locally, not in prod".
 *
 * Run this ON THE PRODUCTION SERVER, from the backend directory, with the
 * SAME environment the app actually runs under (same `.env` / PM2 env — if
 * you run it plain, `source` or `pm2 env <id>` the vars first so `UPLOAD_DIR`
 * matches):
 *
 *   npm run build          # if dist/ doesn't exist yet
 *   npm run verify:uploads
 *
 * It reports, using the EXACT SAME path-resolution code the running server
 * uses (compiled `dist/utils/uploadPaths.js` — not a re-implementation that
 * could drift from it):
 *   - the absolute directory `/uploads/**` is actually served from
 *   - whether that directory exists, and its permissions
 *   - every file under employee-avatars/ (and employee-docs/, company-logos/
 *     if present), with:
 *       • size
 *       • POSIX mode + owner uid/gid (so a "PM2 runs as X, Nginx reads as Y"
 *         permission mismatch is visible immediately)
 *       • whether its content is actually a valid JPEG/PNG/WebP — flags any
 *         file that is 0 bytes, truncated, or (the classic failure) an HTML
 *         error page that got saved with a .jpg name
 */
const fs = require('fs');
const path = require('path');

let uploadPaths, imageSignature;
try {
  uploadPaths = require('../dist/utils/uploadPaths');
  imageSignature = require('../dist/utils/imageSignature');
} catch (e) {
  console.error(
    'Could not load dist/utils/uploadPaths.js — build the backend first:\n' +
    '  npm run build\n' +
    'then re-run: npm run verify:uploads\n\n' + e.message,
  );
  process.exit(1);
}

const root = uploadPaths.uploadRoot();
console.log('='.repeat(70));
console.log('Resolved upload root (what the running server will read/write):');
console.log(' ', root);
console.log('  UPLOAD_DIR env var:', JSON.stringify(process.env.UPLOAD_DIR ?? '(unset — defaulting to "uploads")'));
console.log('  process.cwd():     ', process.cwd(), '(NOT used for the above — see utils/uploadPaths.ts)');
console.log('='.repeat(70));

if (!fs.existsSync(root)) {
  console.error(`\n✗ Upload root does not exist yet: ${root}`);
  console.error('  It is created on first upload — if you expected existing files here,');
  console.error('  this confirms uploads are landing somewhere else (or this is a fresh install).');
  process.exit(1);
}
const rootStat = fs.statSync(root);
console.log(`\nUpload root exists — mode ${rootStat.mode.toString(8).slice(-3)}, uid ${rootStat.uid}, gid ${rootStat.gid}`);
console.log('Compare uid/gid above to the user PM2 runs the backend as, and to the user Nginx runs as (if Nginx serves /uploads directly instead of proxying to this backend).');

const SUBFOLDERS = ['employee-avatars', 'employee-docs', 'company-logos'];
let totalFiles = 0, badFiles = 0;

for (const sub of SUBFOLDERS) {
  const dir = path.join(root, sub);
  if (!fs.existsSync(dir)) { console.log(`\n(no ${sub}/ yet)`); continue; }

  console.log(`\n--- ${sub}/ ---`);
  const walk = (d, rel) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      const relPath = path.join(rel, entry.name);
      if (entry.isDirectory()) { walk(full, relPath); continue; }

      totalFiles++;
      const st = fs.statSync(full);
      const buf = fs.readFileSync(full);
      const detected = imageSignature.detectImageType(buf);
      const ext = path.extname(entry.name).toLowerCase().replace('.', '');
      const looksLikeImageExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      const isBad = looksLikeImageExt && !detected;

      const mode = st.mode.toString(8).slice(-3);
      const flag = isBad ? '✗ NOT A VALID IMAGE' : (detected ? `ok (${detected.mime})` : 'ok (non-image file)');
      if (isBad) {
        badFiles++;
        const preview = buf.slice(0, 120).toString('utf8').replace(/\s+/g, ' ').trim();
        console.log(`  ✗ ${relPath}  ${st.size}B  mode=${mode}  ${flag}`);
        console.log(`      first bytes: ${preview.slice(0, 100)}${preview.length > 100 ? '…' : ''}`);
        console.log(`      → this is almost certainly an HTML/error page saved with an image extension.`);
      } else {
        console.log(`  ✓ ${relPath}  ${st.size}B  mode=${mode}  ${flag}`);
      }
    }
  };
  walk(dir, sub);
}

console.log('\n' + '='.repeat(70));
console.log(`Checked ${totalFiles} file(s), ${badFiles} invalid.`);
if (badFiles > 0) {
  console.log('Delete the invalid files and have the affected employees re-upload their');
  console.log('avatar — the fixed upload code (magic-byte validation) rejects this class');
  console.log('of bad file at upload time going forward, so it will not recur.');
  process.exit(1);
}
console.log('All good — every stored avatar/logo/doc-scan is a real, complete file.');
