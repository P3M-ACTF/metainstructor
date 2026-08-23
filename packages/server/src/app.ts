import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyzeBuffer, createSection } from '@metapeek/core';
import type { MetadataResult } from '@metapeek/core';
import { runExifTool, runFfprobe, isExifToolEnabled } from './tools.js';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? '52428800', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*';
      if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) return origin;
      return ALLOWED_ORIGINS[0];
    },
  }),
);

app.get('/health', (c) => c.json({ status: 'ok', exiftool: isExifToolEnabled() }));

app.post('/fetch', async (c) => {
  try {
    const body = await c.req.json<{ url: string }>();
    if (!body.url) return c.json({ error: 'Missing url' }, 400);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(body.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MetaPeek-Server/0.1' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return c.json({ error: `Fetch failed: ${response.status}` }, 502);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return c.json({ error: `File too large (max ${MAX_FILE_SIZE} bytes)` }, 413);
    }

    const urlPath = new URL(body.url).pathname;
    const filename = urlPath.split('/').pop() || 'download';
    const contentType = response.headers.get('content-type')?.split(';')[0] ?? undefined;

    const result = await analyzeWithTools(buffer, filename, 'url', contentType);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

app.post('/analyze', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Missing file in form data' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return c.json({ error: `File too large (max ${MAX_FILE_SIZE} bytes)` }, 413);
    }

    const result = await analyzeWithTools(buffer, file.name, 'file');
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

async function analyzeWithTools(
  buffer: Buffer,
  filename: string,
  source: MetadataResult['source'],
  mimeHint?: string,
): Promise<MetadataResult> {
  const result = await analyzeBuffer(buffer, { filename, source });

  if (mimeHint && result.mime === 'application/octet-stream') {
    result.mime = mimeHint;
  }

  if (isExifToolEnabled()) {
    try {
      const exifData = await runExifTool(buffer, filename);
      if (Object.keys(exifData).length) {
        result.sections.push(createSection('exiftool', 'ExifTool (extended)', exifData));
      }
    } catch {
      result.warnings.push('ExifTool not available or failed');
    }

    if (result.mime.startsWith('video/')) {
      try {
        const probeData = await runFfprobe(buffer, filename);
        if (Object.keys(probeData).length) {
          result.sections.push(createSection('ffprobe', 'ffprobe', probeData));
        }
      } catch {
        result.warnings.push('ffprobe not available or failed');
      }
    }
  }

  return result;
}

export default app;
