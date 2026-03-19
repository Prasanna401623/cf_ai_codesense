import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ReviewRequest } from './types'

const app = new Hono<{ Bindings: Env }>()

// Allow requests from the frontend
app.use('*', cors({
	origin: 'https://cf-ai-codesense.pages.dev',
	allowMethods: ['GET', 'POST', 'DELETE'],
	allowHeaders: ['Content-Type'],
}))

// Health check
app.get('/api/health', (c) => {
	return c.json({ status: 'ok' })
})

// Trigger a code review via Workflow
app.post('/api/review', async (c) => {
	const body = await c.req.json<ReviewRequest>()
	const { sessionId, message, code } = body

	if (!sessionId || !message) {
		return c.json({ error: 'sessionId and message are required' }, 400)
	}

	const workflow = await c.env.REVIEW_WORKFLOW.create({ params: { sessionId, message, code } })
	const result = await workflow.status()

	// Wait for the workflow to complete (poll until done)
	let status = result
	while (status.status !== 'complete' && status.status !== 'errored') {
		await new Promise(r => setTimeout(r, 500))
		status = await workflow.status()
	}

	if (status.status === 'errored') {
		return c.json({ error: 'Review failed. Please try again.' }, 500)
	}

	return c.json(status.output)
})

// Get all sessions from global registry
app.get('/api/sessions', async (c) => {
	const registryId = c.env.CONVERSATION_MEMORY.idFromName('__registry__')
	const registry = c.env.CONVERSATION_MEMORY.get(registryId)
	const sessions = await registry.getSessions()
	return c.json({ sessions })
})

// Get history for one session
app.get('/api/sessions/:id', async (c) => {
	const { id } = c.req.param()
	const doId = c.env.CONVERSATION_MEMORY.idFromName(id)
	const stub = c.env.CONVERSATION_MEMORY.get(doId)
	const history = await stub.getHistory()
	return c.json({ sessionId: id, messages: history })
})

// Clear a session
app.delete('/api/sessions/:id', async (c) => {
	const { id } = c.req.param()
	const doId = c.env.CONVERSATION_MEMORY.idFromName(id)
	const stub = c.env.CONVERSATION_MEMORY.get(doId)
	await stub.clearSession()
	return c.json({ success: true })
})

export { ConversationMemory } from './durableObject'
export { ReviewWorkflow } from './workflow'
export default app
