import { useState, useCallback, useRef } from 'react';
import type { MetadataResult } from '@metapeek/core';
import {
  analyzeFile,
  analyzeUrl,
  exportJson,
  exportCsv,
  getServerUrl,
  setServerUrl,
} from './lib/analyze';

function ResultCard({ section }: { section: MetadataResult['sections'][0] }) {
  return (
    <div className="card">
      <h3>{section.label}</h3>
      {section.fields.map((field) => (
        <div className="field-row" key={field.key}>
          <span className="field-key">{field.key}</span>
          <span className="field-value">{field.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeFile(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onUrlAnalyze = useCallback(async () => {
    if (!urlInput.trim()) return;
    if (!serverUrl.trim()) {
      setError('Configura la URL del servidor autohosteado en Ajustes para analizar URLs remotas.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeUrl(urlInput.trim(), serverUrl);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [urlInput, serverUrl]);

  const saveServerUrl = (url: string) => {
    setServerUrlState(url);
    setServerUrl(url);
  };

  return (
    <>
      <header>
        <h1>MetaPeek</h1>
        <p>Análisis de metadatos local — imágenes, PDF, audio, Office, HTML</p>
      </header>

      <div className="privacy-notice">
        Los archivos no salen de tu dispositivo. El análisis se realiza completamente en tu navegador.
      </div>

      <details className="settings">
        <summary>Ajustes del servidor autohosteado (opcional)</summary>
        <div className="settings-content">
          <label htmlFor="server-url">URL del servidor:</label>
          <input
            id="server-url"
            type="url"
            placeholder="http://localhost:8787"
            value={serverUrl}
            onChange={(e) => saveServerUrl(e.target.value)}
          />
        </div>
      </details>

      <div
        className={`dropzone${dragOver ? ' dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <strong>Arrastra un archivo aquí</strong>
        <p>o haz clic para seleccionar — JPEG, PNG, PDF, MP3, Office, HTML…</p>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div className="url-section">
        <input
          type="url"
          placeholder="https://example.com/imagen.jpg (requiere servidor)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onUrlAnalyze()}
        />
        <button onClick={onUrlAnalyze} disabled={loading || !urlInput.trim()}>
          Analizar URL
        </button>
      </div>

      {loading && <div className="loading">Analizando…</div>}
      {error && <div className="error">{error}</div>}

      {result && (
        <>
          <div className="results-header">
            <h2>Resultados</h2>
            <div className="export-buttons">
              <button className="secondary" onClick={() => exportJson(result)}>
                Exportar JSON
              </button>
              <button className="secondary" onClick={() => exportCsv(result)}>
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="meta-info">
            <span>MIME: {result.mime}</span>
            {result.filename && <span>Archivo: {result.filename}</span>}
            {result.hashes && <span>SHA-256: {result.hashes.sha256.slice(0, 16)}…</span>}
          </div>

          {result.warnings.length > 0 && (
            <ul className="warnings">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}

          {result.sections.map((section) => (
            <ResultCard key={section.id} section={section} />
          ))}
        </>
      )}

      <footer>MetaPeek — Análisis de metadatos con privacidad por defecto</footer>
    </>
  );
}
