import React, { useState, useEffect, useCallback } from 'react';

const ADMIN_TOKEN_KEY = 'portfolio_admin_token';
const AUTH_TOKEN_KEY = 'portfolio_auth_token';

interface Props {
  onAuthenticated: () => void;
}

type AdminState = 'locked' | 'unlocking' | 'unlocked';

const AdminPanel: React.FC<Props> = ({ onAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const [adminState, setAdminState] = useState<AdminState>('locked');
  const [masterPassword, setMasterPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [passwords, setPasswords] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, used: 0, remaining: 0 });
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [usingPassword, setUsingPassword] = useState<string | null>(null);

  // Check if admin token is still valid on open
  useEffect(() => {
    if (!open) return;
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      setAdminState('unlocked');
      fetchPasswords(token);
    } else {
      setAdminState('locked');
    }
  }, [open]);

  // Long-press on footer trigger (600ms) — works on both desktop and mobile
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let touchMoved = false;

    const start = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('#admin-trigger')) {
        touchMoved = false;
        timer = setTimeout(() => setOpen(true), 600);
      }
    };

    const onTouchMove = () => { touchMoved = true; cancel(); };
    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };

    document.addEventListener('mousedown', start);
    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('mouseup', cancel);
    document.addEventListener('touchend', cancel);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('mousemove', cancel);

    return () => {
      document.removeEventListener('mousedown', start);
      document.removeEventListener('touchstart', start);
      document.removeEventListener('mouseup', cancel);
      document.removeEventListener('touchend', cancel);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mousemove', cancel);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setMasterPassword('');
    setUnlockError('');
  }, []);

  const fetchPasswords = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/passwords', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { sessionStorage.removeItem(ADMIN_TOKEN_KEY); setAdminState('locked'); return; }
      const data = await res.json();
      setPasswords(data.passwords || []);
      setStats({ total: data.total, used: data.used, remaining: data.remaining });
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword || unlocking) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setAdminState('unlocked');
        setMasterPassword('');
        fetchPasswords(data.token);
      } else {
        setUnlockError(data.error || 'Wrong password.');
        setMasterPassword('');
      }
    } catch {
      setUnlockError('Connection error.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleCopy = async (pw: string) => {
    try {
      await navigator.clipboard.writeText(pw);
      setCopied(pw);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const handleUse = async (pw: string) => {
    setUsingPassword(pw);
    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        close();
        onAuthenticated();
      }
    } catch { /* ignore */ } finally {
      setUsingPassword(null);
    }
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    if (!confirm('Regenerate all 1000 passwords? All existing unused passwords will be replaced.')) return;
    setRegenerating(true);
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) { setAdminState('locked'); return; }
    try {
      const res = await fetch('/api/admin/passwords', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPasswords(token);
    } catch { /* ignore */ } finally {
      setRegenerating(false);
    }
  };

  if (!open) return null;

  const s = {
    bg: '#0a0a0c',
    border: 'rgba(255,255,255,0.07)',
    text: 'rgba(255,255,255,0.85)',
    muted: 'rgba(255,255,255,0.35)',
    dim: 'rgba(255,255,255,0.06)',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        background: s.bg,
        borderTop: `1px solid ${s.border}`,
        borderRadius: '20px 20px 0 0',
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        // Safe area for notched phones
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 14px',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: s.text }}>Admin Panel</div>
            {adminState === 'unlocked' && (
              <div style={{ fontSize: 13, color: s.muted, marginTop: 3 }}>
                {stats.remaining} of {stats.total} passwords remaining · {stats.used} used
              </div>
            )}
          </div>
          {/* Close button — large touch target */}
          <button
            onClick={close}
            style={{
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${s.border}`,
              borderRadius: 10, color: s.muted, cursor: 'pointer',
              width: 44, height: 44, fontSize: 20, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '0 16px 24px',
          WebkitOverflowScrolling: 'touch',
        }}>

          {/* LOCKED — master password */}
          {adminState !== 'unlocked' ? (
            <form onSubmit={handleUnlock}>
              <p style={{ fontSize: 14, color: s.muted, marginBottom: 20, lineHeight: 1.6 }}>
                Enter your master password to view and manage access passwords.
              </p>
              <input
                type="password"
                value={masterPassword}
                onChange={e => { setMasterPassword(e.target.value); setUnlockError(''); }}
                placeholder="master password"
                autoFocus
                autoComplete="current-password"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: s.dim,
                  border: `1px solid ${unlockError ? 'rgba(239,68,68,0.5)' : s.border}`,
                  borderRadius: 10, padding: '14px 14px',
                  color: s.text,
                  fontFamily: 'JetBrains Mono, monospace',
                  // 16px prevents iOS zoom
                  fontSize: 16,
                  outline: 'none',
                  marginBottom: unlockError ? 10 : 14,
                  WebkitAppearance: 'none',
                }}
              />
              {unlockError && (
                <p style={{ fontSize: 13, color: 'rgba(239,68,68,0.9)', marginBottom: 14, lineHeight: 1.4 }}>
                  {unlockError}
                </p>
              )}
              <button
                type="submit"
                disabled={unlocking || !masterPassword}
                style={{
                  width: '100%',
                  // 48px height — comfortable touch target
                  minHeight: 48,
                  borderRadius: 10, cursor: unlocking ? 'wait' : 'pointer',
                  background: unlocking || !masterPassword ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
                  border: `1px solid ${s.border}`,
                  color: unlocking || !masterPassword ? 'rgba(255,255,255,0.25)' : s.text,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.15em',
                  WebkitAppearance: 'none',
                }}
              >
                {unlocking ? 'VERIFYING...' : 'UNLOCK'}
              </button>
            </form>

          ) : (
            /* UNLOCKED — passwords list */
            <>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  style={{
                    flex: 1, minHeight: 44, borderRadius: 10, cursor: regenerating ? 'wait' : 'pointer',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: 'rgba(239,68,68,0.8)',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.08em',
                    WebkitAppearance: 'none',
                  }}
                >
                  {regenerating ? 'GENERATING...' : '↻  REGENERATE ALL'}
                </button>
                <button
                  onClick={() => { const t = sessionStorage.getItem(ADMIN_TOKEN_KEY); if (t) fetchPasswords(t); }}
                  style={{
                    minHeight: 44, minWidth: 44, borderRadius: 10, cursor: 'pointer',
                    background: s.dim, border: `1px solid ${s.border}`,
                    color: s.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    WebkitAppearance: 'none',
                  }}
                >
                  ↻
                </button>
              </div>

              {loading ? (
                <p style={{ color: s.muted, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Loading...</p>
              ) : passwords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: s.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                    No passwords yet. Generate them first.
                  </p>
                  <button
                    onClick={handleRegenerate}
                    style={{
                      padding: '14px 28px', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.08)', border: `1px solid ${s.border}`,
                      color: s.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.1em',
                      WebkitAppearance: 'none',
                    }}
                  >
                    GENERATE 1000 PASSWORDS
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {passwords.map(pw => {
                    const formatted = `${pw.slice(0, 4)} ${pw.slice(4, 8)} ${pw.slice(8, 12)} ${pw.slice(12)}`;
                    const isCopied = copied === pw;
                    const isUsing = usingPassword === pw;
                    return (
                      <div
                        key={pw}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: isCopied ? 'rgba(34,197,94,0.07)' : s.dim,
                          border: `1px solid ${isCopied ? 'rgba(34,197,94,0.25)' : s.border}`,
                          borderRadius: 10,
                          // Minimum 52px row height for comfortable tapping
                          minHeight: 52,
                          padding: '0 12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{
                          flex: 1,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 14,
                          letterSpacing: '0.08em',
                          color: isCopied ? 'rgba(34,197,94,0.9)' : s.text,
                        }}>
                          {isCopied ? '✓ copied' : formatted}
                        </span>

                        {/* Copy button — 44px touch target */}
                        <button
                          onClick={() => handleCopy(pw)}
                          style={{
                            minHeight: 36, minWidth: 56,
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${s.border}`,
                            borderRadius: 8,
                            color: s.muted, cursor: 'pointer',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            WebkitAppearance: 'none', flexShrink: 0,
                          }}
                        >
                          copy
                        </button>

                        {/* Use button — 44px touch target */}
                        <button
                          onClick={() => handleUse(pw)}
                          disabled={isUsing}
                          style={{
                            minHeight: 36, minWidth: 52,
                            background: 'rgba(255,255,255,0.09)',
                            border: `1px solid ${s.border}`,
                            borderRadius: 8,
                            color: s.text, cursor: isUsing ? 'wait' : 'pointer',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            WebkitAppearance: 'none', flexShrink: 0,
                          }}
                        >
                          {isUsing ? '...' : 'use →'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
