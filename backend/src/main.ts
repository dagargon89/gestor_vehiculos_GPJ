import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { appendFileSync } from 'fs';
import { join } from 'path';

const workspaceRoot = process.cwd().endsWith('backend') ? join(process.cwd(), '..') : process.cwd();
const DEBUG_LOG = join(workspaceRoot, '.cursor', 'debug.log');
function debugLog(payload: Record<string, unknown>) {
  try {
    appendFileSync(DEBUG_LOG, JSON.stringify({ ...payload, timestamp: Date.now() }) + '\n');
  } catch {}
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];
  // #region agent log
  const startupPayload = { location: 'main.ts:bootstrap', message: 'CORS allowedOrigins at startup', data: { allowedOrigins, FRONTEND_URL: process.env.FRONTEND_URL ?? null }, hypothesisId: 'H5' };
  debugLog(startupPayload);
  fetch('http://127.0.0.1:7242/ingest/3ec9a792-d3fe-4b48-a3aa-58c6198082d5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...startupPayload, timestamp: Date.now() }) }).catch(() => {});
  app.use((req: { method: string; url: string; headers: { origin?: string } }, _res: unknown, next: () => void) => {
    const reqPayload = { location: 'main.ts:middleware', message: 'Request received', data: { method: req.method, url: req.url, origin: req.headers?.origin ?? '(none)' }, hypothesisId: 'H1,H4' };
    debugLog(reqPayload);
    fetch('http://127.0.0.1:7242/ingest/3ec9a792-d3fe-4b48-a3aa-58c6198082d5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...reqPayload, timestamp: Date.now() }) }).catch(() => {});
    next();
  });
  // #endregion
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = !origin || allowedOrigins.includes(origin);
      // #region agent log
      const corsPayload = { location: 'main.ts:cors', message: 'CORS origin callback', data: { origin: origin ?? '(none)', allowed, inList: origin ? allowedOrigins.includes(origin) : 'no-origin' }, hypothesisId: 'H2' };
      debugLog(corsPayload);
      fetch('http://127.0.0.1:7242/ingest/3ec9a792-d3fe-4b48-a3aa-58c6198082d5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...corsPayload, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
      if (allowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
