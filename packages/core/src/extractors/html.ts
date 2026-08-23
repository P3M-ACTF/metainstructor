import * as cheerio from 'cheerio';
import type { AnalyzeOptions } from '../types.js';
import { createSection } from '../utils/helpers.js';

export async function extractHtml(
  buffer: Buffer | Uint8Array,
  _options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  try {
    const html = Buffer.from(buffer).toString('utf-8');
    const $ = cheerio.load(html);

    const general: Record<string, unknown> = {};
    const og: Record<string, unknown> = {};
    const twitter: Record<string, unknown> = {};

    general.title = $('title').text() || undefined;
    general.lang = $('html').attr('lang') || undefined;
    general.description = $('meta[name="description"]').attr('content') || undefined;
    general.canonical = $('link[rel="canonical"]').attr('href') || undefined;
    general.robots = $('meta[name="robots"]').attr('content') || undefined;
    general.charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || undefined;

    $('meta[property^="og:"]').each((_, el) => {
      const prop = $(el).attr('property')?.replace('og:', '') ?? '';
      const content = $(el).attr('content');
      if (prop && content) og[prop] = content;
    });

    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name')?.replace('twitter:', '') ?? '';
      const content = $(el).attr('content');
      if (name && content) twitter[name] = content;
    });

    const cleaned = (obj: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));

    const generalClean = cleaned(general);
    const ogClean = cleaned(og);
    const twitterClean = cleaned(twitter);

    if (Object.keys(generalClean).length) sections.push(createSection('html-general', 'HTML Meta', generalClean));
    if (Object.keys(ogClean).length) sections.push(createSection('html-og', 'Open Graph', ogClean));
    if (Object.keys(twitterClean).length) sections.push(createSection('html-twitter', 'Twitter Cards', twitterClean));

    if (!sections.length) warnings.push('No HTML metadata found');
  } catch (err) {
    warnings.push(`HTML extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { sections, warnings };
}
