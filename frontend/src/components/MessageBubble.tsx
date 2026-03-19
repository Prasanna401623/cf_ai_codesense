import ReactMarkdown from 'react-markdown'
import type { Message } from '../types'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    const displayText = message.codeSnippet
      ? message.content.split('```')[0].trim()
      : message.content

    return (
      <div className="flex justify-end mb-6">
        <div style={{ maxWidth: '72%' }}>
          {message.codeSnippet && (
            <details
              className="mb-2 overflow-hidden rounded-xl"
              style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <summary
                className="px-4 py-2.5 text-xs cursor-pointer select-none flex items-center gap-2"
                style={{ color: '#5a5a72' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                Code snippet · {message.codeSnippet.split('\n').length} lines
              </summary>
              <pre
                className="px-4 pb-4 overflow-x-auto text-xs leading-relaxed"
                style={{ fontFamily: "'Fira Code', monospace", color: '#c8c8e0' }}
              >
                {message.codeSnippet}
              </pre>
            </details>
          )}
          <div
            className="px-4 py-3 rounded-2xl rounded-tr text-sm leading-relaxed"
            style={{ background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.2)', color: '#e8e8f8' }}
          >
            {displayText || 'Please review this code.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-6">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #7c6aff, #a855f7)' }}
      >
        CS
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-xs mb-2 font-medium" style={{ color: '#5a5a72' }}>CodeSense</div>
        <div
          className="rounded-2xl rounded-tl px-5 py-4"
          style={{ background: '#13131c', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="md-body">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
