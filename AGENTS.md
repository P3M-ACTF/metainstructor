# AGENTS.md

Contrato mínimo. Docs largas → **wiki** (no más archivos para LLM).

## Misión

**MetaInstructor** = visor educativo (CLI + UI web `:5173`). Formerly MetaPeek. **No** es el core lib-only, ni IR, ni mutador.

## Antes de implementar

1. [Wiki Home](https://github.com/P3M-ACTF/metainstructor/wiki)
2. [Wiki Estado](https://github.com/P3M-ACTF/metainstructor/wiki/Estado)
3. Core: [MetaDissect Estado](https://github.com/P3M-ACTF/metadissect/wiki/Estado)

## Pin / sibling

MetaDissect + `meta-ui` por **git tag** (`v0.11.1`). Umbrella: `[patch]` → `../metadissect/crates/...`. Sin sibling, comenta el patch. **No** publicar `meta-ui`.

## Nunca

- Evidencias, `.env`, secretos
- `CLAUDE.md` / `llms.txt` / dumps de sesión
- Duplicar docs de TUI/serve en `docs/` (viven en la wiki)

## Checks

```bash
cargo fmt
cargo clippy --workspace -- -D warnings
cargo test --workspace
```

MSRV **1.89**.
