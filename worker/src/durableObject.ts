import { DurableObject } from 'cloudflare:workers'
import type { Message, SessionMetadata, SessionSummary } from './types'

const MAX_STORED_MESSAGES = 100
const DEFAULT_HISTORY_LIMIT = 10

export class ConversationMemory extends DurableObject {
	async getHistory(limit: number = DEFAULT_HISTORY_LIMIT): Promise<Message[]> {
		const messages = await this.ctx.storage.get<Message[]>('messages') ?? []
		return messages.slice(-limit)
	}

	async addMessage(message: Message): Promise<void> {
		const messages = await this.ctx.storage.get<Message[]>('messages') ?? []
		messages.push(message)

		// Cap stored messages to avoid unbounded growth
		if (messages.length > MAX_STORED_MESSAGES) {
			messages.splice(0, messages.length - MAX_STORED_MESSAGES)
		}

		await this.ctx.storage.put('messages', messages)

		// Update metadata
		const metadata = await this.ctx.storage.get<SessionMetadata>('metadata') ?? {
			detectedLanguages: [],
			issuesFound: 0,
			lastActivity: Date.now(),
		}
		metadata.lastActivity = Date.now()
		await this.ctx.storage.put('metadata', metadata)
	}

	async getSessions(): Promise<SessionSummary[]> {
		return await this.ctx.storage.get<SessionSummary[]>('sessions-list') ?? []
	}

	async registerSession(sessionId: string): Promise<void> {
		const sessions = await this.ctx.storage.get<SessionSummary[]>('sessions-list') ?? []
		const exists = sessions.find(s => s.sessionId === sessionId)
		if (!exists) {
			sessions.push({
				sessionId,
				createdAt: Date.now(),
				lastActivity: Date.now(),
				messageCount: 0,
			})
			await this.ctx.storage.put('sessions-list', sessions)
		}
	}

	async clearSession(): Promise<void> {
		await this.ctx.storage.delete('messages')
		await this.ctx.storage.delete('metadata')
	}

	async getMetadata(): Promise<SessionMetadata> {
		return await this.ctx.storage.get<SessionMetadata>('metadata') ?? {
			detectedLanguages: [],
			issuesFound: 0,
			lastActivity: Date.now(),
		}
	}
}
