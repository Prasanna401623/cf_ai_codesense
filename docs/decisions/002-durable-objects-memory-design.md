# Decision 002 — Durable Object Memory Design

## Status: Decided

## Context

The assignment requires persistent conversation memory per user. The key design question: how do we store and retrieve conversation history efficiently?

## Design choices

### One DO instance per sessionId (not per userId)

**Why:** A session (identified by UUID in localStorage) is the natural unit of conversation context. Users can have multiple sessions (multiple DO instances). This matches how chat apps work — you see a sidebar of past conversations, not a single merged history.

**Alternative considered:** One DO per user. Rejected because:
- We don't have user authentication (no login)
- SessionId is simpler — generated on first visit, no auth needed
- Multiple sessions per "user" is a better UX (like ChatGPT's sidebar)

### Cap history at 10 messages for LLM prompt

**Why:** Llama 3.3 70B has a context window, and sending the full conversation history could cause `context_length_exceeded` errors and slow responses. 10 messages = ~5 exchanges, which is enough context for follow-up questions without overloading the model.

**The DO stores the full history** (unlimited). The cap only applies when building the LLM prompt.

### Flat key-value storage inside DO

**Why:** The DO's `ctx.storage` is a key-value store. We use:
- Key `messages` → `Message[]` (the full conversation)
- Key `metadata` → `SessionMetadata` (stats)
- Key `sessions-list` → `SessionSummary[]` (for sidebar)

**Alternative considered:** Storing each message as a separate key (e.g., `message-0`, `message-1`). Rejected because:
- Reading all messages requires listing keys (expensive)
- A single array read is one storage operation
- For the message volumes in a code review tool (hundreds, not millions), a flat array is fine

### Session list stored on the same DO as the conversation

**Why:** Simple. The user's "sessions list" (for the sidebar) lives on each session's DO. When fetching sessions for the sidebar, we only need the active sessionId's DO.

**Limitation:** If a user has 3 sessions (3 DOs), the sidebar only shows the sessions that were ever linked. This is acceptable for the assignment scope.
