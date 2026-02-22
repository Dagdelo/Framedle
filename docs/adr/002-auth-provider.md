# ADR-002: Authentication Provider — Clerk

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Authentication & Identity

## Context

Framedle needs authentication supporting:

- Anonymous play (no signup required for daily games)
- Social SSO (Google, Discord, Apple, GitHub, Twitter)
- Email + password registration
- Anonymous → registered account upgrade (merge history)
- Multi-platform (Web, Tauri desktop, Tauri mobile)
- JWT-based verification for serverless API (Cloudflare Workers — no persistent connections)

## Options Considered

| Criteria | Clerk ✅ | Auth.js (NextAuth) | Supabase Auth | Lucia Auth |
|----------|-------|------------------|---------------|------------|
| Hosted/managed | ✅ | Self-hosted | Hosted | Self-hosted |
| Pre-built UI | ✅ Full components | ❌ | Partial | ❌ |
| Social SSO | All major providers | Good coverage | Good coverage | Manual per provider |
| Edge JWT verification | ✅ No DB call | ❌ DB sessions | ⚠️ Complex | ❌ |
| Anonymous→registered | ✅ Custom claims | Manual | Manual | Manual |
| Free tier | 10K MAU | Unlimited (self-host) | 50K MAU | Unlimited (self-host) |
| Tauri compatibility | ✅ | ⚠️ Next.js coupled | ⚠️ Supabase coupled | ✅ |
| Implementation effort | Days | Weeks | Weeks | Months |

## Decision

**Clerk** — best developer experience, pre-built components, seamless anonymous→registered upgrade flow, and edge-compatible JWT verification. The free tier (10K MAU) covers our launch phase.

## Implementation

### Supported Providers

1. **Google** (Gmail) — primary, largest user base
2. **Discord** — gaming community crossover
3. **Apple** — required for iOS App Store
4. **GitHub** — developer audience
5. **Twitter/X** — social sharing tie-in
6. **Email + password** — universal fallback
7. **Magic link** — passwordless option

### JWT Verification in Cloudflare Workers

```typescript
import { verifyToken } from '@clerk/backend';

// Hono middleware — runs on every API request
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const payload = await verifyToken(token, {
        jwtKey: c.env.CLERK_JWT_KEY,
      });
      c.set('userId', payload.sub);
      c.set('isAuthenticated', true);
    } catch {
      // Invalid token — treat as anonymous
      c.set('isAuthenticated', false);
    }
  } else {
    c.set('isAuthenticated', false);
  }

  await next();
});
```

Key: JWT verification uses the public key — no database call, no network request to Clerk. Pure cryptographic verification at the edge.

### Anonymous → Registered Merge

```typescript
// When user registers and wants to claim anonymous history:
// POST /api/user/claim-anonymous
app.post('/api/user/claim-anonymous', async (c) => {
  const { fingerprint } = await c.req.json();
  const clerkUserId = c.get('userId');

  // Find anonymous user by fingerprint
  const anonUser = await db.query.users.findFirst({
    where: eq(users.anonFingerprint, fingerprint),
  });

  if (!anonUser) return c.json({ merged: 0 });

  // Merge: reassign all game results to the new account
  const merged = await db
    .update(gameResults)
    .set({ userId: registeredUser.id })
    .where(eq(gameResults.userId, anonUser.id));

  // Transfer XP, streak, and achievements
  await db.update(users).set({
    xp: sql`xp + ${anonUser.xp}`,
    streakCurrent: Math.max(registeredUser.streakCurrent, anonUser.streakCurrent),
    streakBest: Math.max(registeredUser.streakBest, anonUser.streakBest),
  }).where(eq(users.id, registeredUser.id));

  // Retire anonymous identity
  await db.delete(users).where(eq(users.id, anonUser.id));

  return c.json({ merged: merged.count });
});
```

### Webhook Sync (User Lifecycle)

Clerk fires webhooks on user events. A dedicated Worker endpoint processes them:

```
POST /api/webhooks/clerk
  user.created  → Create user record in Neon
  user.updated  → Sync display name, avatar, email
  user.deleted  → Soft-delete user, anonymize game results
```

## Consequences

### Positive

- Weeks of auth implementation reduced to hours
- Pre-built, accessible UI components (sign-in modal, user button)
- Edge-compatible JWT (no DB calls for auth verification)
- Webhook-driven user lifecycle (automatic Neon sync)
- Built-in rate limiting and bot protection
- Multi-platform SDK (React, vanilla JS for Tauri)

### Negative

- Vendor dependency on authentication (critical path)
- Monthly cost at scale ($25/mo per 100K MAU beyond free tier)
- Clerk outage = auth outage for new sessions (mitigated: existing JWTs still verify locally)
- Custom UI requires more effort than using pre-built components

### Cost Projection

| MAU | Monthly Cost |
|-----|-------------|
| 0 - 10,000 | $0 (free) |
| 10,001 - 100,000 | $25 |
| 100,001 - 1,000,000 | $100 |

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk + Cloudflare Workers](https://clerk.com/docs/deployments/clerk-edge)
- [Clerk Pricing](https://clerk.com/pricing)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
