# ADR-002: Authentication Provider — Clerk

**Status**: Accepted
**Date**: 2025-02-22
**Deciders**: Core team
**Category**: Authentication & Identity

## Context

Framedle needs authentication supporting:
- Anonymous play (no signup required for daily games)
- Social SSO (Google, Discord, Apple, GitHub, Twitter)
- Email + password registration
- Anonymous → registered account upgrade (merge history)
- Multi-platform (Web, Tauri desktop, Tauri mobile)
- JWT-based for serverless API verification (Cloudflare Workers)

## Options Considered

### Option A: Clerk ✅ (Selected)
- Hosted auth service with generous free tier (10,000 MAU)
- Pre-built UI components (sign-in, user profile)
- All major social providers + email/password + magic links
- JWT tokens verifiable at the edge (no DB call needed)
- React SDK with hooks (`useUser`, `useAuth`, `useSignIn`)
- Anonymous → registered merge via custom claims
- Webhook system for user lifecycle events
- Cost: Free to 10K MAU, then $25/mo for 100K MAU

### Option B: Auth.js (NextAuth)
- Open source, self-hosted
- Good social provider support
- Tightly coupled to Next.js (harder for Tauri apps)
- Requires database session management
- No built-in UI components
- Anonymous user handling requires custom implementation

### Option C: Supabase Auth
- Free tier with good social SSO
- Tightly coupled to Supabase ecosystem
- JWT verification at edge is possible but complex
- Would push us toward Supabase DB (we want Neon)
- Anonymous → registered merge is manual

### Option D: Lucia Auth
- Lightweight, flexible, open source
- Full control over auth logic
- Significant implementation effort
- No pre-built UI
- All provider integrations are manual

## Decision

**Clerk** — best developer experience, pre-built components, seamless anonymous→registered upgrade flow, and edge-compatible JWT verification. The free tier covers our launch phase, and the pricing scales reasonably.

## Implementation Details

### Anonymous Users
```typescript
// Anonymous users get a device fingerprint
const anonId = generateFingerprint(navigator);
// Stored in localStorage/SQLite
// All game results saved with anonId

// On registration, merge:
// POST /api/user/claim-anonymous
// { anonId, clerkUserId }
// → Links all anonymous game results to the new account
```

### JWT Verification in CF Workers
```typescript
import { verifyToken } from '@clerk/backend';

// In Hono middleware:
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    const payload = await verifyToken(token, { 
      jwtKey: c.env.CLERK_JWT_KEY 
    });
    c.set('userId', payload.sub);
  }
  // Anonymous users proceed without userId
  await next();
});
```

### Supported Providers
1. Google (Gmail) — primary
2. Discord — gaming community
3. Apple — iOS requirement
4. GitHub — developer audience
5. Twitter/X — social sharing tie-in
6. Email + password — fallback
7. Magic link — passwordless option

## Consequences

### Positive
- Weeks of auth implementation → hours
- Pre-built, accessible UI components
- Edge-compatible JWT (no DB calls for auth)
- Webhook-driven user lifecycle (sync to Neon on signup)
- Built-in rate limiting and bot protection

### Negative
- Vendor dependency (auth is a core path)
- Monthly cost at scale ($25/100K MAU)
- Clerk outage = auth outage (mitigate with JWT caching)
- Custom UI requires more work than using pre-built components

## References
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk + Cloudflare Workers](https://clerk.com/docs/deployments/clerk-edge)
- [Clerk Pricing](https://clerk.com/pricing)
