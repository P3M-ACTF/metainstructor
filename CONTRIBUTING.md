# Contributing

## Setup

Clone this repo **next to** `metadissect`:

```text
Metadata/
  metadissect/
  metainstructor/
```

`[patch."https://github.com/P3M-ACTF/metadissect"]` overrides the git tag with the sibling path. Without `../metadissect`, comment out `[patch]` and use tag `v0.11.1` (or newer).

Pin both `metadissect` and `meta-ui` from the same MetaDissect tag. Do **not** publish `meta-ui` to crates.io.

## Checks

```bash
cargo fmt
cargo clippy --workspace -- -D warnings
cargo test --workspace
```

**MSRV:** Rust **1.89**.

## Documentation

Long-form docs live in the **[GitHub Wiki](https://github.com/P3M-ACTF/metainstructor/wiki)**. Do **not** add LLM instruction files (`CLAUDE.md`, `llms.txt`, etc.). In-repo agent contract: [`AGENTS.md`](AGENTS.md) only.

## Pull requests

- Target **`main`**.
- CI = **Linux debug** only; Windows/macOS local or `workflow_dispatch`.
- No `evidence/`, `.env`, or secrets in commits.

## Bumping the MetaDissect pin

1. Tag MetaDissect (`vX.Y.Z`).
2. Change `tag = "vX.Y.Z"` for `metadissect` and `meta-ui` in `[workspace.dependencies]`.
3. Verify with/without `[patch]`; run `cargo test --workspace`; update `CHANGELOG.md`.
