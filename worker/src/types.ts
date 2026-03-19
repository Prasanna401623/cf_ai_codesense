export interface Message {
	role: 'user' | 'assistant'
	content: string
	timestamp: number
	codeSnippet?: string
}

export interface SessionMetadata {
	detectedLanguages: string[]
	issuesFound: number
	lastActivity: number
}

export interface StoredSession {
	sessionId: string
	createdAt: number
	messages: Message[]
	metadata: SessionMetadata
}

export interface SessionSummary {
	sessionId: string
	createdAt: number
	lastActivity: number
	messageCount: number
	preview?: string
}

export interface ReviewRequest {
	sessionId: string
	message: string
	code?: string
}
