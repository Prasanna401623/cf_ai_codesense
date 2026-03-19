import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronRight, Copy, Check, Bot, User } from 'lucide-react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-2 border border-slate-700">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">{language || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.82rem', background: '#0F172A' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function UserCodeSnippet({ code }: { code: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = code.split('\n');
  const preview = lines.slice(0, 4).join('\n');
  const hasMore = lines.length > 4;

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-orange-200 bg-orange-50">
      <div className="flex items-center justify-between px-3 py-1.5 bg-orange-100 border-b border-orange-200">
        <span className="text-xs font-medium text-orange-700">Attached code</span>
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Show less' : `+${lines.length - 4} more lines`}
          </button>
        )}
      </div>
      <pre className="text-xs p-3 font-mono text-slate-700 overflow-x-auto leading-relaxed bg-white">
        {expanded ? code : preview}
        {!expanded && hasMore && (
          <span className="text-orange-400 cursor-pointer" onClick={() => setExpanded(true)}>{'\n...click to expand'}</span>
        )}
      </pre>
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[78%]">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
            {message.codeSnippet && <UserCodeSnippet code={message.codeSnippet} />}
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          </div>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mt-1 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[82%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isBlock = String(children).includes('\n');
                  if (isBlock) {
                    return (
                      <CodeBlock
                        code={String(children).replace(/\n$/, '')}
                        language={match?.[1]}
                      />
                    );
                  }
                  return <code className={className} {...props}>{children}</code>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="mt-1">
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
