/**
 * imageSignature.ts
 * Verifies uploaded bytes really are the image format they claim to be, by
 * reading the file's magic-number signature — not the client-supplied
 * filename extension or `Content-Type` header, both of which are trivial to
 * spoof or can be wrong for an innocent reason (e.g. a proxy/redirect
 * returning an HTML error page for what should have been an image download,
 * which would otherwise get saved to disk as `avatar-<ts>.jpg`).
 *
 * Used to gate every avatar / image write (direct upload, bulk-import
 * avatar-from-URL) so a non-image can never reach `/uploads/**` with an
 * image extension in the first place.
 */

export type DetectedImage = { ext: 'jpg' | 'png' | 'webp'; mime: string };

const isJpeg = (b: Buffer) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const isPng = (b: Buffer) =>
  b.length >= 8 &&
  b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
  b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
const isWebp = (b: Buffer) =>
  b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';

/** Sniffs the real image type from its first bytes; `null` if it isn't one of JPEG/PNG/WebP. */
export function detectImageType(buffer: Buffer): DetectedImage | null {
  if (isPng(buffer)) return { ext: 'png', mime: 'image/png' };
  if (isJpeg(buffer)) return { ext: 'jpg', mime: 'image/jpeg' };
  if (isWebp(buffer)) return { ext: 'webp', mime: 'image/webp' };
  return null;
}

/** True when the buffer's first bytes match a well-formed JPEG/PNG/WebP signature. */
export function isValidImageBuffer(buffer: Buffer): boolean {
  return detectImageType(buffer) !== null;
}
