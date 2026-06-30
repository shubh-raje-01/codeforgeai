import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar         from './components/Navbar';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import NotFound       from './pages/NotFound';
import './App.css';

/* ── Full-page loading spinner ─────────────────────────────────── */
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow orb */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        animation: 'glowPulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <div style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, var(--accent-primary), var(--accent-purple), var(--accent-cyan), var(--accent-primary))',
          animation: 'spin 1.2s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 2, borderRadius: '50%',
          background: 'var(--bg-base)',
        }} />
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-secondary)', letterSpacing: '0.15em',
        fontWeight: 600,
        textShadow: '0 0 10px rgba(99,102,241,0.3)',
      }}>
        INITIALIZING SYSTEM...
      </p>
    </div>
  );
}

/* ── Route guards ──────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

/* ── App routes (rendered inside providers) ────────────────────── */
function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/"            element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </>
  );
}

/* ── Error boundary — shows error instead of blank screen ────────── */
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', padding: 32, textAlign: 'center', gap: 20,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'relative',
          background: 'rgba(12,15,26,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '48px 36px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxWidth: 500,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: 'var(--radius-lg)', 
            background: 'rgba(239,68,68,0.1)', 
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'var(--accent-red)'
          }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
            System Interrupt Encountered
          </h2>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)',
            maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', borderRadius: 'var(--radius-md)',
              background: 'var(--grad-primary)', border: 'none',
              color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 600,
              fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Reload Interface
          </button>
        </div>
      </div>
    );
  }
}

/* ── Root ──────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}