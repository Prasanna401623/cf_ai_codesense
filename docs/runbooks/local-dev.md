# Runbook: Local Development Setup

## Prerequisites

- Node.js 18+ installed
- `npm` available
- Cloudflare account (free tier is fine)
- Wrangler CLI installed and logged in

## Install and authenticate Wrangler

```bash
npm install -g wrangler
wrangler login
# Opens browser → log in to Cloudflare → authorize Wrangler
wrangler whoami
# Should show your Cloudflare account email
```

## Start the Worker locally

```bash
cd codesense/worker
npm install
wrangler dev
# Worker starts on http://localhost:8787
# Press 'L' to see logs, 'X' to exit
```

## Start the Frontend locally

In a second terminal:

```bash
cd codesense/frontend
npm install
npm run dev
# Vite starts on http://localhost:5173
# /api requests are proxied to http://localhost:8787 (Worker)
```

## Test the Worker directly

```bash
# Health check
curl http://localhost:8787/api/health

# Send a code review request
curl -X POST http://localhost:8787/api/review \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","message":"review this code","code":"function add(a,b){return a+b}"}'

# Get session history
curl http://localhost:8787/api/sessions/test-123

# Clear a session
curl -X DELETE http://localhost:8787/api/sessions/test-123
```

## Common local dev issues

**Worker crashes on start:**
- Check `wrangler.toml` syntax
- Run `wrangler types` to regenerate TypeScript types
- Make sure all exported classes are in `index.ts`

**Frontend can't reach Worker:**
- Check `vite.config.ts` proxy config points to `http://localhost:8787`
- Make sure Worker is actually running (check terminal 1)

**Durable Object not persisting:**
- Run `wrangler dev --local` (uses local SQLite for DO storage)
- Data persists in `.wrangler/state/` directory

**AI not responding locally:**
- Workers AI only works with a real Cloudflare account via `wrangler dev --remote`
- For local dev without AI, use `wrangler dev` (local) and mock the AI response for testing UI

## Useful wrangler flags

```bash
wrangler dev --remote    # Run locally but use real Cloudflare services (incl. Workers AI)
wrangler dev --local     # Fully local (AI won't work, but DO and routing will)
wrangler tail            # Stream logs from deployed worker (not local)
wrangler types           # Regenerate bindings TypeScript types
```
