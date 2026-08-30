# Security

Report vulnerabilities via [GitHub Security Advisories](https://github.com/P3M-ACTF/metainstructor/security/advisories/new) on this public repository.

- Do **not** attach sensitive files, evidence, or credentials.
- Prefer a minimal, synthetic reproduction.
- Binding `0.0.0.0` without `--token` / `META_SERVE_TOKEN` rejects requests (401). Use Bearer or `?token=` when exposing serve remotely.
