# Contributing

## Setup

Clone this repo **next to** `metadissect`:

```text
Metadata/
  metadissect/
  metainstructor/
```

`[patch."https://github.com/P3M-ACTF/metadissect"]` overrides the git tag with the sibling path. Without `../metadissect`, comment out `[patch]` and use tag `v0.3.0` (or newer).

## Checks

```bash
cargo fmt
cargo clippy --workspace -- -D warnings
cargo test --workspace
```

**MSRV:** Rust **1.89**.

## Pull requests

- Target **`main`**.
- CI = **Linux debug** only; Windows/macOS local or `workflow_dispatch`.
- No `evidence/`, `.env`, or secrets in commits.

## Bumping the MetaDissect pin

1. Tag MetaDissect (`vX.Y.Z`).
2. Change `tag = "vX.Y.Z"` in `[workspace.dependencies]` `metadissect`.
3. Verify with/without `[patch]`; run `cargo test --workspace`; update `CHANGELOG.md`.
