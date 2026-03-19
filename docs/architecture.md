# CodeSense — Architecture

## System Overview

CodeSense is a multi-turn AI code review assistant. Users paste code and ask questions about it. The conversation persists per user across sessions.

```
User (Browser)
    │
    │  HTTP / fetch()
    ▼
Cloudflare Pages (React + TypeScript frontend)
    │
    │  POST /api/review  { sessionId, message, code? }
    ▼
Cloudflare Worker (Hono router — API gateway)
    │
    ├──► Triggers ReviewWorkflow
    │         │
    │         ├── Step 1: preprocess-input
    │         │     Validate input, detect language (regex heuristics),
    │         │     trim/sanitize code
    │         │
    │         ├── Step 2: fetch-history
    │         │     Call ConversationMemory DO to get last 10 messages
    │         │
    │         ├── Step 3: call-llm
    │         │     Build prompt (system + history + new message)
    │         │     Call Workers AI: Llama 3.3 70B
    │         │
    │         └── Step 4: save-to-memory
    │               Save user message + AI response to DO
    │
    └──► ConversationMemory (Durable Object)
              │
              One instance per sessionId
              Stores: messages[], metadata, session list
              Persists across requests and restarts
```

---

## Component Breakdown

### 1. Frontend (Cloudflare Pages)

**Role:** UI layer. No business logic. Just state management + API calls.

**Key components:**
- `ChatWindow.tsx` — main layout (sidebar + chat area)
- `CodeEditor.tsx` — syntax-highlighted code input
- `MessageBubble.tsx` — renders AI responses as markdown with code highlighting
- `SessionSidebar.tsx` — lists and switches between past sessions

**Key hooks:**
- `useSession.ts` — manages sessionId via localStorage
- `useChat.ts` — manages messages[], loading, error; calls Worker

**State management:** Local React state only. No Redux, no Zustand. Simple enough that it's not needed.

---

### 2. Worker / API (Cloudflare Worker + Hono)

**Role:** API gateway. Validates requests, triggers workflows, returns responses.

**Endpoints:**
| Method | Path | Purpose |
|---|---|---|
| POST | /api/review | Trigger review workflow |
| GET | /api/sessions | Get all sessions for user |
| GET | /api/sessions/:id | Get history for one session |
| DELETE | /api/sessions/:id | Clear a session |
| GET | /api/health | Health check |

**Why Hono:** Designed for Cloudflare Workers. Lightweight, fast, full TypeScript support. Familiar API (close to Express).

---

### 3. Durable Object (ConversationMemory)

**Role:** Per-user persistent storage. One DO instance per `sessionId`.

**Why Durable Objects instead of KV or D1:**
- KV is eventually consistent — wrong for conversation state
- D1 is a shared database — adds latency and complexity for simple per-user data
- Durable Objects guarantee: one instance, one writer, strongly consistent

**Storage schema:**
```typescript
// Key: `messages` → Value: Message[]
// Key: `metadata` → Value: SessionMetadata
// Key: `sessions-list` → Value: SessionSummary[]
```

**Methods:**
- `getHistory(limit = 10)` — returns last N messages (capped to avoid token overflow)
- `addMessage(message)` — appends to storage
- `getSessions()` — returns all sessions for sidebar
- `clearSession(sessionId)` — deletes a session
- `getMetadata()` — returns stats (language count, issues found, last activity)

---

### 4. Workflow (ReviewWorkflow)

**Role:** Durable multi-step execution pipeline. If the LLM call fails, it retries without re-fetching history.

**Why Workflows:**
- Without Workflows: if the AI call times out, the whole request fails and you'd have to re-fetch history on retry
- With Workflows: each step is checkpointed. Step 3 (call-llm) retries independently.
- Makes the system resilient to flaky AI inference

**Step responsibilities:**
```
Step 1: preprocess-input    →  language detection, input validation
Step 2: fetch-history       →  get last 10 messages from DO
Step 3: call-llm            →  construct prompt + call Workers AI
Step 4: save-to-memory      →  persist exchange to DO
```

---

### 5. Workers AI (Llama 3.3)

**Model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

**Prompt structure:**
```
[system prompt — CodeSense reviewer persona + output format]
[message 1 — user]
[message 2 — assistant]
...
[last 10 messages from history]
[new user message with code if provided]
```

**Output format enforced by system prompt:**
```
## Bugs & Logic Errors
## Security Issues
## Performance
## Best Practices
## Suggested Fix
```

---

## Data Flow — Single Review Request

1. User types a message + pastes code in `CodeEditor`
2. `useChat.sendMessage()` called with `{ message, code }`
3. `api.reviewCode(sessionId, message, code)` → `POST /api/review`
4. Worker receives request → extracts sessionId, message, code from body
5. Worker triggers `ReviewWorkflow` with the payload
6. Workflow Step 1: validates input, detects language
7. Workflow Step 2: calls `ConversationMemory.getHistory(10)`
8. Workflow Step 3: calls `env.AI.run(model, { messages: buildPrompt(history, message, code) })`
9. Workflow Step 4: saves user message + AI response to DO via `addMessage()`
10. Worker returns AI response to frontend
11. Frontend appends response to `messages[]` → rerenders `ChatWindow`

---

## Session Identity

- `sessionId` = UUID generated on first visit, stored in `localStorage`
- Same `sessionId` = same DO instance = same conversation history
- User clicks "New Session" → new UUID → fresh DO instance → fresh conversation
- `sessionId` is the key for routing to a specific DO: `env.CONVERSATION_MEMORY.idFromName(sessionId)`

---

## Deployment Topology

```
Cloudflare Network
├── Pages (static assets + React app)    → codesense.pages.dev
├── Worker (API)                          → codesense-worker.workers.dev
├── Durable Objects (per user)            → managed by Cloudflare, no explicit URL
└── Workers AI                            → managed by Cloudflare
```

CORS: Worker allows requests from the Pages domain only (in production).
