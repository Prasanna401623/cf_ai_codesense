import { useRef, useEffect, useState } from 'react'
import { MessageBubble } from './MessageBubble'
import { CodeEditor } from './CodeEditor'
import type { Message } from '../types'

interface Props {
  messages: Message[]
  isLoading: boolean
  error: string | null
  onSendMessage: (message: string, code?: string) => void
}

export function ChatWindow({ messages, isLoading, error, onSendMessage }: Props) {
  const [input, setInput] = useState('')
  const [code, setCode] = useState('')
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSend() {
    if (!input.trim() && !code.trim()) return
    onSendMessage(input.trim() || 'Please review this code.', code.trim() || undefined)
    setInput('')
    setCode('')
    setShowCodeEditor(false)
    if (textareaRef.current) textareaRef.current.style.height = '44px'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const t = e.target as HTMLTextAreaElement
    t.style.height = '44px'
    t.style.height = Math.min(t.scrollHeight, 160) + 'px'
    setInput(t.value)
  }

  const canSend = (input.trim() || code.trim()) && !isLoading

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* Header */}
      <div
        className="flex items-center px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f' }}
      >
        <span className="text-sm font-medium" style={{ color: '#5a5a72' }}>
          Code Review
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
          <span className="text-xs" style={{ color: '#5a5a72' }}>Llama 3.3 · Workers AI</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-5"
                style={{ background: 'linear-gradient(135deg, #7c6aff, #a855f7)' }}
              >
                CS
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#f0f0fa' }}>
                Ready to review your code
              </h2>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#5a5a72' }}>
                Paste your code using the <span style={{ color: '#7c6aff' }}>&lt;/&gt;</span> button below, then ask a question or request a full review.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-sm">
                {['Review this for bugs', 'Check security issues', 'Improve performance', 'Follow best practices'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textareaRef.current?.focus() }}
                    className="px-3 py-2 rounded-lg text-xs text-left transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#7070a0' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(124,106,255,0.2)'; e.currentTarget.style.color = '#9090c0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7070a0' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-3 mb-6">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #7c6aff, #a855f7)' }}
              >
                CS
              </div>
              <div className="mt-2">
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map(delay => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: '#3a3a52', animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm"
              style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
              <button onClick={handleSend} className="ml-auto underline text-xs opacity-70 hover:opacity-100">
                Retry
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Code editor */}
      {showCodeEditor && (
        <div
          className="flex-shrink-0 mx-4 mb-2 rounded-xl overflow-hidden"
          style={{ height: '180px', border: '1px solid rgba(124,106,255,0.2)', background: '#0d0d14' }}
        >
          <CodeEditor code={code} onChange={setCode} />
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: '#13131c', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={() => setShowCodeEditor(v => !v)}
            title="Attach code"
            className="flex-shrink-0 p-2 rounded-lg text-xs transition-all mb-0.5"
            style={{
              color: showCodeEditor ? '#7c6aff' : '#5a5a72',
              background: showCodeEditor ? 'rgba(124,106,255,0.12)' : 'transparent',
            }}
            onMouseEnter={e => { if (!showCodeEditor) e.currentTarget.style.color = '#9090b8' }}
            onMouseLeave={e => { if (!showCodeEditor) e.currentTarget.style.color = '#5a5a72' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or request a review…"
            className="flex-1 bg-transparent text-sm resize-none outline-none py-2"
            style={{
              color: '#e0e0f0',
              minHeight: '44px',
              maxHeight: '160px',
              lineHeight: '1.5',
              height: '44px',
            }}
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-all"
            style={{
              background: canSend ? 'linear-gradient(135deg, #7c6aff, #a855f7)' : 'rgba(255,255,255,0.06)',
              color: canSend ? 'white' : '#3a3a52',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: '#2a2a38' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
