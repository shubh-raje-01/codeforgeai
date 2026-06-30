import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function complexityMeta(score) {
  if (score === 0 || score === undefined || score === null)
    return { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: '—', glow: 'rgba(255,255,255,0)' };
  if (score <= 25)
    return { color: 'var(--accent-green)',   bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)',  label: 'Low',      glow: 'rgba(16,185,129,0.15)'  };
  if (score <= 50)
    return { color: 'var(--accent-yellow)',  bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.25)',   label: 'Medium',   glow: 'rgba(234,179,8,0.15)'   };
  if (score <= 75)
    return { color: 'var(--accent-orange)',  bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',  label: 'High',     glow: 'rgba(245,158,11,0.15)'  };
  return     { color: 'var(--accent-red)',   bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',   label: 'Critical', glow: 'rgba(239,68,68,0.15)'   };
}

function sum(files, key) {
  if (!Array.isArray(files) || files.length === 0) return 0;
  return files.reduce((acc, f) => acc + (Number(f[key]) || 0), 0);
}

function avg(files, key) {
  if (!Array.isArray(files) || files.length === 0) return 0;
  return Math.round(sum(files, key) / files.length);
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const files = project.files ?? project.codeFiles ?? [];

  const totalLines   = sum(files, 'lineCount');
  const totalMethods = sum(files, 'methodCount');
  const totalClasses = sum(files, 'classCount');
  const avgScore     = avg(files, 'complexityScore');
  const fileCount    = project.fileCount ?? files.length;

  const displayScore = project.complexityScore ?? avgScore;
  const cx = complexityMeta(displayScore);

  const createdAt = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div
      id={`project-card-${project.id}`}
      onClick={() => navigate(`/project/${project.id}`)}
      style={{
        background: 'rgba(12,15,26,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? cx.border : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${cx.border}, 0 0 40px ${cx.glow}`
          : '0 2px 12px rgba(0,0,0,0.3)',
        transition: 'all var(--transition-base)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top color accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${cx.color}, ${cx.color}40, transparent)`,
        opacity: hovered ? 1 : 0.6,
        transition: 'opacity var(--transition-fast)',
      }} />

      {/* Subtle corner glow on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 120, height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${cx.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
            color: hovered ? 'var(--text-primary)' : 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 4, letterSpacing: '-0.01em',
            transition: 'color var(--transition-fast)',
          }}>
            {project.name}
          </h3>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            {fileCount} file{fileCount !== 1 ? 's' : ''}
            {createdAt ? <> · {createdAt}</> : ''}
          </p>
        </div>

        {/* Complexity badge */}
        <span style={{
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: cx.color, background: cx.bg,
          border: `1px solid ${cx.border}`,
          flexShrink: 0, marginLeft: 10, letterSpacing: '0.04em',
          transition: 'all var(--transition-fast)',
        }}>
          {cx.label}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 12,
          color: 'var(--text-secondary)', lineHeight: 1.6,
          marginBottom: 14,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {project.description}
        </p>
      )}

      {/* ── Metrics Bento ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        <Metric label="LINES"   value={totalLines.toLocaleString()}   color="var(--accent-cyan)"   />
        <Metric label="METHODS" value={totalMethods.toLocaleString()} color="var(--accent-purple)" />
        <Metric label="CLASSES" value={totalClasses.toLocaleString()} color="var(--accent-yellow)" />
      </div>

      {/* ── Complexity bar ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            AVG COMPLEXITY
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: cx.color }}>
            {displayScore}/100
          </span>
        </div>
        <div style={{
          height: 5, background: 'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-full)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 'var(--radius-full)',
            width: `${Math.min(displayScore, 100)}%`,
            background: `linear-gradient(90deg, ${cx.color}80, ${cx.color})`,
            boxShadow: displayScore > 0 ? `0 0 8px ${cx.glow}` : 'none',
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
          color: hovered ? 'var(--accent-primary-light)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color var(--transition-fast)',
        }}>
          View Details
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{
              transform: hovered ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform var(--transition-fast)',
            }}
          >
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 10px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800,
        color, marginBottom: 2, lineHeight: 1,
      }}>
        {value || '—'}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-muted)', letterSpacing: '0.1em',
      }}>
        {label}
      </div>
    </div>
  );
}