# MetaPeek

Análisis **local y exhaustivo** de metadatos. Un único binario nativo por sistema operativo: CLI + interfaz web embebida. Sin Node, sin pnpm, sin Execution Policy.

MetaPeek extrae **todas** las etiquetas que el parser lee (EXIF IFD completos, XMP, IPTC, PNG, audio, vídeo, PDF, Office, HTML/JSON-LD, ZIP/EPUB, fuentes, EML). No hay lista blanca de 16 campos.

[English below](#english)

## Qué hace

Arrastra un archivo (o pega HTML/JSON/URL) y ves la historia del objeto: qué es, cuándo se creó o modificó, con qué software, dónde (GPS) y **cada tag** en su espacio de nombres. El análisis corre en tu máquina. Una URL solo se descarga si tú la pides.

## Windows 10/11

1. Baja el ZIP `metapeek-x86_64-pc-windows-msvc.zip` desde [Releases](https://github.com/P3M-ACTF/metapeek/releases).
2. Extrae `metapeek.exe` a una carpeta.
3. En PowerShell o `cmd` (no hace falta Execution Policy):

```powershell
.\metapeek.exe .\foto.jpg
.\metapeek.exe .\foto.jpg --format json
.\metapeek.exe serve
```

La UI queda en `http://127.0.0.1:5173`. En escritorio puedes usar `.\metapeek.exe serve --open`.

## Linux

1. Baja el tarball `x86_64-unknown-linux-gnu` (glibc) o `x86_64-unknown-linux-musl` (estático) o `aarch64-unknown-linux-gnu` (Pi/VPS ARM).
2. Extrae y ejecuta:

```bash
chmod +x metapeek
./metapeek foto.jpg
./metapeek foto.jpg --format markdown
./metapeek serve --host 127.0.0.1 --port 5173
```

## macOS

1. Baja el tarball `aarch64-apple-darwin` (Apple Silicon) o `x86_64-apple-darwin` (Intel).
2. Si Gatekeeper bloquea el binario: clic derecho → Abrir.

```bash
chmod +x metapeek
./metapeek foto.jpg
./metapeek serve --open
```

## Termux (Android)

Opción A — binario de Releases (`aarch64-linux-android`):

```bash
termux-setup-storage
chmod +x metapeek
./metapeek ~/storage/shared/DCIM/foto.jpg
./metapeek serve
```

Opción B — desde código:

```bash
pkg install rust
termux-setup-storage
cargo install --path crates/metapeek-cli
metapeek ~/storage/shared/DCIM/foto.jpg
metapeek serve
```

`serve` **solo imprime la URL** (no hay `xdg-open`). Ábrela en el navegador del teléfono.

## Desde código (cualquier SO)

Escritorio: instala [rustup](https://rustup.rs). Termux: `pkg install rust`.

```bash
git clone https://github.com/P3M-ACTF/metapeek.git
cd metapeek
cargo test
cargo build --release
```

El binario queda en `target/release/metapeek` o `target/release/metapeek.exe`.

```powershell
# Windows
.\target\release\metapeek.exe .\foto.jpg
.\target\release\metapeek.exe serve
```

No uses `pnpm`. No cambies Execution Policy.

## CLI

```
metapeek <archivo>                 # tabla por secciones
metapeek <archivo> --format json
metapeek <archivo> --format markdown
metapeek <archivo> --format csv
metapeek fetch https://example.com/a.jpg
metapeek html --file page.html
metapeek serve [--port 5173] [--open]
```

## Formatos

| Familia | Extensiones | Qué se obtiene |
|---------|-------------|----------------|
| Imagen | JPEG, TIFF, PNG, WebP, GIF, BMP, ICO, AVIF, HEIC* | Todos los IFD EXIF, XMP, IPTC/IIM, ICC, chunks PNG, comentarios GIF, dimensiones reales |
| Audio | MP3, FLAC, OGG, M4A, WAV, AIFF | ID3v1/v2, Vorbis, ilst, bitrate, canales |
| Vídeo | MP4, MOV, MKV, WebM, AVI | Átomos/tracks, duración, codecs, creation_time, handler |
| Docs | PDF, DOCX/XLSX/PPTX, ODT, RTF | Info + XMP; core.xml/app.xml/custom.xml; meta ODF |
| Web | HTML, JSON | `<meta>`, OG, Twitter, Dublin Core, JSON-LD, `link[rel]` |
| Otros | ZIP, EPUB, TTF/OTF, EML | Comentario ZIP, OPF, name table, cabeceras |
| Siempre | cualquier archivo | magic, MIME, tamaño, MD5/SHA-1/256/512/BLAKE3, entropía, fechas FS |

\* HEIC sin `libheif`: magic + EXIF/XMP embebido. Feature opcional `heif` no entra en Termux/musl.

## Privacidad

El análisis es local. Fetch de URL usa rustls, timeout, tope de tamaño y bloqueo de IPs privadas (anti-SSRF). No hay servidor Node aparte.

ExifTool/ffprobe son **opcionales** (los usa MetaTrace para cruce). Docker es opcional para empaquetar ExifTool junto al binario; no es el camino por defecto.

## Estructura

```
metapeek/
├── crates/meta-core      # parsers y hashes
├── crates/meta-explain   # glosario
├── crates/metapeek-cli   # binario
├── crates/metapeek-web   # Axum + UI rust-embed
└── fixtures/
```

## Licencia

MIT — [LICENSE](./LICENSE)

---

## English

**Local, exhaustive metadata analysis.** One native binary per OS: CLI + embedded web UI. No Node, no pnpm, no Execution Policy.

Every parsed tag is shown. There is no 16-field whitelist.

### Windows

Download `metapeek-x86_64-pc-windows-msvc.zip` from Releases, then:

```powershell
.\metapeek.exe .\photo.jpg
.\metapeek.exe serve
```

### Linux

```bash
chmod +x metapeek && ./metapeek photo.jpg && ./metapeek serve
```

Use the musl build for a static binary, or `aarch64-unknown-linux-gnu` on ARM.

### macOS

Pick `aarch64-apple-darwin` or `x86_64-apple-darwin`. Right-click → Open if Gatekeeper blocks the file.

### Termux

`pkg install rust` then `cargo install --path crates/metapeek-cli`, **or** the `aarch64-linux-android` Release binary. `termux-setup-storage`. `metapeek serve` prints a URL — open it in the phone browser.

### From source

[rustup](https://rustup.rs) (desktop) or `pkg install rust` (Termux): `cargo build --release`.

Privacy: local analysis; URL fetch only on request; rustls; private IPs blocked.
