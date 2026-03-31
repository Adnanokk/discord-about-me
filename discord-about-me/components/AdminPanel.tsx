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

  // Long-press on footer trigger (600ms)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const start = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target?.id === 'admin-trigger') {
        timer = setTimeout(() => setOpen(true), 600);
      }
    };
    const cancel = () => { if (timer) clearTimeout(timer); };

    document.addEventListener('mousedown', start);
    document.addEventListener('touchstart', start);
    document.addEventListener('mouseup', cancel);
    document.addEventListener('touchend', cancel);
    document.addEventListener('mousemove', cancel);

    return () => {
      document.removeEventListener('mousedown', start);
      document.removeEventListener('touchstart', start);
      document.removeEventListener('mouseup', cancel);
      document.removeEventListener('touchend', cancel);
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
    } catch {
      // ignore
    } finally {
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

  const s = { background: '#0a0a0c', border: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.35)', dim: 'rgba(255,255,255,0.12)' };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, backdropFilter: 'blur(4px)' }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        background: s.background, borderTop: `1px solid ${s.border}`, borderRadius: '16px 16px 0 0',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: s.dim }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: s.text }}>Admin Panel</div>
            {adminState === 'unlocked' && (
              <div style={{ fontSize: 11, color: s.muted, marginTop: 2 }}>
                {stats.remaining} of {stats.total} passwords remaining
              </div>
            )}
          </div>
          <button onClick={close} style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', padding: 4, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>

          {/* Locked state — master password form */}
          {adminState === 'locked' || adminState === 'unlocking' ? (
            <form onSubmit={handleUnlock}>
              <p style={{ fontSize: 13, color: s.muted, marginBottom: 16, lineHeight: 1.5 }}>
                Enter your master password to view and manage access passwords.
              </p>
              <input
                type="password"
                value={masterPassword}
                onChange={e => { setMasterPassword(e.target.value); setUnlockError(''); }}
                placeholder="master password"
                autoFocus
                autoComplete="off"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: s.dim, border: `1px solid ${unlockError ? 'rgba(239,68,68,0.5)' : s.border}`,
                  borderRadius: 8, padding: '10px 12px',
                  color: s.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
                  outline: 'none', marginBottom: unlockError ? 8 : 12,
                }}
              />
              {unlockError && <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.9)', marginBottom: 12 }}>{unlockError}</p>}
              <button
                type="submit"
                disabled={unlocking || !masterPassword}
                style={{
                  width: '100%', padding: '11px', borderRadius: 8, cursor: unlocking ? 'wait' : 'pointer',
                  background: 'rgba(255,255,255,0.08)', border: `1px solid ${s.border}`,
                  color: s.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.15em',
                }}
              >
                {unlocking ? 'VERIFYING...' : 'UNLOCK'}
              </button>
            </form>
          ) : (
            /* Unlocked state — passwords */
            <>
              {/* Actions bar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, cursor: regenerating ? 'wait' : 'pointer',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: 'rgba(239,68,68,0.8)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.1em',
                  }}
                >
                  {regenerating ? 'GENERATING...' : '↻  REGENERATE ALL'}
                </button>
                <button
                  onClick={() => { const t = sessionStorage.getItem(ADMIN_TOKEN_KEY); if (t) fetchPasswords(t); }}
                  style={{
                    padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                    background: s.dim, border: `1px solid ${s.border}`,
                    color: s.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  }}
                >
                  ↻
                </button>
              </div>

              {loading ? (
                <p style={{ color: s.muted, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Loading...</p>
              ) : passwords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: s.muted, fontSize: 13, marginBottom: 16 }}>No passwords yet. Generate them first.</p>
                  <button
                    onClick={handleRegenerate}
                    style={{
                      padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.08)', border: `1px solid ${s.border}`,
                      color: s.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.1em',
                    }}
                  >
                    GENERATE 1000 PASSWORDS
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {passwords.map(pw => {
                    const formatted = `${pw.slice(0,4)} ${pw.slice(4,8)} ${pw.slice(8,12)} ${pw.slice(12)}`;
                    const isCopied = copied === pw;
                    const isUsing = usingPassword === pw;
                    return (
                      <div
                        key={pw}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: isCopied ? 'rgba(34,197,94,0.08)' : s.dim,
                          border: `1px solid ${isCopied ? 'rgba(34,197,94,0.3)' : s.border}`,
                          borderRadius: 8, padding: '8px 12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{
                          flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.05em',
                          color: isCopied ? 'rgba(34,197,94,0.9)' : s.text,
                        }}>
                          {isCopied ? '✓ copied' : formatted}
                        </span>
                        <button
                          onClick={() => handleCopy(pw)}
                          style={{
                            background: 'none', border: `1px solid ${s.border}`, borderRadius: 6,
                            color: s.muted, cursor: 'pointer', padding: '4px 10px', fontSize: 11,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        >
                          copy
                        </button>
                        <button
                          onClick={() => handleUse(pw)}
                          disabled={isUsing}
                          style={{
                            background: 'rgba(255,255,255,0.07)', border: `1px solid ${s.border}`, borderRadius: 6,
                            color: s.text, cursor: isUsing ? 'wait' : 'pointer', padding: '4px 10px', fontSize: 11,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        >
                          {isUsing ? '...' : 'use'}
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
