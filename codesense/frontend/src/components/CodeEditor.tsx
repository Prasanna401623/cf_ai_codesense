import { useState, useRef } from 'react';
import { Code2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

function detectLanguage(code: string): string {
  if (/^\s*(import|export|const|let|var|function|class|interface|type)\s/.test(code)) {
    if (/:\s*(string|number|boolean|void|any|React)/.test(code) || /tsx?/.test(code)) return 'TypeScript';
    return 'JavaScript';
  }
  if (/^\s*(def |class |import |from |#!.*python)/.test(code)) return 'Python';
  if (/^\s*(package |import "java|public class)/.test(code)) return 'Java';
  if (/#include|int main\s*\(/.test(code)) return 'C/C++';
  if (/^\s*(fn |use |impl |pub |let mut)/.test(code)) return 'Rust';
  if (/^\s*(func |package |import\s+"fmt")/.test(code)) return 'Go';
  if (/<\/?[a-zA-Z][^>]*>/.test(code)) return 'HTML';
  if (/^\s*(\{|\[)/.test(code)) return 'JSON';
  if (/^\s*[.#][a-zA-Z]/.test(code) || /:\s*[a-zA-Z-]+\s*;/.test(code)) return 'CSS';
  return 'Code';
}

const langColors: Record<string, string> = {
  TypeScript: 'bg-blue-100 text-blue-700',
  JavaScript: 'bg-yellow-100 text-yellow-700',
  Python: 'bg-green-100 text-green-700',
  Java: 'bg-red-100 text-red-700',
  'C/C++': 'bg-purple-100 text-purple-700',
  Rust: 'bg-orange-100 text-orange-700',
  Go: 'bg-cyan-100 text-cyan-700',
  HTML: 'bg-pink-100 text-pink-700',
  JSON: 'bg-gray-100 text-gray-600',
  CSS: 'bg-indigo-100 text-indigo-700',
  Code: 'bg-gray-100 text-gray-600',
};

export default function CodeEditor({ value, onChange, onClear }: CodeEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lang = value.trim() ? detectLanguage(value) : null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Code Snippet</span>
          {lang && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${langColors[lang] ?? langColors.Code}`}>
              {lang}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          {value && (
            <button
              onClick={onClear}
              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear code"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      {!collapsed && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your code here... (Tab inserts 2 spaces)"
            className="w-full resize-none bg-[#0F172A] text-[#E2E8F0] font-mono text-sm p-4 outline-none placeholder-slate-500 min-h-[140px] max-h-[320px] overflow-y-auto leading-relaxed"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            spellCheck={false}
          />
          {value && (
            <div className="absolute bottom-2 right-3 text-xs text-slate-500 font-mono">
              {value.split('\n').length} lines
            </div>
          )}
        </div>
      )}
    </div>
  );
}
