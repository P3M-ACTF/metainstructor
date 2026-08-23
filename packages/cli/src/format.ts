import type { MetadataResult } from '@metapeek/core';

export function formatTable(result: MetadataResult): string {
  const lines: string[] = [];
  lines.push(`Source: ${result.source}`);
  lines.push(`MIME: ${result.mime}`);
  if (result.filename) lines.push(`File: ${result.filename}`);
  lines.push(`Extracted: ${result.extractedAt}`);
  if (result.hashes) {
    lines.push(`SHA-256: ${result.hashes.sha256}`);
    lines.push(`MD5: ${result.hashes.md5}`);
  }
  lines.push('');

  for (const section of result.sections) {
    lines.push(`── ${section.label} (${section.id}) ──`);
    for (const field of section.fields) {
      lines.push(`  ${field.key}: ${field.value}`);
    }
    lines.push('');
  }

  if (result.warnings.length) {
    lines.push('── Warnings ──');
    for (const w of result.warnings) lines.push(`  ⚠ ${w}`);
  }

  return lines.join('\n');
}

export function formatCsv(result: MetadataResult): string {
  const rows = ['section,key,value'];
  for (const section of result.sections) {
    for (const field of section.fields) {
      const escaped = field.value.replace(/"/g, '""');
      rows.push(`"${section.label}","${field.key}","${escaped}"`);
    }
  }
  return rows.join('\n');
}

export function formatJson(result: MetadataResult): string {
  return JSON.stringify(result, null, 2);
}

export type OutputFormat = 'json' | 'table' | 'csv';

export function formatOutput(result: MetadataResult, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return formatJson(result);
    case 'csv':
      return formatCsv(result);
    case 'table':
    default:
      return formatTable(result);
  }
}
