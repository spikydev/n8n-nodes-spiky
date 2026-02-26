# Spiky AI for n8n — Usage Guide

This guide explains how to install and use the Spiky AI node in your n8n workflows.

## What is Spiky AI?

[Spiky.ai](https://spiky.ai) is an AI-powered meeting intelligence platform. It analyzes your sales calls, demos, and team meetings to provide summaries, transcripts, action items, and performance scores.

The Spiky AI n8n node lets you automate workflows around your meeting data — for example, automatically sending meeting summaries to Slack, updating your CRM when a call is analyzed, or uploading recordings for analysis from other tools.

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

Before using the Spiky AI node, you need to connect your Spiky account.

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
5. Click the **Connect** button

### Step 3: Sign in

After clicking Connect, a login page will open in your browser:

1. Enter your Spiky email and password
2. Click **Sign in**
3. You'll be redirected back to n8n
4. The credential should now show as **Connected**

## Using the Spiky AI Node

### Adding the Node to a Workflow

1. Open or create a workflow
2. Click the **+** button to add a node
3. Search for **Spiky AI**
4. Click to add it to your workflow

### Available Operations

#### Get Current User

Retrieves information about the authenticated user. Useful for testing that your connection is working.

**How to use:**
1. Add the Spiky AI node
2. Select **Get Current User** as the operation
3. Click **Test step** to verify

#### Upload Call Recording *(Coming Soon)*

Submit a call recording URL for AI-powered analysis by Spiky.

**Inputs:**
- **Recording URL** (required) — A public URL to the recording file (e.g., from Google Drive, S3, or Dropbox)
- **Meeting Name** (required) — A title for the meeting
- **Meeting Date** (optional) — When the meeting took place (defaults to now)
- **Tags** (optional) — Comma-separated tags for organizing (max 3)

### Spiky AI Trigger *(Coming Soon)*

The trigger node starts your workflow automatically when a meeting analysis is ready.

**What it provides:**
- Meeting name and date
- Brief and detailed summaries
- Full transcript
- Participant list (internal and external)
- Action items
- Spiky score (0-100 quality metric)
- Links to the meeting report
- CRM deal and company IDs

**Example workflows:**
- When a meeting is analyzed → Post summary to a Slack channel
- When a meeting is analyzed → Create a note in HubSpot
- When a meeting is analyzed → Add action items to Notion
- When a meeting is analyzed → Send follow-up email via Gmail

## Troubleshooting

### "Invalid credentials" error

- Make sure you entered the correct Client ID and Client Secret
- Try disconnecting and reconnecting the credential
- Verify your Spiky account is active

### Node not found in search

- Ensure the node is installed (see Installation above)
- On self-hosted: restart n8n after installation
- On n8n Cloud: the node may take a few minutes to become available

### OAuth login page doesn't load

- Check your internet connection
- Try clearing your browser cache
- If using a corporate network, check that `*.amazoncognito.com` is not blocked

## Need Help?

- **Spiky Support:** Contact your Spiky account manager or visit [spiky.ai](https://spiky.ai)
- **n8n Community:** [community.n8n.io](https://community.n8n.io/)
- **Bug Reports:** [GitHub Issues](https://github.com/spikydev/n8n-nodes-spiky/issues)
