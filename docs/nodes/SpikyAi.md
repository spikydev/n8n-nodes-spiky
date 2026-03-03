# Spiky AI — Action Node

The Spiky AI action node lets you perform operations on the Spiky.ai platform from your n8n workflows.

## Operations

### Get Current User

Retrieves information about the authenticated user. Useful for testing that your connection is working.

**How to use:**
1. Add the **Spiky AI** node to your workflow
2. Select **Get Current User** as the operation
3. Click **Test step** to verify

**Output fields:**

| Field | Type | Description |
|-------|------|-------------|
| `sub` | string | User ID |
| `email` | string | User email address |
| `username` | string | Cognito username |
| `name` | string | First name |
| `family_name` | string | Last name |

### Upload Call Recording *(Coming Soon)*

Submit a call recording URL for AI-powered analysis by Spiky.

**Inputs:**
- **Recording URL** (required) — A public URL to the recording file (e.g., from Google Drive, S3, or Dropbox)
- **Meeting Name** (required) — A title for the meeting
- **Meeting Date** (optional) — When the meeting took place (defaults to now)
- **Tags** (optional) — Comma-separated tags for organizing (max 3)
