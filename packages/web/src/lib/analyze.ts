import type { MetadataResult } from '@metapeek/core';

const SERVER_KEY = 'metapeek-server-url';

export function getServerUrl(): string {
  return localStorage.getItem(SERVER_KEY) ?? '';
}

export function setServerUrl(url: string): void {
  if (url) localStorage.setItem(SERVER_KEY, url);
  else localStorage.removeItem(SERVER_KEY);
}

export async function analyzeFile(file: File): Promise<MetadataResult> {
  const buffer = await file.arrayBuffer();
  const { analyzeBuffer } = await import('@metapeek/core');
  return analyzeBuffer(new Uint8Array(buffer), {
    filename: file.name,
    source: 'file',
    fileStats: { size: file.size, mtime: new Date(file.lastModified) },
  });
}

export async function analyzeUrl(url: string, serverUrl: string): Promise<MetadataResult> {
  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error del servidor (${response.status}): ${text}`);
  }
  return response.json();
}

export function exportJson(result: MetadataResult): void {
  downloadBlob(JSON.stringify(result, null, 2), 'metapeek-result.json', 'application/json');
}

export function exportCsv(result: MetadataResult): void {
  const rows = ['section,key,value'];
  for (const section of result.sections) {
    for (const field of section.fields) {
      rows.push(`"${section.label}","${field.key}","${field.value.replace(/"/g, '""')}"`);
    }
  }
  downloadBlob(rows.join('\n'), 'metapeek-result.csv', 'text/csv');
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
