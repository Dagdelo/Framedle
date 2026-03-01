# ADR-011: Authentication Implementation — Logto + jose + openid-client

**Status**: Accepted
**Date**: 2026-03-01
**Deciders**: Core team
**Category**: Authentication & Identity

## Context

With the VPS-first architecture established (ADR-002 addendum), Logto is deployed self-hosted on the VPS as the identity provider. The remaining decision is **how to integrate Logto into the application layers**:

1. **Nuxt 3 web app** — needs server-side OIDC flow (SSR, session management, token refresh)
2. **Hono API** — needs JWT verification on every protected request (stateless, no DB call)
3. **Admin access** — needs role-based gate beyond the shared `ADMIN_SECRET`

The web app uses SSR (Nuxt 3), which means auth must be handled server-side — browser-only SDK approaches are incompatible.

## Decision

Use **native OIDC libraries** across both layers:

- **Nuxt (web)**: [`openid-client`](https://github.com/panva/node-openid-client) for OIDC discovery + token exchange; H3 encrypted cookie sessions (`useSession`) for token storage; `logtoCookieSecret` for AES-256 cookie encryption.
- **Hono (API)**: [`jose`](https://github.com/panva/jose) for stateless JWT verification via Logto's JWKS endpoint; `LOGTO_API_RESOURCE` env var as the required JWT audience.
- **Admin RBAC**: `requireAdmin` middleware checks the `admin` role in JWT claims, with `ADMIN_SECRET` fallback for backward compatibility during migration.

## Drivers

1. **SSR compatibility** — `openid-client` and `jose` are framework-agnostic Node.js libraries that work correctly in Nuxt server context. Logto's official `@logto/vue` SDK targets browser-only SPAs and is incompatible with SSR.
2. **Stateless API** — `jose` verifies JWTs cryptographically via JWKS with no database or network call on every request. This is the correct pattern for a stateless API layer.
3. **Minimal abstraction** — Using the underlying OIDC/JOSE primitives directly avoids an extra dependency layer (`@logto/nuxt`, `@logto/node`) that would wrap these same libraries. Fewer layers = easier debugging.
4. **Cookie security** — H3's `useSession` provides encrypted, HttpOnly, SameSite=Lax cookies with server-side session management. Token storage in localStorage or client-side state would be a security regression.
5. **Admin security upgrade** — Moving admin auth from `ADMIN_SECRET` bearer token to JWT role claims improves security: tokens are short-lived, auditable, and tied to real user identities.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| `@logto/vue` (official SDK) | Browser-only, breaks Nuxt SSR. Cannot run in server context. |
| `@logto/nuxt` (if it existed) | Does not exist as a maintained package at time of implementation. |
| Nuxt Auth (`nuxt-auth-utils`) | Adds another abstraction layer over `openid-client`. Fewer stars, less active. We'd be debugging through it anyway. |
| Clerk (managed) | Cloud-only; incompatible with VPS-first architecture. Viable migration target but not for MVP (see ADR-002). |
| Session-based auth (no JWT) | Requires DB call on every API request for session lookup. Incompatible with stateless Hono API design. |
| Direct Logto Management API calls from web | Requires exposing M2M credentials to Nuxt server routes. Separated M2M app (API layer only) is more secure. |

## Implementation

### Web (Nuxt 3) — OIDC Flow

```
GET /api/auth/sign-in  → openid-client authorization_code initiation (PKCE)
GET /api/auth/callback → token exchange, store in H3 cookie session
GET /api/auth/session  → return user from session (SSR-compatible)
GET /api/auth/token    → return access token (for API calls, refresh if expired)
GET /api/auth/sign-out → clear session, redirect to Logto sign-out
```

Cookie session (`framedle-auth`) stores: `accessToken`, `refreshToken`, `accessTokenExpiresAt`, `user`, `codeVerifier` (cleared after callback), `state` (cleared after callback).

### API (Hono) — JWT Verification

```
LOGTO_ENDPOINT      → JWKS URL: ${LOGTO_ENDPOINT}/oidc/jwks
LOGTO_API_RESOURCE  → Required audience in JWT claims
```

Middleware exported from `apps/api/src/middleware/auth.ts`:
- `optionalAuth` — extracts user if JWT present, null otherwise
- `requireAuth` — 401 if no valid JWT
- `requireAdmin` — checks `roles` claim contains `"admin"`, falls back to `ADMIN_SECRET`

### Admin Role Assignment

Roles are managed via Logto Console or the Management API (M2M app). The `admin` role in Logto maps to the `roles` claim in the JWT. No separate roles table in the application database.

## Consequences

### Positive

- SSR-native: auth state available on first server render (no hydration flash)
- Stateless API: JWT verification is a pure cryptographic operation (~1ms, no DB)
- Minimal dependency surface: `jose` + `openid-client` are the OIDC ecosystem's foundational libraries, actively maintained by the same author (panva)
- Admin RBAC is token-based and auditable via Logto's event logs
- `ADMIN_SECRET` fallback allows gradual migration without breaking existing tooling

### Negative

- Manual OIDC configuration: discovery URL, PKCE, token refresh, clock-skew handling — all implemented by hand (mitigated: `openid-client` handles this)
- Logto dependency: if Logto is unavailable, sign-in fails (existing sessions continue until expiry)
- Cookie size: storing full tokens in the session cookie increases response size (~1-2 KB encrypted)
- M2M credential management: `LOGTO_M2M_APP_ID`/`LOGTO_M2M_APP_SECRET` must be rotated manually; no automatic rotation

### Follow-ups

- Add token refresh logic to `/api/auth/token` when `accessTokenExpiresAt` is within 60 seconds
- Evaluate Logto's native Nuxt module if one is released post-MVP
- Add `LOGTO_M2M_APP_ID` rotation to the quarterly secrets rotation checklist
- Remove `adminAuth` from `apps/api/src/middleware/admin-auth.ts` once all consumers are migrated to `requireAdmin`

## References

- [openid-client (panva)](https://github.com/panva/node-openid-client)
- [jose (panva)](https://github.com/panva/jose)
- [Logto Management API](https://docs.logto.io/docs/recipes/manage-users/management-api/)
- [H3 useSession](https://h3.unjs.io/utils/session)
- [ADR-002: Auth Provider](./002-auth-provider.md) — Logto vs Clerk evaluation
- [ADR-010: Nuxt 3 Framework](./010-nuxt3-framework-swap.md) — SSR context
