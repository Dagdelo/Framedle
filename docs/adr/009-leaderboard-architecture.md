# ADR-009: Leaderboard Architecture — Redis Sorted Sets

**Status**: Accepted
**Date**: 2025-02-22
**Deciders**: Core team
**Category**: Data Architecture

## Context

Framedle needs leaderboards across multiple dimensions:

- **Per-mode, per-day**: "Who scored highest on today's Daily Frame?"
- **Weekly aggregate**: "Who had the best week across all daily games?"
- **All-time**: "Who has the most cumulative XP?"
- **Friends**: "How do I compare to people I know?"
- **Country**: "How do I rank in my country?"

Requirements:
1. O(log N) rank queries (get user's rank among potentially millions)
2. O(log N) score insertion (add score after game completion)
3. Top-N retrieval (show top 100 efficiently)
4. Low latency (<50ms for rank lookups)
5. Automatic TTL-based cleanup for daily/weekly boards
6. Cost-effective at scale

## Options Considered

### Option A: PostgreSQL Only

- `ORDER BY score DESC` with `ROW_NUMBER()`
- Familiar, no additional infrastructure
- O(N log N) for rank calculation on large tables
- Poor performance at >100K rows per query
- No natural TTL mechanism
- Would bottleneck Neon compute units

### Option B: Redis Sorted Sets ✅ Selected

- `ZADD` / `ZREVRANK` / `ZREVRANGE` — purpose-built for ranking
- O(log N) for all operations
- Built-in TTL on keys (perfect for daily/weekly expiry)
- Upstash Redis: serverless, REST API, edge-compatible
- Separated from primary database (no query contention)

### Option C: Dedicated Leaderboard Service (e.g., GameSparks, Nakama)

- Full-featured game backend
- Overkill for leaderboards alone
- Vendor lock-in to gaming infrastructure
- Additional cost and complexity
- Reduces architectural flexibility

### Option D: Cloudflare KV

- Simple key-value storage
- No sorted set operations (would need manual sorting)
- Eventually consistent (not ideal for real-time rankings)
- Good for caching, bad for leaderboards

## Decision

**Redis Sorted Sets via Upstash** — purpose-built data structure for ranking workloads. O(log N) for all operations, natural TTL for temporal boards, and Upstash's REST API works natively from Cloudflare Workers without persistent connections.

## Key Design

### Namespace Convention

```
lb:{mode}:{period}:{scope}

Examples:
lb:daily_frame:2025-02-22           → Daily Frame scores for Feb 22
lb:daily_frame:week:2025-W08        → Weekly aggregate for week 8
lb:alltime:xp                       → All-time XP leaderboard
lb:daily_frame:2025-02-22:country:BR → Brazil-specific daily board
lb:duels:elo                        → Duel ELO rankings
```

### Score Insertion (on game completion)

```typescript
// In the game completion handler:
async function recordScore(userId: string, mode: string, score: number) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `lb:${mode}:${today}`;

  // ZADD with NX — only set if no existing score (one play per day)
  // Or GT — only update if new score is greater
  await redis.zadd(key, { score, member: userId });

  // Set TTL: daily boards expire after 7 days
  await redis.expire(key, 7 * 24 * 60 * 60);

  // Update all-time XP board
  await redis.zincrby('lb:alltime:xp', score, userId);
}
```

### Rank Retrieval

```typescript
// Get user's rank and surrounding players
async function getUserRank(userId: string, mode: string, date: string) {
  const key = `lb:${mode}:${date}`;

  // Get rank (0-indexed)
  const rank = await redis.zrevrank(key, userId);
  if (rank === null) return null;

  // Get surrounding players (5 above, 5 below)
  const start = Math.max(0, rank - 5);
  const end = rank + 5;
  const surrounding = await redis.zrevrange(key, start, end, {
    withScores: true,
  });

  // Get total participants
  const total = await redis.zcard(key);

  return { rank: rank + 1, total, surrounding };
}

// Get top N
async function getTopPlayers(mode: string, date: string, limit = 100) {
  const key = `lb:${mode}:${date}`;
  return redis.zrevrange(key, 0, limit - 1, { withScores: true });
}
```

### Weekly Aggregation

A scheduled Cloudflare Worker runs Sunday midnight UTC:

```typescript
// Cron trigger: 0 0 * * 0 (every Sunday)
async function aggregateWeekly(mode: string) {
  const isoWeek = getISOWeek(new Date());
  const weekKey = `lb:${mode}:week:${isoWeek}`;

  // Get all daily keys for this week
  const days = getLast7Days();
  for (const day of days) {
    const dayKey = `lb:${mode}:${day}`;
    // ZUNIONSTORE with AGGREGATE SUM
    await redis.zunionstore(weekKey, [weekKey, dayKey], {
      aggregate: 'SUM',
    });
  }

  // TTL: weekly boards expire after 30 days
  await redis.expire(weekKey, 30 * 24 * 60 * 60);

  // Snapshot top 100 to Neon for historical records
  const top100 = await redis.zrevrange(weekKey, 0, 99, {
    withScores: true,
  });
  await db.insert(leaderboardSnapshots).values({
    period: `weekly:${isoWeek}`,
    mode,
    rankings: top100,
  });
}
```

### Friends Leaderboard

Friends boards are computed client-side by filtering:

```typescript
// Client fetches friend IDs from Clerk social connections
const friendIds = await clerk.user.getSocialConnections();

// For each friend, batch-fetch their scores
const friendScores = await api.get('/leaderboard/friends', {
  params: { userIds: friendIds, mode, date },
});
// Returns scores for only those users from the sorted set
```

Server implementation uses `ZSCORE` for each friend (batch via pipeline):

```typescript
async function getFriendScores(friendIds: string[], mode: string, date: string) {
  const key = `lb:${mode}:${date}`;
  const pipeline = redis.pipeline();
  for (const id of friendIds) {
    pipeline.zscore(key, id);
  }
  const scores = await pipeline.exec();
  return friendIds
    .map((id, i) => ({ userId: id, score: scores[i] }))
    .filter(f => f.score !== null)
    .sort((a, b) => b.score - a.score);
}
```

### Duel ELO

Duels use a separate ELO-based ranking:

```
K-factor: 32 (standard for new rating systems)
Initial ELO: 1000

After match:
  expected_a = 1 / (1 + 10^((elo_b - elo_a) / 400))
  new_elo_a = elo_a + K * (result - expected_a)
  // result: 1.0 for win, 0.5 for draw, 0.0 for loss
```

Stored in `lb:duels:elo` sorted set (no TTL — persistent ranking).

## TTL Strategy

| Board Type | TTL | Rationale |
|------------|-----|-----------|
| Daily | 7 days | Keep a week of history |
| Weekly | 30 days | Keep a month of history |
| All-time XP | None | Permanent |
| Duel ELO | None | Permanent |
| Country (daily) | 7 days | Same as daily |

Expired boards are automatically cleaned up by Redis. Historical records survive in `leaderboard_snapshots` table in Neon.

## Consequences

### Positive

- Sub-10ms rank lookups (Redis in-memory + Upstash edge)
- Natural fit for temporal leaderboards (TTL-based cleanup)
- No database query contention (leaderboard ops are Redis-only)
- Scales to millions of entries with O(log N) operations
- Upstash REST API works from CF Workers without TCP connections

### Negative

- Additional infrastructure component (Redis alongside Neon)
- Data in Redis is ephemeral (mitigated by Neon snapshots)
- Friends board requires N Redis calls (mitigated by pipeline batching)
- Upstash free tier: 10K commands/day (need paid plan at scale)

### Cost Estimate

| DAU | Daily Commands | Upstash Cost |
|-----|---------------|-------------|
| 1K | ~5K | $0 (free tier) |
| 10K | ~50K | $10/mo |
| 50K | ~250K | $30/mo |
| 100K | ~500K | $50/mo |

## References

- [Redis Sorted Sets](https://redis.io/docs/data-types/sorted-sets/)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Building Game Leaderboards with Redis](https://redis.com/solutions/use-cases/leaderboards/)
- [ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system)
