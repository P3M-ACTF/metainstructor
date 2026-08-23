import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { analyzeBuffer } from '@metapeek/core';
import type { MetadataResult } from '@metapeek/core';

export async function analyzeLocalFile(filepath: string): Promise<MetadataResult> {
  const buffer = readFileSync(filepath);
  const stats = statSync(filepath);
  return analyzeBuffer(buffer, {
    filename: basename(filepath),
    source: 'file',
    fileStats: { size: stats.size, mtime: stats.mtime, ctime: stats.birthtime },
  });
}

export async function analyzeRemoteUrl(url: string, serverUrl: string): Promise<MetadataResult> {
  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Server error (${response.status}): ${err}`);
  }

  return response.json() as Promise<MetadataResult>;
}

export async function analyzeInput(
  input: string,
  serverUrl?: string,
): Promise<MetadataResult> {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    if (!serverUrl) {
      throw new Error(
        'URL analysis requires --server flag pointing to MetaPeek server.\n' +
          'Run: docker compose up (in metapeek/) or metapeek serve --with-server',
      );
    }
    return analyzeRemoteUrl(input, serverUrl);
  }

  return analyzeLocalFile(input);
}
