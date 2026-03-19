import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem('codesense-session-id')
  if (existing) return existing
  const newId = uuidv4()
  localStorage.setItem('codesense-session-id', newId)
  return newId
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>(getOrCreateSessionId)

  const createNewSession = useCallback(() => {
    const newId = uuidv4()
    localStorage.setItem('codesense-session-id', newId)
    setSessionId(newId)
  }, [])

  return { sessionId, createNewSession }
}
