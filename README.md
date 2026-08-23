# MetaPeek

**Análisis de metadatos local con privacidad por defecto.**

MetaPeek extrae metadatos de imágenes, PDF, audio, documentos Office y HTML completamente en tu dispositivo. Sin enviar archivos a servidores externos.

[English version below](#english)

---

## Características

- **Imágenes** (JPEG, PNG, WebP, HEIC): EXIF — fecha, cámara, dimensiones, orientación, GPS
- **Audio** (MP3, FLAC, OGG): ID3 — título, artista, álbum, duración
- **PDF**: autor, título, fechas, productor
- **Office** (DOCX, XLSX, PPTX): autor, fechas, aplicación
- **HTML**: meta tags, Open Graph, Twitter Cards
- **Genérico**: MIME, tamaño, hashes SHA-256/MD5
- **CLI**, **Web UI** y **servidor autohosteado** opcional

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Compilar todo
pnpm build

# CLI — analizar un archivo
pnpm --filter metapeek-cli exec node dist/index.js photo.jpg

# CLI — salida JSON
pnpm --filter metapeek-cli exec node dist/index.js photo.jpg --format json

# Web UI (desarrollo)
pnpm --filter @metapeek/web dev

# Servidor autohosteado
pnpm --filter @metapeek/server dev
```

## Estructura del monorepo

```
metapeek/
├── packages/
│   ├── core/      # Extractores y tipos compartidos
│   ├── cli/       # bin: metapeek
│   ├── web/       # SPA Vite + React
│   └── server/    # Backend Hono (fetch remoto + ExifTool)
├── docker-compose.yml
└── LICENSE (MIT)
```

## CLI

```bash
metapeek photo.jpg                    # Tabla legible
metapeek photo.jpg --format json      # JSON
metapeek photo.jpg --format csv       # CSV
metapeek https://example.com/img.jpg --server http://localhost:8787
metapeek serve --port 5173            # Sirve la Web UI
metapeek serve --with-server            # Web UI + backend en :8787
```

## Web UI

Interfaz con drag-and-drop, campo URL (requiere servidor), vista en tarjetas agrupadas y exportación JSON/CSV.

> **Privacidad:** Los archivos no salen de tu dispositivo. El análisis se realiza en el navegador.

## Servidor autohosteado

Para analizar URLs remotas y usar ExifTool/ffprobe:

```bash
# Con Docker (recomendado)
cd metapeek
docker compose up

# Manual
pnpm --filter @metapeek/server dev
```

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8787` | Puerto del servidor |
| `MAX_FILE_SIZE` | `52428800` (50 MB) | Tamaño máximo de archivo |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Orígenes CORS permitidos |
| `ENABLE_EXIFTOOL` | `true` | Habilitar ExifTool/ffprobe |

### Endpoints

- `GET /health` — Estado del servidor
- `POST /fetch` — `{ "url": "..." }` → descarga y analiza
- `POST /analyze` — multipart file → analiza con ExifTool

Configura la URL del servidor en la Web UI: **Ajustes → URL del servidor**.

## MetaTrace (forense)

MetaTrace extiende MetaPeek con análisis forense avanzado. Ver [`../metatrace/README.md`](../metatrace/README.md).

## Desarrollo

```bash
pnpm install       # Instalar dependencias
pnpm build         # Compilar todos los paquetes
pnpm test          # Ejecutar tests (Vitest)
pnpm lint          # Verificar tipos TypeScript
```

## Licencia

MIT — ver [LICENSE](./LICENSE)

---

## English

**Local metadata analysis with privacy by default.**

MetaPeek extracts metadata from images, PDFs, audio, Office documents, and HTML entirely on your device. No files are sent to external servers.

### Quick start

```bash
pnpm install && pnpm build
pnpm --filter metapeek-cli exec node dist/index.js photo.jpg
pnpm --filter @metapeek/web dev
```

### Features

- Image EXIF, audio ID3, PDF info, Office docs, HTML meta tags
- SHA-256/MD5 hashes, MIME detection
- CLI with JSON/table/CSV output
- React web UI with drag-and-drop
- Optional self-hosted server with ExifTool (Docker)

### Self-hosted server

```bash
cd metapeek && docker compose up
# Server at http://localhost:8787
```

Configure the server URL in Web UI Settings for remote URL analysis.

### License

MIT
