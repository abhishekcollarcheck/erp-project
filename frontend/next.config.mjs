/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';

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
