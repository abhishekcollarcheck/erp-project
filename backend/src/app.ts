import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './config/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { uploadRoot } from './utils/uploadPaths';

const app = express();
app.set('trust proxy', 1);
// ─── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.cors.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id'],
}));

// ─── Rate Limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Auth endpoints: stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: 'Too many login attempts.', data: null },
});
app.use('/api/auth/login', authLimiter);

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Request Logging ─────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (_req, res) => res.statusCode < 400 && env.isProduction,
}));

// ─── Static Files ────────────────────────────────────────────
// `uploadRoot()` is the SAME resolver every upload handler writes through
// (see utils/uploadPaths.ts) — anchored to this file's on-disk location and
// UPLOAD_DIR, never `process.cwd()`, so write and serve can never drift apart
// in production. Uploaded avatars/scans/logos are meant to be publicly
// fetchable by URL (including cross-origin, e.g. a proxied Next.js host) —
// relax helmet's default same-origin Cross-Origin-Resource-Policy for them.
logger.info(`Serving /uploads from ${uploadRoot()}`);
app.use('/uploads', express.static(uploadRoot(), {
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;