import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'
import { buildPrompt } from './prompts'
import type { Message, ReviewRequest } from './types'

type ReviewPayload = ReviewRequest

export class ReviewWorkflow extends WorkflowEntrypoint<Env, ReviewPayload> {
	async run(event: WorkflowEvent<ReviewPayload>, step: WorkflowStep) {
		const { sessionId, message, code } = event.payload

		// Step 1: Validate and preprocess input
		const processed = await step.do('preprocess-input', async () => {
			const trimmedCode = code?.trim()
			const trimmedMessage = message.trim()

			// Simple language detection by file signature
			let detectedLanguage = 'unknown'
			if (trimmedCode) {
				if (trimmedCode.includes('import React') || trimmedCode.includes('useState') || trimmedCode.includes('tsx')) detectedLanguage = 'tsx/jsx'
				else if (trimmedCode.includes('def ') && trimmedCode.includes(':')) detectedLanguage = 'python'
				else if (trimmedCode.includes('fn ') && trimmedCode.includes('->')) detectedLanguage = 'rust'
				else if (trimmedCode.includes('func ') && trimmedCode.includes('go')) detectedLanguage = 'go'
				else if (trimmedCode.includes('interface ') || trimmedCode.includes(': string') || trimmedCode.includes(': number')) detectedLanguage = 'typescript'
				else if (trimmedCode.includes('function') || trimmedCode.includes('=>')) detectedLanguage = 'javascript'
			}

			if (!trimmedMessage) throw new Error('Message cannot be empty')
			if (trimmedCode && trimmedCode.length > 50000) throw new Error('Code too long — max 50,000 characters')

			return { code: trimmedCode, message: trimmedMessage, detectedLanguage }
		})

		// Step 2: Fetch conversation history from Durable Object
		const history = await step.do('fetch-history', async () => {
			const doId = this.env.CONVERSATION_MEMORY.idFromName(sessionId)
			const stub = this.env.CONVERSATION_MEMORY.get(doId)
			return await stub.getHistory(10)
		})

		// Step 3: Call Workers AI
		const aiResponse = await step.do('call-llm', async () => {
			const messages = buildPrompt(history, processed.message, processed.code)
			const result = await this.env.AI.run(
				'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
				{ messages }
			) as { response: string }
			return { content: result.response, detectedLanguage: processed.detectedLanguage }
		})

		// Step 4: Save both messages to Durable Object
		await step.do('save-to-memory', async () => {
			const doId = this.env.CONVERSATION_MEMORY.idFromName(sessionId)
			const stub = this.env.CONVERSATION_MEMORY.get(doId)

			const userMessage: Message = {
				role: 'user',
				content: processed.code
					? `${processed.message}\n\`\`\`\n${processed.code}\n\`\`\``
					: processed.message,
				timestamp: Date.now(),
				codeSnippet: processed.code,
			}
			const assistantMessage: Message = {
				role: 'assistant',
				content: aiResponse.content,
				timestamp: Date.now(),
			}

			await stub.addMessage(userMessage)
			await stub.addMessage(assistantMessage)
		})

		return { response: aiResponse.content, sessionId, detectedLanguage: aiResponse.detectedLanguage }
	}
}
