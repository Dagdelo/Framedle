# ADR-005: Game Engine — Server-Authoritative with Optimistic UI

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Game Logic

## Context

Game state must be server-authoritative to prevent cheating. In a guessing game, the answer is the most valuable piece of data — if it reaches the client before the game is complete, the game is trivially cheatable. At the same time, the game must feel responsive with no perceptible lag.

## Decision

### Dual-Layer State Architecture

**Client (Optimistic UI)**:
- XState v5 state machine per game mode — models all valid transitions
- Zustand store for global UI state (selected mode, user preferences, theme)
- Optimistic transitions — UI updates immediately on guess submission
- Rolled back if server disagrees (incorrect guess registered, but result differs)

**Server (Source of Truth)**:
- Game session stored in Neon (`daily_games` + `game_results` tables)
- Each guess is a `POST /api/game/:mode/guess` that returns the authoritative result
- Game completion triggers: leaderboard write (Redis), XP update (Neon), achievement check
- Anti-cheat validation runs on every guess submission

### State Machine (Daily Frame)

```
idle
  → LOAD_GAME → loading
loading
  → GAME_LOADED → guessing (attempt 1, show hint 1)
  → ALREADY_PLAYED → result (show previous result)
  → LOAD_ERROR → error
guessing
  → SUBMIT_GUESS → validating
validating
  → CORRECT → reveal (won)
  → INCORRECT [attempts < 6] → guessing (attempt N+1, show next hint)
  → INCORRECT [attempts = 6] → reveal (lost)
  → NETWORK_ERROR → guessing (retry available)
reveal
  → SHARE → sharing
  → VIEW_LEADERBOARD → leaderboard
  → CLOSE → complete
sharing
  → SHARED → reveal
  → CANCEL → reveal
complete
  → PLAY_NEXT_MODE → idle (different mode)
```

### Anti-Cheat Measures

| Measure | Implementation | Threat Mitigated |
|---------|---------------|-----------------|
| **Answers never on client** | API returns frame URLs + hint metadata but NOT video_id or title until game completion | Inspect network traffic |
| **Game session HMAC** | `HMAC-SHA256(userId + gameDate + mode + serverSecret)` — must accompany all guess submissions | Forge/replay requests |
| **Timing validation** | Flag if correct answer arrives <500ms after last frame URL was requested | Automated solving bots |
| **Frame URL obfuscation** | R2 paths use random UUIDs mapped via DB — not derivable from video metadata | Reverse-lookup from URL |
| **One-shot daily lock** | `SETNX game:{userId}:{date}:{mode}` in Redis — idempotent | Replay attacks |
| **Rate limiting** | Max 1 guess per second per session, 10 guesses per minute per user | Brute force |

### HMAC Session Flow

```typescript
// Server generates session token on game load:
function createGameSession(userId: string, date: string, mode: string): string {
  const data = `${userId}:${date}:${mode}`;
  return crypto.subtle.sign('HMAC', SECRET_KEY, new TextEncoder().encode(data));
}

// Client sends session token with every guess:
// POST /api/game/:mode/guess
// { gameToken: "abc123...", guess: "video title", timestamp: 1708600000 }

// Server validates:
function validateSession(token: string, userId: string, date: string, mode: string): boolean {
  const expected = createGameSession(userId, date, mode);
  return crypto.subtle.verify('HMAC', SECRET_KEY, token, expected);
}
```

### Timing Validation

The 500ms threshold is calibrated based on:
- Minimum human reading time for a frame: ~300ms (eye fixation + recognition)
- Minimum typing time for a guess: ~500ms (search-as-you-type with debounce)
- Network round-trip: ~50-100ms
- **Total minimum legitimate time: ~850ms**

Setting the threshold at 500ms between frame request and correct guess submission catches automated bots while allowing very fast human players.

Flagged submissions are not rejected but marked for review. Repeated flags on the same account trigger manual investigation.

## Consequences

### Positive

- Eliminates all client-side cheating vectors (no answer data in client)
- XState provides predictable, testable game flow (every transition is explicit)
- Optimistic UI means sub-50ms perceived response time
- Server validation is stateless (HMAC + Redis check) — scales horizontally

### Negative

- Slight latency on guess validation: 50-100ms round-trip to edge Worker
- Mitigated by optimistic UI with rollback (user sees instant feedback)
- Server costs: every guess = 1 Worker invocation + 1 Redis check + potentially 1 Neon write
- At 50K DAU: ~250K guess submissions/day → well within Workers free tier

## References

- [XState v5 Documentation](https://xstate.js.org/docs/)
- [Zustand](https://github.com/pmndrs/zustand)
- [HMAC Anti-Tamper Patterns](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
