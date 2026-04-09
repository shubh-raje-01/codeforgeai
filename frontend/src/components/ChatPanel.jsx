import { useState, useRef, useEffect } from 'react';

const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

// Suggested starter questions
const SUGGESTIONS = [
  'What does this project do?',
  'Which file has the most complexity?',
  'Are there any security issues?',
  'How can I improve the code quality?',
  'Explain the main class/method',
];

export default function ChatPanel({ files = [], isOpen, onClose }) {
  const [messages,  setMessages]  = useState([]);   // { role, content, error? }
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  async function sendMessage(text) {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput('');
    setError('');

    // Add user message immediately
    const userMsg = { role: 'user', content: question };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch(`${AI_URL}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send full conversation history for multi-turn context
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          // Send all loaded files as context — truncated server-side
          files: files.map(f => ({
            fileName: f.fileName,
            content:  f.content || '',
          })).filter(f => f.content),
        }),
      });

      let data;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok) {
        const detail = data?.detail || `AI service error (${res.status})`;
        throw new Error(detail);
      }

      const reply = data?.reply || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (err) {
      const msg = err?.message || 'Unknown error';
      const friendly = msg.includes('Failed to fetch') || msg.includes('NetworkError')
        ? `Cannot reach AI service. Make sure it's running:\nuvicorn main:app --reload --port 8000`
        : msg;
      // Add error as a failed assistant message so it shows inline
      setMessages(prev => [...prev, {
        role: 'assistant', content: friendly, error: true
      }]);
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setError('');
  }

  const loadedFileCount = files.filter(f => f.content).length;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0,
      width: 380, height: '70vh', minHeight: 480,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderBottom: 'none', borderRight: 'none',
      borderRadius: 'var(--radius-xl) 0 0 0',
      boxShadow: '-8px -8px 32px rgba(0,0,0,0.4)',
      zIndex: 200,
      animation: 'slideInLeft 250ms ease',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl) 0 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Chat with Code
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              {loadedFileCount > 0
                ? `${loadedFileCount} file${loadedFileCount !== 1 ? 's' : ''} in context`
                : 'No files loaded — open a project first'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {messages.length > 0 && (
            <button onClick={clearChat} title="Clear chat" style={{
              background: 'none', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
              cursor: 'pointer', padding: '4px 8px',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              transition: 'all var(--transition-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-emphasis)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ⌫ Clear
            </button>
          )}
          <button onClick={onClose} title="Close" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 18, padding: '0 4px',
            transition: 'color var(--transition-fast)',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >✕</button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 14px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>

        {/* Empty state with suggestions */}
        {messages.length === 0 && (
          <div style={{ animation: 'fadeIn 300ms ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Ask anything about your project files.<br/>
                I only know about the code in this project.
              </p>
            </div>

            {loadedFileCount === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,166,87,0.08)', border: '1px solid rgba(255,166,87,0.2)',
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-orange)',
                textAlign: 'center', lineHeight: 1.6,
              }}>
                ⚠ No files loaded.<br/>
                Select a file from the sidebar to load it into context.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
                  SUGGESTED QUESTIONS
                </p>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left', lineHeight: 1.4,
                    transition: 'all var(--transition-fast)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-primary-muted)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Thinking indicator */}
        {loading && <ThinkingBubble />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          transition: 'border-color var(--transition-fast)',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = 'var(--border-default)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code… (Enter to send)"
            disabled={loading}
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12,
              resize: 'none', lineHeight: 1.5, maxHeight: 80,
              overflow: 'auto',
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 30, height: 30, borderRadius: 'var(--radius-sm)',
              background: loading || !input.trim()
                ? 'var(--bg-elevated)'
                : 'var(--accent-primary)',
              border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              color: loading || !input.trim() ? 'var(--text-muted)' : '#000',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all var(--transition-fast)',
            }}
          >
            {loading ? <Spinner /> : '↑'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Shift+Enter for new line · Powered by Ollama ({import.meta.env.VITE_AI_MODEL || 'mistral'})
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const lines  = msg.content.split('\n').filter(l => l.trim());

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 200ms ease',
    }}>
      {/* Avatar for assistant */}
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: msg.error
            ? 'rgba(255,123,114,0.2)'
            : 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, marginRight: 8, marginTop: 2,
        }}>
          {msg.error ? '⚠' : '🤖'}
        </div>
      )}

      <div style={{
        maxWidth: '82%',
        padding: '10px 13px',
        borderRadius: isUser
          ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
          : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
        background: isUser
          ? 'var(--accent-primary-muted)'
          : msg.error
            ? 'rgba(255,123,114,0.08)'
            : 'var(--bg-elevated)',
        border: `1px solid ${isUser
          ? 'rgba(88,166,255,0.25)'
          : msg.error
            ? 'rgba(255,123,114,0.2)'
            : 'var(--border-subtle)'}`,
      }}>
        {lines.map((line, i) => {
          const isBullet = /^[-•*]\s/.test(line);
          const isCode   = line.startsWith('```') || line.startsWith('    ');
          return (
            <div key={i} style={{
              display: 'flex', gap: 6, alignItems: 'flex-start',
              marginBottom: i < lines.length - 1 ? 5 : 0,
            }}>
              {isBullet && (
                <span style={{ color: 'var(--accent-primary)', fontSize: 13, flexShrink: 0, marginTop: 1 }}>▸</span>
              )}
              <p style={{
                fontFamily: isCode ? 'var(--font-mono)' : 'var(--font-mono)',
                fontSize: 12,
                color: isUser
                  ? 'var(--accent-primary)'
                  : msg.error
                    ? 'var(--accent-red)'
                    : 'var(--text-primary)',
                lineHeight: 1.6, margin: 0,
                wordBreak: 'break-word',
                background: isCode ? 'var(--bg-overlay)' : 'none',
                padding: isCode ? '2px 6px' : 0,
                borderRadius: isCode ? 'var(--radius-sm)' : 0,
              }}>
                {isBullet ? line.replace(/^[-•*]\s/, '') : line}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
      }}>🤖</div>
      <div style={{
        padding: '12px 16px', background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-primary)',
            display: 'inline-block',
            animation: `fadeIn 600ms ease ${i * 200}ms infinite alternate`,
            opacity: 0.4,
          }} />
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
          Thinking…
        </span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12, display: 'inline-block',
      border: '2px solid var(--text-muted)', borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
  );
}