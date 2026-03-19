import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'codesense_session_id';

function getOrCreateSessionId(): string {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const newId = uuidv4();
  localStorage.setItem(SESSION_KEY, newId);
  return newId;
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>(getOrCreateSessionId);

  const createNewSession = useCallback(() => {
    const newId = uuidv4();
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    return newId;
  }, []);

  const switchSession = useCallback((id: string) => {
    localStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
  }, []);

  return { sessionId, createNewSession, switchSession };
}
