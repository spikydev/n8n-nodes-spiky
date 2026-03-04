# n8n-nodes-spiky

This is an [n8n](https://n8n.io/) community node for [Spiky.ai](https://spiky.ai) — an AI-powered meeting intelligence platform that analyzes sales calls, demos, and team meetings to provide actionable insights.

## Features

- **Upload Call Recording** — Submit a call recording URL for AI-powered analysis
- **Meeting Analysis Ready** (Trigger) — Automatically starts a workflow when a meeting analysis completes

## Installation

### n8n Cloud

1. Go to **Settings > Community Nodes**
2. Search for `n8n-nodes-spiky`
3. Click **Install**

### Self-Hosted n8n

```bash
# In your n8n installation directory
npm install n8n-nodes-spiky
```

Then restart your n8n instance.

## Credentials

This node uses OAuth2 to authenticate with your Spiky.ai account.

### Prerequisites

- A [Spiky.ai](https://spiky.ai) account
- OAuth2 Client ID and Client Secret (contact Spiky.ai support or your admin)

### Setup

1. In n8n, go to **Credentials > New Credential**
2. Search for **Spiky AI OAuth2 API**
3. Enter your **Client ID** and **Client Secret**
4. Click **Connect** — you'll be redirected to the Spiky login page
5. Sign in with your Spiky account credentials
6. After successful authentication, you'll be redirected back to n8n

## Operations

### Spiky AI (Action Node)

| Operation | Description |
|-----------|-------------|
| Get Current User | Retrieve the authenticated user's information |
| Upload Call Recording | Submit a recording URL for AI analysis *(coming soon)* |

### Spiky AI Trigger

| Trigger | Description |
|---------|-------------|
| Meeting Analysis Ready | Fires when a meeting analysis completes |

## Compatibility

- **Minimum n8n version:** 1.0.0
- **Node.js:** >= 22.0.0

## Development

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for instructions on setting up a local development environment.

## Resources

- [Spiky.ai](https://spiky.ai)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
- [n8n Community Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)

## License

[MIT](LICENSE)
