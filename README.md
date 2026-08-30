# MetaInstructor

Visor educativo de metadatos (CLI + UI web). Binario: `metainstructor`. **Formerly MetaPeek.** Pin MetaDissect **`v0.11.1`** (+ `[patch]` local).

Sin argumentos → `http://127.0.0.1:5173`.

Docs: **[Wiki](https://github.com/P3M-ACTF/metainstructor/wiki)** · **[Estado](https://github.com/P3M-ACTF/metainstructor/wiki/Estado)** · core: [MetaDissect wiki](https://github.com/P3M-ACTF/metadissect/wiki).

## Qué es / qué no es

**Es:** UI web educativa + CLI (`analyze`, `fetch`, `html`, `json`, `serve`) + TUI/`serve` dashboard vía `meta-ui`.

**No es:** MetaDissect puro, IR (MetaTrace) ni mutador (MetaFake).

## Familia

| Proyecto | Acceso | Rol |
|----------|--------|-----|
| **MetaDissect** | [público](https://github.com/P3M-ACTF/metadissect) | Lib + CLI |
| **MetaInstructor** | [público](https://github.com/P3M-ACTF/metainstructor) | Web educativa |
| **MetaTrace** | Privado — Hellcode Collective | IR / forense |
| **MetaFake** | Privado — Hellcode Collective | Mutación (copias) |

## Instalación

[Releases](https://github.com/P3M-ACTF/metainstructor/releases) o sibling `../metadissect`:

```bash
git clone https://github.com/P3M-ACTF/metainstructor.git
cd metainstructor
cargo build --release -p metainstructor-cli
```

Sin sibling: comenta `[patch]` y usa el tag git.

## Comandos

```bash
metainstructor
metainstructor serve --open --token "$META_SERVE_TOKEN"
metainstructor foto.jpg
metainstructor analyze doc.pdf -f json --no-tui
metainstructor fetch https://example.com/ -f markdown
```

Teclas TUI, token remoto y UI → [Wiki · Uso](https://github.com/P3M-ACTF/metainstructor/wiki/Uso).

## Privacidad

Análisis local; bind por defecto loopback.

## Crates

`meta-explain` · `metainstructor-web` · `metainstructor-cli`

## Licencia

[MIT](LICENSE) — Copyright 2026 MetaInstructor Contributors.

---

## English

**MetaInstructor** — educational metadata viewer (CLI + embedded web). Binary: `metainstructor`. **Formerly MetaPeek.** Depends on MetaDissect `v0.11.1`. Default UI: port **5173**.

Docs: **[Wiki](https://github.com/P3M-ACTF/metainstructor/wiki)**. Not the core lib-only product, IR tool, or mutator.

```bash
metainstructor
metainstructor serve --open
metainstructor foto.jpg -f json
```

License: [MIT](LICENSE).
