# Local Development Guide

This guide walks you through setting up a local development environment for the Spiky AI n8n community node.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22.0.0
- [Docker](https://www.docker.com/) (for running n8n locally)
- A [Spiky.ai](https://spiky.ai) account with email/password login

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/spikydev/n8n-nodes-spiky.git
cd n8n-nodes-spiky
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project

```bash
npm run build
```

To rebuild automatically on file changes during development:

```bash
npm run build:watch
```

## Running n8n Locally with the Node

### 1. Start n8n with Docker

Run the following command to start n8n and mount your local node build into the container:

```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd):/home/node/custom-nodes/n8n-nodes-spiky \
  -e N8N_CUSTOM_EXTENSIONS="/home/node/custom-nodes/n8n-nodes-spiky" \
  n8nio/n8n
```

### 2. Access n8n

Open your browser and go to: [http://localhost:5678](http://localhost:5678)

On first launch, n8n will ask you to create a local owner account (email + password). This is stored locally and is not related to any cloud service.

### 3. Set up the Spiky AI credential

1. In n8n, create a new workflow
2. Add a node and search for **Spiky AI**
3. Click on the node, then click **Create New Credential**
4. Enter your Spiky **Email** and **Password**
5. The **Cognito Client ID** and API base URLs are pre-filled with production defaults. For dev/staging, override them accordingly.
6. Click **Save** and then **Test** to verify the connection

### 4. Test the connection

1. Select the **Get Current User** operation
2. Click **Test step**
3. You should see your user info (email, username) returned

## Development Workflow

1. Make changes to files in `credentials/` or `nodes/`
2. Rebuild: `npm run build` (or use `npm run build:watch`)
3. Restart the Docker container to pick up changes
4. Test in the n8n UI

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript and copy static assets |
| `npm run build:watch` | Watch mode — recompile on file changes |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Run ESLint and auto-fix issues |
| `npm run dev` | Start n8n development mode |

## Project Structure

```
n8n-nodes-spiky/
├── credentials/
│   └── SpikyAiApi.credentials.ts         # preAuthentication credential
├── nodes/
│   └── SpikyAi/
│       ├── SpikyAi.node.ts               # Action node (router)
│       ├── SpikyAiTrigger.node.ts        # Trigger node (webhook)
│       ├── GenericFunctions.ts            # Shared API helpers
│       ├── operations/                    # Operation handlers
│       ├── spikyAi.svg                   # Icon (light mode)
│       └── spikyAi.dark.svg              # Icon (dark mode)
├── docs/                                  # Documentation
├── .github/workflows/ci.yml              # CI pipeline
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

## Troubleshooting

### Node doesn't appear in n8n search

- Make sure you ran `npm run build` before starting the Docker container
- Verify the `N8N_CUSTOM_EXTENSIONS` path points to the correct directory
- Restart the Docker container after rebuilding

### Credential test returns "Invalid email or password"

- Verify your email/password works on [app.spiky.ai](https://app.spiky.ai)
- SSO-only users (Google/Microsoft/Apple login) must set a password first via Spiky settings
- Check that the Cognito Client ID is correct (production default: `215131dkhgebjfevrn9k5ql61r`)

### Changes not reflected after rebuild

- The Docker container caches node definitions at startup. Stop and restart the container after each build.
