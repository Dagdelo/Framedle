---
name: pr
description: Create a pull request from development to main following the Framedle git flow. Always push to development first, then open a PR to main.
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash, Read, Grep
argument-hint: [pr-title-or-description]
---

# Framedle Pull Request Skill

Create a pull request following the Framedle git flow: development → PR → main.

## Git Flow

```
feature work → commit to development → push → open PR to main → review → merge
```

- `main` — Production branch. Only receives code via merged PRs.
- `development` — Integration branch. All work lands here first.
- Never push directly to `main`.

## Steps

1. **Verify branch**: Confirm you're on `development`. If not, abort with a warning.
2. **Check clean state**: Run `git status` — warn if uncommitted changes exist.
3. **Push to remote**: `git push -u origin development`
4. **Analyze changes**: Run `git log main..development --oneline` and `git diff main...development --stat` to understand all changes since main.
5. **Draft PR**:
   - Title: short (<70 chars), describes the milestone/feature
   - Body: Summary bullets + test plan
6. **Create PR**:
   ```bash
   gh pr create --base main --head development --title "title" --body "$(cat <<'EOF'
   ## Summary
   - bullet points

   ## Test Plan
   - [ ] tests pass
   - [ ] local validation
   EOF
   )"
   ```
7. **Return the PR URL** to the user.

## PR Body Format

```markdown
## Summary
<1-5 bullet points describing what changed and why>

## Changes
<grouped by area: API, Web, Packages, Tests, Docs>

## Test Plan
- [ ] All unit tests pass (`pnpm test`)
- [ ] Local dev server runs (`pnpm dev`)
- [ ] <specific manual checks>

## Version
<current version from package.json>
```

## Argument Handling

If `$ARGUMENTS` is provided, use it as the PR title/description context.
If no arguments, analyze the commit log to generate the PR summary.
