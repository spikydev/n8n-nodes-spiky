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

### Upload Call Recording

Submit a call recording URL for AI-powered analysis by Spiky. The recording is uploaded server-side — no file data passes through n8n.

**Inputs:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Recording URL | string | Yes | A publicly accessible direct download URL to the recording file (e.g., S3 pre-signed URL). The URL must return the file bytes directly, not an HTML page. |
| Meeting Name | string | Yes | A title for the meeting |
| Meeting Date | dateTime | No | When the meeting took place (defaults to now) |
| Tags | string | No | Comma-separated tag names (max 3). Existing tags are matched by name (case-insensitive); new tags are created automatically. |

**How to use:**
1. Add the **Spiky AI** node to your workflow
2. Select **Upload Recording** as the operation
3. Provide a **Recording URL** — this must be a direct download link (not a web page)
4. Enter a **Meeting Name**
5. Optionally set **Meeting Date** and **Tags**
6. Click **Test step** or run the workflow

**What happens behind the scenes:**
1. Spiky calculates the file size from the URL
2. A meeting record is created with integration source `N8N`
3. Spiky's backend downloads the file from the URL and uploads it to S3
4. The ML analysis pipeline is triggered automatically

**Output fields:**

| Field | Type | Description |
|-------|------|-------------|
| `meeting_id` | string | Unique meeting ID in Spiky |
| `meeting_name` | string | The meeting name you provided |
| `meeting_date` | string | ISO 8601 date of the meeting |
| `status` | string | Always `upload_in_progress` on success |

**Important notes:**
- The recording URL must be a **direct download link**. Google Drive sharing links, Dropbox preview pages, and similar URLs that return HTML will fail.
- For Google Drive, use the format: `https://drive.google.com/uc?export=download&id=FILE_ID` (only works for files <100MB)
- For large files, use S3 pre-signed URLs or other direct-download hosting
- The upload is handled server-side by Spiky's backend (Lambda). The n8n node only orchestrates API calls — no file data flows through n8n.
- After a successful upload, the meeting will appear in your Spiky dashboard. Analysis typically takes a few minutes.
