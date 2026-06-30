import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Editor from "@monaco-editor/react";
import ChatPanel from "../components/ChatPanel";

const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000";

function parseAIResponse(text) {
  if (!text) return { structure: '', issues: '', refactoring: '' };

  const clean  = text.replace(/\*\*/g, '').replace(/#+\s/g, '');
  const parts  = clean.split(/(?=\b[123]\.\s)/);

  const get = (n) => {
    const part = parts.find(p => p.trimStart().startsWith(`${n}.`));
    return part ? part.replace(/^\s*\d\.\s*/, '').trim() : '';
  };

  return {
    structure:   get(1) || clean,
    issues:      get(2),
    refactoring: get(3),
  };
}

function scoreColor(score) {
  if (!score) return 'var(--text-muted)';
  if (score <= 25) return 'var(--accent-green)';
  if (score <= 50) return 'var(--accent-yellow)';
  if (score <= 75) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

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

  useEffect(() => {
    api.get(`/projects/${id}/files`)
      .then(res => setFiles(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoadingFiles(false));
  }, [id]);

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
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, ...fileData, content } : f
      ));
    } catch {
      setCode('// Could not load file content.');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!code || code === '// No content available.' || code === '// Could not load file content.') {
      setAnalyzeError('No source code loaded. Click a file first to load its content.');
      return;
    }

    setAnalyzing(true);
    setAnalyzeError('');

    try {
      const res = await fetch(`${AI_URL}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      
      {/* ── Background glows ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
          top: '-10%', right: '-10%',
          animation: 'glowPulse 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)',
          bottom: '10%', left: '-10%',
          animation: 'glowPulse 12s ease-in-out infinite 3s',
        }} />
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: 60, position: 'relative', zIndex: 1 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside style={{
          width: 280, flexShrink: 0,
          background: 'rgba(12,15,26,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'all var(--transition-base)',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,8,16,0.2)' }}>
            <button 
              id="back-to-dashboard-btn"
              onClick={() => navigate('/dashboard')} 
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                color: 'var(--text-muted)', padding: 0, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--accent-primary-light)';
                e.currentTarget.firstChild.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.firstChild.style.transform = 'translateX(0)';
              }}
            >
              <span style={{ transition: 'transform var(--transition-fast)', display: 'inline-block' }}>←</span> Back to Dashboard
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.01em' }}>
              Project Files
            </h2>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }}>⌕</span>
              <input 
                id="search-files-input"
                placeholder="Search files..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '9px 12px 9px 30px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.07)', 
                  borderRadius: 'var(--radius-md)', 
                  color: 'var(--text-primary)', 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: 13, 
                  outline: 'none', 
                  transition: 'all var(--transition-fast)' 
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(99,102,241,0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
            {loadingFiles ? (
              [1,2,3,4,5].map(i => (
                <div key={i} style={{ 
                  height: 38, 
                  margin: '6px 0', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)', 
                  backgroundSize: '200% 100%', 
                  animation: 'shimmer 1.5s infinite' 
                }} />
              ))
            ) : filteredFiles.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', padding: '24px 12px', textAlign: 'center' }}>
                {search ? 'No matching files' : 'No files found'}
              </p>
            ) : filteredFiles.map(file => {
              const isActive = selectedFile?.id === file.id;
              const hasAI    = !!(file.aiSummary || file.aiSuggestion);
              const score    = file.complexityScore ?? 0;
              return (
                <div 
                  key={file.id} 
                  id={`file-item-${file.id}`}
                  onClick={() => loadFile(file)} 
                  style={{
                    padding: '9px 12px', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer', 
                    marginBottom: 4,
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                    transition: 'all var(--transition-fast)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10,
                  }}
                  onMouseEnter={e => { 
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; 
                  }}
                  onMouseLeave={e => { 
                    if (!isActive) e.currentTarget.style.background = 'transparent'; 
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{getFileIcon(file.fileName)}</span>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: 12, 
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', 
                    flex: 1, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 600 : 400
                  }}>
                    {file.fileName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {hasAI && <span title="AI analysis complete" style={{ fontSize: 11, color: 'var(--accent-green)' }}>⚡</span>}
                    {score > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor(score), boxShadow: `0 0 6px ${scoreColor(score)}` }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ 
            padding: '12px 20px', 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            fontFamily: 'var(--font-mono)', 
            fontSize: 10, 
            color: 'var(--text-muted)', 
            letterSpacing: '0.08em',
            background: 'rgba(5,8,16,0.1)'
          }}>
            {files.length} FILES · {files.filter(f => f.aiSummary).length} ANALYZED
          </div>
        </aside>

        {/* ── MAIN PANEL ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedFile ? (
            <>
              {/* Panel header */}
              <div style={{ 
                padding: '14px 24px', 
                background: 'rgba(12,15,26,0.6)', 
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: 12 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{ fontSize: 18 }}>{getFileIcon(selectedFile.fileName)}</span>
                  <h2 style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontSize: 16, 
                    fontWeight: 800, 
                    color: 'var(--text-primary)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em'
                  }}>
                    {selectedFile.fileName}
                  </h2>
                  
                  {/* Pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedFile.lineCount > 0 && <MetaPill label="lines" value={selectedFile.lineCount.toLocaleString()} color="var(--accent-cyan)" />}
                    {selectedFile.methodCount > 0 && <MetaPill label="methods" value={selectedFile.methodCount.toLocaleString()} color="var(--accent-purple)" />}
                    {selectedFile.classCount > 0 && <MetaPill label="classes" value={selectedFile.classCount.toLocaleString()} color="var(--accent-yellow)" />}
                    {selectedFile.complexityScore > 0 && (
                      <MetaPill label="complexity" value={`${selectedFile.complexityScore}/100`} color={scoreColor(selectedFile.complexityScore)} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {/* AI Analysis button */}
                  <button 
                    id="analyze-btn"
                    onClick={handleAnalyze} 
                    disabled={analyzing || loadingCode} 
                    style={{
                      padding: '8px 18px', 
                      borderRadius: 'var(--radius-md)', 
                      border: 'none',
                      background: analyzing 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'var(--grad-primary)',
                      color: analyzing ? 'var(--text-muted)' : '#fff',
                      fontFamily: 'var(--font-sans)', 
                      fontWeight: 600, 
                      fontSize: 12,
                      cursor: (analyzing || loadingCode) ? 'not-allowed' : 'pointer',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      boxShadow: analyzing ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => {
                      if (!analyzing && !loadingCode) {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = analyzing ? 'none' : '0 4px 16px rgba(99,102,241,0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {analyzing ? <><Spinner /> Analyzing…</> : <>⚡ Analyze with AI</>}
                  </button>

                  {/* Chat button */}
                  <button 
                    id="toggle-chat-btn"
                    onClick={() => setChatOpen(v => !v)} 
                    style={{
                      padding: '8px 16px', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid',
                      borderColor: chatOpen ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)',
                      background: chatOpen ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)',
                      color: chatOpen ? 'var(--accent-purple)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)', 
                      fontWeight: 600, 
                      fontSize: 12,
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => {
                      if (!chatOpen) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!chatOpen) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }
                    }}
                  >
                    <span>💬</span> {chatOpen ? 'Close Chat' : 'Chat with Code'}
                  </button>
                </div>
              </div>

              {/* Scrollable layout for Monaco + AI suggestions */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Monaco Editor Wrapper */}
                <div style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.06)', 
                  position: 'relative',
                  background: '#1e1e1e', // Monaco vs-dark base
                }}>
                  {loadingCode && (
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      zIndex: 10, 
                      background: 'rgba(5,8,16,0.85)', 
                      backdropFilter: 'blur(4px)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 12 
                    }}>
                      <Spinner />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        LOADING CONTENT...
                      </span>
                    </div>
                  )}
                  <Editor
                    height="400px"
                    language={detectLanguage(selectedFile.fileName)}
                    theme="vs-dark"
                    value={code}
                    options={{
                      readOnly: true, 
                      minimap: { enabled: false },
                      fontSize: 13, 
                      lineHeight: 22,
                      scrollBeyondLastLine: false,
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      padding: { top: 16, bottom: 16 },
                      scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        useShadows: false,
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                      }
                    }}
                  />
                </div>

                {/* AI Analysis Panel */}
                <div style={{ padding: '24px 24px 48px', maxWidth: 1000, width: '100%', margin: '0 auto' }}>

                  {/* Error Banner */}
                  {analyzeError && (
                    <div style={{ 
                      padding: '14px 18px', 
                      borderRadius: 'var(--radius-lg)', 
                      background: 'rgba(239,68,68,0.08)', 
                      border: '1px solid rgba(239,68,68,0.25)', 
                      fontFamily: 'var(--font-sans)', 
                      fontSize: 13, 
                      color: 'var(--accent-red)', 
                      marginBottom: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      animation: 'bounceIn 300ms ease'
                    }}>
                      <span style={{ fontSize: 16 }}>⚠️</span> {analyzeError}
                    </div>
                  )}

                  {/* Loading skeleton */}
                  {analyzing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <AICardSkeleton label="AI SUMMARY"      color="var(--accent-cyan)"   />
                      <AICardSkeleton label="ISSUES DETECTED" color="var(--accent-orange)" />
                      <AICardSkeleton label="REFACTORING"     color="var(--accent-green)"  />
                    </div>
                  )}

                  {/* AI Output Content */}
                  {!analyzing && (selectedFile.aiSummary || selectedFile.aiSuggestion) && (() => {
                    const raw      = selectedFile.aiSummary || selectedFile.aiSuggestion;
                    const sections = parseAIResponse(raw);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Title header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>🤖</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                              AI Intelligence Report
                            </span>
                            <span style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: 10, 
                              fontWeight: 600,
                              color: 'var(--accent-green)', 
                              background: 'rgba(16,185,129,0.08)', 
                              padding: '3px 10px', 
                              borderRadius: 'var(--radius-full)', 
                              border: '1px solid rgba(16,185,129,0.2)' 
                            }}>
                              Mistral 7B
                            </span>
                          </div>
                          <button 
                            id="re-analyze-btn"
                            onClick={handleAnalyze} 
                            style={{ 
                              fontFamily: 'var(--font-sans)', 
                              fontSize: 12, 
                              color: 'var(--accent-primary-light)', 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              fontWeight: 500,
                              transition: 'color var(--transition-fast)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-primary-light)'}
                          >
                            Re-analyze Code
                          </button>
                        </div>

                        {/* Staggered cards */}
                        {sections.structure && (
                          <div style={{ animation: 'staggerFade 400ms ease 50ms both' }}>
                            <AICard
                              icon="◈"
                              label="CODE STRUCTURE"
                              color="var(--accent-cyan)"
                              bg="rgba(34,211,238,0.05)"
                              border="rgba(34,211,238,0.18)"
                              content={sections.structure}
                            />
                          </div>
                        )}

                        {/* 2. Issues */}
                        {sections.issues && (
                          <div style={{ animation: 'staggerFade 400ms ease 120ms both' }}>
                            <AICard
                              icon="▲"
                              label="ISSUES & CODE SMELLS"
                              color="var(--accent-orange)"
                              bg="rgba(245,158,11,0.05)"
                              border="rgba(245,158,11,0.18)"
                              content={sections.issues}
                            />
                          </div>
                        )}

                        {/* 3. Refactoring */}
                        {sections.refactoring && (
                          <div style={{ animation: 'staggerFade 400ms ease 190ms both' }}>
                            <AICard
                              icon="💡"
                              label="REFACTORING SUGGESTIONS"
                              color="var(--accent-green)"
                              bg="rgba(16,185,129,0.05)"
                              border="rgba(16,185,129,0.18)"
                              content={sections.refactoring}
                            />
                          </div>
                        )}

                      </div>
                    );
                  })()}

                  {/* Empty state */}
                  {!analyzing && !selectedFile.aiSummary && !selectedFile.aiSuggestion && !analyzeError && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '48px 24px', 
                      background: 'rgba(12,15,26,0.5)', 
                      border: '1px dashed rgba(255,255,255,0.08)', 
                      borderRadius: 'var(--radius-xl)',
                      animation: 'fadeIn 400ms ease'
                    }}>
                      <div style={{ fontSize: 44, marginBottom: 16, animation: 'float 4s ease-in-out infinite' }}>🤖</div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>
                        No analysis generated yet
                      </h3>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 24px' }}>
                        Click <span style={{ color: 'var(--accent-primary-light)', fontWeight: 600 }}>⚡ Analyze with AI</span> to run code inspections and retrieve structure maps, code smells, and optimizations.
                      </p>
                      <button 
                        id="run-analysis-empty-btn"
                        onClick={handleAnalyze} 
                        style={{ 
                          padding: '10px 24px', 
                          borderRadius: 'var(--radius-md)', 
                          border: 'none', 
                          background: 'var(--grad-primary)', 
                          color: '#fff', 
                          fontFamily: 'var(--font-sans)', 
                          fontWeight: 600, 
                          fontSize: 13, 
                          cursor: 'pointer', 
                          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                          transition: 'all var(--transition-base)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        ⚡ Analyze with AI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // No file selected state
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, animation: 'fadeIn 300ms ease' }}>
              <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <div style={{ 
                  width: 80, height: 80, margin: '0 auto 20px', 
                  borderRadius: 'var(--radius-xl)', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 36,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  animation: 'float 4s ease-in-out infinite'
                }}>
                  📂
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>
                  Select a file to inspect
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Choose any codebase module from the sidebar, then toggle code assistant chat or run AI analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatPanel
        files={files}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}

/* ── Pills component ── */
function MetaPill({ label, value, color }) {
  return (
    <span style={{ 
      fontFamily: 'var(--font-mono)', 
      fontSize: 11, 
      fontWeight: 500,
      color, 
      background: `${color}10`, 
      padding: '3px 10px', 
      borderRadius: 'var(--radius-full)', 
      border: `1px solid ${color}25`, 
      whiteSpace: 'nowrap' 
    }}>
      {value} <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>{label}</span>
    </span>
  );
}

/* ── Collapsible Card ── */
function AICard({ icon, label, color, bg, border, content }) {
  const [expanded, setExpanded] = useState(true);
  const lines = content.split('\n').filter(l => l.trim());

  return (
    <div style={{ 
      background: 'rgba(12,15,26,0.6)', 
      backdropFilter: 'blur(8px)',
      border: `1px solid ${border}`, 
      borderLeft: `4px solid ${color}`, 
      borderRadius: 'var(--radius-lg)', 
      overflow: 'hidden',
      transition: 'all var(--transition-base)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {/* Header */}
      <div 
        onClick={() => setExpanded(v => !v)} 
        style={{ 
          padding: '14px 18px', 
          background: bg, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer', 
          userSelect: 'none' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color, fontSize: 14 }}>{icon}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, letterSpacing: '0.12em', fontWeight: 700 }}>
            {label}
          </span>
        </div>
        <svg 
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"
          style={{ 
            transform: expanded ? 'rotate(180deg)' : 'none', 
            transition: 'transform var(--transition-fast)' 
          }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lines.map((line, i) => {
            const isBullet = /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line.slice(2));
            const trimmed  = line.replace(/^[-•*]\s/, '').trim();
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {isBullet ? (
                  <span style={{ color, fontSize: 13, flexShrink: 0, marginTop: 2 }}>▸</span>
                ) : null}
                <p style={{ 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: 13, 
                  color: 'var(--text-primary)', 
                  lineHeight: 1.65, 
                  margin: 0 
                }}>
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

/* ── Card Skeleton Loading ── */
function AICardSkeleton({ label, color }) {
  return (
    <div style={{ 
      background: 'rgba(12,15,26,0.6)', 
      border: `1px solid ${color}15`, 
      borderLeft: `4px solid ${color}`, 
      borderRadius: 'var(--radius-lg)', 
      overflow: 'hidden' 
    }}>
      <div style={{ padding: '14px 18px', background: `${color}05`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, letterSpacing: '0.12em', fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>— scanning structure…</span>
      </div>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[85, 70, 75, 55].map((w, i) => (
          <div key={i} style={{ 
            height: 12, 
            borderRadius: 4, 
            width: `${w}%`, 
            background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)', 
            backgroundSize: '200% 100%', 
            animation: 'shimmer 1.5s infinite',
            animationDelay: `${i * 120}ms` 
          }} />
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 14, height: 14, display: 'inline-block', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />;
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