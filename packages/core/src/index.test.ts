import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeBuffer, analyzeHtmlString, computeHashes } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');

describe('computeHashes', () => {
  it('computes sha256 and md5', async () => {
    const buf = Buffer.from('hello');
    const hashes = await computeHashes(buf);
    expect(hashes.sha256).toHaveLength(64);
    expect(hashes.md5).toHaveLength(32);
  });
});

describe('analyzeHtmlString', () => {
  it('extracts HTML meta tags', async () => {
    const html = readFileSync(join(fixturesDir, 'sample.html'), 'utf-8');
    const result = await analyzeHtmlString(html);
    expect(result.source).toBe('html');
    expect(result.mime).toBe('text/html');
    expect(result.sections.length).toBeGreaterThan(0);

    const htmlSection = result.sections.find((s) => s.id === 'html-general');
    expect(htmlSection?.fields.some((f) => f.key === 'title')).toBe(true);
    expect(htmlSection?.fields.some((f) => f.key === 'lang' && f.value === 'es')).toBe(true);

    const ogSection = result.sections.find((s) => s.id === 'html-og');
    expect(ogSection?.fields.some((f) => f.key === 'title')).toBe(true);
  });
});

describe('analyzeBuffer generic', () => {
  it('analyzes unknown binary as generic', async () => {
    const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    const result = await analyzeBuffer(buf, { filename: 'test.bin' });
    expect(result.mime).toBe('application/octet-stream');
    expect(result.hashes).toBeDefined();
    expect(result.sections.some((s) => s.id === 'generic')).toBe(true);
  });
});

describe('analyzeBuffer PDF', () => {
  it('analyzes minimal PDF', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();
    pdf.setTitle('Test PDF');
    pdf.setAuthor('MetaPeek');
    const bytes = await pdf.save();
    const result = await analyzeBuffer(Buffer.from(bytes), { filename: 'test.pdf' });
    expect(result.mime).toBe('application/pdf');
    const pdfSection = result.sections.find((s) => s.id === 'pdf-info');
    expect(pdfSection?.fields.some((f) => f.key === 'title' && f.value === 'Test PDF')).toBe(true);
  });
});
