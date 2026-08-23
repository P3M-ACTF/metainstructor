import type { AnalyzeOptions, MetadataResult } from './types.js';
import { detectMime, computeHashes } from './utils/helpers.js';
import { extractImage } from './extractors/image.js';
import { extractAudio } from './extractors/audio.js';
import { extractPdf } from './extractors/pdf.js';
import { extractOffice, isOfficeMime } from './extractors/office.js';
import { extractHtml } from './extractors/html.js';
import { extractVideo, isVideoMime } from './extractors/video.js';
import { extractGeneric } from './extractors/generic.js';

export async function analyzeBuffer(
  buffer: Buffer | Uint8Array,
  options: AnalyzeOptions = {},
): Promise<MetadataResult> {
  const mime =
    options.filename?.endsWith('.html') || options.filename?.endsWith('.htm')
      ? 'text/html'
      : await detectMime(buffer);

  const source = options.source ?? 'file';
  const includeHashes = options.includeHashes ?? true;
  const warnings: string[] = [];
  const sections: MetadataResult['sections'] = [];

  let typeSpecific: { sections: MetadataResult['sections']; warnings: string[] };

  if (mime.startsWith('image/')) {
    typeSpecific = await extractImage(buffer, options);
  } else if (mime.startsWith('audio/')) {
    typeSpecific = await extractAudio(buffer, options);
  } else if (mime === 'application/pdf') {
    typeSpecific = await extractPdf(buffer, options);
  } else if (isOfficeMime(mime)) {
    typeSpecific = await extractOffice(buffer, options);
  } else if (mime.startsWith('text/html') || source === 'html') {
    typeSpecific = await extractHtml(buffer, options);
  } else if (isVideoMime(mime)) {
    typeSpecific = await extractVideo(buffer, options);
  } else {
    typeSpecific = await extractGeneric(buffer, options);
  }

  sections.push(...typeSpecific.sections);
  warnings.push(...typeSpecific.warnings);

  const result: MetadataResult = {
    source,
    mime,
    filename: options.filename,
    extractedAt: new Date().toISOString(),
    sections,
    warnings,
  };

  if (includeHashes) {
    result.hashes = await computeHashes(buffer);
  }

  return result;
}

export async function analyzeHtmlString(
  html: string,
  options: AnalyzeOptions = {},
): Promise<MetadataResult> {
  return analyzeBuffer(Buffer.from(html, 'utf-8'), {
    ...options,
    source: 'html',
    filename: options.filename ?? 'input.html',
  });
}

export * from './types.js';
export { detectMime, computeHashes, createSection, formatValue } from './utils/helpers.js';
export { extractImage } from './extractors/image.js';
export { extractAudio } from './extractors/audio.js';
export { extractPdf } from './extractors/pdf.js';
export { extractOffice, isOfficeMime } from './extractors/office.js';
export { extractHtml } from './extractors/html.js';
export { extractVideo, isVideoMime } from './extractors/video.js';
export { extractGeneric } from './extractors/generic.js';
