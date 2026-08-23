#!/usr/bin/env node
import { Command } from 'commander';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { analyzeInput } from './analyze.js';
import { formatOutput, type OutputFormat } from './format.js';

const program = new Command();
const __dirname = dirname(fileURLToPath(import.meta.url));

program
  .name('metapeek')
  .description('Analyze file metadata locally — images, PDF, audio, Office, HTML')
  .version('0.1.0');

program
  .argument('[input]', 'File path or URL to analyze')
  .option('-f, --format <format>', 'Output format: json, table, csv', 'table')
  .option('-s, --server <url>', 'MetaPeek server URL for remote URL analysis')
  .action(async (input: string | undefined, opts: { format: string; server?: string }) => {
    if (!input) {
      program.help();
      return;
    }

    try {
      const result = await analyzeInput(input, opts.server);
      const format = (['json', 'table', 'csv'].includes(opts.format) ? opts.format : 'table') as OutputFormat;
      console.log(formatOutput(result, format));
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Serve the MetaPeek web UI (and optionally the backend server)')
  .option('-p, --port <port>', 'Web UI port', '5173')
  .option('--with-server', 'Also start the backend server on port 8787')
  .option('--server-port <port>', 'Backend server port', '8787')
  .action(async (opts: { port: string; withServer?: boolean; serverPort: string }) => {
    const webDir = join(__dirname, '../../web/dist');
    const port = parseInt(opts.port, 10);

    if (!existsSync(webDir)) {
      console.error('Web UI not built. Run: pnpm --filter @metapeek/web build');
      process.exit(1);
    }

    if (opts.withServer) {
      const serverPath = join(__dirname, '../../server/dist/index.js');
      if (!existsSync(serverPath)) {
        console.error('Server not built. Run: pnpm --filter @metapeek/server build');
        process.exit(1);
      }
      spawn('node', [serverPath], {
        env: { ...process.env, PORT: opts.serverPort },
        stdio: 'inherit',
        shell: true,
      });
      console.log(`Backend server starting on http://localhost:${opts.serverPort}`);
    }

    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.json': 'application/json',
      '.woff2': 'font/woff2',
    };

    const server = createServer((req, res) => {
      let filePath = join(webDir, req.url === '/' ? 'index.html' : req.url ?? '');
      if (!existsSync(filePath) || !filePath.startsWith(webDir)) {
        filePath = join(webDir, 'index.html');
      }
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      const contentType = mimeTypes[ext] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(readFileSync(filePath));
    });

    server.listen(port, () => {
      console.log(`MetaPeek web UI at http://localhost:${port}`);
    });
  });

program.parse();
