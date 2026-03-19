# Cloudflare Intern Assignment — AI-Powered Code Review Assistant
## Engineering Spec & Build Plan

---

## CONTEXT (Read this first, Claude)

This project is being built as an optional assignment for a **Cloudflare Software Engineer Internship (Summer 2026, Austin TX)** application. The assignment asks for an AI-powered application built on Cloudflare's platform that demonstrates:

1. LLM integration (Llama 3.3 via Workers AI)
2. Workflow / coordination (Cloudflare Workers + Durable Objects)
3. User input via chat interface (Cloudflare Pages)
4. Memory / persistent state (Durable Objects)

The developer is **Prasanna Kumar Jha**, a junior CS student at University of Louisiana Monroe with a 4.0 GPA. His stack is React, TypeScript, Python, Supabase, Node.js, GitHub Actions, and REST APIs. He has shipped full-stack features in production at a real startup (CashWise / NotelinkAI). He is comfortable with TypeScript and React but **has not used Cloudflare Workers or Durable Objects before**. Explain Cloudflare-specific concepts clearly when introducing them.

The goal is to build something **impressive enough to fast-track review**, not just meet the minimum requirements. The reviewer is a Cloudflare engineer — they care about clean architecture, meaningful use of their platform, and code quality.

---

## WHAT WE ARE BUILDING

**Name:** `CodeSense` — An AI-powered code review assistant

**Core idea:** A chat interface where a user pastes code (any language) and has a persistent, multi-turn conversation with an LLM that reviews the code for bugs, security vulnerabilities, performance issues, and best practices. The conversation memory persists across sessions per user, so returning users can say things like "remember that auth bug you found last week? did I fix it correctly?"

**Why this is the right project:**
- Hits all four requirements meaningfully (not just technically)
- Solves a real problem that Cloudflare's own engineers face daily
- Demonstrates understanding of distributed state (Durable Objects) — Cloudflare's most unique primitive
- Can be demoed live with real code during an interview
- Prasanna can speak to it authentically because he's worked in real codebases

---

## TECH STACK

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript | Prasanna's strength; fast to build |
| Deployment | Cloudflare Pages | Required by assignment |
| API layer | Cloudflare Workers | Required; handles routing + LLM calls |
| LLM | Llama 3.3 via Workers AI | Required by assignment |
| State / Memory | Durable Objects | Required; persists conversation per user |
| Coordination | Cloudflare Workflows | Orchestrates multi-step review pipeline |
| Styling | TailwindCSS | Fast, clean, no config needed |
| Dev tooling | Wrangler CLI | Cloudflare's official local dev tool |

---

## ARCHITECTURE OVERVIEW

```
User (Browser)
    │
    │  HTTP requests
    ▼
Cloudflare Pages (React frontend)
    │
    │  fetch() API calls
    ▼
Cloudflare Worker (API router — hono.js)
    │
    ├──► Cloudflare Workflow
    │       │
    │       ├── Step 1: Validate & preprocess input
    │       ├── Step 2: Fetch conversation history from Durable Object
    │       ├── Step 3: Call Workers AI (Llama 3.3)
    │       └── Step 4: Save response to Durable Object
    │
    └──► Durable Object (ConversationMemory)
            │
            ├── stores: messages[] per session
            ├── stores: user metadata (language prefs, past issues found)
            └── stores: session list (for sidebar history)
```

**Data flow for a single review request:**
1. User pastes code + types a question in the React UI
2. Frontend sends `POST /api/review` to the Worker with `{ sessionId, code, message }`
3. Worker triggers a Cloudflare Workflow
4. Workflow Step 1 — validates input, detects language, cleans code
5. Workflow Step 2 — calls the user's Durable Object to retrieve past conversation history
6. Workflow Step 3 — constructs prompt with system instructions + history + new message, sends to Workers AI (Llama 3.3)
7. Workflow Step 4 — saves the new exchange (user message + AI response) to the Durable Object
8. Worker streams response back to frontend
9. Frontend renders the response in the chat UI with syntax highlighting

---

## PROJECT STRUCTURE

```
codesense/
├── frontend/                     # React + TypeScript app (Cloudflare Pages)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx        # Main chat UI
│   │   │   ├── CodeEditor.tsx        # Code input with syntax highlighting
│   │   │   ├── MessageBubble.tsx     # Individual message rendering
│   │   │   ├── SessionSidebar.tsx    # Past sessions list
│   │   │   └── LanguageBadge.tsx     # Auto-detected language tag
│   │   ├── hooks/
│   │   │   ├── useChat.ts            # Chat state management
│   │   │   └── useSession.ts         # Session ID management (localStorage)
│   │   ├── lib/
│   │   │   └── api.ts                # All fetch() calls to Worker
│   │   ├── types/
│   │   │   └── index.ts              # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── worker/                        # Cloudflare Worker (API + orchestration)
│   ├── src/
│   │   ├── index.ts               # Worker entry point + routing (hono)
│   │   ├── workflow.ts            # Cloudflare Workflow definition
│   │   ├── durableObject.ts       # ConversationMemory Durable Object
│   │   ├── prompts.ts             # System prompt + prompt construction
│   │   └── types.ts               # Shared types
│   ├── wrangler.toml              # Cloudflare config (bindings etc.)
│   └── package.json
│
└── README.md                      # Setup instructions + architecture diagram
```

---

## DETAILED COMPONENT SPECS

### 1. Durable Object — `ConversationMemory` (`durableObject.ts`)

This is the most important piece. A Durable Object is a single-instance stateful object hosted by Cloudflare. Each user gets their own instance, identified by their `sessionId`. Think of it as a tiny persistent server with its own storage, only for that user.

**What it stores:**
```typescript
interface StoredSession {
  sessionId: string;
  createdAt: number;
  messages: Message[];
  metadata: {
    detectedLanguages: string[];   // languages reviewed in this session
    issuesFound: number;           // count of bugs/issues flagged
    lastActivity: number;          // timestamp
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeSnippet?: string;           // the code that was reviewed (if any)
}
```

**Methods to implement:**
- `getHistory(limit?: number)` — returns last N messages (default 10, to avoid token overflow)
- `addMessage(message: Message)` — appends a message and saves to storage
- `getSessions()` — returns list of all sessions for sidebar
- `clearSession(sessionId)` — deletes a session's history
- `getMetadata()` — returns session stats

**Key Cloudflare concept to explain:** Durable Objects use `this.ctx.storage` for persistence. Data survives across requests. Each DO instance is identified by a name — we use `sessionId` as the name. Route to a DO like this:

```typescript
const id = env.CONVERSATION_MEMORY.idFromName(sessionId);
const stub = env.CONVERSATION_MEMORY.get(id);
const history = await stub.getHistory();
```

---

### 2. Cloudflare Workflow — `ReviewWorkflow` (`workflow.ts`)

Workflows are durable, multi-step execution pipelines. If a step fails, it can retry without restarting the whole thing. This is the "coordination" requirement.

**Steps:**

```typescript
export class ReviewWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent<ReviewPayload>, step: WorkflowStep) {

    // Step 1: Preprocess
    const processed = await step.do('preprocess-input', async () => {
      // detect language (simple regex/heuristic is fine)
      // trim whitespace, validate code length
      // return { code, language, userMessage }
    });

    // Step 2: Fetch memory
    const history = await step.do('fetch-history', async () => {
      // call Durable Object to get last 10 messages
      // return formatted history array
    });

    // Step 3: Call LLM
    const aiResponse = await step.do('call-llm', async () => {
      // construct prompt using history + new message
      // call Workers AI with Llama 3.3
      // return { content, tokensUsed }
    });

    // Step 4: Save to memory
    await step.do('save-to-memory', async () => {
      // save both user message and AI response to Durable Object
    });

    return aiResponse;
  }
}
```

---

### 3. System Prompt (`prompts.ts`)

This is critical — a weak prompt produces generic responses. This prompt should be opinionated and specific.

```typescript
export const SYSTEM_PROMPT = `You are CodeSense, an expert code reviewer with deep knowledge of software engineering best practices, security vulnerabilities, and performance optimization.

When reviewing code, you ALWAYS structure your response with these sections:
## 🐛 Bugs & Logic Errors
List specific bugs with line references if possible. Be precise.

## 🔒 Security Issues
Flag any security vulnerabilities (SQL injection, XSS, exposed secrets, insecure dependencies, etc.)

## ⚡ Performance
Identify bottlenecks, unnecessary re-renders, N+1 queries, memory leaks.

## ✅ Best Practices
What's done well. Always include at least one positive observation.

## 🔧 Suggested Fix
Provide a corrected code snippet for the most critical issue found.

Rules:
- Be specific. Reference line numbers or function names when possible.
- If the user asks a follow-up question about previous code, refer back to that context.
- If no code is provided, ask the user to share code to review.
- Keep responses focused and actionable. No filler.
- Detect the programming language automatically and mention it.`;

export function buildPrompt(history: Message[], newMessage: string, code?: string): string {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: code
        ? `Please review this code:\n\`\`\`\n${code}\n\`\`\`\n\n${newMessage}`
        : newMessage
    }
  ];
  return JSON.stringify(messages);
}
```

---

### 4. Worker Router (`index.ts`)

Use **Hono** — a lightweight router for Cloudflare Workers. It's the standard choice.

**Endpoints to build:**
```
POST /api/review          — triggers workflow, returns AI response
GET  /api/sessions/:id    — returns session history
GET  /api/sessions        — returns all sessions for sidebar
DELETE /api/sessions/:id  — clears a session
```

**CORS:** Must be configured for the Pages domain. Add CORS headers to every response.

---

### 5. React Frontend

**Key components:**

`ChatWindow.tsx` — Main layout. Left sidebar (session history) + right main area (chat + code input).

`CodeEditor.tsx` — Textarea with monospace font, line numbers (use `react-simple-code-editor` + `prism-js` for syntax highlighting). Has a language auto-detect badge. User pastes code here separately from the chat message input.

`MessageBubble.tsx` — Renders assistant messages with markdown support (`react-markdown`). Code blocks inside responses get syntax highlighting. User messages show the code snippet they submitted in a collapsible block.

`SessionSidebar.tsx` — Lists past sessions with timestamps. Clicking one loads that session's history. Has a "New Session" button. Session ID stored in `localStorage`.

`useSession.ts` hook — Manages `sessionId`. On first visit, generates a UUID and stores it in `localStorage`. Same session persists on return visits unless user clicks "New Session."

`useChat.ts` hook — Manages `messages[]`, `isLoading`, `error` state. Handles the fetch call to `/api/review` and appends responses to state.

**UI requirements:**
- Dark theme (code review tools are always dark)
- Streaming responses if possible (use `ReadableStream` on the worker side)
- Loading state with a pulsing indicator while LLM responds
- Error state with a clear retry button
- Mobile responsive (not primary focus but should not break)

---

## `wrangler.toml` Configuration

```toml
name = "codesense-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[ai]]
binding = "AI"

[durable_objects]
bindings = [
  { name = "CONVERSATION_MEMORY", class_name = "ConversationMemory" }
]

[[migrations]]
tag = "v1"
new_classes = ["ConversationMemory"]

[[workflows]]
name = "review-workflow"
binding = "REVIEW_WORKFLOW"
class_name = "ReviewWorkflow"

[vars]
ENVIRONMENT = "production"
```

---

## BUILD ORDER (Follow this exactly)

Build in this order — each step is testable before moving to the next.

### Phase 1 — Cloudflare Worker foundation (Day 1, ~3 hours)
1. `npm create cloudflare@latest codesense-worker` — scaffold the worker
2. Install hono: `npm install hono`
3. Build the router in `index.ts` with placeholder responses (no AI yet)
4. Test locally with `wrangler dev`
5. Deploy to Cloudflare: `wrangler deploy`
6. Confirm endpoints respond correctly via `curl`

### Phase 2 — Durable Object (Day 1, ~2 hours)
1. Write `ConversationMemory` class in `durableObject.ts`
2. Add the DO binding to `wrangler.toml`
3. Implement `getHistory`, `addMessage`, `getSessions`
4. Write a test route `GET /api/test-do` that creates a session, adds a message, retrieves it
5. Verify persistence: stop and restart `wrangler dev`, data should survive

### Phase 3 — Workers AI + Prompt (Day 1-2, ~2 hours)
1. Add `[[ai]]` binding to `wrangler.toml`
2. Write `prompts.ts` with system prompt and `buildPrompt()` function
3. Call `env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })` in a test route
4. Verify you get a good code review response back
5. Integrate with the Durable Object: fetch history → build prompt → call AI → save response

### Phase 4 — Workflow (Day 2, ~2 hours)
1. Write `ReviewWorkflow` in `workflow.ts` with all 4 steps
2. Add workflow binding to `wrangler.toml`
3. Replace the direct AI call in the router with a Workflow trigger
4. Test the full pipeline end-to-end via curl:
   ```bash
   curl -X POST http://localhost:8787/api/review \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"test-123","message":"review this","code":"function add(a,b){return a+b}"}'
   ```
5. Verify the response is a structured code review

### Phase 5 — React Frontend (Day 2-3, ~4 hours)
1. `npm create vite@latest codesense-frontend -- --template react-ts`
2. Install: `tailwindcss`, `react-markdown`, `react-simple-code-editor`, `prismjs`, `uuid`
3. Build `useSession.ts` hook first (foundation for everything else)
4. Build `useChat.ts` hook
5. Build `MessageBubble.tsx` — get markdown rendering working with code highlighting
6. Build `CodeEditor.tsx`
7. Build `ChatWindow.tsx` — wire everything together
8. Build `SessionSidebar.tsx`
9. Configure `vite.config.ts` to proxy `/api` requests to `localhost:8787` during dev
10. Test full flow locally

### Phase 6 — Deploy + Polish (Day 3, ~2 hours)
1. Deploy frontend to Cloudflare Pages: `wrangler pages deploy dist`
2. Set `ENVIRONMENT` var and any secrets in Cloudflare dashboard
3. Update CORS in Worker to allow the Pages domain
4. End-to-end test on the deployed URL
5. Write `README.md` with: what it does, architecture diagram (ASCII is fine), setup instructions, live demo link
6. Record a short Loom demo video (2-3 min) showing the app working — attach this to the application

---

## PROMPTING TIPS FOR CLAUDE IN YOUR IDE

When working with Claude (in Cursor, VS Code, etc.), use these patterns:

**Starting a new file:**
> "I'm building CodeSense, a Cloudflare Workers-based AI code review app. Read the spec in `cloudflare_project_plan.md` before writing anything. Now build `[filename]` following the spec exactly."

**When you're stuck on Cloudflare-specific concepts:**
> "Explain how Durable Objects work in Cloudflare Workers, then implement `getHistory()` in `durableObject.ts` following the spec."

**When debugging:**
> "This is my `wrangler.toml` and this is the error from `wrangler dev`. Fix the issue and explain what was wrong."

**When building the frontend:**
> "Build `ChatWindow.tsx` using the spec. Use Tailwind for styling. Dark theme. The component receives `messages`, `isLoading`, `onSendMessage` as props."

**Keep Claude focused:**
> "Only write the code for this specific file. Don't refactor other files. Don't add features not in the spec."

---

## THINGS THAT WILL IMPRESS THE REVIEWER

1. **Structured review output** — the sectioned format (Bugs / Security / Performance / Best Practices / Fix) makes the AI output actually usable, not just a wall of text

2. **Persistent memory across sessions** — most demo apps lose context on refresh. Yours doesn't. Mention this explicitly in your README.

3. **Language auto-detection** — a small touch but shows attention to UX

4. **Clean README with architecture diagram** — reviewers skim. Make it instantly clear what you built and how.

5. **Live deployed URL** — not just a GitHub link. Actually deploy it so they can use it in 30 seconds.

6. **Error handling** — handle LLM timeout, empty code input, network errors gracefully. Don't let it crash silently.

7. **Session history sidebar** — this is what makes it feel like a real product vs a demo

---

## WHAT TO WRITE IN THE SUBMISSION FIELD

Keep it to 3-4 sentences:

> "I built CodeSense, an AI-powered code review assistant on Cloudflare's platform. It uses Workers AI (Llama 3.3) for code analysis, Durable Objects to persist conversation history per user across sessions, a Cloudflare Workflow to orchestrate the multi-step review pipeline, and a React/TypeScript frontend deployed on Pages. The structured review format (bugs, security, performance, best practices) makes the output immediately actionable for developers. Live demo: [URL] | GitHub: [URL]"

---

## TOTAL TIME ESTIMATE

| Phase | Estimated Time |
|---|---|
| Phase 1 — Worker foundation | 3 hours |
| Phase 2 — Durable Object | 2 hours |
| Phase 3 — Workers AI + Prompt | 2 hours |
| Phase 4 — Workflow | 2 hours |
| Phase 5 — React Frontend | 4 hours |
| Phase 6 — Deploy + Polish + README | 2 hours |
| **Total** | **~15 hours across 3 days** |

Start Phase 1 today. Don't wait.
