import { Zap } from 'lucide-react';

interface HeaderProps {
  sessionId: string;
}

export default function Header({ sessionId }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Logo */}
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

      {/* Session badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono">{sessionId.slice(0, 8)}…</span>
        </div>
      </div>
    </header>
  );
}
