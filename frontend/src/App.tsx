import { useSession } from './hooks/useSession'
import { useChat } from './hooks/useChat'
import { SessionSidebar } from './components/SessionSidebar'
import { ChatWindow } from './components/ChatWindow'

function App() {
  const { sessionId, createNewSession } = useSession()
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(sessionId)

  function handleNewSession() {
    createNewSession()
    clearMessages()
  }

  return (
    <div className="flex h-screen bg-[#0d1117]">
      <SessionSidebar
        sessionId={sessionId}
        onNewSession={handleNewSession}
        onClearSession={clearMessages}
      />
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
      />
    </div>
  )
}

export default App
