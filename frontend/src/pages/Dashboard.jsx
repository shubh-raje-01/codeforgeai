import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectsApi } from '../api/projects';
import ProjectCard from '../components/ProjectCard';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('ALL');
  const [sortBy,    setSortBy]    = useState('createdAt');
  const [showForm,  setShowForm]  = useState(false);

  const [formName,  setFormName]  = useState('');
  const [formDesc,  setFormDesc]  = useState('');
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const projectList = await projectsApi.getAll();
      const list = Array.isArray(projectList) ? projectList : [];
      const withFiles = await Promise.all(
        list.map(async (p) => {
          try {
            const files = await projectsApi.getFiles(p.id);
            return { ...p, files: Array.isArray(files) ? files : [] };
          } catch {
            return { ...p, files: [] };
          }
        })
      );
      setProjects(withFiles);
    } catch (err) {
      toast.error('Failed to load projects: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!formName.trim()) { setUploadErr('Project name is required.'); return; }
    if (!file)            { setUploadErr('Please select a ZIP file.'); return; }
    setUploadErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', formName);
      fd.append('description', formDesc);
      await projectsApi.create(fd);
      toast.success(`"${formName}" uploaded! Analysis running…`);
      setShowForm(false);
      setFormName(''); setFormDesc(''); setFile(null);
      fetchProjects();
    } catch (err) {
      const msg = err?.message || 'Upload failed.';
      setUploadErr(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function complexityLevel(project) {
    const files = project.files ?? [];
    if (!files.length) return 'UNKNOWN';
    const avg = files.reduce((s, f) => s + (f.complexityScore || 0), 0) / files.length;
    if (avg <= 25) return 'LOW';
    if (avg <= 50) return 'MEDIUM';
    if (avg <= 75) return 'HIGH';
    return 'CRITICAL';
  }

  const filtered = projects
    .filter(p => filter === 'ALL' || complexityLevel(p) === filter)
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'complexity') {
        const scoreA = (a.files ?? []).reduce((s, f) => s + (f.complexityScore || 0), 0) / Math.max((a.files ?? []).length, 1);
        const scoreB = (b.files ?? []).reduce((s, f) => s + (f.complexityScore || 0), 0) / Math.max((b.files ?? []).length, 1);
        return scoreB - scoreA;
      }
      return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
    });

  // Aggregate stats
  const totalFiles   = projects.reduce((s, p) => s + (p.files?.length ?? p.fileCount ?? 0), 0);
  const totalLines   = projects.reduce((s, p) => s + (p.files ?? []).reduce((a, f) => a + (f.lineCount || 0), 0), 0);
  const avgComplexity = projects.length > 0
    ? Math.round(projects.reduce((s, p) => {
        const files = p.files ?? [];
        return s + (files.length > 0
          ? files.reduce((a, f) => a + (f.complexityScore || 0), 0) / files.length
          : 0);
      }, 0) / projects.length)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 60 }}>

      {/* ── Background accents ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          top: '-300px', right: '-200px',
          animation: 'glowPulse 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 65%)',
          bottom: '-200px', left: '-100px',
          animation: 'glowPulse 12s ease-in-out infinite 4s',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 32px 64px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 20, marginBottom: 36,
          animation: 'fadeIn 400ms ease',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.12em',
              marginBottom: 6, textTransform: 'uppercase',
            }}>
              {greeting},{' '}
              <span style={{ color: 'var(--accent-primary-light)' }}>
                {user?.name || user?.username || 'dev'}
              </span>
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 34px)',
              background: 'var(--grad-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em', lineHeight: 1.2,
              marginBottom: 6,
            }}>
              Code Intelligence Dashboard
            </h1>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              AI-powered analysis for your repositories
            </p>
          </div>

          <button
            id="new-project-btn"
            onClick={() => { setShowForm(v => !v); setUploadErr(''); }}
            style={{
              padding: '11px 22px',
              borderRadius: 'var(--radius-md)',
              background: showForm
                ? 'rgba(255,255,255,0.05)'
                : 'var(--grad-primary)',
              color: showForm ? 'var(--text-secondary)' : '#fff',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: showForm ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              transition: 'all var(--transition-base)',
              border: showForm ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
            onMouseEnter={e => {
              if (!showForm) {
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.6)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = showForm ? 'none' : '0 4px 20px rgba(99,102,241,0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        </div>

        {/* ── Stats Bar ── */}
        {!loading && projects.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16, marginBottom: 32,
            animation: 'slideUp 400ms ease 100ms both',
          }}>
            <StatCard value={projects.length} label="Projects" icon="◈" color="var(--accent-primary-light)" />
            <StatCard value={totalFiles.toLocaleString()} label="Total Files" icon="◻" color="var(--accent-cyan)" />
            <StatCard value={totalLines.toLocaleString()} label="Lines of Code" icon="≡" color="var(--accent-purple)" />
            <StatCard value={`${avgComplexity}/100`} label="Avg Complexity" icon="◎" color={avgComplexity > 60 ? 'var(--accent-red)' : avgComplexity > 30 ? 'var(--accent-orange)' : 'var(--accent-green)'} />
          </div>
        )}

        {/* ── Upload Form ── */}
        {showForm && (
          <form onSubmit={handleCreate} style={{
            background: 'rgba(12,15,26,0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: 28,
            animation: 'slideUp 250ms ease',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
          }}>
            {/* Form header */}
            <div style={{
              padding: '18px 24px',
              background: 'rgba(99,102,241,0.06)',
              borderBottom: '1px solid rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}>⚡</div>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: 15,
                  fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2,
                }}>Upload New Project</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Upload a ZIP file to start AI-powered code analysis
                </p>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="PROJECT NAME *" value={formName} onChange={e => setFormName(e.target.value)} placeholder="my-awesome-project" required />
                <FormField label="DESCRIPTION"    value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Optional description" />
              </div>

              {/* Drop zone */}
              <div>
                <label style={labelStyle}>ZIP FILE *</label>
                <div
                  id="file-dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  style={{
                    padding: '32px 24px',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer', textAlign: 'center',
                    border: `2px dashed ${dragOver ? 'var(--accent-primary-light)' : file ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}`,
                    background: dragOver
                      ? 'rgba(99,102,241,0.08)'
                      : file
                        ? 'rgba(16,185,129,0.05)'
                        : 'rgba(255,255,255,0.02)',
                    transition: 'all var(--transition-fast)',
                    boxShadow: dragOver ? '0 0 0 4px rgba(99,102,241,0.12)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>
                    {file ? '✅' : dragOver ? '📂' : '⬆️'}
                  </div>
                  {file ? (
                    <>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>
                        {file.name}
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {(file.size / 1024).toFixed(1)} KB · Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: dragOver ? 'var(--accent-primary-light)' : 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
                        Drop your ZIP here or click to browse
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Accepts .zip files</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".zip,application/zip" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} />
              </div>

              {uploadErr && (
                <div style={{
                  padding: '11px 14px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontFamily: 'var(--font-sans)', fontSize: 13,
                  color: 'var(--accent-red)',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  ⚠ {uploadErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '10px 20px', borderRadius: 'var(--radius-md)',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                <button type="submit" id="upload-analyze-btn" disabled={uploading} style={{
                  padding: '10px 24px', borderRadius: 'var(--radius-md)', border: 'none',
                  background: uploading ? 'rgba(255,255,255,0.05)' : 'var(--grad-primary)',
                  color: uploading ? 'var(--text-muted)' : '#fff',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: uploading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
                  transition: 'all var(--transition-fast)',
                }}>
                  {uploading ? <><Spinner /> Uploading…</> : '⚡ Upload & Analyze'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Filter bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
          animation: 'fadeIn 400ms ease 150ms both',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'ALL',      color: 'var(--accent-primary-light)' },
              { label: 'LOW',      color: 'var(--accent-green)'  },
              { label: 'MEDIUM',   color: 'var(--accent-yellow)' },
              { label: 'HIGH',     color: 'var(--accent-orange)' },
              { label: 'CRITICAL', color: 'var(--accent-red)'    },
            ].map(({ label, color }) => (
              <button key={label} onClick={() => setFilter(label)} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: filter === label ? color : 'rgba(255,255,255,0.07)',
                background: filter === label ? `${color}18` : 'transparent',
                color: filter === label ? color : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
                transition: 'all var(--transition-fast)', letterSpacing: '0.06em',
                fontWeight: filter === label ? 700 : 400,
              }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
              {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '7px 14px', appearance: 'none',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)', fontSize: 12,
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="createdAt">Latest</option>
              <option value="name">Name</option>
              <option value="complexity">Complexity</option>
            </select>
          </div>
        </div>

        {/* ── Project Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 18 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{
                height: 240, borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 1.5s infinite, staggerFade 400ms ease ${i * 80}ms both`,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'rgba(12,15,26,0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px dashed rgba(255,255,255,0.08)',
            animation: 'fadeIn 400ms ease',
          }}>
            <div style={{ fontSize: 56, marginBottom: 20, animation: 'float 4s ease-in-out infinite' }}>⊞</div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: 20,
              color: 'var(--text-primary)', marginBottom: 10, fontWeight: 700,
            }}>
              {filter !== 'ALL' ? `No ${filter.toLowerCase()} complexity projects` : 'No projects yet'}
            </h3>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 14,
              color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6,
            }}>
              Upload a ZIP of your project to start AI analysis
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 28px', borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)', border: 'none',
                color: '#fff', fontFamily: 'var(--font-sans)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
            >
              + Upload First Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 18 }}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{ animation: `staggerFade 400ms ease ${i * 60}ms both` }}>
                <ProjectCard project={p} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ value, label, icon, color }) {
  return (
    <div style={{
      padding: '18px 20px',
      background: 'rgba(12,15,26,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--radius-xl)',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all var(--transition-base)',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = `${color}30`;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 22, color, lineHeight: 1, marginBottom: 3,
        }}>
          {value}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontFamily: 'var(--font-mono)', fontSize: 10,
  color: 'var(--text-muted)', letterSpacing: '0.12em',
  display: 'block', marginBottom: 8, textTransform: 'uppercase',
};

function FormField({ label, value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        value={value} onChange={onChange} placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 14px',
          fontFamily: 'var(--font-sans)', fontSize: 13,
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--text-primary)',
          border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 'var(--radius-md)', outline: 'none',
          transition: 'all var(--transition-fast)',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        }}
      />
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, display: 'inline-block',
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}