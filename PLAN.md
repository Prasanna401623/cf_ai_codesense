# PLAN.md — CodeSense Build Plan

> This is the single source of truth for what we build and in what order. Update the status checkboxes as you complete each step.

---

## Current Phase: NOT STARTED

Update this line when you begin a phase: `Current Phase: Phase 1 — Worker Foundation`

---

## Phase Overview

| Phase | What | Status |
|---|---|---|
| Phase 1 | Cloudflare Worker + Hono Router foundation | ⬜ Not started |
| Phase 2 | Durable Object (ConversationMemory) | ⬜ Not started |
| Phase 3 | Workers AI + Prompt engineering | ⬜ Not started |
| Phase 4 | Cloudflare Workflow (multi-step pipeline) | ⬜ Not started |
| Phase 5 | React Frontend | ⬜ Not started |
| Phase 6 | Deploy + Polish + README | ⬜ Not started |

---

## Phase 1 — Cloudflare Worker Foundation

**Goal:** A live Worker on Cloudflare with routing that returns placeholder responses. No AI yet.

**What Prasanna will learn:** How Cloudflare Workers work, how Hono routing compares to Express, how wrangler dev works.

### Steps

- [ ] 1.1 Scaffold the worker project
  ```bash
  cd codesense
  npm create cloudflare@latest worker -- --type hello-world --ts
  cd worker
  ```

- [ ] 1.2 Install Hono
  ```bash
  npm install hono
  ```

- [ ] 1.3 Replace `src/index.ts` with Hono router + these placeholder endpoints:
  - `POST /api/review` → returns `{ message: "Review endpoint - coming soon" }`
  - `GET /api/sessions/:id` → returns `{ sessions: [] }`
  - `GET /api/sessions` → returns `{ sessions: [] }`
  - `DELETE /api/sessions/:id` → returns `{ success: true }`
  - `GET /api/health` → returns `{ status: "ok" }`

- [ ] 1.4 Add CORS middleware to Hono (needed for Pages → Worker communication)

- [ ] 1.5 Test locally
  ```bash
  wrangler dev
  curl http://localhost:8787/api/health
  # Should return: {"status":"ok"}
  ```

- [ ] 1.6 Deploy to Cloudflare
  ```bash
  wrangler deploy
  ```

- [ ] 1.7 Verify all endpoints respond via curl on the deployed URL

### Files created this phase
- `codesense/worker/src/index.ts`
- `codesense/worker/wrangler.toml`
- `codesense/worker/package.json`

### Done when
All 5 endpoints respond correctly both locally and on deployed Cloudflare URL.

---

## Phase 2 — Durable Object (ConversationMemory)

**Goal:** Persistent conversation storage per user. Data survives restarts.

**What Prasanna will learn:** What Durable Objects are, how they differ from regular storage, how to route to a specific user's DO instance.

### Steps

- [ ] 2.1 Create `codesense/worker/src/durableObject.ts` with `ConversationMemory` class
  - Implement: `getHistory(limit?)`, `addMessage(message)`, `getSessions()`, `clearSession()`, `getMetadata()`
  - Use `this.ctx.storage` for persistence

- [ ] 2.2 Add DO binding to `wrangler.toml`
  ```toml
  [durable_objects]
  bindings = [{ name = "CONVERSATION_MEMORY", class_name = "ConversationMemory" }]

  [[migrations]]
  tag = "v1"
  new_classes = ["ConversationMemory"]
  ```

- [ ] 2.3 Export `ConversationMemory` from `index.ts`

- [ ] 2.4 Add test route `GET /api/test-do` that:
  - Creates a session with ID "test-123"
  - Adds a test message
  - Retrieves history
  - Returns all of it as JSON

- [ ] 2.5 Test persistence
  ```bash
  wrangler dev
  curl http://localhost:8787/api/test-do
  # Stop wrangler dev, restart it
  wrangler dev
  curl http://localhost:8787/api/test-do
  # Same data should come back — this proves persistence
  ```

- [ ] 2.6 Remove the test route (clean up before next phase)

### Files created this phase
- `codesense/worker/src/durableObject.ts`
- Updated: `codesense/worker/src/index.ts`
- Updated: `codesense/worker/wrangler.toml`

### Key data structures
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeSnippet?: string;
}

interface StoredSession {
  sessionId: string;
  createdAt: number;
  messages: Message[];
  metadata: {
    detectedLanguages: string[];
    issuesFound: number;
    lastActivity: number;
  };
}
```

### Done when
Data persists across `wrangler dev` restarts. The `test-do` route returns consistent data.

---

## Phase 3 — Workers AI + Prompt Engineering

**Goal:** The Worker calls Llama 3.3 and returns a structured code review.

**What Prasanna will learn:** How Workers AI works, how prompt engineering shapes output quality, how to integrate AI with stored history.

### Steps

- [ ] 3.1 Add AI binding to `wrangler.toml`
  ```toml
  [[ai]]
  binding = "AI"
  ```

- [ ] 3.2 Create `codesense/worker/src/prompts.ts`
  - Export `SYSTEM_PROMPT` constant (the full opinionated code reviewer prompt)
  - Export `buildPrompt(history, newMessage, code?)` function
  - See exact prompt in `cloudflare_project_plan.md` → Section 3

- [ ] 3.3 Create `codesense/worker/src/types.ts` with shared TypeScript types

- [ ] 3.4 Add test route `POST /api/test-ai` that:
  - Accepts `{ code, message }` in body
  - Calls `env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })`
  - Returns the AI response

- [ ] 3.5 Test with real code
  ```bash
  curl -X POST http://localhost:8787/api/test-ai \
    -H "Content-Type: application/json" \
    -d '{"message":"review this","code":"function add(a,b){return a+b}"}'
  ```

- [ ] 3.6 Integrate with Durable Object:
  - `POST /api/review` now: fetch DO history → build prompt → call AI → save to DO → return response

- [ ] 3.7 Remove the test route

### Files created this phase
- `codesense/worker/src/prompts.ts`
- `codesense/worker/src/types.ts`
- Updated: `codesense/worker/src/index.ts`
- Updated: `codesense/worker/wrangler.toml`

### Done when
`POST /api/review` returns a structured code review with Bug / Security / Performance / Best Practices / Fix sections.

---

## Phase 4 — Cloudflare Workflow

**Goal:** Replace the direct AI call with a durable multi-step Workflow pipeline.

**What Prasanna will learn:** What Cloudflare Workflows are, why durable execution matters, how each step is retryable.

### Steps

- [ ] 4.1 Create `codesense/worker/src/workflow.ts` with `ReviewWorkflow` class
  - Step 1: `preprocess-input` — detect language, validate, trim
  - Step 2: `fetch-history` — get last 10 messages from DO
  - Step 3: `call-llm` — build prompt + call Workers AI
  - Step 4: `save-to-memory` — save both messages to DO

- [ ] 4.2 Add workflow binding to `wrangler.toml`
  ```toml
  [[workflows]]
  name = "review-workflow"
  binding = "REVIEW_WORKFLOW"
  class_name = "ReviewWorkflow"
  ```

- [ ] 4.3 Update `POST /api/review` to trigger the workflow instead of direct AI call

- [ ] 4.4 Export `ReviewWorkflow` from `index.ts`

- [ ] 4.5 Full end-to-end test
  ```bash
  curl -X POST http://localhost:8787/api/review \
    -H "Content-Type: application/json" \
    -d '{"sessionId":"test-123","message":"review this","code":"function add(a,b){return a+b}"}'
  ```

- [ ] 4.6 Send a follow-up message to test memory
  ```bash
  curl -X POST http://localhost:8787/api/review \
    -H "Content-Type: application/json" \
    -d '{"sessionId":"test-123","message":"what bugs did you find?"}'
  # Should reference the previous code review
  ```

### Files created this phase
- `codesense/worker/src/workflow.ts`
- Updated: `codesense/worker/src/index.ts`
- Updated: `codesense/worker/wrangler.toml`

### Done when
Multi-turn conversation works. Follow-up messages reference previous context correctly.

---

## Phase 5 — React Frontend

**Goal:** Full chat UI with code editor, session sidebar, markdown rendering.

**What Prasanna will learn:** How to connect a React app to a CF Worker, how to manage session state, how to render markdown with code highlighting.

### Steps

- [ ] 5.1 Scaffold frontend
  ```bash
  cd codesense
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  ```

- [ ] 5.2 Install dependencies
  ```bash
  npm install tailwindcss @tailwindcss/vite react-markdown react-simple-code-editor prismjs uuid
  npm install -D @types/uuid @types/prismjs
  ```

- [ ] 5.3 Configure TailwindCSS for dark theme

- [ ] 5.4 Configure `vite.config.ts` to proxy `/api` → `http://localhost:8787`

- [ ] 5.5 Create `src/types/index.ts` — shared TypeScript types

- [ ] 5.6 Build `src/hooks/useSession.ts`
  - Generates UUID on first visit, stores in localStorage
  - Returns `{ sessionId, createNewSession }`

- [ ] 5.7 Build `src/hooks/useChat.ts`
  - Manages `messages[]`, `isLoading`, `error` state
  - `sendMessage(code?, message)` → calls `/api/review` → appends response

- [ ] 5.8 Build `src/lib/api.ts`
  - `reviewCode(sessionId, message, code?)` → POST /api/review
  - `getSessions(sessionId)` → GET /api/sessions/:id
  - `getAllSessions(sessionId)` → GET /api/sessions

- [ ] 5.9 Build `src/components/MessageBubble.tsx`
  - User messages: shows code snippet in collapsible block
  - Assistant messages: renders markdown with syntax-highlighted code blocks

- [ ] 5.10 Build `src/components/CodeEditor.tsx`
  - Textarea with monospace font + line numbers
  - Language auto-detection badge
  - Uses react-simple-code-editor + prismjs

- [ ] 5.11 Build `src/components/SessionSidebar.tsx`
  - Lists past sessions with timestamps
  - "New Session" button
  - Click to load a session

- [ ] 5.12 Build `src/components/ChatWindow.tsx`
  - Layout: left sidebar + right main area
  - Wire up all components
  - Loading state with pulsing indicator
  - Error state with retry button

- [ ] 5.13 Wire everything in `src/App.tsx`

- [ ] 5.14 Test full flow locally with Worker running

### Files created this phase
- All files in `codesense/frontend/src/`
- `codesense/frontend/package.json`
- `codesense/frontend/vite.config.ts`

### Done when
Full end-to-end flow works: paste code → chat → see structured review → refresh page → history persists.

---

## Phase 6 — Deploy + Polish + README

**Goal:** Live, publicly accessible URL. Clean README. Ready for submission.

### Steps

- [ ] 6.1 Deploy Worker
  ```bash
  cd codesense/worker
  wrangler deploy
  ```

- [ ] 6.2 Deploy Frontend to Cloudflare Pages
  ```bash
  cd codesense/frontend
  npm run build
  wrangler pages deploy dist --project-name codesense
  ```

- [ ] 6.3 Update CORS in Worker to allow the Pages domain

- [ ] 6.4 Set environment variable `ENVIRONMENT=production` in Cloudflare dashboard

- [ ] 6.5 End-to-end test on live URL (not localhost)

- [ ] 6.6 Write `codesense/README.md` with:
  - What it does (one paragraph)
  - Architecture diagram (ASCII)
  - Tech stack table
  - Setup instructions
  - Live demo URL

- [ ] 6.7 Final code quality check (run `/review-code` skill)

- [ ] 6.8 Update submission with: Live URL + GitHub URL + 3-4 sentence description

### Done when
Live URL accessible. README complete. Submission ready.

---

## Architecture Decisions Log

See `docs/decisions/` for the reasoning behind each major architectural choice.

---

## Useful Commands Reference

```bash
# Local development
wrangler dev                          # Start Worker locally on :8787
npm run dev (in frontend/)            # Start Vite dev server on :5173

# Testing
curl http://localhost:8787/api/health
wrangler tail                         # Stream logs from deployed worker

# Deployment
wrangler deploy                       # Deploy Worker
wrangler pages deploy dist            # Deploy Pages

# Types
wrangler types                        # Generate TypeScript types from wrangler.toml
```
