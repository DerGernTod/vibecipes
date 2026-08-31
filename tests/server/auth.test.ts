import { describe, it, expect, beforeAll } from 'vitest';
import { app, initDb } from '../../src/server/index.ts';
import { db } from '../../src/server/db/index.ts';
import { users, sessions, authenticators } from '../../src/server/db/schema.ts';
import { setSignedCookie } from 'hono/cookie';
import { Hono } from 'hono';

const COOKIE_SECRET = process.env.COOKIE_SECRET || 'vibecipes-dev-secret-key-32-chars-minimum!';

describe('WebAuthn Auth & Session Management API (app.fetch)', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('GET /api/auth/me returns user: null when unauthenticated', async () => {
    const req = new Request('http://localhost/api/auth/me');
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it('POST /api/auth/register/options requires username', async () => {
    const req = new Request('http://localhost/api/auth/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '' }),
    });
    const res = await app.fetch(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Username is required');
  });

  it('POST /api/auth/register/options returns WebAuthn options & sets challenge cookie', async () => {
    const req = new Request('http://localhost/api/auth/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testchef', displayName: 'Test Chef' }),
    });
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const options = await res.json();
    expect(options.rp.name).toBe('Vibecipes');
    expect(options.rp.id).toBe('localhost');
    expect(options.user.name).toBe('testchef');
    expect(options.user.displayName).toBe('Test Chef');
    expect(typeof options.challenge).toBe('string');
    expect(options.authenticatorSelection.residentKey).toBe('required');

    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('passkey_challenge');
  });

  it('POST /api/auth/login/options returns WebAuthn authentication options & sets challenge cookie', async () => {
    const req = new Request('http://localhost/api/auth/login/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testchef' }),
    });
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const options = await res.json();
    expect(options.rpId).toBe('localhost');
    expect(typeof options.challenge).toBe('string');

    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('passkey_challenge');
  });

  it('GET /api/auth/me returns user profile when valid session cookie is provided', async () => {
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.insert(users).values({
      id: userId,
      username: `sessionuser_${userId}`,
      displayName: 'Session User',
      createdAt: now,
    });

    await db.insert(sessions).values({
      id: sessionId,
      userId: userId,
      expiresAt: expiresAt,
      createdAt: now,
    });

    // Generate signed cookie value using temporary Hono helper route
    const helperApp = new Hono();
    helperApp.get('/cookie', async (c) => {
      await setSignedCookie(c, 'vibecipes_session', sessionId, COOKIE_SECRET);
      return c.text('ok');
    });
    const cookieRes = await helperApp.fetch(new Request('http://localhost/cookie'));
    const setCookieHeader = cookieRes.headers.get('set-cookie');
    const cookieValue = setCookieHeader?.split(';')[0];

    const req = new Request('http://localhost/api/auth/me', {
      headers: { Cookie: cookieValue || '' },
    });
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(userId);
    expect(data.user.username).toBe(`sessionuser_${userId}`);
    expect(data.user.displayName).toBe('Session User');
  });

  it('POST /api/auth/logout revokes session and clears cookie', async () => {
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.insert(users).values({
      id: userId,
      username: `logoutuser_${userId}`,
      displayName: 'Logout User',
      createdAt: now,
    });

    await db.insert(sessions).values({
      id: sessionId,
      userId: userId,
      expiresAt: expiresAt,
      createdAt: now,
    });

    const helperApp = new Hono();
    helperApp.get('/cookie', async (c) => {
      await setSignedCookie(c, 'vibecipes_session', sessionId, COOKIE_SECRET);
      return c.text('ok');
    });
    const cookieRes = await helperApp.fetch(new Request('http://localhost/cookie'));
    const setCookieHeader = cookieRes.headers.get('set-cookie');
    const cookieValue = setCookieHeader?.split(';')[0];

    // Logout request
    const logoutReq = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookieValue || '' },
    });
    const logoutRes = await app.fetch(logoutReq);
    expect(logoutRes.status).toBe(200);

    const logoutCookieHeader = logoutRes.headers.get('set-cookie');
    expect(logoutCookieHeader).toContain('vibecipes_session=;');

    // Subsequent /me request
    const meReq = new Request('http://localhost/api/auth/me', {
      headers: { Cookie: cookieValue || '' },
    });
    const meRes = await app.fetch(meReq);
    const meData = await meRes.json();
    expect(meData.user).toBeNull();
  });
});
