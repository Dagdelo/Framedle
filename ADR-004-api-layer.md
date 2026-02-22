# ADR-004: API Layer — Hono on Cloudflare Workers

**Status**: Accepted | **Date**: 2025-02-22 | **Category**: Backend

## Context
Need a lightweight API framework that deploys to edge, handles JWT auth, and integrates natively with R2 and Durable Objects.

## Options Considered

| Criteria | Express (Node) | Hono (CF Workers) ✅ | tRPC | Fastify |
|----------|---------------|---------------------|------|---------|
| Edge deployment | ❌ | ✅ Native | ⚠️ Adapter | ❌ |
| Cold start | ~200ms | **<1ms** | Depends | ~150ms |
| R2 integration | HTTP call | **Native binding** | HTTP call | HTTP call |
| Type safety | Manual | Good | **Excellent** | Manual |
| WebSocket | Socket.io | Durable Objects | ❌ | ws |
| Bundle size | Large | **~14KB** | Medium | Medium |

## Decision

**Hono** on Cloudflare Workers. Sub-millisecond cold starts, native R2/KV/DO bindings, excellent middleware system, and a bundle size measured in kilobytes. Pairs perfectly with our edge-first architecture.

## Implementation Notes

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clerkMiddleware } from './middleware/auth';
import { gameRoutes } from './routes/game';
import { leaderboardRoutes } from './routes/leaderboard';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());
app.use('/api/*', clerkMiddleware());
app.route('/api/game', gameRoutes);
app.route('/api/leaderboard', leaderboardRoutes);

export default app;
```

Durable Objects for Duels are co-located in the same Workers project but run as separate isolates per match.
