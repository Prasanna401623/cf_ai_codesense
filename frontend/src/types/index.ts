export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  codeSnippet?: string
}

export interface Session {
  sessionId: string
  createdAt: number
  lastActivity: number
  messageCount: number
}

export interface ReviewResponse {
  response: string
  sessionId: string
  detectedLanguage?: string
}
