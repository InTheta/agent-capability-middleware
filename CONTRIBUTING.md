# Contributing

Thank you for helping improve Agent Capability Middleware.

## Development

Requirements:

- Node.js 20 or 22;
- npm 10 or later.

```bash
npm ci
npm run verify
```

`npm run verify` type-checks the SDK, runs unit tests, executes the complete local permission lifecycle and validates the package contents.

## Pull requests

- Keep changes focused.
- Add or update tests for behavior changes.
- Preserve backwards compatibility within a preview line where practical.
- Explain any privacy or security impact.
- Never commit private keys, seed phrases, tokens, raw order histories, identity documents or production user data.

Contributions are licensed under Apache-2.0.
