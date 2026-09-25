# Security Policy

## Supported Versions

The following versions of **EM-Zilla** are currently supported with security updates and cryptographic integrity verification:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

**FJ™ Cybertronic Systems** takes the security of EM-Zilla and hardware flashing utilities extremely seriously. If you discover a security vulnerability, cryptographic flaw, or tampering vector, please report it responsibly.

- **Email**: [security@cybertronic-systems.dev](mailto:security@cybertronic-systems.dev)
- **PGP Key**: Available upon request.

Please do **not** disclose security vulnerabilities publicly until our security team has addressed and resolved the report (typically within 48-72 hours).

## Cryptographic Integrity & Tamper Protection

EM-Zilla includes a robust security architecture (`security/`) designed to prevent unauthorized cloning, malicious modification, and tampering:
- **SHA-256 Hash Verification**: `security/integrity-verifier.js` computes and validates hashes of critical core files at startup.
- **Clone Protection**: `security/clone-protector.js` validates official origin domains (`fj-cyberzilla.github.io`).
- **Integrity Testing**: Run `npm test` to verify build integrity against known cryptographic signatures.
