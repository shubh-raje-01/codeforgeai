import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Editor from "@monaco-editor/react";
import ChatPanel from "../components/ChatPanel";

// Python AI service URL — call directly to avoid Vite proxy issues
const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000";

// ─── Parse the raw Mistral response into labelled sections ────────────────────
// The prompt asks for 3 numbered sections, so we split on them.
function parseAIResponse(text) {
  if (!text) return { structure: '', issues: '', refactoring: '' };

  // Split on "1.", "2.", "3." headings (with optional bold/markdown)
  const clean  = text.replace(/\*\*/g, '').replace(/#+\s/g, '');
  const parts  = clean.split(/(?=\b[123]\.\s)/);

  const get = (n) => {
    const part = parts.find(p => p.trimStart().startsWith(`${n}.`));
    return part ? part.replace(/^\s*\d\.\s*/, '').trim() : '';
  };

  return {
    structure:   get(1) || clean,   // fallback: show everything in structure
    issues:      get(2),
    refactoring: get(3),
  };
}

// ─── Score → colour helper (matches CodeFile.complexityScore 0-100) ──────────
function scoreColor(score) {
  if (!score) return 'var(--text-muted)';
  if (score <= 25) return 'var(--accent-green)';
  if (score <= 50) return 'var(--accent-yellow)';
  if (score <= 75) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ProjectDetails() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [files,        setFiles]        = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code,         setCode]         = useState('');
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingCode,  setLoadingCode]  = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [search,       setSearch]       = useState('');
  const [chatOpen,     setChatOpen]     = useState(false);

  // ── Fetch file list ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/projects/${id}/files`)
      .then(res => setFiles(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoadingFiles(false));
  }, [id]);

  // ── Load a file's content into Monaco ─────────────────────────────────────
  const loadFile = async (file) => {
    setSelectedFile(file);
    setAnalyzeError('');
    setCode('');
    setLoadingCode(true);
    try {
      const res = await api.get(`/projects/files/${file.id}`);
      const fileData = res.data;
      const content  = fileData?.content ?? '// No content available.';
      setCode(content);
      setSelectedFile(fileData);
      // Store content in files array so ChatPanel can use it as context
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, ...fileData, content } : f
      ));
    } catch {
      setCode('// Could not load file content.');
    } finally {
      setLoadingCode(false);
    }
  };

  // ── Analyze: POST code to Python AI service ──────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    // Guard: need code loaded first
    if (!code || code === '// No content available.' || code === '// Could not load file content.') {
      setAnalyzeError('No source code loaded. Click a file first to load its content.');
      return;
    }

    setAnalyzing(true);
    setAnalyzeError('');

    try {
      // Call Python FastAPI (Ollama) directly — no Vite proxy needed
      const res = await fetch(`${AI_URL}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });

      // Try to parse JSON regardless of status so we can show the error detail
      let data;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok) {
        const detail = data?.detail || data?.message || `AI service error (${res.status})`;
        throw new Error(detail);
      }

      const content = data?.summary || data?.suggestion || '';
      if (!content) throw new Error('AI service returned an empty response.');

      const updated = {
        ...selectedFile,
        aiSummary:    content,
        aiSuggestion: content,
      };
      setSelectedFile(updated);
      setFiles(prev => prev.map(f => f.id === updated.id ? updated : f));

    } catch (err) {
      // Network error means Ollama / Python service is not running
      const msg = err?.message || 'Unknown error';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED')) {
        setAnalyzeError(
          `Cannot reach AI service at ${AI_URL}. ` +
          `Make sure Python service is running: uvicorn main:app --reload --port 8000`
        );
      } else {
        setAnalyzeError(msg);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredFiles = files.filter(f =>
    f.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)', marginTop: 56 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside style={{
          width: 260, flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', padding: 0, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'color var(--transition-fast)',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >← Dashboard</button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              Files
            </h2>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12, pointerEvents: 'none' }}>⌕</span>
              <input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 26px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', transition: 'border-color var(--transition-fast)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {loadingFiles ? (
              [1,2,3,4].map(i => <div key={i} style={{ height: 36, margin: '4px 0', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />)
            ) : filteredFiles.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '16px 8px', textAlign: 'center' }}>
                {search ? 'No matching files' : 'No files found'}
              </p>
            ) : filteredFiles.map(file => {
              const isActive = selectedFile?.id === file.id;
              const hasAI    = !!(file.aiSummary || file.aiSuggestion);
              const score    = file.complexityScore ?? 0;
              return (
                <div key={file.id} onClick={() => loadFile(file)} style={{
                  padding: '9px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 2,
                  background: isActive ? 'var(--accent-primary-muted)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(88,166,255,0.2)' : 'transparent'}`,
                  transition: 'all var(--transition-fast)', display: 'flex', alignItems: 'center', gap: 8,
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-overlay)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{getFileIcon(file.fileName)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.fileName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {/* AI done indicator */}
                    {hasAI && <span title="AI analysis done" style={{ fontSize: 10, color: 'var(--accent-green)' }}>⚡</span>}
                    {/* Complexity dot */}
                    {score > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: scoreColor(score) }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            {files.length} FILE{files.length !== 1 ? 'S' : ''} · {files.filter(f => f.aiSummary).length} ANALYZED
          </div>
        </aside>

        {/* ── MAIN PANEL ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
          {selectedFile ? (
            <>
              {/* Panel header */}
              <div style={{ padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 16 }}>{getFileIcon(selectedFile.fileName)}</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.fileName}
                  </h2>
                  {/* CodeFile metrics */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedFile.lineCount   > 0 && <MetaPill label="lines"   value={selectedFile.lineCount}   />}
                    {selectedFile.methodCount > 0 && <MetaPill label="methods" value={selectedFile.methodCount} color="var(--accent-purple)" />}
                    {selectedFile.classCount  > 0 && <MetaPill label="classes" value={selectedFile.classCount}  color="var(--accent-yellow)" />}
                    {selectedFile.complexityScore > 0 && (
                      <MetaPill label="complexity" value={`${selectedFile.complexityScore}/100`} color={scoreColor(selectedFile.complexityScore)} />
                    )}
                  </div>
                </div>

                <button onClick={handleAnalyze} disabled={analyzing || loadingCode} style={{
                  padding: '7px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: analyzing ? 'var(--bg-overlay)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  color: analyzing ? 'var(--text-muted)' : '#fff',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
                  cursor: (analyzing || loadingCode) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: analyzing ? 'none' : '0 2px 8px rgba(88,166,255,0.3)',
                  transition: 'all var(--transition-fast)',
                }}>
                  {analyzing ? <><Spinner /> Analyzing…</> : '⚡ Analyze with AI'}
                </button>

                {/* Chat button */}
                <button onClick={() => setChatOpen(v => !v)} style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                  borderColor: chatOpen ? 'var(--accent-purple)' : 'var(--border-default)',
                  background: chatOpen ? 'rgba(188,140,255,0.12)' : 'var(--bg-elevated)',
                  color: chatOpen ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all var(--transition-fast)',
                }}>
                  💬 {chatOpen ? 'Close Chat' : 'Chat with Code'}
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* Monaco Editor */}
                <div style={{ borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
                  {loadingCode && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(13,17,23,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Spinner /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>Loading…</span>
                    </div>
                  )}
                  <Editor
                    height="380px"
                    language={detectLanguage(selectedFile.fileName)}
                    theme="vs-dark"
                    value={code}
                    options={{
                      readOnly: true, minimap: { enabled: false },
                      fontSize: 13, lineHeight: 22,
                      scrollBeyondLastLine: false,
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>

                {/* AI Analysis output */}
                <div style={{ padding: 20 }}>

                  {/* Error banner */}
                  {analyzeError && (
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,123,114,0.08)', border: '1px solid rgba(255,123,114,0.25)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-red)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      ⚠ {analyzeError}
                    </div>
                  )}

                  {/* Analyzing skeleton */}
                  {analyzing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <AICardSkeleton label="AI SUMMARY"      color="var(--accent-cyan)"   />
                      <AICardSkeleton label="ISSUES DETECTED" color="var(--accent-orange)" />
                      <AICardSkeleton label="REFACTORING"     color="var(--accent-green)"  />
                    </div>
                  )}

                  {/* Results */}
                  {!analyzing && (selectedFile.aiSummary || selectedFile.aiSuggestion) && (() => {
                    // aiSummary has the full Mistral response — parse into sections
                    const raw      = selectedFile.aiSummary || selectedFile.aiSuggestion;
                    const sections = parseAIResponse(raw);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🤖</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                              AI Analysis
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', background: 'rgba(63,185,80,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(63,185,80,0.2)' }}>
                              Mistral 7B
                            </span>
                          </div>
                          <button onClick={handleAnalyze} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                            Re-analyze
                          </button>
                        </div>

                        {/* 1. Code Structure */}
                        {sections.structure && (
                          <AICard
                            icon="◈"
                            label="CODE STRUCTURE"
                            color="var(--accent-cyan)"
                            bg="rgba(121,192,255,0.06)"
                            border="rgba(121,192,255,0.2)"
                            content={sections.structure}
                          />
                        )}

                        {/* 2. Issues */}
                        {sections.issues && (
                          <AICard
                            icon="▲"
                            label="ISSUES & CODE SMELLS"
                            color="var(--accent-orange)"
                            bg="rgba(255,166,87,0.06)"
                            border="rgba(255,166,87,0.2)"
                            content={sections.issues}
                          />
                        )}

                        {/* 3. Refactoring */}
                        {sections.refactoring && (
                          <AICard
                            icon="💡"
                            label="REFACTORING SUGGESTIONS"
                            color="var(--accent-green)"
                            bg="rgba(63,185,80,0.06)"
                            border="rgba(63,185,80,0.2)"
                            content={sections.refactoring}
                          />
                        )}

                      </div>
                    );
                  })()}

                  {/* Empty state */}
                  {!analyzing && !selectedFile.aiSummary && !selectedFile.aiSuggestion && !analyzeError && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ fontSize: 40, marginBottom: 14 }}>🤖</div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
                        No AI analysis yet
                      </h3>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 20px' }}>
                        Click <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>⚡ Analyze with AI</span> to send this file to Mistral 7B via OpenRouter and get a full breakdown — code structure, issues, and refactoring suggestions.
                      </p>
                      <button onClick={handleAnalyze} style={{ padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(88,166,255,0.3)' }}>
                        ⚡ Analyze with AI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // No file selected
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <div style={{ textAlign: 'center', maxWidth: 340 }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 18px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  📂
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-primary)', marginBottom: 10 }}>
                  Select a file to begin
                </h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Pick a file from the sidebar. Then click <span style={{ color: 'var(--accent-primary)' }}>⚡ Analyze with AI</span> to get Mistral-powered insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat with Code — floating panel ── */}
      <ChatPanel
        files={files}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaPill({ label, value, color = 'var(--accent-cyan)' }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, background: `${color}15`, padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${color}30`, whiteSpace: 'nowrap' }}>
      {value} {label}
    </span>
  );
}

function AICard({ icon, label, color, bg, border, content }) {
  const [expanded, setExpanded] = useState(true);
  // Split content into bullet lines where possible
  const lines = content.split('\n').filter(l => l.trim());

  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${border}`, borderLeft: `3px solid ${color}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', animation: 'fadeIn 400ms ease' }}>
      {/* Card header */}
      <div onClick={() => setExpanded(v => !v)} style={{ padding: '12px 16px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color, fontSize: 13 }}>{icon}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ color, fontSize: 10, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}>▼</span>
      </div>

      {/* Card body */}
      {expanded && (
        <div style={{ padding: '14px 18px' }}>
          {lines.map((line, i) => {
            const isBullet = /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line.slice(2));
            const trimmed  = line.replace(/^[-•*]\s/, '').trim();
            return (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < lines.length - 1 ? 8 : 0, alignItems: 'flex-start' }}>
                {isBullet && (
                  <span style={{ color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>▸</span>
                )}
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {isBullet ? trimmed : line}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AICardSkeleton({ label, color }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: `${color}08`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>— generating…</span>
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[90, 75, 85, 60].map((w, i) => (
          <div key={i} style={{ height: 12, borderRadius: 4, width: `${w}%`, background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ComplexityBadge({ level }) {
  const cfg = { LOW: { color: 'var(--accent-green)', bg: 'rgba(63,185,80,0.1)' }, MEDIUM: { color: 'var(--accent-yellow)', bg: 'rgba(227,179,65,0.1)' }, HIGH: { color: 'var(--accent-orange)', bg: 'rgba(255,166,87,0.1)' }, CRITICAL: { color: 'var(--accent-red)', bg: 'rgba(255,123,114,0.1)' } };
  const c = cfg[level] || { color: 'var(--text-muted)', bg: 'var(--bg-overlay)' };
  return <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}>{level}</span>;
}

function Spinner() {
  return <span style={{ width: 12, height: 12, display: 'inline-block', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />;
}

function detectLanguage(fileName) {
  if (!fileName) return 'plaintext';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map = { js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript', py:'python', java:'java', go:'go', rs:'rust', cpp:'cpp', c:'c', cs:'csharp', rb:'ruby', php:'php', html:'html', css:'css', scss:'scss', json:'json', yaml:'yaml', yml:'yaml', md:'markdown', sh:'shell', sql:'sql', xml:'xml', kt:'kotlin', swift:'swift' };
  return map[ext] || 'plaintext';
}

function getFileIcon(fileName) {
  const ext   = fileName?.split('.').pop()?.toLowerCase();
  const icons = { js:'🟨', jsx:'⚛', ts:'🔷', tsx:'⚛', py:'🐍', java:'☕', go:'🔵', rs:'🦀', cpp:'⚙️', cs:'💜', rb:'💎', php:'🐘', html:'🌐', css:'🎨', json:'📋', md:'📄', sh:'🖥️', sql:'🗃️' };
  return icons[ext] || '📄';
}