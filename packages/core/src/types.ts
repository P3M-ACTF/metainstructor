export interface MetadataField {
  key: string;
  value: string;
  raw?: unknown;
}

export interface MetadataSection {
  id: string;
  label: string;
  fields: MetadataField[];
}

export interface MetadataResult {
  source: 'file' | 'url' | 'html';
  mime: string;
  filename?: string;
  extractedAt: string;
  sections: MetadataSection[];
  warnings: string[];
  hashes?: { sha256: string; md5: string };
}

export interface AnalyzeOptions {
  filename?: string;
  source?: MetadataResult['source'];
  includeHashes?: boolean;
  fileStats?: { size: number; mtime?: Date; ctime?: Date };
}

export type Extractor = (
  buffer: Buffer | Uint8Array,
  options: AnalyzeOptions,
) => Promise<Partial<MetadataResult>>;
