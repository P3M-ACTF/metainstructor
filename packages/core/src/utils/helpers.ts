import { fileTypeFromBuffer } from 'file-type';
import { md5 } from 'js-md5';
import type { AnalyzeOptions } from '../types.js';

export async function detectMime(buffer: Buffer | Uint8Array): Promise<string> {
  const type = await fileTypeFromBuffer(buffer);
  return type?.mime ?? 'application/octet-stream';
}

function toUint8Array(buffer: Buffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeHashes(
  buffer: Buffer | Uint8Array,
): Promise<{ sha256: string; md5: string }> {
  const data = toUint8Array(buffer);
  const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
  return {
    sha256: toHex(sha256Buffer),
    md5: md5(data),
  };
}

export function createSection(
  id: string,
  label: string,
  fields: Record<string, unknown>,
): { id: string; label: string; fields: { key: string; value: string; raw?: unknown }[] } {
  const entries = Object.entries(fields).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  return {
    id,
    label,
    fields: entries.map(([key, value]) => ({
      key,
      value: formatValue(value),
      raw: value,
    })),
  };
}

export function formatValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function addFileStatsSection(
  options: AnalyzeOptions,
): { id: string; label: string; fields: { key: string; value: string }[] } | null {
  if (!options.fileStats) return null;
  const fields: Record<string, unknown> = {
    size: options.fileStats.size,
  };
  if (options.fileStats.mtime) fields.modified = options.fileStats.mtime;
  if (options.fileStats.ctime) fields.created = options.fileStats.ctime;
  return createSection('filesystem', 'Filesystem', fields);
}

export function isMime(mime: string, patterns: string[]): boolean {
  return patterns.some((p) => mime === p || mime.startsWith(p.replace('*', '')));
}
