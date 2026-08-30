# MetaInstructor 📖

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/P3M-ACTF/metainstructor)](https://github.com/P3M-ACTF/metainstructor/releases)
[![CI](https://github.com/P3M-ACTF/metainstructor/actions/workflows/ci.yml/badge.svg)](https://github.com/P3M-ACTF/metainstructor/actions/workflows/ci.yml)
[![MSRV](https://img.shields.io/badge/rustc-1.89%2B-orange.svg)](https://github.com/P3M-ACTF/metainstructor)

Visor educativo de metadatos (CLI + UI web). Binario: `metainstructor`. **Formerly MetaPeek.** Pin MetaDissect **`v0.11.1`**.

> [!TIP]
> Sin argumentos abre la UI en `http://127.0.0.1:5173`. En Windows: `.\metainstructor.exe` o el binario de [Releases](https://github.com/P3M-ACTF/metainstructor/releases).

> [!NOTE]
> En la web, `?` abre el glosario. El core de parsers vive en [MetaDissect](https://github.com/P3M-ACTF/metadissect).

## Arranque en 30 s

```bash
# Binario: https://github.com/P3M-ACTF/metainstructor/releases
metainstructor                  # → :5173
metainstructor foto.jpg         # TUI analyze
metainstructor serve --open
```

Desde fuente (con sibling `../metadissect` + `[patch]`, o comenta el patch y usa el tag):

```bash
git clone https://github.com/P3M-ACTF/metainstructor.git && cd metainstructor
cargo build --release -p metainstructor-cli
```

## Qué es / no es

**Es**

- 🚀 Arranca la UI educativa sin args (`:5173`).
- Explica campos con glosario y capa `meta-ui`.
- CLI: `analyze`, `fetch`, `html`, `json`, `serve` (+ TUI).
- Depende del motor MetaDissect por git tag.

**No es**

- El motor puro ([MetaDissect](https://github.com/P3M-ACTF/metadissect)).
- Una herramienta de IR (MetaTrace).
- Un mutador de metadatos (MetaFake).
- Un crawler de sitios.

## Familia

Cuatro repos, un motor:

| Proyecto | Acceso | Rol |
|----------|--------|-----|
| **MetaDissect** | [público](https://github.com/P3M-ACTF/metadissect) | Lib + CLI + API JSON |
| **MetaInstructor** | [público](https://github.com/P3M-ACTF/metainstructor) | Web educativa |
| **MetaTrace** | Privado — Hellcode Collective | IR / forense |
| **MetaFake** | Privado — Hellcode Collective | Mutación (copias) |

## Privacidad

> [!NOTE]
> Análisis local; bind por defecto en loopback. Bind remoto exige token.

## Docs y licencia

Docs largas: **[Wiki](https://github.com/P3M-ACTF/metainstructor/wiki)** · **[Estado](https://github.com/P3M-ACTF/metainstructor/wiki/Estado)** · core: [MetaDissect wiki](https://github.com/P3M-ACTF/metadissect/wiki).

Crates: `meta-explain` · `metainstructor-web` · `metainstructor-cli`.

[MIT](LICENSE) — Copyright 2026 MetaInstructor Contributors.

<details>
<summary>English</summary>

**MetaInstructor** — educational metadata viewer (CLI + embedded web). Binary: `metainstructor`. **Formerly MetaPeek.** Depends on MetaDissect `v0.11.1`. Default UI: port **5173**.

**Is:** educational UI + CLI/TUI. **Is not:** core lib-only product, IR tool, or mutator.

```bash
metainstructor
metainstructor serve --open
metainstructor foto.jpg -f json
```

Docs: **[Wiki](https://github.com/P3M-ACTF/metainstructor/wiki)**. License: [MIT](LICENSE).

</details>
