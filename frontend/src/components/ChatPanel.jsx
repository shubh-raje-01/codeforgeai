import { useState, useRef, useEffect } from 'react';

const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

const SUGGESTIONS = [
  'What does this project do?',
  'Which file has the most complexity?',
  'Are there any security issues?',
  'How can I improve the code quality?',
  'Explain the main class/method',
];

export default function ChatPanel({ files = [], isOpen, onClose }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function sendMessage(text) {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput('');
    setError('');

    const userMsg = { role: 'user', content: question };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch(`${AI_URL}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
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
      position: 'fixed', bottom: 0, right: 24,
      width: 400, height: '75vh', minHeight: 520,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(12,15,26,0.9)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderBottom: 'none',
      borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
      boxShadow: '0 -16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
      zIndex: 2000,
      animation: 'slideInUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(99,102,241,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Chat with Code
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
              {loadedFileCount > 0
                ? `${loadedFileCount} file${loadedFileCount !== 1 ? 's' : ''} in context`
                : 'No files loaded — open a project first'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {messages.length > 0 && (
            <button 
              id="clear-chat-btn"
              onClick={clearChat} 
              title="Clear chat history" 
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '4px 10px',
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Clear
            </button>
          )}
          <button 
            id="close-chat-btn"
            onClick={onClose} 
            title="Close panel" 
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 18, padding: '0 4px',
              transition: 'color var(--transition-fast)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >✕</button>
        </div>
      </div>

      {/* ── Messages list ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>

        {/* Empty state view */}
        {messages.length === 0 && (
          <div style={{ animation: 'fadeIn 300ms ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 24, marginTop: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 10, animation: 'float 4s ease-in-out infinite' }}>💬</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                Ask detailed questions about classes, methods, or performance patterns in this project.
              </p>
            </div>

            {loadedFileCount === 0 ? (
              <div style={{
                padding: '14px', borderRadius: 'var(--radius-lg)',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
                fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--accent-orange)',
                textAlign: 'center', lineHeight: 1.6,
              }}>
                ⚠️ No active codebase context.<br/>
                Open a file from the list to populate helper context.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 700 }}>
                  SUGGESTED QUESTIONS
                </p>
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => sendMessage(s)} 
                    style={{
                      padding: '10px 14px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13,
                      cursor: 'pointer', textAlign: 'left', lineHeight: 1.45,
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; 
                      e.currentTarget.style.color = 'var(--accent-primary-light)'; 
                      e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; 
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; 
                      e.currentTarget.style.color = 'var(--text-secondary)'; 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; 
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Bubble list */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && <ThinkingBubble />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input block ── */}
      <div style={{
        padding: '14px 16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,8,16,0.3)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          transition: 'border-color var(--transition-fast)',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send)"
            disabled={loading}
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 13,
              resize: 'none', lineHeight: 1.5, maxHeight: 90,
              overflow: 'auto',
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
            }}
          />
          <button
            id="send-chat-msg-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 30, height: 30, borderRadius: 'var(--radius-md)',
              background: loading || !input.trim()
                ? 'rgba(255,255,255,0.04)'
                : 'var(--grad-primary)',
              border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              color: loading || !input.trim() ? 'var(--text-muted)' : '#fff',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all var(--transition-fast)',
              boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(99,102,241,0.35)'
            }}
          >
            {loading ? <Spinner /> : '↑'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', letterSpacing: '0.01em' }}>
          Shift + Enter for multiline · model: {import.meta.env.VITE_AI_MODEL || 'mistral'}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const lines  = msg.content.split('\n').filter(l => l.trim());

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 200ms ease',
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: msg.error
            ? 'rgba(239,68,68,0.2)'
            : 'var(--grad-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, marginRight: 8, marginTop: 2,
          boxShadow: msg.error ? 'none' : '0 2px 8px rgba(99,102,241,0.3)'
        }}>
          {msg.error ? '⚠️' : '🤖'}
        </div>
      )}

      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isUser
          ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
          : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
        background: isUser
          ? 'rgba(99,102,241,0.12)'
          : msg.error
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isUser
          ? 'rgba(99,102,241,0.25)'
          : msg.error
            ? 'rgba(239,68,68,0.25)'
            : 'rgba(255,255,255,0.06)'}`,
      }}>
        {lines.map((line, i) => {
          const isBullet = /^[-•*]\s/.test(line);
          const isCode   = line.startsWith('```') || line.startsWith('    ');
          return (
            <div key={i} style={{
              display: 'flex', gap: 6, alignItems: 'flex-start',
              marginBottom: i < lines.length - 1 ? 6 : 0,
            }}>
              {isBullet && (
                <span style={{ color: 'var(--accent-primary-light)', fontSize: 13, flexShrink: 0, marginTop: 1 }}>▸</span>
              )}
              <p style={{
                fontFamily: isCode ? 'var(--font-mono)' : 'var(--font-sans)',
                fontSize: 12.5,
                color: isUser
                  ? 'var(--text-primary)'
                  : msg.error
                    ? 'var(--accent-red)'
                    : 'var(--text-primary)',
                lineHeight: 1.6, margin: 0,
                wordBreak: 'break-word',
                background: isCode ? 'rgba(0,0,0,0.2)' : 'none',
                padding: isCode ? '4px 8px' : 0,
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
        background: 'var(--grad-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
      }}>🤖</div>
      <div style={{
        padding: '10px 14px', 
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-primary-light)',
            display: 'inline-block',
            animation: 'dotPulse 1.2s infinite alternate',
            animationDelay: `${i * 200}ms`
          }} />
        ))}
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
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
      border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
  );
}