# Linear Project Setup

This document describes how to configure the Linear workspace for Framedle. All steps are manual — API integration is a separate future task.

## 1. Team Setup

Create a team named **Framedle** with identifier `FRA`.

Settings:
- Timezone: match your local timezone
- Issue IDs: enable sequential IDs (FRA-1, FRA-2, …)
- Default priority: Medium
- Estimation: Story points (Fibonacci)

## 2. Projects

Create the following projects under the Framedle team. Each project maps to a phase from `roadmap.md`.

| Project        | Identifier | Description                                    |
| -------------- | ---------- | ---------------------------------------------- |
| Foundation     | FRA        | Monorepo, infra, CI/CD, auth, database         |
| Game Modes     | GAME       | All 12 game modes, game logic, game UI         |
| Users & Social | USER       | Profiles, friends, social sharing, comments    |
| Leaderboards   | LEAD       | Daily/weekly/all-time rankings, XP system      |
| Multiplayer    | DUEL       | Real-time duels, matchmaking, spectating       |
| Native Apps    | NATIVE     | Tauri desktop + mobile builds                  |
| Operations     | OPS        | Monitoring, analytics, content pipeline, i18n  |

## 3. Label Taxonomy

Create the following labels in the Framedle team. Labels are shared across all projects.

### Domain Labels

| Label       | Color suggestion | Purpose                                      |
| ----------- | ---------------- | -------------------------------------------- |
| infra       | #6B7280 (gray)   | Infrastructure, Docker, VPS, networking      |
| dx          | #8B5CF6 (purple) | Developer experience, tooling, scripts       |
| frontend    | #3B82F6 (blue)   | React components, UI logic                   |
| backend     | #10B981 (green)  | Server-side code, Node.js, Hono              |
| api         | #F59E0B (amber)  | API endpoints, request/response contracts    |
| game-logic  | #EF4444 (red)    | Core game state machines, rules, scoring     |
| game-mode   | #F97316 (orange) | Individual game mode implementations         |
| game-ui     | #EC4899 (pink)   | Game-specific UI components                  |
| auth        | #14B8A6 (teal)   | Authentication, sessions, Logto/Clerk        |
| database    | #6366F1 (indigo) | PostgreSQL schema, migrations, Drizzle ORM   |
| storage     | #84CC16 (lime)   | R2/Garage object storage                     |
| pipeline    | #0EA5E9 (sky)    | yt-dlp/ffmpeg frame extraction pipeline      |
| search      | #A855F7 (violet) | Full-text search, indexing                   |
| redis       | #EF4444 (red)    | Valkey/Redis cache, pub/sub                  |
| social      | #F43F5E (rose)   | Sharing, friends, activity feeds             |
| platform    | #64748B (slate)  | Cross-platform (web, desktop, mobile)        |
| monitoring  | #22C55E (green)  | Prometheus, Grafana, alerting                |
| analytics   | #06B6D4 (cyan)   | Usage tracking, funnel analysis              |
| a11y        | #D97706 (amber)  | Accessibility                                |
| i18n        | #7C3AED (violet) | Internationalization, translations           |
| performance | #DC2626 (red)    | Latency, bundle size, query optimisation     |
| content     | #16A34A (green)  | Video content, metadata curation             |
| design      | #DB2777 (pink)   | Visual design, Figma, design tokens          |
| release     | #1D4ED8 (blue)   | Release management, versioning               |
| engagement  | #D97706 (amber)  | Retention, streaks, notifications            |
| realtime    | #0891B2 (cyan)   | WebSockets, live updates                     |

### Type Labels (optional, use if not using Linear issue types)

| Label   | Purpose                     |
| ------- | --------------------------- |
| bug     | Something is broken         |
| feature | New functionality           |
| chore   | Maintenance, refactoring    |
| docs    | Documentation only          |
| spike   | Research / proof of concept |

## 4. Priority Mapping

Linear's four priority levels map to the following Framedle conventions:

| Linear Priority | When to use                                             |
| --------------- | ------------------------------------------------------- |
| Urgent          | Blocking production or blocking other issues            |
| High            | Core path for the current phase; must ship this week    |
| Medium          | Default; planned for the current phase                  |
| Low             | Nice-to-have; deferred to a later phase or backlog      |

## 5. Issue Import Strategy

Issues are defined in `docs/project-management/linear-issues.md` (50 issues, 226 story points across 7 epics). Import them manually in epic order:

1. Open `linear-issues.md`.
2. For each issue, create a Linear issue with:
   - **Title**: as written
   - **Project**: matching epic (FRA → Foundation, GAME → Game Modes, etc.)
   - **Labels**: from the "Labels" column
   - **Estimate**: story points from the "SP" column
   - **Priority**: derived from phase order (Phase 1–2 issues → High, Phase 3–4 → Medium, Phase 5–7 → Low)
3. Link blocking relationships using Linear's "blocking / blocked by" relation.

## 6. Workflow States

Use the default Linear workflow states per project:

| State       | Meaning                                      |
| ----------- | -------------------------------------------- |
| Backlog     | Not yet scheduled                            |
| Todo        | Scheduled for current cycle                  |
| In Progress | Actively being worked on                     |
| In Review   | PR open, awaiting review                     |
| Done        | Merged and deployed                          |
| Cancelled   | Will not be implemented                      |

## 7. Cycles (Sprints)

Configure 1-week cycles starting on Monday. Each roadmap phase spans roughly 4 cycles.

## 8. GitHub Integration

In Linear → Settings → Integrations → GitHub:
- Connect the `framedle` GitHub repository.
- Enable: auto-close issues on PR merge, branch name from issue ID.
- Branch naming convention: `FRA-{id}/{short-description}` (e.g. `FRA-1/monorepo-setup`).

## 9. Slack / Notification Integration (optional)

Connect Linear to a team Slack workspace for issue update notifications. Configure per-project channels if desired.

## 10. Future: Linear API Integration

A future task will automate issue sync via the Linear GraphQL API. The planned approach:

- Use `@linear/sdk` (official TypeScript client).
- Script: `scripts/sync-linear-issues.ts` — reads `linear-issues.md`, diffs against Linear API, creates/updates issues.
- Run manually or as a one-time migration; not continuous sync.
