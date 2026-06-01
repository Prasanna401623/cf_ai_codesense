import { useState } from 'react';
import Header from './components/Header';
import SessionSidebar from './components/SessionSidebar';
import ChatWindow from './components/ChatWindow';
import LoginPage from './components/LoginPage';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';

const AUTH_KEY = 'codesense_user';

function getStoredUser(): string | null {
  return localStorage.getItem(AUTH_KEY);
}

export default function App() {
  const [user, setUser] = useState<string | null>(getStoredUser);

  const { sessionId, createNewSession, switchSession } = useSession();
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useChat(sessionId);

  const handleLogin = (username: string) => {
    localStorage.setItem(AUTH_KEY, username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const handleNewSession = () => {
    createNewSession();
    clearMessages();
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
    clearMessages();
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      <Header sessionId={sessionId} user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          currentSessionId={sessionId}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
        />
        <main className="flex-1 flex flex-col overflow-hidden h-full">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSend={sendMessage}
            onClearError={clearError}
          />
        </main>
      </div>
    </div>
  );
}
