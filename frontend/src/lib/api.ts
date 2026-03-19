import type { Message, ReviewResponse } from '../types'

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? ''

export async function reviewCode(
  sessionId: string,
  message: string,
  code?: string
): Promise<ReviewResponse> {
  const res = await fetch(`${WORKER_URL}/api/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, code }),
  })
  if (!res.ok) throw new Error('Review request failed')
  return res.json()
}

export async function getSessionHistory(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${WORKER_URL}/api/sessions/${sessionId}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.messages ?? []
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${WORKER_URL}/api/sessions/${sessionId}`, { method: 'DELETE' })
}
