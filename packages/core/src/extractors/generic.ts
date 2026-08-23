import type { AnalyzeOptions } from '../types.js';
import { createSection, addFileStatsSection } from '../utils/helpers.js';

export async function extractGeneric(
  buffer: Buffer | Uint8Array,
  options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  const general: Record<string, unknown> = {
    size: buffer.byteLength,
  };
  if (options.filename) general.filename = options.filename;

  sections.push(createSection('generic', 'File Info', general));

  const fsSection = addFileStatsSection(options);
  if (fsSection) sections.push(fsSection);

  return { sections, warnings };
}
