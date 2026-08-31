import React, { useEffect, useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { UserDto, AuthStatusResponse, VerifyAuthResponse } from '../shared/types.ts';

interface AuthBarProps {
  onUserChange?: (user: UserDto | null) => void;
}

export function AuthBar({ onUserChange }: AuthBarProps) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data: AuthStatusResponse = await res.json();
        setUser(data.user);
        if (onUserChange) onUserChange(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch auth state', err);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username to register.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Get registration options
      const optRes = await fetch('/api/auth/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), displayName: displayName.trim() || undefined }),
      });
      if (!optRes.ok) {
        const errData = await optRes.json();
        throw new Error(errData.error || 'Failed to get registration options');
      }
      const options = await optRes.json();

      // 2. Pass options to WebAuthn browser API
      const regResp = await startRegistration({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResp),
      });

      const verifyData: VerifyAuthResponse = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified || !verifyData.user) {
        throw new Error(verifyData.error || 'Registration verification failed');
      }

      setUser(verifyData.user);
      if (onUserChange) onUserChange(verifyData.user);
      setMessage(`Successfully registered passkey for ${verifyData.user.displayName}!`);
      setUsername('');
      setDisplayName('');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Passkey registration was canceled or timed out.');
      } else {
        setError(err.message || 'Passkey registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Get authentication options
      const optRes = await fetch('/api/auth/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() || undefined }),
      });
      if (!optRes.ok) {
        const errData = await optRes.json();
        throw new Error(errData.error || 'Failed to get authentication options');
      }
      const options = await optRes.json();

      // 2. Pass options to WebAuthn browser API
      const authResp = await startAuthentication({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp),
      });

      const verifyData: VerifyAuthResponse = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified || !verifyData.user) {
        throw new Error(verifyData.error || 'Passkey login verification failed');
      }

      setUser(verifyData.user);
      if (onUserChange) onUserChange(verifyData.user);
      setMessage(`Welcome back, ${verifyData.user.displayName}!`);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Passkey login was canceled.');
      } else {
        setError(err.message || 'Passkey login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (onUserChange) onUserChange(null);
      setMessage('Successfully logged out.');
    } catch (err) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--border, #333)', borderRadius: '8px', padding: '1.25rem' }}>
      {user ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted, #888)', display: 'block' }}>AUTHENTICATED PASSKEY USER</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--primary, #6366f1)' }}>{user.displayName}</strong>{' '}
            <small style={{ color: 'var(--muted, #888)' }}>(@{user.username})</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--border, #444)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Add/Verify Passkey
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>🔑 Passkey Authentication</h3>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Username (e.g. chef_gernot)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border, #444)',
                background: 'var(--input-bg, #1e1e2e)',
                color: '#fff',
                flex: '1 1 180px',
              }}
            />
            <input
              type="text"
              placeholder="Display Name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border, #444)',
                background: 'var(--input-bg, #1e1e2e)',
                color: '#fff',
                flex: '1 1 180px',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent, #6366f1)',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Processing...' : 'Register Passkey'}
            </button>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--accent, #6366f1)',
                background: 'transparent',
                color: 'var(--accent, #6366f1)',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Sign In with Passkey
            </button>
          </form>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '0.75rem', color: '#ef4444', fontSize: '0.9rem', background: '#450a0a', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{ marginTop: '0.75rem', color: '#10b981', fontSize: '0.9rem', background: '#064e3b', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
          ✓ {message}
        </div>
      )}
    </div>
  );
}
