# MetaInstructor

Visor educativo de metadatos (CLI + UI web embebida). Binario: `metainstructor`. **Formerly MetaPeek.** Depende de [MetaDissect](https://github.com/P3M-ACTF/metadissect) (tag `v0.11.1` + `[patch]` local).

Sin argumentos → UI en `http://127.0.0.1:5173`.

## Qué es / qué no es

**Es:** interfaz web educativa por defecto, más CLI (`analyze`, `fetch`, `html`, `json`, `serve`). TUI ratatui en terminal para `analyze` y dashboard de stats en `serve`. File-bar de intake, overlay de glosario (`?`), `--token` / `--retain-dir` en serve remoto.

**No es:** MetaDissect puro (lib+CLI sin UI), ni herramienta forense IR (eso es MetaTrace), ni mutador (MetaFake).

## Familia MetaDissect

| Proyecto | Acceso | Rol |
|----------|--------|-----|
| **MetaDissect** | [público](https://github.com/P3M-ACTF/metadissect) | Lib + CLI, sin UI |
| **MetaInstructor** | [público](https://github.com/P3M-ACTF/metainstructor) | Web educativa (antes MetaPeek) |
| **MetaTrace** | Privado — Hellcode Collective | Herramienta IR / forense |
| **MetaFake** | Privado — Hellcode Collective | Mutación de metadatos (copias) |

## Instalación

**Releases:** [Releases](https://github.com/P3M-ACTF/metainstructor/releases).

**Desde código** (clonar junto a `metadissect` para el `[patch]`):

```bash
# sibling: ../metadissect
git clone https://github.com/P3M-ACTF/metainstructor.git
cd metainstructor
cargo build --release -p metainstructor-cli
```

Sin sibling: comenta el bloque `[patch."https://github.com/P3M-ACTF/metadissect"]` en `Cargo.toml` y usa solo el tag git.

## Ejemplos CLI

```bash
metainstructor                 # serve → :5173
metainstructor serve --open --token "$META_SERVE_TOKEN"
metainstructor foto.jpg        # TUI analyze en TTY
metainstructor analyze doc.pdf -f json --no-tui
metainstructor fetch https://example.com/ -f markdown
```

```powershell
.\metainstructor.exe
.\metainstructor.exe serve --open
.\metainstructor.exe .\foto.jpg -f csv
```

## TUI y teclas web

- **CLI TUI:** `analyze` en TTY abre visor de secciones/campos (`j/k`, `/`, `q`). Ver [`docs/tui.md`](docs/tui.md) (copiado del core).
- **Serve:** dashboard de stats en TTY; auth remota con `--token` / `META_SERVE_TOKEN` (Bearer o `?token=`).
- **Web UI:** file-bar para intake, overlay de glosario con `?`, tema compartido `meta-ui/shell.css`.

## Privacidad

Análisis local. La UI sirve en loopback por defecto. Una URL solo se descarga con `fetch`.

## Estructura de crates

| Crate | Rol |
|-------|-----|
| `meta-explain` | Explicaciones educativas |
| `metainstructor-web` | UI Axum (:5173) |
| `metainstructor-cli` | Binario `metainstructor` |

## Licencia

[MIT](LICENSE) — Copyright 2026 MetaInstructor Contributors.

---

## English

**MetaInstructor** is an educational metadata viewer (CLI + embedded web UI). Binary: `metainstructor`. **Formerly MetaPeek.** Depends on MetaDissect via git tag `v0.11.1` and a local `[patch]` when developing under the umbrella.

No args → serve on port **5173**.

### What it is / is not

**Is:** educational web UI by default, plus CLI analyze/fetch/html/json/serve.

**Is not:** the core library-only product (MetaDissect), IR forensics (MetaTrace), or a mutator (MetaFake).

### Family

| Project | Access | Role |
|---------|--------|------|
| **MetaDissect** | [public](https://github.com/P3M-ACTF/metadissect) | Lib + CLI, no UI |
| **MetaInstructor** | [public](https://github.com/P3M-ACTF/metainstructor) | Educational web (formerly MetaPeek) |
| **MetaTrace** | Private — Hellcode Collective | IR / forensic tool |
| **MetaFake** | Private — Hellcode Collective | Metadata mutation (copies) |

### Install

From [Releases](https://github.com/P3M-ACTF/metainstructor/releases), or `cargo build --release -p metainstructor-cli` with `../metadissect` present (or comment out `[patch]`).

### CLI examples

```bash
metainstructor
metainstructor serve --open
metainstructor foto.jpg -f json
```

### Privacy

Local analysis; default bind `127.0.0.1:5173`.

### Crates

`meta-explain`, `metainstructor-web`, `metainstructor-cli`.

### License

[MIT](LICENSE) — Copyright 2026 MetaInstructor Contributors.
