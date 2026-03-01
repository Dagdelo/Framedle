# ADR-013: Logto Coolify Deployment

**Status**: Accepted
**Date**: 2026-03-01
**Deciders**: Core team
**Category**: Authentication & Infrastructure

## Context

With authentication integration defined (ADR-011), Logto must be deployed and running before any auth flows work end-to-end. The project runs on a single Hostinger KVM2 VPS (8 GB RAM, ~3.7 GB headroom after existing services) managed by Coolify. Two environments require auth isolation: production (`framedle.wtf`) and staging (`staging.framedle.wtf`), each with a separate Neon PostgreSQL branch.

The deployment decision covers:
1. **How to run Logto** on the VPS (container topology)
2. **Which database backend** to use per environment
3. **How to expose admin consoles** without leaking them on the application domain

## Decision

Deploy each Logto instance as a **Docker Image resource in Coolify**, one per environment, backed by Neon PostgreSQL direct endpoints:

- **Production**: `ghcr.io/logto-io/logto:1.37.1` at `auth.framedle.wtf`, admin at `logto-admin.hd5.dev`, Neon production branch
- **Staging**: `ghcr.io/logto-io/logto:1.37.1` at `auth-staging.framedle.wtf`, admin at `logto-admin-staging.hd5.dev`, Neon development branch
- Admin consoles restricted to `hd5.dev` infrastructure domain (matches existing Coolify API pattern)
- `TRUST_PROXY_HEADER=1` set for Traefik TLS termination

## Drivers

1. **Multi-environment isolation** — production and staging auth data must never share a database; Neon's branch-per-environment model provides this naturally
2. **Existing infrastructure** — no new servers; Logto must fit within the KVM2 RAM budget (~512 MB for both instances from ~3.7 GB headroom)
3. **Neon direct endpoint required** — Logto uses Slonik (session-mode queries); Neon's PgBouncer pooler breaks session semantics; must use direct non-pooler endpoints
4. **Admin console security** — admin panels must not be accessible via the application domain (`framedle.wtf`); infrastructure domain (`hd5.dev`) with Cloudflare IP allowlist is the existing pattern

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Docker Compose stack in Coolify | Env var changes require stop/start cycle (Coolify issue #4181); init containers add startup latency; overkill for a single-container service |
| Logto Cloud (managed) | ~$16/mo Pro plan cost; external data sovereignty concern for auth data; eliminates self-hosting cost advantage |
| Single Logto instance, multi-tenant isolation | Not possible — Logto OSS is single-tenant; no namespace or tenant isolation between environments |
| Dedicated VPS for Logto | Unnecessary cost; KVM2 has ~3.7 GB free headroom; Logto runs at ~256 MB RSS per instance |

## Why Chosen

Docker Image in Coolify is the simplest path that matches the existing deployment pattern (each service = one Coolify resource). Neon branches provide natural environment isolation at no extra cost. Coolify handles TLS termination via Traefik, health checks, and the redeploy API. The total RAM addition is ~512 MB for both instances, well within budget.

## Consequences

### Positive

- Consistent deployment model — same Coolify resource type as API and web app
- Environment isolation guaranteed — separate Logto instances, separate Neon databases, separate secrets
- Coolify handles Let's Encrypt, health checks, and rolling deploys without additional config
- Admin consoles on `hd5.dev` domain with Cloudflare IP allowlist — same security posture as existing Coolify API exposure
- Pinned image tag (`1.37.1`) prevents unintended upgrades

### Negative

- Social connectors must be configured manually per instance (no config export/import in Logto OSS)
- Logto version upgrades require manual `npx @logto/cli db alteration deploy latest` before deploying a new image tag
- Admin console multi-port routing (core :3001, admin :3002) may require separate Coolify resources or manual Traefik dynamic config if Coolify doesn't support two FQDNs per Docker Image resource
- Two Logto instances reduce the VPS headroom by ~512 MB

### Follow-ups

- Monitor VPS RAM after both instances are live; if headroom drops below 1 GB, consider Neon paid plan or upgrading to KVM4
- Add `npx @logto/cli db alteration deploy latest` as a pre-deploy step in CI/CD to automate schema migrations on version upgrades
- Script reproducible Logto configuration (applications, API resources, roles, webhooks) via Management API in `scripts/setup-logto.sh`
- Evaluate Logto Cloud migration if self-hosted maintenance burden becomes significant at scale

## References

- [Logto Docker deployment](https://docs.logto.io/docs/tutorials/get-started/)
- [Neon branch-per-environment](https://neon.tech/docs/guides/branching-intro)
- [ADR-002: Auth Provider](./002-auth-provider.md) — Logto vs Clerk evaluation
- [ADR-011: Auth Implementation](./011-auth-implementation.md) — OIDC integration patterns
- [ADR-012: CI/CD Pipeline](./012-ci-cd-pipeline.md) — Coolify deploy API usage
