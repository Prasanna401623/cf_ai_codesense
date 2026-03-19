import { clearSession } from '../lib/api'

interface Props {
  sessionId: string
  onNewSession: () => void
  onClearSession: () => void
}

export function SessionSidebar({ sessionId, onNewSession, onClearSession }: Props) {
  async function handleClear() {
    await clearSession(sessionId)
    onClearSession()
  }

  return (
    <div
      style={{ background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      className="w-56 flex flex-col h-full flex-shrink-0"
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6aff, #a855f7)' }}
          >
            CS
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#f0f0fa' }}>CodeSense</div>
            <div className="text-xs" style={{ color: '#5a5a72' }}>AI Code Reviewer</div>
          </div>
        </div>
      </div>

      {/* New session button */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: '#9090b8', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New session
        </button>
      </div>

      {/* Sessions label */}
      <div className="px-4 pt-5 pb-1">
        <span className="text-xs font-medium" style={{ color: '#3a3a52', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Session
        </span>
      </div>

      {/* Active session */}
      <div className="px-3 flex-1">
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.15)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7c6aff' }} />
          <div className="min-w-0">
            <div className="text-xs font-mono truncate" style={{ color: '#7c6aff' }}>
              {sessionId.slice(0, 18)}…
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#5a5a72' }}>Active</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
        <button
          onClick={handleClear}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
          style={{ color: '#5a5a72' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#5a5a72'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Clear history
        </button>
      </div>
    </div>
  )
}
