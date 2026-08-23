import { parseBuffer } from 'music-metadata';
import type { AnalyzeOptions } from '../types.js';
import { createSection } from '../utils/helpers.js';

export async function extractAudio(
  buffer: Buffer | Uint8Array,
  options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  try {
    const metadata = await parseBuffer(Buffer.from(buffer), {
      mimeType: options.filename?.endsWith('.flac') ? 'audio/flac' : undefined,
    });

    const format: Record<string, unknown> = {};
    if (metadata.format.container) format.container = metadata.format.container;
    if (metadata.format.codec) format.codec = metadata.format.codec;
    if (metadata.format.duration) format.duration = `${metadata.format.duration.toFixed(2)}s`;
    if (metadata.format.bitrate) format.bitrate = `${metadata.format.bitrate} bps`;
    if (metadata.format.sampleRate) format.sampleRate = `${metadata.format.sampleRate} Hz`;
    if (metadata.format.numberOfChannels) format.channels = metadata.format.numberOfChannels;

    const tags: Record<string, unknown> = {};
    const common = metadata.common;
    if (common.title) tags.title = common.title;
    if (common.artist) tags.artist = common.artist;
    if (common.album) tags.album = common.album;
    if (common.albumartist) tags.albumArtist = common.albumartist;
    if (common.year) tags.year = common.year;
    if (common.genre?.length) tags.genre = common.genre.join(', ');
    if (common.track?.no) tags.track = common.track.no;
    if (common.comment?.length) tags.comment = common.comment.map((c) => c.text).join('; ');

    if (Object.keys(format).length) sections.push(createSection('audio-format', 'Audio Format', format));
    if (Object.keys(tags).length) sections.push(createSection('id3-tags', 'ID3 Tags', tags));
    if (!Object.keys(format).length && !Object.keys(tags).length) {
      warnings.push('No audio metadata found');
    }
  } catch (err) {
    warnings.push(`Audio extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { sections, warnings };
}
