# GroveDomainTool TODOs

## Phase 1: Extraction & Core - COMPLETE
- [x] Extract domain_checker.py to standalone package
- [x] Set up pyproject.toml for UV
- [x] Create config.py with all configurable settings
- [x] Move SPEC.md to docs/
- [x] Fill in AGENT.md placeholders
- [x] Update README.md with proper content
- [x] Add Cloudflare pricing lookup
- [x] Basic CLI: `grove-domain-tool check example.com`
- [x] Create secrets.json template

## Phase 2: Durable Object & Persistence - COMPLETE
- [x] Set up Cloudflare Worker with Durable Object
- [x] Implement SQLite schema in DO
- [x] Alarm-based batch chaining
- [x] Basic job lifecycle (create -> running -> complete/needs_followup)
- [x] Wrangler deployment commands file (worker/COMMANDS.txt)
- [x] Deploy worker to Cloudflare (grove-domain-tool-dev)
- [ ] Test DO persistence between alarms
- [ ] Add SSE/streaming endpoint for real-time progress updates

## Phase 3: AI Orchestration - COMPLETE
- [x] Implement driver agent with prompt templates
- [x] Implement Haiku swarm parallel evaluation
- [x] Build main search loop (6 batch limit)
- [x] Results scoring and ranking
- [x] Add provider abstraction for Claude/Kimi/Mock
- [x] Create orchestrator with state management
- [x] CLI: `grove-domain-tool search "Business Name" --mock`
- [x] CLI: Real AI search with Claude API (tested & working)
- [x] Fix terminal output to show domains with unknown pricing
- [x] Fix prompts to generate business-themed domains (not generic)
- [x] Add API usage tracking (tokens + cost estimation)

## Phase 4: MCP Server
- [ ] Implement MCP tool definitions
- [ ] Add job status tracking via MCP
- [ ] Build results aggregation
- [ ] Test MCP tools with Claude Desktop

## Phase 5: Quiz System - PARTIAL
- [x] Static initial quiz schema (JSON)
- [x] Follow-up quiz generator (AI-based with mock support)
- [ ] SvelteKit quiz components (terminal aesthetic)
- [x] Resend email integration (email.ts templates)
- [x] Email templates (terminal aesthetic)

## Phase 6: Multi-Model & Polish
- [x] Add Kimi K2 provider (stub, ready for API key)
- [ ] Parallel provider execution (both providers simultaneously)
- [ ] GroveEngine integration
- [ ] Production testing
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

## Next Steps (Priority Order)

### 1. Real-Time Progress Streaming (for domains.grove.place)
The website needs to show live progress as the search runs. Implementation plan:
- Add SSE endpoint to Durable Object: `GET /job/{id}/stream`
- Stream events: `batch_start`, `batch_complete`, `domain_found`, `search_complete`
- Include usage stats in stream events
- Client subscribes to SSE and updates UI in real-time

### 2. Set Up Cloudflare Bindings & Wire Up DO
Current state: Only the worker + Anthropic API key exist. No bindings configured.

**How Durable Objects work:**
- DO is NOT a replacement for Worker - it's accessed THROUGH a Worker
- Worker = stateless request handler (the entry point)
- DO = stateful singleton with SQLite storage (persists between requests)
- Flow: Request → Worker → DO (via binding) → DO handles stateful logic

**Setup needed:**
- The DO binding is defined in wrangler.toml but may need verification
- DO class `SearchJobDO` handles job state and alarm-based batch processing
- Worker routes requests to DO instances (one DO per job_id)
- DO can make HTTP calls to external services (like Anthropic API directly in TypeScript)

**Decision needed:** Port orchestrator to TypeScript in DO, or have DO call Python API?

### 3. Test Full End-to-End Flow
- Submit quiz via API
- DO starts search job
- Progress streams to website
- Results displayed when complete

### 4. Production Deployment
- Deploy to production environment (not just dev)
- Set production secrets
- Configure custom domain if needed

---

## Completed This Session (2025-12-05)

- [x] Renamed project from `grove-domain-search` to `GroveDomainTool`
- [x] Renamed Python module from `grove_domain_search` to `grove_domain_tool`
- [x] Updated all imports, tests, and documentation
- [x] Deployed worker to Cloudflare dev environment
- [x] Set ANTHROPIC_API_KEY secret in Cloudflare
- [x] Fixed terminal output to show domains with "unknown" pricing
- [x] Fixed AI prompts to generate business-themed domains
- [x] Added API usage tracking (UsageStats class)
- [x] Display token usage and cost estimate in CLI output
- [x] All 73 tests passing

---

## Key Files Modified This Session

- `pyproject.toml` - Package name, CLI entry point, URLs
- `src/grove_domain_tool/` - Renamed from grove_domain_search
- `src/grove_domain_tool/orchestrator.py` - Added UsageStats, usage tracking
- `src/grove_domain_tool/agents/prompts.py` - Strengthened prompts for business-themed domains
- `src/grove_domain_tool/agents/driver.py` - Added last_usage tracking
- `src/grove_domain_tool/agents/swarm.py` - Added usage aggregation across chunks
- `src/grove_domain_tool/cli.py` - Display usage stats
- `worker/wrangler.toml` - Updated worker name, fixed dev env config
- `tests/*` - Updated all imports

---

*Last updated: 2025-12-05*
*73 tests passing*
*Worker: https://grove-domain-tool-dev.m7jv4v7npb.workers.dev*
*CLI: `grove-domain-tool search "Business Name" --batches 2`*
