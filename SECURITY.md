# Security Policy

This repository contains a developer-preview SDK and a non-production reference server. Do not use the reference server to store real identity documents, payment keys, cookies, session tokens or sensitive personal data.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do not open a public issue containing exploit details, credentials or personal information.

Include:

- affected version and component;
- reproduction steps;
- expected impact;
- any suggested remediation;
- whether the issue has been disclosed elsewhere.

## Supported versions

Only the latest preview release is supported. Before `1.0`, security fixes may tighten validation or change unsafe preview behavior.

## Design boundary

The SDK never needs a user's wallet private key. Payment signing, custody and settlement belong in an explicitly configured wallet or gateway integration. Raw cookies and session credentials are outside the public SDK contract.
