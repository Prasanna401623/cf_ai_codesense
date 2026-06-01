import { Zap, LogOut } from 'lucide-react';

interface HeaderProps {
  sessionId: string;
  user: string;
  onLogout: () => void;
}

export default function Header({ sessionId, user, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-base tracking-tight">CodeSense</span>
            <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 align-middle">
              BETA
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Session badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono">{sessionId.slice(0, 8)}…</span>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <span className="text-xs text-gray-600 font-medium max-w-[120px] truncate">{user}</span>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
