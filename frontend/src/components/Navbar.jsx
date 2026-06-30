import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const initials = (user?.name || user?.username)?.slice(0, 2).toUpperCase()
    ?? user?.email?.slice(0, 2).toUpperCase()
    ?? 'U';

  const isDash = location.pathname === '/dashboard';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 1000,
      background: scrolled
        ? 'rgba(5,8,16,0.85)'
        : 'rgba(5,8,16,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', gap: 16,
      transition: 'all var(--transition-base)',
    }}>

      {/* ── Logo ── */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ position: 'relative', width: 32, height: 32 }}>
          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: -3,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #22d3ee, #6366f1)',
            animation: 'spin 4s linear infinite',
            opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute', inset: 1,
            borderRadius: '50%',
            background: 'var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="2" fill="#6366f1"/>
              <rect x="15" y="1" width="10" height="10" rx="2" fill="#10b981"/>
              <rect x="1"  y="15" width="10" height="10" rx="2" fill="#a855f7"/>
              <rect x="15" y="15" width="10" height="10" rx="2" fill="#f59e0b"/>
              <rect x="6" y="6" width="14" height="14" rx="3" fill="#050810"/>
              <path d="M9 13l3 3 5-6" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
          color: 'var(--text-primary)', letterSpacing: '0.02em',
        }}>
          CodeForge<span style={{
            background: 'var(--grad-text)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>AI</span>
        </span>
      </Link>

      {/* ── Center Nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/dashboard" active={isDash}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </NavLink>
      </div>

      {/* ── Right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

        {/* AI Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 'var(--radius-full)',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'var(--accent-green)', letterSpacing: '0.04em',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent-green)',
            display: 'inline-block',
            animation: 'pulseGreen 2s ease-in-out infinite',
          }} />
          AI Online
        </div>

        {/* User menu */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button
            id="navbar-user-menu"
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px 6px 6px',
              borderRadius: 'var(--radius-full)',
              background: open ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${open ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
              cursor: 'pointer', color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--grad-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 0 2px rgba(99,102,241,0.3)',
            }}>
              {initials}
            </div>
            <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.username || user?.email?.split('@')[0] || 'user'}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{
                color: 'var(--text-muted)',
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
              }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'rgba(12,15,26,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)', minWidth: 200,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
              overflow: 'hidden', zIndex: 300,
              animation: 'slideUp 180ms ease',
            }}>
              {/* User info */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(99,102,241,0.05)',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)', marginBottom: 2,
                }}>
                  {user?.name || user?.username}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {user?.email}
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={() => { logout(); navigate('/login'); setOpen(false); }}
                style={{
                  width: '100%', padding: '12px 16px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-red)', fontFamily: 'var(--font-sans)',
                  fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 'var(--radius-md)',
        fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500,
        color: active ? 'var(--accent-primary-light)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active
          ? 'rgba(99,102,241,0.12)'
          : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}