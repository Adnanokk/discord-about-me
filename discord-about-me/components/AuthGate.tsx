import React, { useState, useEffect, useRef } from 'react';

const AUTH_TOKEN_KEY = 'portfolio_auth_token';

interface Props {
  children: React.ReactNode;
  onAuthenticated?: () => void;
}

type State = 'checking' | 'unauthenticated' | 'authenticated';

const AuthGate: React.FC<Props> = ({ children, onAuthenticated }) => {
  const [state, setState] = useState<State>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setState('unauthenticated'); return; }
    fetch('/api/auth/check', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setState(d.authenticated ? 'authenticated' : 'unauthenticated'))
      .catch(() => setState('unauthenticated'));
  }, []);

  useEffect(() => {
    if (state === 'unauthenticated') setTimeout(() => inputRef.current?.focus(), 100);
  }, [state]);

  // Expose a way for AdminPanel to trigger authentication
  useEffect(() => {
    const handler = () => setState('authenticated');
    window.addEventListener('portfolio:authenticated', handler);
    return () => window.removeEventListener('portfolio:authenticated', handler);
  }, []);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        setState('authenticated');
        onAuthenticated?.();
      } else {
        setError(data.error ?? 'Invalid password.');
        setPassword('');
        triggerShake();
        inputRef.current?.focus();
      }
    } catch {
      setError('Connection error. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  if (state === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}>
        <span style={{ color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.3em' }}>
          VERIFYING SESSION...
        </span>
      </div>
    );
  }

  if (state === 'authenticated') return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}>
      {/* Subtle dot-grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 360, padding: '0 20px', boxSizing: 'border-box' }}>
        {/* Lock icon — long-press (0.6s) to open admin panel */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            id="admin-trigger"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', marginBottom: 16,
              cursor: 'default', userSelect: 'none', WebkitUserSelect: 'none',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
            PRIVATE
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 22px',
          animation: shake ? 'shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
          fontFamily: 'Inter, sans-serif',
        }}>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
            Enter access password
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, lineHeight: 1.5 }}>
            This site is private. Use one of your generated passwords to enter.
          </p>

          <form onSubmit={handleSubmit} autoComplete="off">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="access password"
              autoComplete="current-password"
              spellCheck={false}
              disabled={loading}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 10, padding: '14px 14px',
                color: 'rgba(255,255,255,0.85)', fontFamily: 'JetBrains Mono, monospace',
                // 16px prevents iOS Safari from zooming
                fontSize: 16,
                outline: 'none', marginBottom: error ? 10 : 14,
                WebkitAppearance: 'none',
              }}
            />
            {error && <p style={{ fontSize: 13, color: 'rgba(239,68,68,0.85)', marginBottom: 14, lineHeight: 1.4 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                width: '100%',
                // 48px min height — comfortable touch target
                minHeight: 48,
                background: loading || !password.trim() ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10,
                color: loading || !password.trim() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.2em',
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
                WebkitAppearance: 'none',
              }}
            >
              {loading ? 'VERIFYING...' : 'ENTER'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 18,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.08)', textTransform: 'uppercase',
        }}>
          Max 5 attempts · Resets after 15 min
        </p>
      </div>

      <style>{`
        @keyframes shake {
          10%,90%{transform:translateX(-2px)}
          20%,80%{transform:translateX(4px)}
          30%,50%,70%{transform:translateX(-6px)}
          40%,60%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
};

export default AuthGate;
