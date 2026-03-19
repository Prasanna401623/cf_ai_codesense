# CodeSense — AI-Powered Code Review Assistant

**Live demo:** https://cf-ai-codesense.pages.dev

CodeSense is a chat interface where developers paste code and have persistent, multi-turn AI-powered code review conversations. Built entirely on Cloudflare's developer platform.

---

## What it does

- Paste code and ask questions — get structured feedback on bugs, security issues, performance, and best practices
- Conversations persist across sessions using Durable Objects
- Each review runs as a durable, retryable Workflow with 4 atomic steps
- Multiple sessions are tracked in a global session registry

---

## Cloudflare platform components used

| Requirement | Implementation |
|---|---|
| LLM | Llama 3.3 70B via Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) |
| Workflow / coordination | Cloudflare Workflows — 4-step pipeline: preprocess → fetch history → call LLM → save to memory |
| User input via chat | React frontend hosted on Cloudflare Pages |
| Memory / state | Durable Objects (`ConversationMemory`) — one instance per session, persists full message history |

---

## Architecture

```
User (Pages)
    │
    ▼
Hono Router (Worker)
    │
    ▼
ReviewWorkflow (Workflows)
    ├── Step 1: Preprocess input + detect language
    ├── Step 2: Fetch conversation history (Durable Object)
    ├── Step 3: Call Llama 3.3 (Workers AI)
    └── Step 4: Save messages + update session registry (Durable Object)
```

Each session maps to its own Durable Object instance, identified by `sessionId`. A separate `__registry__` Durable Object tracks all sessions globally.

---

## Running locally

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Backend (Worker)

```bash
cd worker
npm install
wrangler dev
# Runs at http://localhost:8787
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
# Proxies /api/* to localhost:8787 automatically
```

No `.env` file needed for local dev — the Vite proxy handles it.

---

## Deploying

### Deploy the Worker

```bash
cd worker
wrangler deploy
# Deploys to https://codesense-api.<your-subdomain>.workers.dev
```

### Deploy the Frontend (Cloudflare Pages)

1. Push the repo to GitHub
2. Go to Cloudflare Dashboard → Compute → Pages → Create application → Connect to Git
3. Set build settings:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://codesense-api.<your-subdomain>.workers.dev`
5. Deploy

---

## Project structure

```
cf_ai_codesense/
├── frontend/                  # React + TypeScript + TailwindCSS (Cloudflare Pages)
│   ├── src/
│   │   ├── components/        # ChatWindow, SessionSidebar, MessageBubble, CodeEditor
│   │   ├── hooks/             # useChat, useSession
│   │   └── lib/api.ts         # API client
│   └── vite.config.ts
└── worker/                    # Cloudflare Worker (Hono router)
    ├── src/
    │   ├── index.ts           # Hono routes + rate limiting
    │   ├── workflow.ts        # ReviewWorkflow (Cloudflare Workflows)
    │   ├── durableObject.ts   # ConversationMemory (Durable Objects)
    │   ├── prompts.ts         # System prompt
    │   └── types.ts
    └── wrangler.jsonc
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/review` | Submit code + message, runs the review workflow |
| `GET` | `/api/sessions` | List all sessions |
| `GET` | `/api/sessions/:id` | Get message history for a session |
| `DELETE` | `/api/sessions/:id` | Clear a session |
| `GET` | `/api/health` | Health check |
