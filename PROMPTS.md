# PROMPTS.md — AI Prompts Used in Building CodeSense

This file documents the key prompts used during development of CodeSense with Claude (claude-sonnet-4-6).

---

## 1. Project Setup — Defining the AI Workflow

Before writing any code, I set up a structured AI collaboration system using Claude Code's custom skills feature. I created a `CLAUDE.md` file to give the AI full context about who I am and what I'm building, and a set of `/skills` that act like reusable commands.

**Prompt used to design the skill system:**

> I want to build a Cloudflare AI project for an internship application. Before we write any code, I want to set up a proper AI workflow. Create a `.claude/skills/` directory with the following skills:
> - `/build-phase` — guides me through each build phase step by step, one file at a time, with verification before moving on
> - `/explain` — explains Cloudflare-specific concepts in plain English using analogies to things I already know (React, Supabase, Vercel)
> - `/debug-cloudflare` — helps me debug Cloudflare-specific errors
> - `/review-code` — reviews code quality before I move on
>
> Also create a `CLAUDE.md` that tells the AI my background (React/TypeScript developer, new to Cloudflare Workers and Durable Objects), what we're building, the full tech stack, and the rules to follow throughout the project.

---

## 2. Architecture Planning

**Prompt:**

> I want to build an AI-powered code review assistant that hits all 4 Cloudflare requirements: LLM, Workflows, chat UI on Pages, and persistent memory. Plan the full architecture. I want Durable Objects to store conversation history per user so sessions survive across browser refreshes. Each code review should run as a Cloudflare Workflow with multiple atomic steps. Use Hono as the router. Lay out the full data flow from the frontend to the AI response.

---

## 3. Building the Workflow

**Prompt:**

> Build the `ReviewWorkflow` using Cloudflare Workflows. It should have 4 steps:
> 1. Preprocess the input — trim the code, detect the programming language, validate
> 2. Fetch the last 10 messages from the user's Durable Object so the AI has conversation context
> 3. Call Llama 3.3 on Workers AI with the full prompt including history
> 4. Save both the user message and AI response back to the Durable Object, and update a global session registry
>
> Each step should be atomic and retryable. The workflow should return the AI reply and the detected language.

---

## 4. Building the Durable Object

**Prompt:**

> Build the `ConversationMemory` Durable Object. Each user session gets its own instance identified by `sessionId`. It needs to:
> - Store messages (cap at 100 to prevent unbounded growth)
> - Track session metadata (last activity, detected languages)
> - Support a global session registry stored in a fixed `__registry__` instance so we can list all sessions
> - Methods: `getHistory`, `addMessage`, `getSessions`, `upsertSession`, `clearSession`

---

## 5. System Prompt Design

**Prompt:**

> Write the system prompt for the AI code reviewer. I don't want it to use emojis or sound like a chatbot. I want it to write like a senior engineer leaving a PR comment — short, direct, and specific. Structure it with sections: Bugs, Security, Performance, What's good, Fix. Tell it to reference line numbers, use code blocks with language tags, and never write filler sentences.

---

## 6. Frontend Architecture

**Prompt:**

> Build the React frontend. I want a clean, light-theme UI — not dark. It should feel like a professional tool, not a toy. The layout is a sidebar on the left for session history and a main chat window on the right. The chat window should have a code editor input (with a toggle button to switch between plain text and code mode), a message list that renders markdown and syntax-highlighted code blocks, and an empty state with 4 quick-start action cards. Sessions should persist so the user can switch between past conversations.

---

## 7. Production Readiness

**Prompt:**

> Before we deploy, what will break in production? Check the worker and frontend config and identify any issues. Then fix them — I want to be able to deploy the worker with `wrangler deploy` and the frontend to Cloudflare Pages, and have them talk to each other correctly.

---

## 8. Rate Limiting

**Prompt:**

> Add rate limiting to the `/api/review` endpoint. Limit to 10 requests per minute per IP using the `cf-connecting-ip` header that Cloudflare automatically attaches to every request. Return a 429 with a clear message if the limit is hit.

---

## Tools used

- **Claude Code** (claude-sonnet-4-6) — primary AI coding assistant
- **Wrangler CLI** — local development and deployment
- **Cloudflare Dashboard** — Pages deployment, Worker monitoring
