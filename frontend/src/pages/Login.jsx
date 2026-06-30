import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Aurora background orbs ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)',
          top: '-200px', left: '-150px',
          animation: 'glowPulse 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 65%)',
          bottom: '-150px', right: '-100px',
          animation: 'glowPulse 8s ease-in-out infinite 2s',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 65%)',
          top: '40%', right: '20%',
          animation: 'glowPulse 10s ease-in-out infinite 4s',
        }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* ── Left branding panel (hidden on small) ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 40px', gap: 32,
        animation: 'slideInLeft 500ms ease',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            marginBottom: 24,
          }}>
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <div style={{
                position: 'absolute', inset: -3, borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #22d3ee, #6366f1)',
                animation: 'spin 4s linear infinite', opacity: 0.8,
              }} />
              <div style={{
                position: 'absolute', inset: 1, borderRadius: '50%',
                background: 'var(--bg-base)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
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
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28,
              color: 'var(--text-primary)',
            }}>
              CodeForge<span style={{
                background: 'var(--grad-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>AI</span>
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15,
            color: 'var(--text-primary)', marginBottom: 16,
            letterSpacing: '-0.02em',
          }}>
            Intelligence for{' '}
            <span style={{
              background: 'var(--grad-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              every commit
            </span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 15,
            color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36,
          }}>
            AI-powered code analysis that understands your architecture, finds hidden complexity, and suggests meaningful refactors.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {[
              { icon: '⚡', label: 'Instant Analysis' },
              { icon: '🤖', label: 'AI Insights' },
              { icon: '📊', label: 'Complexity Metrics' },
              { icon: '💬', label: 'Chat with Code' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
              }}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Auth card ── */}
      <div style={{
        width: '100%', maxWidth: 460,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        animation: 'slideInRight 500ms ease',
      }}>
        <div style={{
          width: '100%',
          background: 'rgba(12,15,26,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
        }}>
          {/* Top gradient bar */}
          <div style={{
            height: 3,
            background: 'var(--grad-text)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease infinite',
          }} />

          <div style={{ padding: '36px 36px 32px' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 24, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', marginBottom: 6,
              }}>
                Welcome back
              </h2>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 13,
                color: 'var(--text-muted)',
              }}>
                Sign in to your workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <FloatInput
                id="login-email"
                label="Email address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              <FloatInput
                id="login-password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: 12,
                      fontFamily: 'var(--font-mono)', padding: '0 4px',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                }
              />

              {error && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontFamily: 'var(--font-sans)', fontSize: 13,
                  color: 'var(--accent-red)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  animation: 'bounceIn 300ms ease',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, padding: '14px', borderRadius: 'var(--radius-md)', border: 'none',
                  background: loading
                    ? 'rgba(255,255,255,0.05)'
                    : 'var(--grad-primary)',
                  color: loading ? 'var(--text-muted)' : '#fff',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all var(--transition-base)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                  letterSpacing: '0.01em',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.6)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {loading ? <><Spinner /> Signing in…</> : <>Sign in → </>}
              </button>
            </form>

            <div style={{
              marginTop: 24, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)' }}>
                No account?{' '}
                <Link to="/register" style={{
                  color: 'var(--accent-primary-light)', fontWeight: 600,
                  transition: 'color var(--transition-fast)',
                }}>
                  Create workspace →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Floating-label Input ── */
function FloatInput({ id, label, type = 'text', value, onChange, autoComplete, suffix }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 'var(--radius-md)',
        transition: 'border-color var(--transition-fast)',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        display: 'flex', alignItems: 'center',
      }}>
        <label
          htmlFor={id}
          style={{
            position: 'absolute', left: 14,
            top: isActive ? '8px' : '50%',
            transform: isActive ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: isActive ? 10 : 13,
            fontFamily: isActive ? 'var(--font-mono)' : 'var(--font-sans)',
            fontWeight: isActive ? 600 : 400,
            color: focused ? 'var(--accent-primary-light)' : 'var(--text-muted)',
            letterSpacing: isActive ? '0.08em' : 0,
            textTransform: isActive ? 'uppercase' : 'none',
            transition: 'all var(--transition-fast)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            padding: isActive ? '22px 14px 8px' : '14px',
            background: 'none', border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--text-primary)',
            transition: 'padding var(--transition-fast)',
          }}
        />
        {suffix && (
          <div style={{ paddingRight: 12, flexShrink: 0 }}>{suffix}</div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, display: 'inline-block',
      border: '2px solid rgba(255,255,255,0.2)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}