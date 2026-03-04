# Spiky AI for n8n — Usage Guide

This guide explains how to install and use the Spiky AI nodes in your n8n workflows.

## What is Spiky AI?

[Spiky.ai](https://spiky.ai) is an AI-powered meeting intelligence platform. It analyzes your sales calls, demos, and team meetings to provide summaries, transcripts, action items, and performance scores.

The Spiky AI n8n nodes let you automate workflows around your meeting data — for example, automatically sending meeting summaries to Slack, updating your CRM when a call is analyzed, or uploading recordings for analysis from other tools.

## Installation

### On n8n Cloud

1. Open your n8n instance
2. Go to **Settings** (gear icon in the sidebar)
3. Click **Community Nodes**
4. Click **Install a community node**
5. Enter: `n8n-nodes-spiky`
6. Click **Install**

### On Self-Hosted n8n

Ask your n8n administrator to install the node:

```bash
npm install n8n-nodes-spiky
```

Then restart the n8n instance.

## Connecting Your Spiky Account

Before using the Spiky AI nodes, you need to connect your Spiky account.

### Step 1: Get your credentials

Contact your Spiky administrator or Spiky support to obtain:
- **Client ID**
- **Client Secret**

These are used to securely connect n8n to your Spiky account.

### Step 2: Create the credential in n8n

1. In n8n, go to **Credentials** (key icon in the sidebar)
2. Click **Add Credential**
3. Search for **Spiky AI OAuth2 API**
4. Enter the **Client ID** and **Client Secret**
5. The **Core Platform API Base URL** and **Platform API Base URL** fields are pre-filled with production defaults. Only change these if connecting to a non-production Spiky environment.
6. Click the **Connect** button

### Step 3: Sign in

After clicking Connect, a login page will open in your browser:

1. Enter your Spiky email and password
2. Click **Sign in**
3. You'll be redirected back to n8n
4. The credential should now show as **Connected**

> **Note:** You must have a **COMPANY_ADMIN** or **SUPER_ADMIN** role in Spiky to use the trigger node. Regular users can use the action node (Get Current User).

## Available Nodes

This package provides two nodes:

| Node | Type | Description |
|------|------|-------------|
| **Spiky AI** | Action | Perform operations like getting user info or uploading recordings |
| **Spiky AI Trigger** | Trigger | Automatically starts a workflow when a meeting analysis completes |

See the individual node guides for details:
- [Spiky AI (Action Node)](./nodes/SpikyAi.md)
- [Spiky AI Trigger](./nodes/SpikyAiTrigger.md)

## Example Workflows

### Post meeting summaries to Slack

**Spiky AI Trigger** → **Slack** (Send Message)

When any meeting analysis completes, post the brief summary and action items to a Slack channel.

### Update CRM after every call

**Spiky AI Trigger** → **HubSpot** (Create Note)

Automatically create a CRM note with the meeting summary, participants, and Spiky score.

### Track action items in Notion

**Spiky AI Trigger** → **Notion** (Create Page)

Create a Notion page for each meeting with action items and assignees.

### Send follow-up emails

**Spiky AI Trigger** → **Gmail** (Send Email)

Email external participants a summary and action items after the call.

## Troubleshooting

### "Invalid credentials" error

- Make sure you entered the correct Client ID and Client Secret
- Try disconnecting and reconnecting the credential
- Verify your Spiky account is active

### "Authorization failed" error

- Ensure your Spiky account has **COMPANY_ADMIN** or **SUPER_ADMIN** role (required for the trigger node)
- Try reconnecting the credential to get a fresh token

### Node not found in search

- Ensure the node is installed (see Installation above)
- On self-hosted: restart n8n after installation
- On n8n Cloud: the node may take a few minutes to become available

### OAuth login page doesn't load

- Check your internet connection
- Try clearing your browser cache
- If using a corporate network, check that `*.amazoncognito.com` is not blocked

### Trigger webhook not receiving events

- Ensure the workflow is **activated** (toggled on), not just published
- If using self-hosted n8n behind a firewall, the Spiky backend needs to reach your n8n webhook URL. Consider using a reverse proxy or tunnel.
- Check that the webhook URL was registered by looking at your n8n logs for `POST /n8n/subscription` calls

## Need Help?

- **Spiky Support:** Contact your Spiky account manager or visit [spiky.ai](https://spiky.ai)
- **n8n Community:** [community.n8n.io](https://community.n8n.io/)
- **Bug Reports:** [GitHub Issues](https://github.com/spikydev/n8n-nodes-spiky/issues)
