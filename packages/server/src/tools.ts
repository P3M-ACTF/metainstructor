import { execFile } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runExifTool(
  buffer: Buffer,
  filename: string,
): Promise<Record<string, string>> {
  const dir = mkdtempSync(join(tmpdir(), 'metapeek-'));
  const filepath = join(dir, filename);
  writeFileSync(filepath, buffer);

  try {
    const { stdout } = await execFileAsync('exiftool', ['-json', '-a', '-G1', filepath], {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as Record<string, unknown>[];
    const result: Record<string, string> = {};
    if (parsed[0]) {
      for (const [key, value] of Object.entries(parsed[0])) {
        if (key !== 'SourceFile' && value != null) {
          result[key] = String(value);
        }
      }
    }
    return result;
  } finally {
    try {
      unlinkSync(filepath);
      unlinkSync(filepath + '_original');
    } catch {
      /* ignore cleanup errors */
    }
  }
}

export async function runFfprobe(buffer: Buffer, filename: string): Promise<Record<string, string>> {
  const dir = mkdtempSync(join(tmpdir(), 'metapeek-'));
  const filepath = join(dir, filename);
  writeFileSync(filepath, buffer);

  try {
    const { stdout } = await execFileAsync(
      'ffprobe',
      ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filepath],
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout) as {
      format?: Record<string, unknown>;
      streams?: Record<string, unknown>[];
    };
    const result: Record<string, string> = {};
    if (parsed.format) {
      for (const [key, value] of Object.entries(parsed.format)) {
        if (value != null && typeof value !== 'object') result[`format.${key}`] = String(value);
      }
    }
    parsed.streams?.forEach((stream, i) => {
      for (const [key, value] of Object.entries(stream)) {
        if (value != null && typeof value !== 'object') {
          result[`stream${i}.${key}`] = String(value);
        }
      }
    });
    return result;
  } finally {
    try {
      unlinkSync(filepath);
    } catch {
      /* ignore */
    }
  }
}

export function isExifToolEnabled(): boolean {
  return process.env.ENABLE_EXIFTOOL !== 'false';
}
