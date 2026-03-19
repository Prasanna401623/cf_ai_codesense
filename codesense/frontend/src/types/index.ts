export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeSnippet?: string;
}

export interface Session {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  preview?: string;
}

export interface ReviewRequest {
  sessionId: string;
  message: string;
  code?: string;
}

export interface ReviewResponse {
  reply: string;
  sessionId: string;
}
