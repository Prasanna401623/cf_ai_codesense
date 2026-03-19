# CLAUDE.md — CodeSense Project Context

> Read this file at the start of every conversation. It contains everything you need to work effectively on this project.

---

## WHO IS PRASANNA

- Junior CS student at University of Louisiana Monroe, 4.0 GPA
- Stack: React, TypeScript, Python, Node.js, Supabase, GitHub Actions, REST APIs
- Has shipped full-stack features in production at real startups (CashWise, NotelinkAI)
- **New to Cloudflare Workers and Durable Objects** — explain Cloudflare-specific concepts clearly when introducing them
- Learns best with analogies: compare Cloudflare concepts to things he already knows (Supabase = hosted Postgres, Durable Objects ≈ per-user mini-servers with storage, Workers ≈ serverless functions like Vercel edge functions)

---

## WHAT WE ARE BUILDING

**Project name:** CodeSense
**Type:** AI-powered code review assistant
**Purpose:** Cloudflare internship (Summer 2026, Austin TX) application assignment

**One-sentence pitch:** A chat interface where users paste code and have persistent, multi-turn AI-powered code review conversations that survive across sessions.

**Why this project wins the review:**
- Hits all 4 Cloudflare platform requirements meaningfully
- Demonstrates Durable Objects (Cloudflare's most unique primitive) properly
- Solves a real problem (code review) that Cloudflare engineers face daily
- Prasanna can speak to it authentically in an interview

For the full detailed spec, read: `cloudflare_project_plan.md`
For the implementation plan: `PLAN.md`

---

## TECH STACK (Know this cold)

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + TailwindCSS |
| Hosting | Cloudflare Pages |
| API | Cloudflare Workers + Hono router |
| LLM | Llama 3.3 via Workers AI |
| State/Memory | Durable Objects (ConversationMemory) |
| Orchestration | Cloudflare Workflows |
| Local dev | Wrangler CLI |

---

## PROJECT DIRECTORY MAP

```
CodeReviewer/                        ← You are here (planning workspace)
├── CLAUDE.md                        ← This file
├── PLAN.md                          ← Phase-by-phase build plan
├── cloudflare_project_plan.md       ← Original full spec
├── docs/
│   ├── architecture.md              ← System design + data flow
│   ├── decisions/                   ← Why we made each architectural choice
│   └── runbooks/                    ← Step-by-step operational guides
├── .claude/
│   └── skills/
│       ├── explain/SKILL.md         ← /explain: plain English explanation of what was just done
│       ├── build-phase/SKILL.md     ← /build-phase: guided phase execution
│       ├── debug-cloudflare/SKILL.md ← /debug-cloudflare: CF-specific debugging
│       └── review-code/SKILL.md     ← /review-code: code quality check
└── codesense/                       ← Actual application code (created during build)
    ├── worker/
    └── frontend/
```

---

## WORKING RULES

1. **Read the spec before writing code.** Always reference `cloudflare_project_plan.md` for exact specs on each component.
2. **Follow the build order in `PLAN.md`.** Don't jump ahead. Each phase is testable before moving on.
3. **Explain Cloudflare concepts.** Prasanna is new to Workers/DOs. When you write CF-specific code, explain what it does in plain English. Use the `/explain` skill for detailed breakdowns.
4. **One file at a time.** Don't rewrite unrelated files when working on a specific task.
5. **Test before moving on.** Each phase has verification steps. Don't skip them.
6. **Dark theme UI.** The frontend uses dark theme — non-negotiable for a code review tool.
7. **TypeScript everywhere.** No plain JS. Strict types.
8. **Hono for routing.** Not express, not raw Workers fetch handler. Hono is the standard for CF Workers.

---

## KEY CLOUDFLARE CONCEPTS (Quick Reference)

### Durable Objects
- Each user gets their own instance, identified by `sessionId`
- Think of it as: a tiny stateful mini-server, only for that one user, with its own storage
- Data persists across requests (unlike Workers which are stateless)
- Access via: `env.CONVERSATION_MEMORY.idFromName(sessionId)` → `.get(id)` → call methods

### Workers AI
- Cloudflare's managed LLM inference
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Call: `env.AI.run(modelName, { messages })`

### Cloudflare Workflows
- Durable, multi-step execution pipelines with retry support
- Each `step.do(name, fn)` is atomic and retryable
- Think of it like: a transaction with checkpoints

### Hono Router
- Lightweight HTTP router built for CF Workers
- Drop-in replacement for Express in the Cloudflare environment

---

## SKILLS AVAILABLE

| Skill | Command | When to use |
|---|---|---|
| Plain English Explainer | `/explain` | After any complex code is written |
| Build Phase Guide | `/build-phase` | When starting a new build phase |
| Cloudflare Debugger | `/debug-cloudflare` | When hitting CF-specific errors |
| Code Reviewer | `/review-code` | To check code quality before moving on |

---

## CURRENT STATUS

Track current phase in `PLAN.md`. Update it as phases complete.
