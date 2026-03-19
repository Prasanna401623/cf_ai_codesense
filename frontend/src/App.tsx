import Header from './components/Header';
import SessionSidebar from './components/SessionSidebar';
import ChatWindow from './components/ChatWindow';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';

export default function App() {
  const { sessionId, createNewSession, switchSession } = useSession();
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useChat(sessionId);

  const handleNewSession = () => {
    createNewSession();
    clearMessages();
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
    clearMessages();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      <Header sessionId={sessionId} />
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
