import { PDFDocument } from 'pdf-lib';
import type { AnalyzeOptions } from '../types.js';
import { createSection } from '../utils/helpers.js';

export async function extractPdf(
  buffer: Buffer | Uint8Array,
  _options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  try {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const info: Record<string, unknown> = {};

    info.pageCount = pdf.getPageCount();
    const title = pdf.getTitle();
    const author = pdf.getAuthor();
    const subject = pdf.getSubject();
    const creator = pdf.getCreator();
    const producer = pdf.getProducer();
    const keywords = pdf.getKeywords();
    const creationDate = pdf.getCreationDate();
    const modDate = pdf.getModificationDate();

    if (title) info.title = title;
    if (author) info.author = author;
    if (subject) info.subject = subject;
    if (creator) info.creator = creator;
    if (producer) info.producer = producer;
    if (keywords) info.keywords = keywords;
    if (creationDate) info.created = creationDate;
    if (modDate) info.modified = modDate;

    sections.push(createSection('pdf-info', 'PDF Document', info));
  } catch (err) {
    warnings.push(`PDF extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { sections, warnings };
}
