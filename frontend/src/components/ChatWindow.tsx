import { useState, useRef, useEffect } from 'react';
import { Send, Code, X, AlertCircle, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import CodeEditor from './CodeEditor';
import type { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string, code?: string) => void;
  onClearError: () => void;
}

function LoadingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400 dot-1" />
          <div className="w-2 h-2 rounded-full bg-orange-400 dot-2" />
          <div className="w-2 h-2 rounded-full bg-orange-400 dot-3" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">CodeSense</h2>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-6">
        Your AI code review assistant. Paste your code, ask questions, and get structured feedback on bugs, security, performance, and best practices.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {[
          { icon: '🐛', label: 'Find bugs' },
          { icon: '🔒', label: 'Security review' },
          { icon: '⚡', label: 'Performance tips' },
          { icon: '✨', label: 'Best practices' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 shadow-sm"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading, error, onSend, onClearError }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    const msg = input.trim();
    const codeVal = code.trim();
    if (!msg && !codeVal) return;
    onSend(msg, codeVal || undefined);
    setInput('');
    setCode('');
    setShowCodeEditor(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleCode = () => {
    setShowCodeEditor((v) => !v);
    if (!showCodeEditor) setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const canSend = (input.trim() || code.trim()) && !isLoading;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {messages.length === 0 && !isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <div className="px-6 py-6 w-full space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error banner — only show when there are messages so it doesn't clutter the empty state */}
      {error && messages.length > 0 && (
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={onClearError}
              className="text-xs underline text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="space-y-3">
          {/* Code editor (shown when toggled) */}
          {showCodeEditor && (
            <CodeEditor
              value={code}
              onChange={setCode}
              onClear={() => { setCode(''); setShowCodeEditor(false); }}
            />
          )}

          {/* Message input row */}
          <div className="flex items-end gap-2">
            {/* Code toggle button */}
            <button
              onClick={toggleCode}
              title={showCodeEditor ? 'Hide code editor' : 'Attach code'}
              className={`flex-shrink-0 p-2.5 rounded-xl border transition-all ${
                showCodeEditor
                  ? 'bg-orange-50 border-orange-300 text-orange-600'
                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              {showCodeEditor ? <X className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            </button>

            {/* Message textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your code... (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none text-sm text-gray-800 placeholder-gray-400 resize-none transition-all leading-relaxed"
                style={{ minHeight: '44px' }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-all ${
                canSend
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:from-orange-600 hover:to-orange-700 hover:shadow-md active:scale-95'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400">
            CodeSense may make mistakes. Always verify critical code changes.
          </p>
        </div>
      </div>
    </div>
  );
}
