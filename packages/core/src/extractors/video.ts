import type { AnalyzeOptions } from '../types.js';
import { createSection } from '../utils/helpers.js';

export async function extractVideo(
  buffer: Buffer | Uint8Array,
  options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  const info: Record<string, unknown> = {
    size: buffer.byteLength,
    note: 'Basic container info only. Use server with ffprobe for detailed video metadata.',
  };

  if (options.filename) info.filename = options.filename;

  sections.push(createSection('video-basic', 'Video Container', info));
  warnings.push('Detailed video metadata requires ffprobe (use MetaPeek server with Docker)');

  return { sections, warnings };
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/');
}
