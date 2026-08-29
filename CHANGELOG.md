# Changelog

## 0.3.6

- Pin **MetaDissect** to `v0.10.0` (C2PA trust anchors, `extract`, ingredients section, compact C2PA warnings).

## 0.3.5

- Pin **MetaDissect** to `v0.9.0` (rich C2PA actions, compact PNG chunks, CLI `--verbose` / `--sections`).

## 0.3.4

- Pin **MetaDissect** to `v0.8.0` (crates.io metadata, JSON HTTP API `serve --api`).

## 0.3.3

- Pin **MetaDissect** to `v0.7.0` (WARC, Outlook MSG/MAPI subset, deeper MakerNotes).

## 0.3.2

- Pin **MetaDissect** to `v0.6.0` (PE / ELF / Mach-O executable metadata).

## 0.3.1

- Pin **MetaDissect** to `v0.5.0` (C2PA/JUMBF in the core library).

## 0.3.0

- **Rebrand / split:** formerly **MetaPeek**; now **MetaInstructor** (educational web + CLI).
- Depends on **MetaDissect** (git tag + local `[patch]` for umbrella).
- Default (no args): `serve` on `127.0.0.1:5173`.
- Crates: `meta-explain`, `metainstructor-web`, `metainstructor-cli`.
