---
name: commit
description: Create conventional commits following Framedle project standards. Use after completing a successful iteration of work.
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
argument-hint: [description-of-changes]
---

# Framedle Commit Skill

Create conventional commits following Framedle project conventions. Always commit after a successful iteration of work.

## Commit Format

```
type(scope): subject

body (optional, for multi-line context)
```

### Types
- `feat` — New feature or capability
- `fix` — Bug fix
- `docs` — Documentation only
- `chore` — Build, deps, config, tooling
- `refactor` — Code restructuring (no behavior change)
- `test` — Adding or updating tests
- `perf` — Performance improvement
- `style` — Formatting, whitespace (no logic change)
- `ci` — CI/CD workflow changes

### Scopes (Framedle-specific)
- `api` — apps/api/
- `web` — apps/web/
- `shared` — packages/shared/
- `game-engine` — packages/game-engine/
- `api-client` — packages/api-client/
- `ui` — packages/ui/
- `pipeline` — pipeline/
- `deps` — dependency updates
- No scope for cross-cutting changes

### Rules
- Subject: lowercase, imperative mood, no period, <72 chars
- Body: wrap at 72 chars, explain "why" not "what"
- One logical change per commit — split unrelated changes
- Never commit secrets (.env, credentials, API keys)
- Always use HEREDOC for multi-line messages

## Steps

1. Run `git status` and `git diff --cached --stat` to see staged changes
2. If nothing is staged, review `git diff` and stage relevant files by name (never `git add -A`)
3. Determine the correct type and scope from the changes
4. Draft a commit message following the format above
5. Commit using HEREDOC format:
   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): subject

   Optional body explaining why.
   EOF
   )"
   ```
6. Show the commit hash and summary

## Anti-patterns
- `update code` — too vague
- `fix stuff` — no specifics
- `WIP` — don't commit work-in-progress
- Mixing unrelated changes in one commit
- Using `git add .` or `git add -A`

## Argument Handling

If `$ARGUMENTS` is provided, use it as context for the commit message.
If no arguments, analyze the diff to determine the appropriate message.
