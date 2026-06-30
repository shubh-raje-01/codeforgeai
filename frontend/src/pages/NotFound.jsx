import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-base)', 
      padding: 32, 
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      
      {/* ── Background glows ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          animation: 'glowPulse 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.6
        }} />
      </div>

      <div style={{ 
        position: 'relative', 
        textAlign: 'center', 
        animation: 'bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: 'rgba(12,15,26,0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '60px 40px',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        maxWidth: 440,
        width: '100%'
      }}>
        {/* Glowing CodeForge mini-logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2" fill="#ef4444"/>
            <rect x="15" y="1" width="10" height="10" rx="2" fill="#ef4444" opacity="0.3"/>
            <rect x="1"  y="15" width="10" height="10" rx="2" fill="#ef4444" opacity="0.3"/>
            <rect x="15" y="15" width="10" height="10" rx="2" fill="#ef4444" opacity="0.3"/>
          </svg>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
            color: 'var(--accent-red)', letterSpacing: '0.1em'
          }}>CODEFORGE // ERROR</span>
        </div>

        <div style={{ 
          fontFamily: 'var(--font-display)', 
          fontWeight: 900, 
          fontSize: 'clamp(90px, 15vw, 130px)', 
          lineHeight: 1, 
          letterSpacing: '-0.05em', 
          background: 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-orange) 60%, var(--accent-yellow) 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text',
          marginBottom: 12, 
          filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.4))',
          animation: 'float 4s ease-in-out infinite'
        }}>
          404
        </div>

        <p style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: 12, 
          color: 'var(--accent-red)', 
          letterSpacing: '0.22em', 
          marginBottom: 20,
          fontWeight: 700
        }}>
          PAGE NOT FOUND
        </p>

        <div style={{ 
          width: 180, 
          height: 1, 
          margin: '0 auto 24px', 
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' 
        }} />

        <p style={{ 
          fontFamily: 'var(--font-sans)', 
          fontSize: 14, 
          color: 'var(--text-secondary)', 
          maxWidth: 320, 
          margin: '0 auto 32px', 
          lineHeight: 1.6 
        }}>
          The page module you are looking for has been refactored, deleted, or relocated.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            id="not-found-back-home-btn"
            onClick={() => navigate('/dashboard')} 
            style={{ 
              padding: '11px 24px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--grad-primary)', 
              border: 'none', 
              color: '#fff', 
              fontFamily: 'var(--font-sans)', 
              fontWeight: 600, 
              fontSize: 13, 
              cursor: 'pointer', 
              transition: 'all var(--transition-base)', 
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)' 
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; 
              e.currentTarget.style.transform = 'translateY(-1px)'; 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; 
              e.currentTarget.style.transform = 'translateY(0)'; 
            }}
          >
            Dashboard
          </button>
          <button 
            id="not-found-back-btn"
            onClick={() => navigate(-1)} 
            style={{ 
              padding: '11px 20px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              color: 'var(--text-secondary)', 
              fontFamily: 'var(--font-sans)', 
              fontSize: 13, 
              fontWeight: 600,
              cursor: 'pointer', 
              transition: 'all var(--transition-base)' 
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; 
              e.currentTarget.style.color = 'var(--text-primary)'; 
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; 
              e.currentTarget.style.color = 'var(--text-secondary)'; 
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}