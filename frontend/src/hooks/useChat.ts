import { useState, useCallback, useEffect } from 'react'
import type { Message } from '../types'
import { reviewCode, getSessionHistory } from '../lib/api'

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load history when sessionId changes
  useEffect(() => {
    setMessages([])
    getSessionHistory(sessionId).then(history => {
      if (history.length > 0) setMessages(history)
    })
  }, [sessionId])

  const sendMessage = useCallback(async (message: string, code?: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: code ? `${message}\n\`\`\`\n${code}\n\`\`\`` : message,
      timestamp: Date.now(),
      codeSnippet: code,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const result = await reviewCode(sessionId, message, code)
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, clearMessages }
}
