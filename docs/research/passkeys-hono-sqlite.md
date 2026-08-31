# WebAuthn Passkeys-Only Registration and Authentication in Hono API with `@simplewebauthn`, Drizzle ORM, and SQLite

**Document Status:** Complete / Architectural Research  
**Target Issue:** Issue #2  
**Domain Alignment:** Matches `CONTEXT.md` & `plan.md`  

---

## 1. Executive Summary

This research report provides the complete implementation specification and architectural design for **Passkeys-only registration and authentication** in the Vibecipes Hono API server using `@simplewebauthn`, Drizzle ORM, and SQLite (Issue #2).

### Key Architectural Decisions:
1. **Passkeys-Only Authentication**: No passwords or fallback email magic links are used. Users authenticate exclusively via FIDO2 / WebAuthn passkeys utilizing **Discoverable Credentials** (`residentKey: 'required'`) and **Conditional UI / Autofill**.
2. **`@simplewebauthn` Integration**: Server logic relies on `@simplewebauthn/server` (v10+/v11+). Client logic uses `@simplewebauthn/browser`. Data types utilize standard `base64url` strings for credential IDs and public keys in SQLite storage, converted to/from `Uint8Array` via `@simplewebauthn/server/helpers` (`isoBase64URL`, `isoUint8Array`).
3. **SQLite Schema via Drizzle ORM**: WebAuthn credential metadata is stored in an `authenticators` table linked to `users`. Active sessions are tracked in a `sessions` table.
4. **Challenge Persistence Strategy**: Server challenges are ephemeral, single-use cryptographically random tokens stored in a signed HTTP-only cookie (`passkey_challenge`) with a 5-minute TTL.
5. **Relying Party (RP) Configuration**: Environment-driven RP configuration (`RP_ID`, `RP_NAME`, `EXPECTED_ORIGIN`) ensuring domain boundary compliance (`localhost` for local development, top-level domain / matching origin for production).
6. **Hono Session Cookie Management**: Authenticated state is maintained via a secure, HTTP-only `vibecipes_session` cookie mapped to a server-side SQLite session record and validated by a Hono `authMiddleware`.

---

## 2. WebAuthn Passkeys-Only Architecture & Protocol Flows

### 2.1 Discoverable Credentials & Passkey-Only Paradigm
Passkey-only login requires authenticators to store the user's private key alongside RP details and user handle on the hardware device (Platform authenticator such as Touch ID, Face ID, Windows Hello, 1Password, Bitwarden).

* **Registration**: Requires `residentKey: 'required'` and `userVerification: 'preferred'` (or `'required'`). The `userID` MUST be an opaque, non-PII binary identifier (e.g. UUID encoded to `Uint8Array`).
* **Authentication**: Supports both:
  1. **User-initiated / Username-less Passkey Login**: The client calls `generateAuthenticationOptions` without specifying `allowCredentials`. The browser prompts the user to select from available passkeys stored for the Relying Party.
  2. **WebAuthn Autofill / Conditional UI**: Calling `startAuthentication({ optionsJSON, useConditionalUI: true })` bound to an `<input autocomplete="username webauthn">` element allows immediate one-tap passkey autofill.

---

## 3. Relying Party (RP) Configuration Strategy

WebAuthn security relies heavily on Relying Party verification to prevent phishing.

### 3.1 Rules for `rpID` and `origin`
* **`rpID`**: Represents the scope of the passkey. MUST be a valid domain suffix without protocol (`http://`/`https://`), port, or URL path.
  * Local Dev: `localhost`
  * Production: `vibecipes.com` or `app.vibecipes.com`
* **`rpName`**: Human-readable application name displayed in the operating system passkey dialog (e.g., `"Vibecipes"`).
* **`origin`**: The exact URL from which the browser WebAuthn request originates. Includes protocol and port.
  * Local Dev: `http://localhost:3000` (or `http://localhost:5173` if frontend runs on separate Vite dev server).
  * Production: `https://app.vibecipes.com`

---

## 4. Drizzle ORM Schema & Authentication Middleware

The database schema includes `users`, `authenticators`, and `sessions`. Authenticated routes are protected via a Hono middleware verifying signed session cookies against the SQLite `sessions` table.

```typescript
import { createMiddleware } from 'hono/factory';
import { getSignedCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { env } from '../config/env';

export const requireAuth = createMiddleware(async (c, next) => {
  const sessionId = await getSignedCookie(c, env.COOKIE_SECRET, 'vibecipes_session');

  if (!sessionId) {
    return c.json({ error: 'Unauthorized: Session missing' }, 401);
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!session || session.expiresAt < new Date()) {
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
```

---

## 5. Security Hardening & Edge Cases

### 5.1 Replay Protection & Counter Checks
* **Signature Counter**: Passkey authenticators maintain a sign counter incremented on every signature.
* **Verification Rule**: `@simplewebauthn/server` enforces that `newCounter > storedCounter`.
* **Cloned Key Handling**: If `newCounter <= storedCounter` (and counter is non-zero), it indicates a duplicated/cloned hardware credential or replay attempt. The login MUST be rejected and flagged.

### 5.2 User ID Privacy
* WebAuthn `userID` is stored on authenticators and MAY be transmitted in unencrypted browser logs.
* **Rule**: Never use PII (email, real name) for `userID`. Always generate an opaque UUID.
