import { serve } from '@hono/node-server';
import app from './app.js';

const port = parseInt(process.env.PORT ?? '8787', 10);

console.log(`MetaPeek server listening on http://localhost:${port}`);
console.log(`  MAX_FILE_SIZE: ${process.env.MAX_FILE_SIZE ?? '52428800'}`);
console.log(`  ENABLE_EXIFTOOL: ${process.env.ENABLE_EXIFTOOL ?? 'true'}`);
console.log(`  ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173'}`);

serve({ fetch: app.fetch, port });
