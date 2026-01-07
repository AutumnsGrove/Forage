# Forage

> Before you can plant, you have to search. Domain discovery that reduces domain hunting from weeks to hours.

## Overview

An autonomous tool that orchestrates AI agents to generate, evaluate, and check domain name availability. Runs in the background via Cloudflare Durable Objects, producing a curated list of 25+ available, affordable domain options.

**Live:** [forage.grove.place](https://forage.grove.place)

## Features

- **Multi-Model AI Support** - Choose from Claude, DeepSeek, Kimi, or Cloudflare AI
- **Parallel Evaluation** - Swarm agents evaluate candidates for pronounceability, memorability, brand fit
- **RDAP Availability Checking** - No API keys needed, real-time domain status
- **Live Pricing** - Cloudflare Registrar pricing for 405+ TLDs
- **Email Notifications** - Results and follow-up emails via Resend
- **Async Processing** - Durable Objects handle long-running searches

## AI Providers

| Provider | Model | Cost (per M tokens) |
|----------|-------|---------------------|
| Claude | Sonnet 4 | $3.00 / $15.00 |
| DeepSeek | V3.2 | $0.28 / $0.42 |
| Kimi | K2 | $0.60 / $2.50 |
| Cloudflare | Llama 4 Scout | $0.27 / $0.85 |

## Quick Start

### CLI Usage

```bash
# Install with UV
uv pip install -e .

# Check a single domain
forage check example.com

# Run a full search
forage search "Sunrise Bakery" --batches 2 --vibe creative
```

### API Usage

**Authentication Required:** All API endpoints require Better Auth session authentication. You must be signed in at [auth-api.grove.place](https://auth-api.grove.place) to use the API.

```bash
# Start a search (with authenticated session cookies)
curl -X POST https://forage.grove.place/api/search \
  -H "Content-Type: application/json" \
  --cookie "better-auth.session_token=YOUR_SESSION_TOKEN" \
  --cookie-jar cookies.txt \
  -d '{
    "quiz_responses": {
      "business_name": "Sunrise Bakery",
      "tld_preferences": ["com", "co", "io"],
      "vibe": "creative"
    }
  }'

# Check status
curl https://forage.grove.place/api/status?job_id=JOB_ID \
  --cookie-jar cookies.txt \
  -b cookies.txt

# Get results
curl https://forage.grove.place/api/results?job_id=JOB_ID \
  --cookie-jar cookies.txt \
  -b cookies.txt
```

**Note:** The `client_id` is automatically set to the authenticated user's email address.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | POST | Start new search |
| `/api/status?job_id=xxx` | GET | Get job status |
| `/api/results?job_id=xxx` | GET | Get search results |
| `/api/stream?job_id=xxx` | GET | SSE real-time updates |
| `/api/followup?job_id=xxx` | GET | Get follow-up quiz |
| `/api/resume?job_id=xxx` | POST | Resume with follow-up answers |
| `/api/cancel?job_id=xxx` | POST | Cancel running job |

## Architecture

```
Quiz → Cloudflare Worker → Durable Object → AI Agents → RDAP → Pricing → Email
                              ↓
                         SQLite Storage
```

- **Driver Agent** - Generates domain candidates using AI
- **Swarm Agents** - Parallel evaluation for quality scoring
- **RDAP Checker** - Verifies availability without rate limits
- **Pricing Module** - Fetches Cloudflare Registrar prices

## Development

```bash
# Python tests
uv run pytest

# Deploy worker
cd worker && pnpm exec wrangler deploy

# Tail logs
pnpm exec wrangler tail
```

## Configuration

### Environment Variables (wrangler.toml)

```toml
DRIVER_PROVIDER = "claude"  # claude | deepseek | kimi | cloudflare
SWARM_PROVIDER = "claude"
MAX_BATCHES = "6"
TARGET_RESULTS = "25"
```

### Secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put KIMI_API_KEY
wrangler secret put RESEND_API_KEY
```

## License

MIT

---

*Part of the Grove ecosystem. Built by [@autumnsgrove](https://github.com/autumnsgrove)*
