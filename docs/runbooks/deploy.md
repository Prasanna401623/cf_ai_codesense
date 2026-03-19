# Runbook: Deployment

## Deploy the Worker

```bash
cd codesense/worker
wrangler deploy
# Deploys to: https://codesense-worker.<your-subdomain>.workers.dev
```

Note the deployed URL — you'll need it for the frontend.

## Deploy the Frontend (Cloudflare Pages)

```bash
cd codesense/frontend
npm run build               # Builds to dist/
wrangler pages deploy dist --project-name codesense
# First deploy creates the project
# Subsequent deploys update it
# Deployed to: https://codesense.pages.dev (or similar)
```

## Post-deploy configuration

### 1. Update CORS in Worker

In `codesense/worker/src/index.ts`, update the CORS origin:

```typescript
app.use('*', cors({
  origin: 'https://codesense.pages.dev',  // Replace with actual Pages URL
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type'],
}))
```

Redeploy the worker after this change: `wrangler deploy`

### 2. Update frontend API URL

In `codesense/frontend/src/lib/api.ts`, set the worker URL for production:

```typescript
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'
```

Add to Cloudflare Pages environment variables in dashboard:
- `VITE_WORKER_URL` = `https://codesense-worker.<your-subdomain>.workers.dev`

Redeploy frontend after setting the env var.

### 3. Set environment variables

In Cloudflare dashboard → Workers & Pages → codesense-worker → Settings → Variables:
- `ENVIRONMENT` = `production`

## Verify deployment

```bash
# Test deployed worker
curl https://codesense-worker.<your-subdomain>.workers.dev/api/health

# Test a review (use your actual worker URL)
curl -X POST https://codesense-worker.<your-subdomain>.workers.dev/api/review \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"deploy-test","message":"review this","code":"const x = 1"}'
```

Then open the Pages URL in browser and test the full flow.

## Monitor deployed worker

```bash
wrangler tail     # Stream live logs from deployed worker
```

## Rollback

Cloudflare keeps deployment history. To rollback:
1. Cloudflare dashboard → Workers & Pages → codesense-worker → Deployments
2. Find the previous deployment → "Rollback to this version"
