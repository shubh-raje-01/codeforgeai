import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Password strength
  function passwordStrength(pwd) {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  }
  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', 'var(--accent-red)', 'var(--accent-orange)', 'var(--accent-yellow)', 'var(--accent-green)', 'var(--accent-emerald)'][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())              { setError('Name is required.');                       return; }
    if (form.password !== form.confirm)  { setError('Passwords do not match.');                return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await register(form.name, form.email, form.password);
      if (!result.autoLogin) {
        setSuccess('Account created! Redirecting to sign in…');
        setTimeout(() => navigate('/login', { replace: true }), 1800);
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
      padding: '32px 20px',
    }}>

      {/* ── Aurora orbs ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 65%)',
          top: '-200px', left: '-100px',
          animation: 'glowPulse 7s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)',
          bottom: '-150px', right: '-80px',
          animation: 'glowPulse 9s ease-in-out infinite 3s',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* ── Auth card ── */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480,
        background: 'rgba(12,15,26,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.1)',
        animation: 'slideUp 400ms ease',
      }}>

        {/* Top gradient bar */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan), var(--accent-primary))',
          backgroundSize: '200% 100%',
          animation: 'gradientShift 3s ease infinite',
        }} />

        <div style={{ padding: '36px 36px 32px' }}>

          {/* Logo + header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ position: 'relative', width: 36, height: 36 }}>
                <div style={{
                  position: 'absolute', inset: -2, borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, #10b981, #6366f1, #22d3ee, #10b981)',
                  animation: 'spin 4s linear infinite', opacity: 0.7,
                }} />
                <div style={{
                  position: 'absolute', inset: 1, borderRadius: '50%',
                  background: 'var(--bg-base)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="2" fill="#6366f1"/>
                    <rect x="15" y="1" width="10" height="10" rx="2" fill="#10b981"/>
                    <rect x="1" y="15" width="10" height="10" rx="2" fill="#a855f7"/>
                    <rect x="15" y="15" width="10" height="10" rx="2" fill="#f59e0b"/>
                    <rect x="6" y="6" width="14" height="14" rx="3" fill="#050810"/>
                    <path d="M9 13l3 3 5-6" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
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
              fontSize: 24, color: 'var(--text-primary)',
              letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Create your workspace
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)' }}>
              Start your AI-powered code intelligence journey
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FloatInput id="reg-name"  label="Full name"  value={form.name}  onChange={set('name')}  autoComplete="name" />
            <FloatInput id="reg-email" label="Email address" type="email" value={form.email} onChange={set('email')} autoComplete="email" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FloatInput
                id="reg-password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <FloatInput
                id="reg-confirm"
                label="Confirm"
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
              />
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <div style={{ animation: 'fadeInFast 200ms ease' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 'var(--radius-full)',
                      background: i <= strength ? strengthColor : 'var(--bg-overlay)',
                      transition: 'background var(--transition-base)',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    PASSWORD STRENGTH
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
                {/* Show password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    marginTop: 6, background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                    letterSpacing: '0.08em', padding: 0,
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {showPass ? '◉ HIDE PASSWORDS' : '◎ SHOW PASSWORDS'}
                </button>
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
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

            {success && (
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                fontFamily: 'var(--font-sans)', fontSize: 13,
                color: 'var(--accent-green)',
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'bounceIn 300ms ease',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {success}
              </div>
            )}

            <button
              id="register-submit"
              type="submit"
              disabled={loading || !!success}
              style={{
                marginTop: 4, padding: '14px',
                borderRadius: 'var(--radius-md)', border: 'none',
                background: (loading || success)
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-cyan) 100%)',
                color: (loading || success) ? 'var(--text-muted)' : '#fff',
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
                cursor: (loading || success) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all var(--transition-base)',
                boxShadow: (loading || success) ? 'none' : '0 4px 20px rgba(16,185,129,0.35)',
              }}
              onMouseEnter={e => {
                if (!loading && !success) {
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(16,185,129,0.55)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = (loading || success) ? 'none' : '0 4px 20px rgba(16,185,129,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? <><Spinner /> Creating workspace…</>
                : success ? '✓ Redirecting…'
                : 'Create workspace →'}
            </button>
          </form>

          <div style={{
            marginTop: 24, paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: 'var(--accent-primary-light)', fontWeight: 600,
              }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatInput({ id, label, type = 'text', value, onChange, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-fast)',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
      }}>
        <label htmlFor={id} style={{
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
          pointerEvents: 'none', zIndex: 1,
        }}>
          {label}
        </label>
        <input
          id={id} type={type} value={value} onChange={onChange}
          autoComplete={autoComplete} required
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: isActive ? '22px 14px 8px' : '14px',
            background: 'none', border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--text-primary)',
            transition: 'padding var(--transition-fast)',
          }}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, display: 'inline-block',
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}