import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { db } from './db/index.ts';
import { users, authenticators, sessions } from './db/schema.ts';
import type { UserDto, AuthStatusResponse, VerifyAuthResponse } from '../shared/types.ts';


const COOKIE_SECRET = process.env.COOKIE_SECRET || 'vibecipes-dev-secret-key-32-chars-minimum!';
const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = process.env.RP_NAME || 'Vibecipes';

function getExpectedOrigins(reqOrigin?: string): string[] {
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  if (process.env.EXPECTED_ORIGIN) {
    defaultOrigins.push(process.env.EXPECTED_ORIGIN);
  }
  if (reqOrigin && !defaultOrigins.includes(reqOrigin)) {
    defaultOrigins.push(reqOrigin);
  }
  return defaultOrigins;
}

export type AuthContextVariables = {
  user: typeof users.$inferSelect;
  session: typeof sessions.$inferSelect;
};

export const requireAuth = createMiddleware<{ Variables: AuthContextVariables }>(async (c, next) => {
  const sessionId = await getSignedCookie(c, COOKIE_SECRET, 'vibecipes_session');

  if (!sessionId) {
    return c.json({ error: 'Unauthorized: Session missing' }, 401);
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!session || new Date(session.expiresAt) < new Date()) {
    deleteCookie(c, 'vibecipes_session', { path: '/' });
    return c.json({ error: 'Unauthorized: Session expired' }, 401);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!user) {
    deleteCookie(c, 'vibecipes_session', { path: '/' });
    return c.json({ error: 'Unauthorized: User not found' }, 401);
  }

  c.set('user', user);
  c.set('session', session);

  await next();
});

export const authRoutes = new Hono()
  .get('/me', async (c) => {
    const sessionId = await getSignedCookie(c, COOKIE_SECRET, 'vibecipes_session');
    if (!sessionId) {
      const res: AuthStatusResponse = { user: null };
      return c.json(res);
    }

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      deleteCookie(c, 'vibecipes_session', { path: '/' });
      const res: AuthStatusResponse = { user: null };
      return c.json(res);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      deleteCookie(c, 'vibecipes_session', { path: '/' });
      const res: AuthStatusResponse = { user: null };
      return c.json(res);
    }

    const userDto: UserDto = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
    const res: AuthStatusResponse = { user: userDto };
    return c.json(res);
  })

  .post('/register/options', async (c) => {
    const body = ((await c.req.json<{ username?: string; displayName?: string }>().catch(() => ({}))) || {}) as {
      username?: string;
      displayName?: string;
    };
    const username = body.username?.trim();
    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    let user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    const userId = user ? user.id : crypto.randomUUID();
    const userAuthenticators = user
      ? await db.select().from(authenticators).where(eq(authenticators.userId, user.id))
      : [];

    const excludeCredentials = userAuthenticators.map((auth) => ({
      id: auth.credentialId,
      transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransportFuture[]) : undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: isoUint8Array.fromUTF8String(userId),
      userName: username,
      userDisplayName: body.displayName?.trim() || username,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    const challengePayload = JSON.stringify({
      challenge: options.challenge,
      userId,
      username,
      displayName: body.displayName?.trim() || username,
    });



    await setSignedCookie(c, 'passkey_challenge', challengePayload, COOKIE_SECRET, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 300,
    });

    return c.json(options);
  })

  .post('/register/verify', async (c) => {
    const body = await c.req.json<RegistrationResponseJSON>();
    const challengeCookie = await getSignedCookie(c, COOKIE_SECRET, 'passkey_challenge');

    if (!challengeCookie) {
      return c.json({ error: 'Challenge expired or missing' }, 400);
    }

    let challengeData: { challenge: string; userId: string; username: string; displayName: string };
    try {
      challengeData = JSON.parse(challengeCookie);
    } catch {
      return c.json({ error: 'Invalid challenge payload' }, 400);
    }

    const reqOrigin = c.req.header('origin');
    const expectedOrigins = getExpectedOrigins(reqOrigin);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: RP_ID,
      });
    } catch (err: any) {
      return c.json({ error: err.message || 'Registration verification failed' }, 400);
    }

    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) {
      return c.json({ error: 'Registration verification failed' }, 400);
    }

    const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

    // Check if user exists or create
    let user = await db.query.users.findFirst({
      where: eq(users.username, challengeData.username),
    });

    const now = new Date().toISOString();

    if (!user) {
      await db.insert(users).values({
        id: challengeData.userId,
        username: challengeData.username,
        displayName: challengeData.displayName,
        createdAt: now,
      });
      user = {
        id: challengeData.userId,
        username: challengeData.username,
        displayName: challengeData.displayName,
        createdAt: now,
      };
    }

    // Save authenticator
    const credentialId = credential.id;
    const publicKeyBase64 = isoBase64URL.fromBuffer(credential.publicKey);
    const transportsJson = body.response.transports ? JSON.stringify(body.response.transports) : null;

    await db.insert(authenticators).values({
      id: crypto.randomUUID(),
      userId: user.id,
      credentialId,
      publicKey: publicKeyBase64,
      counter: credential.counter,
      transports: transportsJson,
      createdAt: now,
    });

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
      createdAt: now,
    });

    // Set session cookie
    await setSignedCookie(c, 'vibecipes_session', sessionId, COOKIE_SECRET, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Clear challenge cookie
    deleteCookie(c, 'passkey_challenge', { path: '/' });

    const userDto: UserDto = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };

    const res: VerifyAuthResponse = { verified: true, user: userDto };
    return c.json(res);
  })

  .post('/login/options', async (c) => {
    const body = ((await c.req.json<{ username?: string }>().catch(() => ({}))) || {}) as { username?: string };
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;


    if (body.username) {
      const user = await db.query.users.findFirst({
        where: eq(users.username, body.username),
      });

      if (user) {
        const userAuthenticators = await db.select().from(authenticators).where(eq(authenticators.userId, user.id));
        allowCredentials = userAuthenticators.map((auth) => ({
          id: auth.credentialId,
          transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransportFuture[]) : undefined,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials,
    });

    const challengePayload = JSON.stringify({
      challenge: options.challenge,
    });

    await setSignedCookie(c, 'passkey_challenge', challengePayload, COOKIE_SECRET, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 300,
    });

    return c.json(options);
  })

  .post('/login/verify', async (c) => {
    const body = await c.req.json<AuthenticationResponseJSON>();
    const challengeCookie = await getSignedCookie(c, COOKIE_SECRET, 'passkey_challenge');

    if (!challengeCookie) {
      return c.json({ error: 'Challenge expired or missing' }, 400);
    }

    let challengeData: { challenge: string };
    try {
      challengeData = JSON.parse(challengeCookie);
    } catch {
      return c.json({ error: 'Invalid challenge payload' }, 400);
    }

    const authenticator = await db.query.authenticators.findFirst({
      where: eq(authenticators.credentialId, body.id),
    });

    if (!authenticator) {
      return c.json({ error: 'Passkey authenticator not found. Please register first.' }, 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, authenticator.userId),
    });

    if (!user) {
      return c.json({ error: 'User associated with passkey not found' }, 400);
    }

    const reqOrigin = c.req.header('origin');
    const expectedOrigins = getExpectedOrigins(reqOrigin);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: RP_ID,
        credential: {
          id: authenticator.credentialId,
          publicKey: isoBase64URL.toBuffer(authenticator.publicKey),
          counter: authenticator.counter,
          transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
        },
      });
    } catch (err: any) {
      return c.json({ error: err.message || 'Authentication verification failed' }, 400);
    }

    const { verified, authenticationInfo } = verification;
    if (!verified || !authenticationInfo) {
      return c.json({ error: 'Authentication verification failed' }, 400);
    }

    // Update signature counter
    await db
      .update(authenticators)
      .set({ counter: authenticationInfo.newCounter })
      .where(eq(authenticators.id, authenticator.id));

    // Create session
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
      createdAt: now,
    });

    // Set session cookie
    await setSignedCookie(c, 'vibecipes_session', sessionId, COOKIE_SECRET, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Clear challenge cookie
    deleteCookie(c, 'passkey_challenge', { path: '/' });

    const userDto: UserDto = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };

    const res: VerifyAuthResponse = { verified: true, user: userDto };
    return c.json(res);
  })

  .post('/logout', async (c) => {
    const sessionId = await getSignedCookie(c, COOKIE_SECRET, 'vibecipes_session');
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
    deleteCookie(c, 'vibecipes_session', { path: '/' });
    return c.json({ success: true });
  });
