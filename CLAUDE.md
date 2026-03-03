# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n8n community node package for [Spiky.ai](https://spiky.ai) — an AI-powered meeting intelligence platform. This provides custom n8n nodes that integrate Spiky's API into n8n workflows.

## Commands

```bash
npm run build          # Compile TypeScript → dist/ (uses n8n-node build)
npm run build:watch    # Watch mode recompilation
npm run lint           # ESLint via n8n-node lint
npm run lint:fix       # ESLint with auto-fix
npm run dev            # n8n development mode
```

CI runs lint then build on PRs and pushes to main (Node 22).

## Architecture

This is an **n8n community node package** following the [n8n node development conventions](https://docs.n8n.io/integrations/creating-nodes/). The package exports credentials and nodes registered via the `n8n` field in `package.json`.

### Key files

- `credentials/SpikyAiOAuth2Api.credentials.ts` — OAuth2 credential extending n8n's `oAuth2Api` base. Authenticates via AWS Cognito using `id_token` (not `access_token`) in the Authorization header.
- `nodes/SpikyAi/SpikyAi.node.ts` — Action node implementing `INodeType`. Currently supports "Get Current User" operation. Each operation processes items in a loop with `continueOnFail()` error handling.
- `nodes/SpikyAi/SpikyAi.node.json` — Codex metadata (categories, documentation links).
- `nodes/SpikyAi/spikyAi.svg` / `spikyAi.dark.svg` — Node icons for light/dark themes.

### n8n node patterns

- Nodes implement `INodeType` with a `description` property and an `execute` method.
- API calls use `this.helpers.httpRequestWithAuthentication` with the credential name `'spikyAiOAuth2Api'`.
- Credentials implement `ICredentialType` and use `authenticate` for injecting auth headers into requests.
- The credential uses `id_token` from `oauthTokenData` (Cognito-specific), not the standard `access_token`.

## Local Development

Run n8n locally with Docker, mounting the built node:

```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd):/home/node/custom-nodes/n8n-nodes-spiky \
  -e N8N_CUSTOM_EXTENSIONS="/home/node/custom-nodes/n8n-nodes-spiky" \
  n8nio/n8n
```

The Docker container must be restarted after each build to pick up changes.

## Code Style

- Uses tabs for indentation, single quotes, semicolons, trailing commas
- Print width: 100
- ESLint config extends `@n8n/node-cli/eslint` (includes n8n-specific rules via `eslint-plugin-n8n-nodes-base`)
- TypeScript strict mode enabled
