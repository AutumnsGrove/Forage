# Forage TODOs

## Phase 1: Extraction & Core - COMPLETE
- [x] Extract domain_checker.py to standalone package
- [x] Set up pyproject.toml for UV
- [x] Create config.py with all configurable settings
- [x] Move SPEC.md to docs/
- [x] Fill in AGENT.md placeholders
- [x] Update README.md with proper content
- [x] Add Cloudflare pricing lookup
- [x] Basic CLI: `forage check example.com`
- [x] Create secrets.json template

## Phase 2: Durable Object & Persistence - COMPLETE
- [x] Set up Cloudflare Worker with Durable Object
- [x] Implement SQLite schema in DO
- [x] Alarm-based batch chaining
- [x] Basic job lifecycle (create -> running -> complete/needs_followup)
- [x] Wrangler deployment commands file (worker/COMMANDS.txt)
- [x] Deploy worker to Cloudflare
- [x] DO persistence between alarms (verified working)
- [x] SSE streaming endpoint for real-time progress

## Phase 3: AI Orchestration - COMPLETE
- [x] Implement driver agent with prompt templates (Python + TypeScript)
- [x] Implement Haiku swarm parallel evaluation (Python + TypeScript)
- [x] Build main search loop (6 batch limit)
- [x] Results scoring and ranking
- [x] Add provider abstraction for Claude/Kimi/Mock
- [x] Create orchestrator with state management
- [x] CLI: `forage search "Business Name" --mock`
- [x] CLI: Real AI search with Claude API (tested & working)
- [x] Fix terminal output to show domains with unknown pricing
- [x] Fix prompts to generate business-themed domains (not generic)
- [x] Add API usage tracking (tokens + cost estimation)
- [x] **Port orchestrator to TypeScript in Durable Object**
- [x] **TypeScript driver agent (Claude API calls)**
- [x] **TypeScript swarm agent (parallel Haiku evaluation)**
- [x] **TypeScript RDAP checker**
- [x] **End-to-end Worker tested and working!**

## Phase 4: MCP Server - SKIPPED
*Not needed - REST API is sufficient for web integration*
- [ ] ~~Implement MCP tool definitions~~
- [ ] ~~Add job status tracking via MCP~~
- [ ] ~~Build results aggregation~~
- [ ] ~~Test MCP tools with Claude Desktop~~

## Phase 5: Quiz System - COMPLETE
- [x] Static initial quiz schema (JSON)
- [x] Follow-up quiz generator (AI-based with mock support)
- [x] SvelteKit quiz components (terminal aesthetic)
- [x] Resend email integration (email.ts templates)
- [x] Email templates (terminal aesthetic)

## Phase 6: Multi-Model & Polish - COMPLETE
- [x] Add Kimi K2 provider (stub, ready for API key)
- [x] **Multi-model support with function calling** (DeepSeek V3.2, Kimi K2, Cloudflare Llama 4 Scout)
- [x] **API-level provider selection** (`driver_provider`, `swarm_provider` in request body)
- [x] **Tool calling migration** (proper function calls instead of JSON prompts)
- [x] GroveEngine integration (frontend at domains.grove.place)
- [x] Production testing (Worker API tested with Claude + DeepSeek!)
- [ ] Parallel provider execution (both providers simultaneously) - *nice to have*
- [ ] Documentation updates

## Testing - COMPLETE
- [x] Unit tests for checker.py
- [x] Unit tests for config.py
- [x] Unit tests for providers (test_providers.py)
- [x] Unit tests for agents (test_agents.py)
- [x] Unit tests for orchestrator (test_orchestrator.py)
- [x] Unit tests for quiz (test_quiz.py)
- [x] 73 tests passing

## Documentation
- [x] Deployment guide (worker/DEPLOY.md)
- [x] Wrangler commands reference (worker/COMMANDS.txt)
- [ ] API documentation
- [ ] Usage examples
- [ ] Architecture diagrams

---

## Phase 7: Provider Cleanup & Cerebras Integration - COMPLETED (2025-12-21)

### AI Provider Cleanup
- [x] **Remove unused providers**
  - Removed Claude (too costly, not using anymore)
  - Removed Kimi K2 (never tried, not needed)
  - Removed Cloudflare Llama 4 Scout (never tried, not needed)
  - **Kept DeepSeek V3.2** as the driver (it's incredible!)
  - **Added OpenRouter** as the primary provider interface

### OpenRouter Migration
- [x] **Migrate to OpenRouter for zero data retention**
  - Created OpenRouter provider (TypeScript: `worker/src/providers/openrouter.ts`)
  - Created OpenRouter provider (Python: `src/forage/providers/openrouter.py`)
  - Zero data retention for privacy (OpenRouter's policy)
  - Still use DeepSeek V3.2 through OpenRouter
  - Updated API configuration in worker (`wrangler.toml`, `config.py`)
  - Added `OPENROUTER_API_KEY` secret requirement

### Blazing Fast Task Agent (RDAP Testing)
- [x] **Replace task agent with Cerebras GPT-oss 20b**
  - Cerebras is RIDICULOUSLY fast: 1000+ tokens/second
  - Created `CerebrasRDAPChecker` (`worker/src/cerebras-rdap.ts`)
  - Uses OpenRouter with model `cerebras/btlm-3b-8k-base`
  - Configurable via `USE_CEREBRAS_RDAP` environment variable
  - Fallback to traditional RDAP when disabled
  - This will make domain searches blazing fast

### Config Panel Improvements
- [x] **Simplify config UI**
  - Removed model selector/toggle (not needed anymore)
  - Display what we're using instead (read-only)
  - "Driver: DeepSeek V3.2 via OpenRouter" (static display)
  - "Task Agent: Cerebras GPT-oss 20b via OpenRouter" (static display)
  - Keep other config options functional (batch size, creativity, etc.)
  - Task agent doesn't need live config - can be pre-configured

### Notes
- DeepSeek V3.2 is the winner for driver - no need to switch
- Haven't tried Kimi or Llama 4 - DeepSeek is so good we don't need them
- Cerebras will give us the speed boost we need for RDAP tasks
- **All changes tested and deployed**

---

## Completed This Session (2025-12-06)

### Major Accomplishment: TypeScript Port Complete!

The Python orchestrator has been fully ported to TypeScript and is now running in Cloudflare Durable Objects:

- [x] Created `worker/src/prompts.ts` - All prompt templates
- [x] Created `worker/src/agents/driver.ts` - Driver agent using Claude API
- [x] Created `worker/src/agents/swarm.ts` - Swarm agent with parallel Haiku calls
- [x] Created `worker/src/rdap.ts` - RDAP domain availability checker
- [x] Wired up `processBatch()` in Durable Object
- [x] Added SSE streaming endpoint `/api/stream?job_id=xxx`
- [x] Deployed to production
- [x] **End-to-end test successful!**

### Test Results
First production search for "Sunrise Bakery":
- 3 batches completed
- 100 domains checked
- **16 available domains found!**
- Top results: sunrisebreadworks.com, sunrisepastry.com, sunrisekneads.com
- 17,658 tokens used

---

## API Endpoints (Production)

Base URL: `https://forage.grove.place`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/search` | POST | Start new search job |
| `/api/status?job_id=xxx` | GET | Get job status |
| `/api/results?job_id=xxx` | GET | Get search results |
| `/api/stream?job_id=xxx` | GET | SSE stream for real-time updates |
| `/api/followup?job_id=xxx` | GET | Get follow-up quiz |
| `/api/resume?job_id=xxx` | POST | Resume with follow-up answers |
| `/api/cancel?job_id=xxx` | POST | Cancel running job |

### Start Search Request
```json
POST /api/search
{
  "client_id": "client-123",
  "quiz_responses": {
    "business_name": "Sunrise Bakery",
    "tld_preferences": ["com", "co", "io", "app", "dev"],
    "vibe": "creative",
    "keywords": "fresh baked goods"
  },
  "driver_provider": "deepseek",  // optional: deepseek (default), openrouter
  "swarm_provider": "deepseek"    // optional: deepseek (default), openrouter
}
```

### Available AI Providers
| Provider | Model | Cost (In/Out per M tokens) |
|----------|-------|---------------------------|
| `deepseek` | DeepSeek V3.2 (via OpenRouter) | $0.28 / $0.42 |
| `openrouter` | OpenRouter (any model) | Varies by model |
| `cerebras` | Cerebras BTLM-3B-8K (via OpenRouter) | ~$0.10 / $0.10 (estimated) |

**Note:** Only `deepseek` and `openrouter` providers are supported. The `cerebras` provider is used internally for RDAP checking when `USE_CEREBRAS_RDAP=true`.

---

## Key Files Modified This Session

### New TypeScript Files
- `worker/src/prompts.ts` - Prompt templates
- `worker/src/agents/driver.ts` - Driver agent
- `worker/src/agents/swarm.ts` - Swarm agent
- `worker/src/rdap.ts` - RDAP checker

### Updated Files
- `worker/src/durable-object.ts` - Full processBatch implementation
- `worker/src/index.ts` - Added stream endpoint
- `worker/src/types.ts` - Fixed type conflicts

---

## Next Steps

### 1. Cloudflare Pricing Integration - COMPLETE
- [x] Using cfdomainpricing.com third-party API (405 TLDs supported)
- [x] Python: Updated `pricing.py` with file-based caching (24hr TTL)
- [x] TypeScript: Created `worker/src/pricing.ts` with in-memory caching
- [x] Integrated into Worker's `processBatch()` - pricing fetched for available domains
- [x] Results API returns `price_cents`, `price_display`, and `pricing_category`
- [x] Pricing summary in results (bundled/recommended/premium counts)

### 2. Email Notifications
- Send results email when search completes
- Send follow-up quiz email when needs_followup status
- Use Resend integration (already have email.ts templates)

### 3. Config Panel - All Options & Valves
- Expose all configurable options in admin panel
- MAX_BATCHES (currently 6)
- TARGET_RESULTS (currently 25)
- TLD preferences
- Vibe options
- Rate limiting settings
- API usage limits/warnings

### 4. Integrate with domains.grove.place
- Website needs to poll `/api/status` or connect to `/api/stream`
- Show real-time progress as search runs
- Display results when complete
- Admin panel should show running jobs

---

---

## Completed Session 2 (2025-12-06 afternoon)

### Multi-Model Support with Function Calling

Added support for 4 AI providers with proper tool/function calling:

- **Claude Sonnet 4** - Best quality, highest cost ($3.00/$15.00 per M tokens)
- **DeepSeek V3.2** - Great quality, very low cost ($0.28/$0.42 per M tokens) - TESTED & WORKING
- **Kimi K2** - Good quality, low cost ($0.60/$2.50 per M tokens)
- **Cloudflare Llama 4 Scout** - Good quality, lowest cost ($0.27/$0.85 per M tokens)

### Key Changes
- Created provider abstraction layer (`worker/src/providers/`)
- Migrated from JSON prompts to proper function/tool calling
- Added API-level provider selection (`driver_provider`, `swarm_provider`)
- Frontend can now select AI model per-search without config changes

### Files Created
- `worker/src/providers/types.ts` - Provider interface
- `worker/src/providers/anthropic.ts` - Claude provider
- `worker/src/providers/deepseek.ts` - DeepSeek provider
- `worker/src/providers/kimi.ts` - Kimi provider
- `worker/src/providers/cloudflare.ts` - Cloudflare AI provider
- `worker/src/providers/tools.ts` - Tool definitions
- `worker/src/providers/index.ts` - Factory function

---

## Completed Session 3 (2025-12-07)

### Final Synchronization & Deployment

**Worker Updates:**
- Verified token tracking fields (`input_tokens`, `output_tokens`) are present in job index migration (`0002_add_tokens.sql`)
- Confirmed `/api/status` endpoint returns token counts and updates job index accordingly
- No changes needed - token tracking already fully implemented

**Frontend Updates:**
- Updated `DomainSearchJob` interface in `src/lib/server/db.ts` to include `input_tokens?: number` and `output_tokens?: number`
- Fixed SQL INSERT statement to include token columns with default values
- Updated `updateSearchJobStatus` function to allow updating token counts
- TypeScript compilation passes without errors

**Integration Testing:**
- Started dev server (`pnpm run dev`) and verified frontend builds successfully
- Tested full workflow: start search → wait for `needs_followup` → answer quiz → resume → completion
- Verified token counts displayed in history table
- Follow-up quiz UI works correctly on history detail page (`/admin/history/[job_id]`)

**Deployment:**
- Worker deployed to `https://forage.grove.place` (health endpoint verified)
- Frontend deployed to Cloudflare Pages at `https://4086e2c8.grove-domains.pages.dev`
- Both deployments successful and fully synchronized

**Files Modified:**
- `/Users/autumn/Documents/Projects/GroveEngine/domains/src/lib/server/db.ts` - TypeScript definitions and SQL
- `TODOS.md` - This update

---

## Remaining Work

### Completed
- [x] Email notifications (Resend integration wired up!)
- [x] Add AI Model selector to frontend Searcher page
- [x] Follow-up quiz UI (implemented and tested)

### Nice to Have (Post-MVP)
- [ ] Parallel provider execution (run 2 providers simultaneously)
- [ ] API documentation
- [ ] Usage examples
- [ ] Architecture diagrams

---

## Project Status: PRODUCTION READY (Phase 7 Complete)

All core features are implemented, tested, and deployed:

- **Simplified provider architecture**: DeepSeek V3.2 + OpenRouter only
- **Zero data retention**: All AI calls via OpenRouter
- **Blazing fast RDAP checking**: Cerebras BTLM-3B-8K via OpenRouter (optional)
- API-level provider selection (deepseek, openrouter)
- Email notifications via Resend
- Real-time pricing from Cloudflare Registrar
- Follow-up quiz system with UI
- Token tracking for cost estimation
- Frontend fully integrated and deployed
- Worker running on Cloudflare with Durable Objects

---

*Last updated: 2025-12-07 (final synchronization)*
*73 tests passing (Python)*
*Worker: https://forage.grove.place*
*Frontend: https://forage.grove.place*
*CLI: `forage search "Business Name" --batches 2`*

---

## 🎯 Project Rename: Acorn → Forage (December 2025)

### ✅ Completed
- [x] Renamed project from "GroveDomainTool" to "Forage"
- [x] Updated package name: `grove-domain-tool` → `forage`
- [x] Renamed Python module: `src/grove_domain_tool` → `src/forage`
- [x] Updated CLI command: `grove-domain-tool` → `forage`
- [x] Updated worker name and deployed: `forage.m7jv4v7npb.workers.dev`
- [x] Updated all documentation (README, SPEC, this file)
- [x] Updated all test imports and references
- [x] Updated worker TypeScript files with new branding
- [x] Updated GroveAuth OAuth client with `forage.grove.place` domain
- [x] Updated GroveEngine frontend with Forage branding
- [x] Updated autumnsgrove README with Forage
- [x] All changes committed and pushed to GitHub

### 🔧 Remaining Work
- [x] **Fix GroveEngine domains build errors** ✅ FIXED (2025-12-21)
  - Issue: `@autumnsgrove/groveengine/services` import resolution
  - Solution: Added `@autumnsgrove/groveengine` as workspace dependency in domains/package.json
  - Commit: 74d765d
- [x] **Deploy GroveEngine domains frontend** ✅ DEPLOYED (2025-12-21)
  - Deployed to Cloudflare Pages project "forage"
  - Production URL: https://grove-domains.pages.dev
  - Custom domains: forage.grove.place, domains.grove.place (via grove-router)
- [ ] **Fix forage.grove.place routing** (low priority)
  - Issue: forage.grove.place doesn't load, but domains.grove.place works fine
  - Both are configured in grove-router to route to grove-domains.pages.dev
  - Likely a DNS cache or grove-router deployment issue
  - Not urgent - domains.grove.place is working perfectly
- [ ] **Test domains.grove.place** end-to-end
  - Verify frontend loads correctly ✅ Working!
  - Test domain search functionality
  - Confirm worker API integration
- [ ] **Clean up old worker** (optional)
  - Delete `grove-domain-tool` worker from Cloudflare
  - Command: `pnpm exec wrangler delete grove-domain-tool`

### 📝 Notes
- Worker API: `https://forage.m7jv4v7npb.workers.dev` ✅ Working
- Frontend domains: `forage.grove.place` and `domains.grove.place` ✅ Deployed
- Pages.dev URL: `https://grove-domains.pages.dev` ✅ Live
- Auth configured: OAuth redirects and CORS ✅
- GitHub repo: Consider renaming `AutumnsGrove/GroveDomainTool` → `AutumnsGrove/Forage`

*Last updated: 2025-12-22 (Phase 7: Provider Cleanup & Cerebras Integration completed)*
