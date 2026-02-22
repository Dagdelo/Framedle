# ADR-005: Game State Management & Anti-Cheat

**Status**: Accepted | **Date**: 2025-02-22 | **Category**: Game Logic

## Context
Game state must be server-authoritative to prevent cheating, while feeling responsive on the client.

## Decision

### Dual-Layer State Architecture

**Client (Optimistic UI)**:
- XState v5 state machine per game mode
- Zustand store for global UI state
- Optimistic transitions — UI updates immediately on guess
- Rolled back if server disagrees

**Server (Source of Truth)**:
- Game session stored in Neon (games table)
- Each guess is a POST that returns the authoritative result
- Game completion triggers leaderboard write (Redis)
- Anti-cheat validation on every guess

### Anti-Cheat Measures

1. **Answers never on client**: API returns frame URLs but not answer metadata
2. **Game session HMAC**: `hash(userId + gameDate + mode + secret)` — must accompany all guesses
3. **Timing validation**: flag if correct answer arrives <500ms after frame URL request
4. **Frame URL obfuscation**: R2 paths use random UUIDs, not video IDs
5. **One-shot daily lock**: `SETNX game:{userId}:{date}:{mode} completed` in Redis
6. **Rate limiting**: max 1 guess per second per session

### State Machine Example (Daily Frame)

```
idle
  → LOAD_GAME → loading
loading
  → GAME_LOADED → guessing (attempt 1)
  → LOAD_ERROR → error
guessing
  → SUBMIT_GUESS → validating
validating
  → CORRECT → reveal (won)
  → INCORRECT [attempts < 6] → guessing (attempt N+1, new hint)
  → INCORRECT [attempts = 6] → reveal (lost)
reveal
  → SHARE → sharing
  → CLOSE → complete
```

## Consequences
- Slight latency on guess validation (50-100ms to edge worker)
- Mitigated by optimistic UI with rollback
- Eliminates all client-side cheating vectors
- Server costs minimal (stateless workers + Redis atomic ops)
