# ADR-006: Real-time Infrastructure — Cloudflare Durable Objects

**Status**: Accepted | **Date**: 2025-02-22 | **Category**: Real-time

## Context
Duels mode requires real-time bidirectional communication between two players. Need WebSocket support with server-authoritative state and low latency.

## Options Considered

| Criteria | Socket.io + Server | CF Durable Objects ✅ | Ably/Pusher | PartyKit |
|----------|-------------------|---------------------|------------|---------|
| Latency | ~50-100ms | **~20-40ms (edge)** | ~50-80ms | ~30-50ms |
| Infra mgmt | Self-hosted | **Fully managed** | Managed | Managed |
| Cost model | Server time | Per-request | Per-message | Per-conn |
| State isolation | Manual | **Per-object (automatic)** | Manual | Per-room |
| CF integration | External | **Native** | External | External |
| Scale-to-zero | ❌ | ✅ | ✅ | ✅ |

## Decision

**Cloudflare Durable Objects** — each Duel match is a single Durable Object with its own WebSocket connections, state, and lifecycle. Automatic geographic placement near the first player. Native integration with our existing CF Workers API.

## Architecture

```
Player A ──WebSocket──→ ┌─────────────────────┐ ←──WebSocket── Player B
                        │  Durable Object:    │
                        │  DuelMatch-{matchId} │
                        │                     │
                        │  State:             │
                        │  - players[]        │
                        │  - rounds[]         │
                        │  - currentRound     │
                        │  - timer            │
                        │  - frameData        │
                        └─────────────────────┘
```

Each match object handles: countdown, frame distribution, guess validation, round scoring, timeout handling, and match completion — all in a single-threaded, strongly consistent context.
