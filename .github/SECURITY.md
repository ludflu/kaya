# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Kaya, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to: **hadrien.mary@gmail.com**
3. Or use [GitHub's private vulnerability reporting](https://github.com/kaya-go/kaya/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution Timeline**: Depends on severity
  - Critical: ASAP (within days)
  - High: Within 2 weeks
  - Medium/Low: Within 1 month

### Scope

The following are in scope:

- Kaya desktop application (Tauri)
- Kaya web application
- All packages in this repository
- CI/CD pipelines that could affect releases

### Out of Scope

- Third-party dependencies (report to respective maintainers)
- Social engineering attacks
- Physical attacks

## Security Best Practices

When contributing to Kaya:

1. Never commit secrets, API keys, or credentials
2. Keep dependencies updated (we use Dependabot)
3. Follow the principle of least privilege for permissions
4. Validate and sanitize all user inputs

Thank you for helping keep Kaya and its users safe! 🛡️
