import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '../types';
import { reviewCode, getSessionHistory } from '../lib/api';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history when sessionId changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    getSessionHistory(sessionId).then(setMessages).catch(() => {
      // Silent fail — backend may not be running yet
    });
  }, [sessionId]);

  const sendMessage = useCallback(
    async (userMessage: string, code?: string) => {
      if (!userMessage.trim() && !code?.trim()) return;

      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        codeSnippet: code || undefined,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await reviewCode({
          sessionId,
          message: userMessage,
          code: code || undefined,
        });

        const assistantMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response.reply,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        // Remove the user message on error so they can retry
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, isLoading, error, sendMessage, clearMessages, clearError };
}
