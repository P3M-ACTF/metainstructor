import JSZip from 'jszip';
import type { AnalyzeOptions } from '../types.js';
import { createSection } from '../utils/helpers.js';

const OFFICE_MIMES = [
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-',
];

export function isOfficeMime(mime: string): boolean {
  return OFFICE_MIMES.some((p) => mime.startsWith(p));
}

async function parseCoreXml(xml: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const tagRegex = /<(?:[\w]+:)?(\w+)>([^<]*)<\/(?:[\w]+:)?\1>/g;
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    const [, tag, value] = match;
    if (value.trim()) {
      result[tag] = value.trim();
    }
  }
  return result;
}

export async function extractOffice(
  buffer: Buffer | Uint8Array,
  _options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  try {
    const zip = await JSZip.loadAsync(buffer);
    const coreFile = zip.file('docProps/core.xml');
    const appFile = zip.file('docProps/app.xml');

    const props: Record<string, unknown> = {};

    if (coreFile) {
      const coreXml = await coreFile.async('string');
      const core = await parseCoreXml(coreXml);
      if (core.creator) props.author = core.creator;
      if (core.title) props.title = core.title;
      if (core.subject) props.subject = core.subject;
      if (core.description) props.description = core.description;
      if (core.lastModifiedBy) props.lastModifiedBy = core.lastModifiedBy;
      if (core.created) props.created = core.created;
      if (core.modified) props.modified = core.modified;
      if (core.category) props.category = core.category;
      if (core.keywords) props.keywords = core.keywords;
    }

    if (appFile) {
      const appXml = await appFile.async('string');
      const app = await parseCoreXml(appXml);
      if (app.Application) props.application = app.Application;
      if (app.AppVersion) props.appVersion = app.AppVersion;
      if (app.Company) props.company = app.Company;
    }

    if (Object.keys(props).length) {
      sections.push(createSection('office-props', 'Office Document', props));
    } else {
      warnings.push('No Office document properties found');
    }
  } catch (err) {
    warnings.push(`Office extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { sections, warnings };
}
