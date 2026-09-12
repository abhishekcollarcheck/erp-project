/**
 * uploadPaths.ts
 * Single source of truth for resolving where uploaded files (avatars, IDs &
 * Bank scans, resumes, company logos, …) live on disk, and the public URL
 * that maps to them.
 *
 * Root cause this exists to prevent — "works locally, breaks in production":
 *   1. Several upload handlers built their directory with
 *      `path.join(process.cwd(), 'uploads', …)`, hardcoding the literal
 *      `'uploads'` segment instead of reading `env.upload.dir` — while the
 *      static file server (`app.ts`) and other handlers read `env.upload.dir`.
 *      The moment `UPLOAD_DIR` is set to anything other than the bare string
 *      `"uploads"` (exactly what a real deployment needs, since production
 *      commonly points uploads at a persistent volume that survives a
 *      redeploy — the working tree itself does not), the two disagree and
 *      every previously-working file 404s.
 *   2. `path.join(process.cwd(), env.upload.dir)` is ALSO wrong once
 *      `UPLOAD_DIR` is an absolute path: `path.join` does not treat a later
 *      absolute segment as a reset point (only `path.resolve` does), so
 *      `path.join('/srv/app', '/data/uploads')` incorrectly yields
 *      `/srv/app/data/uploads`, not `/data/uploads`.
 *   3. `process.cwd()` itself is not production-safe: PM2 / systemd / a CI
 *      runner can launch the Node process from a different working directory
 *      than a developer running `npm run dev` from the project root — so an
 *      otherwise-correct relative path can silently resolve somewhere else
 *      entirely. Anchoring to `__dirname` (this file's on-disk location)
 *      instead is deterministic regardless of how/where the process was
 *      started.
 *
 * Every upload read/write path in the codebase should go through
 * `uploadRoot()` / `uploadDir()` / `uploadUrl()` below — never re-derive it
 * with `process.cwd()` or a hardcoded `'uploads'` literal.
 */
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// This file compiles to `dist/utils/uploadPaths.js` (and runs from
// `src/utils/uploadPaths.ts` under ts-node) — either way it sits exactly two
// directories below the backend project root, so this resolves correctly in
// both dev and the compiled production build without depending on how the
// process was launched.
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Absolute path to the upload root. Honours an absolute `UPLOAD_DIR` as-is
 * (e.g. a mounted persistent volume outside the deploy directory); a bare
 * folder name (the default, `"uploads"`) resolves under the backend root,
 * not `process.cwd()`.
 */
export function uploadRoot(): string {
  const configured = env.upload.dir;
  return path.isAbsolute(configured) ? configured : path.resolve(BACKEND_ROOT, configured);
}

/** Absolute filesystem path under the upload root, creating it if missing. */
export function uploadDir(...segments: string[]): string {
  const dir = path.join(uploadRoot(), ...segments);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  return dir;
}

/** Public `/uploads/...` URL path stored in the DB for a given file. */
export function uploadUrl(...segments: string[]): string {
  return `/uploads/${segments.join('/')}`;
}

/**
 * Writes a buffer under the upload root and chmods it world-readable
 * (0o644) regardless of the process umask, so a static file server or a
 * reverse proxy running as a different OS user can still read it.
 */
export function writeUploadFile(absoluteDir: string, filename: string, data: Buffer): string {
  const filePath = path.join(absoluteDir, filename);
  fs.writeFileSync(filePath, data);
  try { fs.chmodSync(filePath, 0o644); } catch { /* best-effort on platforms without POSIX modes */ }
  return filePath;
}
