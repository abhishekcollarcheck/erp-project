/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';

// `BACKEND` decides where EVERY `/uploads/**` request is proxied to — both a
// plain `<img src="/uploads/…">` and, just as importantly, `next/image`'s own
// server-side fetch when it optimizes a local (root-relative) `src` (it goes
// through this same rewrite, not the browser). If `NEXT_PUBLIC_URL` isn't set
// on the machine actually running `next start` in production, this silently
// falls back to `http://localhost:5000`, which is only correct when the
// frontend and backend happen to share that host/port. Getting this wrong
// is the single most common reason avatars/images work in local dev (where
// the fallback happens to be right) and 404/500 in production. Warn loudly
// at server startup instead of failing silently at request time.
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_URL) {
  console.warn(
    '[next.config] NEXT_PUBLIC_URL is not set — /uploads/** (avatars, scans, logos) ' +
    `will be proxied to the default "${BACKEND}", which is almost certainly wrong in ` +
    'production. Set NEXT_PUBLIC_URL to the backend URL reachable from THIS server ' +
    '(e.g. http://127.0.0.1:5000 if the backend runs on the same host) in the ' +
    "frontend's production env before starting the app."
  );
}

const nextConfig = {
  reactStrictMode: true,

  // Uploaded files (avatars, document scans, …) are written to and served by
  // the backend at `<backend>/uploads/**`, but the DB stores them as
  // origin-relative paths (`/uploads/…`). Proxy those through the frontend so
  // `<img src="/uploads/…">` resolves without hard-coding the backend host in
  // components.
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
