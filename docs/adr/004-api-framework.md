# ADR-004: API Layer — Hono on Cloudflare Workers

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Backend

## Context

Need a lightweight API framework that:

- Deploys to edge (300+ global locations)
- Handles JWT auth verification
- Integrates natively with R2 (object storage) and Durable Objects (WebSocket)
- Supports typed route definitions for client generation
- Has sub-second cold starts for game responsiveness

## Options Considered

| Criteria | Express (Node) | Hono (CF Workers) ✅ | tRPC | Fastify |
|----------|---------------|---------------------|------|---------|
| Edge deployment | ❌ Requires server | ✅ Native | ⚠️ Adapter needed | ❌ Requires server |
| Cold start | ~200ms | **<1ms** | Depends on host | ~150ms |
| R2 integration | HTTP call | **Native binding** | HTTP call | HTTP call |
| Durable Objects | ❌ | ✅ Co-located | ❌ | ❌ |
| Type safety | Manual | Good (zod-openapi) | **Excellent** (end-to-end) | Manual |
| WebSocket | Socket.io | Durable Objects | ❌ | ws |
| Bundle size | Large (Express + deps) | **~14KB** | Medium | Medium |
| Middleware | Extensive ecosystem | Growing, sufficient | N/A | Good |

## Decision

**Hono on Cloudflare Workers** — sub-millisecond cold starts, native R2/KV/Durable Object bindings, and a bundle size measured in kilobytes. The typed client generation (`hono/client`) gives us most of tRPC's benefits without the framework coupling.

## Implementation

### API Structure

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limit';
import { gameRoutes } from './routes/game';
import { leaderboardRoutes } from './routes/leaderboard';
import { userRoutes } from './routes/user';
import { duelRoutes } from './routes/duel';
import { shareRoutes } from './routes/share';

type Env = {
  CONTENT_BUCKET: R2Bucket;
  GAME_KV: KVNamespace;
  DUEL_MATCH: DurableObjectNamespace;
  DATABASE_URL: string;
  CLERK_JWT_KEY: string;
  UPSTASH_REDIS_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors());
app.use('/api/*', clerkMiddleware());
app.use('/api/*', rateLimiter());

// Routes
app.route('/api/game', gameRoutes);
app.route('/api/leaderboard', leaderboardRoutes);
app.route('/api/user', userRoutes);
app.route('/api/duel', duelRoutes);
app.route('/api/share', shareRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', region: c.req.cf?.colo }));

export default app;

// Co-located Durable Object
export { DuelMatch } from './durable-objects/duel-match';
```

### R2 Direct Access (no HTTP overhead)

```typescript
// In game route handler:
app.get('/api/game/:mode/frame/:frameId', async (c) => {
  const r2Path = await getFramePath(c.get('gameSession'), c.req.param('frameId'));

  // Direct R2 binding — no HTTP call
  const object = await c.env.CONTENT_BUCKET.get(r2Path);
  if (!object) return c.notFound();

  // Generate signed URL for client
  const signedUrl = await generateSignedUrl(r2Path, 3600); // 1h TTL
  return c.json({ url: signedUrl });
});
```

### Typed Client Generation

```typescript
// Server exports route types:
export type AppType = typeof app;

// Client imports and gets full type safety:
import { hc } from 'hono/client';
import type { AppType } from '@framedle/api';

const client = hc<AppType>('https://api.framedle.wtf');
// client.api.game[':mode'].daily.$get() — fully typed
```

## Consequences

### Positive

- <1ms cold starts — game feels instant
- Native R2 binding — no HTTP overhead for frame serving
- Durable Objects co-located in same Workers project — unified deployment
- ~14KB bundle — fast deploy, low memory
- OpenAPI schema generation via `@hono/zod-openapi`
- Typed client eliminates API contract drift

### Negative

- Cloudflare Workers runtime limitations (no Node.js APIs, 128MB memory, 30s CPU time)
- Smaller middleware ecosystem than Express
- Workers-specific APIs (R2 bindings, DO) create platform coupling
- 10ms CPU time limit on free tier (need paid for complex operations)

### Mitigations

- Heavy computation (image processing) stays in the pipeline, not Workers
- Database operations use Neon's serverless driver (HTTP-based, no TCP needed)
- Workers paid plan ($5/mo) removes CPU time restrictions
- Platform coupling is acceptable — we're already all-in on Cloudflare for R2, CDN, and DO

## Status Update (2026-02-28)

The deployment strategy has evolved since this ADR was written. Hono is still the chosen API framework, but it runs on **Node.js on the VPS** rather than Cloudflare Workers.

**What changed:**
- **Runtime**: Hono on Node.js (VPS) instead of Hono on Cloudflare Workers. Hono is runtime-agnostic and the framework evaluation still fully applies — typed routes, zod-openapi, `hono/client` typed client generation, middleware ecosystem.
- **R2 binding → S3 API**: The `CONTENT_BUCKET: R2Bucket` native Workers binding becomes standard S3 API calls via `@aws-sdk/client-s3` (R2 is S3-compatible). No HTTP overhead concern at VPS scale.
- **Durable Objects → ws library + Valkey state**: The `DUEL_MATCH: DurableObjectNamespace` binding for WebSocket match state is replaced by the `ws` npm library embedded in the Hono Node.js process, with match state held in memory and persisted to PostgreSQL on completion. Valkey (Redis-compatible) handles session locks and leaderboard state.
- **KV namespace → Valkey**: `GAME_KV: KVNamespace` becomes Valkey (self-hosted Redis-compatible cache) accessed via `ioredis`.
- **Cold starts**: The <1ms cold start advantage of Workers does not apply on Node.js, but the VPS runs a persistent process so there are no cold starts at all.
- **CPU limits**: The 10ms/30s Workers CPU limits do not apply. Node.js on VPS has no invocation CPU cap.

The `Env` type block in the Implementation section above reflects the Workers binding API and should be read as illustrative. The VPS equivalent uses environment variables and `ioredis`/S3 SDK clients initialized at process start.

**Migration path**: If traffic outgrows the VPS, the Hono app can be redeployed to Cloudflare Workers with minimal changes — swap `ioredis` for Upstash REST client, swap S3 SDK for native R2 bindings, swap `ws` for Durable Objects. The core route logic is identical.

## References

- [Hono Documentation](https://hono.dev)
- [Hono Client](https://hono.dev/docs/guides/rpc)
- [Hono — Node.js adapter](https://hono.dev/docs/getting-started/nodejs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [VPS Deployment — WebSocket for Duels](../architecture/vps-deployment.md)
