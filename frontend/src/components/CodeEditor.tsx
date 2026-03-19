import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-go'
import 'prismjs/themes/prism-tomorrow.css'

interface Props {
  code: string
  onChange: (code: string) => void
}

function detectLanguage(code: string): string {
  if (code.includes('import React') || code.includes('useState') || code.includes('jsx')) return 'tsx'
  if (code.includes('def ') && code.includes(':')) return 'python'
  if (code.includes('fn ') && code.includes('->')) return 'rust'
  if (code.includes('func ') && code.includes('go')) return 'go'
  if (code.includes(': string') || code.includes(': number') || code.includes('interface ')) return 'typescript'
  return 'javascript'
}

function getGrammar(lang: string) {
  const map: Record<string, Prism.Grammar> = {
    tsx: languages.tsx ?? languages.javascript,
    python: languages.python,
    rust: languages.rust,
    go: languages.go,
    typescript: languages.typescript,
    javascript: languages.javascript,
  }
  return map[lang] ?? languages.javascript
}

export function CodeEditor({ code, onChange }: Props) {
  const lang = detectLanguage(code)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
        <span className="text-xs text-[#8b949e]">Code to review</span>
        {code && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#79c0ff] border border-[#1f6feb]/30">
            {lang}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={val => highlight(val, getGrammar(lang), lang)}
          padding={12}
          style={{
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontSize: 13,
            background: '#0d1117',
            color: '#e6edf3',
            minHeight: '100%',
          }}
          placeholder="Paste your code here..."
          textareaClassName="outline-none"
        />
      </div>
    </div>
  )
}
