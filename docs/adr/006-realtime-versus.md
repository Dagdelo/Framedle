# ADR-006: Real-time Infrastructure — Cloudflare Durable Objects

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Real-time

## Context

Duels mode requires real-time bidirectional communication between two players with:

- Sub-100ms message delivery
- Server-authoritative state (no client trust)
- Per-match state isolation (one match cannot affect another)
- Automatic cleanup when matches end
- Managed infrastructure (no WebSocket servers to maintain)

## Options Considered

| Criteria | Socket.io + Server | CF Durable Objects ✅ | Ably/Pusher | PartyKit |
|----------|-------------------|---------------------|------------|---------|
| Latency | ~50-100ms | **~20-40ms (edge)** | ~50-80ms | ~30-50ms |
| Infrastructure | Self-hosted server | **Fully managed** | Managed | Managed |
| Cost model | Server time (always on) | Per-request (scale to 0) | Per-message | Per-connection |
| State isolation | Manual (rooms) | **Per-object (automatic)** | Manual | Per-room |
| CF integration | External | **Native** | External | External (CF-based) |
| Scale-to-zero | ❌ | ✅ | ✅ | ✅ |
| Server-side logic | Full control | **Full control** | Limited (webhooks) | Full control |
| Max connections | Depends on server | 32K per DO | Tier-based | Room-based |

## Decision

**Cloudflare Durable Objects** — each Duel match is a single Durable Object with its own WebSocket connections, state, and lifecycle. Automatic geographic placement near the first player. Native integration with our existing CF Workers API. Zero infrastructure management.

PartyKit was a close second (also built on CF), but Durable Objects give us more control and avoid an additional vendor dependency since we're already on Cloudflare.

## Architecture

```
                    Hono API Worker
                         │
           ┌─────────────┴──────────────┐
           │                            │
    POST /api/duel/queue         POST /api/duel/invite
    (matchmaking)                (friend invite)
           │                            │
           └──────────┬─────────────────┘
                      │
              Creates/routes to
                      │
                      ▼
    Player A ──WS──→ ┌──────────────────────┐ ←──WS── Player B
                     │  Durable Object:      │
                     │  DuelMatch-{matchId}   │
                     │                       │
                     │  State:               │
                     │  ├─ players[]          │
                     │  ├─ currentRound (1-5) │
                     │  ├─ rounds[]           │
                     │  ├─ timer (30s)        │
                     │  ├─ frameData          │
                     │  └─ status             │
                     │                       │
                     │  Lifecycle:            │
                     │  waiting → countdown   │
                     │  → round → intermission│
                     │  → ... → result        │
                     │  → cleanup (auto-destroy)│
                     └──────────────────────┘
```

### Match State Machine

```
waiting (1 player connected)
  → PLAYER_JOINED → countdown (both connected)
  → TIMEOUT (30s) → abandoned

countdown (3-second countdown)
  → COUNTDOWN_DONE → round

round (frame shown, both players guessing)
  → GUESS (player A or B submits)
    → validate guess server-side
    → if correct: record time, wait for other player or timeout
  → BOTH_ANSWERED → intermission (show round result)
  → TIMEOUT (30s) → intermission (no answer = loss for that round)

intermission (3 seconds, show round result)
  → NEXT_ROUND [rounds < best_of] → round
  → MATCH_OVER [winner determined] → result

result (show final scores)
  → REMATCH_REQUESTED → waiting (new match with same players)
  → DISCONNECT → cleanup

cleanup
  → Save match result to Neon
  → Update leaderboards (Redis)
  → Update ELO ratings
  → Durable Object hibernates (auto-destroyed after inactivity)
```

### Anti-Latency-Cheat

Both players' guesses are timestamped server-side within the Durable Object:

```typescript
// Inside DuelMatch Durable Object:
handleGuess(playerId: string, guess: string) {
  const serverTimestamp = Date.now(); // DO-local timestamp
  const roundStartTime = this.state.currentRound.startedAt;
  const responseTime = serverTimestamp - roundStartTime;

  // Both players' response times are measured by the same clock
  // No client timestamps are trusted
  this.state.currentRound.guesses.push({
    playerId,
    guess,
    responseTimeMs: responseTime,
    correct: this.validateGuess(guess),
  });
}
```

## Consequences

### Positive

- ~20-40ms latency (edge deployment, same region as players)
- Per-match isolation — bugs in one match can't affect others
- Single-threaded consistency — no race conditions in state transitions
- Scale-to-zero — no cost when no matches are active
- Automatic geographic placement — DO spawns near the first connecting player
- Hibernation API — long-lived connections with zero idle cost

### Negative

- 10ms CPU time limit per message (sufficient for game logic)
- Max 32K WebSocket connections per DO (far beyond our needs)
- Learning curve for Durable Object programming model
- Migration complexity if we ever leave Cloudflare

### Mitigations

- Game logic per message is lightweight (validate guess, update state) — well under 10ms
- Each match has exactly 2 connections — 32K limit is irrelevant
- DO programming model is well-documented with growing community
- Core game logic is in `packages/game-engine` (portable TypeScript) — only the WebSocket/state layer is DO-specific

## References

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Durable Objects WebSocket API](https://developers.cloudflare.com/durable-objects/api/websockets/)
- [Durable Objects Hibernation](https://developers.cloudflare.com/durable-objects/reference/hibernate-state/)
