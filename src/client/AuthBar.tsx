import React, { useEffect, useState } from 'react';
import { Button, Input } from './ui/index.ts';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { UserDto } from '../shared/schemas.ts';
import {
  authStatusResponseSchema,
  authenticationOptionsResponseSchema,
  registrationOptionsResponseSchema,
  verifyAuthResponseSchema,
} from '../shared/schemas.ts';
import { readErrorMessage, readJson } from './http.ts';

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
        const data = await readJson(res, authStatusResponseSchema);
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
        throw new Error(await readErrorMessage(optRes, 'Failed to get registration options'));
      }
      const options = await readJson(optRes, registrationOptionsResponseSchema);

      // 2. Pass options to WebAuthn browser API
      const regResp = await startRegistration({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResp),
      });

      if (!verifyRes.ok) throw new Error(await readErrorMessage(verifyRes, 'Registration verification failed'));
      const verifyData = await readJson(verifyRes, verifyAuthResponseSchema);

      setUser(verifyData.user);
      if (onUserChange) onUserChange(verifyData.user);
      setMessage(`Successfully registered passkey for ${verifyData.user.displayName}!`);
      setUsername('');
      setDisplayName('');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Passkey registration was canceled or timed out.');
      } else {
        setError((err instanceof Error && err.message) || 'Passkey registration failed');
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
        throw new Error(await readErrorMessage(optRes, 'Failed to get authentication options'));
      }
      const options = await readJson(optRes, authenticationOptionsResponseSchema);

      // 2. Pass options to WebAuthn browser API
      const authResp = await startAuthentication({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp),
      });

      if (!verifyRes.ok) throw new Error(await readErrorMessage(verifyRes, 'Passkey login verification failed'));
      const verifyData = await readJson(verifyRes, verifyAuthResponseSchema);

      setUser(verifyData.user);
      if (onUserChange) onUserChange(verifyData.user);
      setMessage(`Welcome back, ${verifyData.user.displayName}!`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Passkey login was canceled.');
      } else {
        setError((err instanceof Error && err.message) || 'Passkey login failed');
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
    <div className="auth-bar">
      {user ? (
        <div className="auth-bar__row">
          <div className="auth-bar__identity">
            <span className="auth-bar__eyebrow">AUTHENTICATED PASSKEY USER</span>
            <span className="auth-bar__name">{user.displayName}</span>
            <small className="auth-bar__handle">(@{user.username})</small>
          </div>
          <div className="auth-bar__actions">
            <Button onClick={handleLogin} disabled={loading}>
              Add/Verify Passkey
            </Button>
            <Button variant="danger" onClick={handleLogout} disabled={loading}>
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="auth-bar__title">🔑 Passkey Authentication</h3>
          <form className="auth-bar__form" onSubmit={handleRegister}>
            <Input
              type="text"
              placeholder="Username (e.g. chef_gernot)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Display Name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Processing...' : 'Register Passkey'}
            </Button>
            <Button onClick={handleLogin} disabled={loading}>
              Sign In with Passkey
            </Button>
          </form>
        </>
      )}

      {error && <div className="alert alert--error">⚠️ {error}</div>}

      {message && <div className="alert alert--success">✓ {message}</div>}
    </div>
  );
}
