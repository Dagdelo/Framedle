# docs/ — Agent Guide

## Purpose

The `docs/` directory is the **single source of truth** for all Framedle architecture, design, and project management decisions. When there is a conflict between code comments and documentation, the documentation wins.

---

## Directory Structure

```
docs/
├── project-overview.md              # Vision, goals, target audience, success metrics
├── architecture/
│   ├── system-architecture.md       # System design, monorepo structure, API endpoints
│   ├── tech-stack.md                # Technology choices and rationale
│   ├── database-schema.md           # Full PostgreSQL schema with Drizzle mappings
│   ├── vps-deployment.md            # Hostinger KVM2 + Coolify setup, RAM budget
│   ├── cost-analysis.md             # Free tier ceilings, cost projections by DAU
│   └── test-strategy.md             # Test layers: Vitest (unit+integration), Playwright (E2E)
├── game-design/
│   ├── game-modes.md                # All 12 game modes with rules and frame requirements
│   └── game-mechanics.md            # Scoring, XP, streaks, achievements, daily lock
├── adr/
│   ├── 001-tauri-over-electron.md
│   ├── 002-auth-provider.md
│   ├── 003-storage-r2.md
│   ├── 004-api-framework.md
│   ├── 005-game-engine-architecture.md
│   ├── 006-realtime-versus.md
│   ├── 007-content-pipeline.md
│   ├── 008-anonymous-identity.md
│   └── 009-leaderboard-architecture.md
├── legal/
│   └── privacy-policy.md
└── project-management/
    ├── roadmap.md                   # 28-week phased delivery plan
    └── linear-issues.md             # 50 issues, 226 story points
```

---

## Source of Truth by Topic

| Topic | Authoritative document |
|-------|----------------------|
| What is Framedle? | `project-overview.md` |
| Game modes and rules | `game-design/game-modes.md` |
| Scoring, XP, streaks | `game-design/game-mechanics.md` |
| System architecture, API endpoints | `architecture/system-architecture.md` |
| Why a technology was chosen | `architecture/tech-stack.md` or the relevant ADR |
| Database tables and columns | `architecture/database-schema.md` |
| VPS setup, Coolify, RAM budget | `architecture/vps-deployment.md` |
| Cost projections | `architecture/cost-analysis.md` |
| Test structure and coverage targets | `architecture/test-strategy.md` |
| Any major architectural choice | `adr/NNN-*.md` — read the ADR before changing the decision |
| Delivery timeline | `project-management/roadmap.md` |
| Issue tracking | `project-management/linear-issues.md` |

---

## Mermaid Diagram Conventions

Architecture docs use **ASCII diagrams** rather than Mermaid (no external rendering dependency, renders correctly in any Markdown viewer). When adding diagrams:

- Use box-drawing characters (`┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼`) for component boxes
- Use `→` for data flow arrows
- Label every box with the service name and port where applicable
- Keep diagrams within 80-character line width where possible
- Place diagrams immediately after the heading they illustrate

If Mermaid is used in future, render it in the browser via `mermaid.js` or in GitHub's native Mermaid support. Do not add a build step for diagram generation.

---

## Cross-Reference Rules (Single Source of Truth)

1. **Do not duplicate decisions** — if the system architecture is documented in `architecture/system-architecture.md`, do not re-state it in code comments or other docs. Link instead.
2. **Link, don't copy** — use relative Markdown links: `[system architecture](architecture/system-architecture.md)`.
3. **ADRs are immutable records** — once an ADR is written and a decision is made, do not edit it retroactively. If the decision changes, write a new ADR that supersedes the old one and add a note at the top of the old ADR pointing to the new one.
4. **Update docs before code** — when a significant architectural change is made, update the relevant doc (or ADR) in the same commit as the code change.
5. **AGENTS.md files are a navigation layer** — they summarize and link to authoritative docs. They should not contain canonical facts that belong in the architecture docs.

---

## ADR Format

Each ADR in `docs/adr/` follows this structure:

```markdown
# ADR-NNN: Title

## Status
Accepted | Superseded by ADR-NNN

## Context
What problem were we solving? What constraints existed?

## Decision
What did we decide to do?

## Consequences
What are the trade-offs? What becomes easier or harder?
```

ADRs are numbered sequentially. The next ADR to write is `010-*.md`.

When an ADR is superseded, add this line at the top of the old ADR:

```markdown
> **Superseded by [ADR-NNN](NNN-new-decision.md)**
```
