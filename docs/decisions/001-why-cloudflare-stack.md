# Decision 001 — Why the Cloudflare Stack

## Status: Decided

## Context

This project is built for a Cloudflare internship application. The assignment explicitly requires use of Cloudflare's platform. However, within that constraint, many specific choices were made.

## Decisions

### Hono over raw Workers fetch handler
**Why:** Raw Workers require manual URL parsing, method checking, and response construction. Hono provides Express-like routing with TypeScript support, designed specifically for edge runtimes. It adds ~12KB to the bundle — acceptable.

### Durable Objects over KV or D1
**Why:**
- KV is eventually consistent — unusable for conversation state (you could write a message and immediately read a stale version)
- D1 is a relational database — over-engineered for per-user key-value conversation storage
- Durable Objects provide strong consistency, per-user isolation, and co-location (the DO runs near the user)

**Trade-off:** DOs are the most complex Cloudflare primitive. Worth it here because it's what impresses Cloudflare reviewers — it shows you understand their most unique product.

### Cloudflare Workflows over manual retry logic
**Why:** Without Workflows, if the AI call fails mid-request, you'd have to restart the entire pipeline (re-fetch history, rebuild prompt, retry AI). Workflows checkpoint each step. If Step 3 (LLM call) fails, it retries Step 3 only.

**Trade-off:** Adds complexity to the Worker. Worth it because it demonstrates understanding of durable execution patterns.

### Llama 3.3 70B fp8-fast via Workers AI
**Why:** Required by assignment (Workers AI). The fp8-fast variant is quantized for speed without significant quality loss — better response times for a demo.

### TailwindCSS for styling
**Why:** Prasanna's team uses it. Fast to prototype dark theme UI without custom CSS files. No configuration needed for basic use.

### React + Vite for frontend
**Why:** Prasanna's primary stack. Fast to build. Vite's proxy feature makes local development seamless (proxy `/api` to Worker).
