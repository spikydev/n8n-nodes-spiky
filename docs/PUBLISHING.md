# Publishing Guide

This guide covers how to publish new versions of `n8n-nodes-spiky` to npm.

## Prerequisites

- npm account `spiky.ai` with 2FA enabled
- Logged in: `npm whoami` should return `spiky.ai`
- All changes committed and pushed to `main`
- CI passing (lint + build)

## Publishing a Release

Run from the repo root on `main`:

```bash
npx n8n-node release
```

This will:
1. Run lint and build
2. Generate a changelog from git history
3. Prompt you to select a version increment (patch, minor, major)
4. Bump `package.json` version
5. Create a git commit and tag
6. Publish to npm (prompts for 2FA OTP code)
7. Open a browser to create a GitHub Release

### Version guidelines

| Change type | Increment | Example |
|-------------|-----------|---------|
| Bug fixes, small tweaks | patch | `0.1.1` → `0.1.2` |
| New operations or features | minor | `0.1.2` → `0.2.0` |
| Breaking changes (credential schema, removed operations) | major | `0.2.0` → `1.0.0` |

## Verifying the Publish

```bash
npm view n8n-nodes-spiky
```

Test on a clean self-hosted n8n (no local mount):

```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Then in n8n: **Settings > Community Nodes > Install** → enter `n8n-nodes-spiky`.

## n8n Cloud

Community nodes on n8n Cloud require verification via the [n8n Creator Portal](https://creators.n8n.io). Unverified packages can only be installed on self-hosted instances.

## Troubleshooting

### `E403 Two-factor authentication required`

The `spiky.ai` npm account has 2FA enabled. Make sure you enter the OTP code when prompted. Alternatively, use a granular access token with publish permissions.

### `prepublishOnly` hook blocks `npm publish`

The `prepublishOnly` script runs `n8n-node prerelease`, which blocks direct `npm publish`. Always use `npx n8n-node release` instead.

### Rolling back a bad publish

npm doesn't allow deleting published versions, but you can deprecate them:

```bash
npm deprecate n8n-nodes-spiky@0.1.1 "Known issue, use 0.1.2 instead"
```

Then publish a fixed version.
