# Changelog

All notable changes to **EM-Zilla** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-25

### Added
- **Vintage Olive Green Military Hardware Theme**: Cohesive military olive green aesthetic (`#556b2f`, `#6b8e23`, `#8fbc8f`, `#3f4c3b`, `#232d21`) across UI panels, PSP Vita LiveArea views, and stylesheets.
- **Unified Branding**: Standardized branding under **FJ™ Cybertronic Systems** (`FJ-cyberzilla`).
- **Cryptographic Integrity Verification**: Automated SHA-256 hash generation and runtime verification (`security/integrity-verifier.js`).
- **ESLint v9 Flat Configuration**: Modern `eslint.config.js` achieving zero error and zero warning compliance across `js/`, `modules/`, and `security/`.
- **Multi-AI Orchestration Engine**: Advanced context manager, decision engine, knowledge graph, and task dispatcher modules under `modules/ai_orchestration/`.
- **Comprehensive Documentation & Governance**: Added `USERGUIDE.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `architecture.mmd`, `CHANGELOG.md`, and `CODEOWNERS`.

### Changed
- Refactored `js/app.js` and `index.html` to eliminate duplicate ES module imports and consolidate document structure.
- Migrated GitHub Actions workflows (`codeql.yml`, `bandit.yml`, `codacy.yml`, `webpack.yml`) to robust modern versions.

### Security
- Enhanced clone protection (`security/clone-protector.js`) and tamper resistance with SHA-256 integrity guards.
