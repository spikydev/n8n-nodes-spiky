# Spiky AI Trigger — Webhook Trigger Node

The Spiky AI Trigger starts your workflow automatically when a meeting analysis completes in Spiky.ai.

## How It Works

1. When you **activate** the workflow, n8n registers a webhook URL with the Spiky backend
2. When any meeting analysis completes for your company, Spiky sends the analysis data to the webhook
3. Your workflow executes with the meeting data
4. When you **deactivate** the workflow, the webhook is unregistered

## Requirements

- Your Spiky account must have **COMPANY_ADMIN** or **SUPER_ADMIN** role
- The workflow must be **activated** (not just published) for the trigger to receive events

## Setup

1. Create a new workflow
2. Click **+** and search for **Spiky AI Trigger**
3. Add it as the first node in your workflow
4. Select your Spiky AI credential
5. Connect downstream nodes (e.g., Slack, HubSpot, Gmail)
6. **Activate** the workflow using the toggle

## Testing

To test the trigger during development:

1. Click **Execute Workflow** to start listening for events (times out after 2 minutes)
2. Trigger a meeting analysis in Spiky, or send a test POST to the webhook URL:

```bash
curl -X POST <your-webhook-url> \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "test-123",
    "meeting_name": "Demo Call",
    "meeting_date": "2026-03-03",
    "brief_summary": "Discussed pricing and next steps",
    "participants": ["Alice", "Bob"],
    "spiky_score": 85.5
  }'
```

For production use, activate the workflow — this creates a permanent webhook that stays registered until you deactivate.

## Output Fields

When a meeting analysis completes, the trigger outputs the following data:

| Field | Type | Description |
|-------|------|-------------|
| `meeting_id` | string | Unique meeting analysis ID |
| `meeting_name` | string | Meeting title |
| `meeting_date` | string | Date of the meeting (YYYY-MM-DD) |
| `brief_summary` | string | Short overview of the meeting |
| `detailed_summary` | string | Multi-section summary with timestamps |
| `participants` | string[] | Names of all participants |
| `internal_emails` | string[] | Email addresses of company team members |
| `external_emails` | string[] | Email addresses of external participants |
| `meeting_organizer` | string | Email of the meeting organizer |
| `action_items` | string | Bullet-point list of action items |
| `action_items_data` | object[] | Structured action items (see below) |
| `spiky_score` | number | AI performance score (0-100) |
| `platform_report_link` | string | URL to the report in the Spiky platform |
| `shared_report_link` | string | Public shareable report URL |
| `crm_deal_id` | string \| null | Associated CRM deal ID (if connected) |
| `crm_company_id` | string \| null | Associated CRM company ID (if connected) |

### Action Items Data Structure

Each item in `action_items_data` has:

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | The action item description |
| `category` | string | Category (e.g., follow-up, deliverable) |
| `assignees` | object[] | List of assignees with `name` and `email` fields |

## Networking Notes

The Spiky backend sends webhook events from AWS (us-east-2 region). If your n8n instance is behind a firewall or on a private network:

- Ensure the Spiky backend can reach your n8n webhook URL over HTTPS
- For local development, use a tunnel service (e.g., ngrok) and set the `WEBHOOK_URL` environment variable in n8n
