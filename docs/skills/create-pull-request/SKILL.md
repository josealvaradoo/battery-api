---
name: create-pull-request
description: Push a feature or fix branch to the remote and open a pull request on GitHub following the project's git-workflow conventions. Use when the user asks to open, create, or submit a PR, or when a feature branch with committed work is ready to be merged.
---

# Create Pull Request

Push the current branch to the remote and open a GitHub pull request using `gh` or the GitHub API. PR title, body, and base branch follow the project's git-workflow conventions.

## When to use

Use this skill when:
- The user asks to "open a PR", "create a pull request", "submit a PR", or "push and open PR".
- A `feature/*` or `fix/*` branch has been committed locally and is ready for review.
- The user wants to merge work from a feature branch into `main`.

## Pre-flight checks

Before pushing, verify the branch is ready:

```bash
git status                          # must be clean
git log main..HEAD --oneline        # must have commits ahead of main
git branch --show-current           # must be feature/<name> or fix/<name>
```

If working tree is dirty, ask the user to commit or stash first. If there are no commits ahead of main, there is nothing to merge.

## How to use

### 1. Push the branch

```bash
git push -u origin $(git branch --show-current)
```

Use `-u` only on the first push for this branch. Subsequent pushes can use `git push`.

### 2. Gather PR context

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

Read the recent commit messages — they inform the PR title and the changelog. The diff stat shows which files changed and how much.

If a spec directory exists (e.g. `specs/NNN-name/`), read `spec.md` and `tasks.md` to understand the full scope. Reference it in the PR body as `refs specs/NNN-name/`.

### 3. Open the PR with `gh`

```bash
gh pr create \
  --base main \
  --head $(git branch --show-current) \
  --title "<type>: <short description>" \
  --body "<PR body>"
```

### 4. PR title format

Follow the same convention as commit messages (see `git-workflow` skill):

- English and lowercase
- Prefix: `feat:`, `fix:`, `refactor:`, `chore:`, or `docs:`
- Imperative verb, under 50 characters

**Examples:**
- `feat: add monthly profit historical data persistence`
- `fix: prevent empty emails from being sent`
- `refactor: split property domain into use case and types`

### 5. PR body template

Use this structure and fill every section. Remove lines that do not apply.

```markdown
## Summary

<1-3 bullet points describing what this PR does and why.>

## Changes

- <layer or area>: <change> (e.g. `domains: add history repository with dual-parsing flow`)
- <layer or area>: <change>

## Spec

`refs specs/NNN-name/` — link the related spec directory if one exists.

## Verification

- [ ] `bun run typecheck` passes (or `bunx tsc --noEmit`)
- [ ] `bun test` passes
- [ ] Manual smoke test via `docs/http/<resource>.http` (if applicable)
- [ ] `git-workflow` conventions followed (branch name, commit messages)
- [ ] `CHANGELOG.md` updated (if user-facing change)

## Notes

<Any breaking changes, migration steps, or follow-up work.>
```

### 6. Confirm and share

After `gh pr create` succeeds, report the PR URL to the user. If the user wants to set the PR as a draft, add `--draft` to the flags. If they want to auto-merge after CI, mention they can do that from the GitHub UI.

## Examples

### Example 1: Feature PR with spec

```bash
# Pre-flight
git status                          # clean
git log main..HEAD --oneline        # 8 commits
git branch --show-current           # feature/monthly-profit-historical-data

# Push and open
git push -u origin feature/monthly-profit-historical-data

gh pr create \
  --base main \
  --head feature/monthly-profit-historical-data \
  --title "feat: add monthly profit historical data" \
  --body "$(cat <<'EOF'
## Summary

- Persist all monthly property snapshots to SQLite via Drizzle ORM.
- Expose query endpoints for historical data (all, by period, by property).
- Add dashboard upload section for .xls/.xlsx files.
- The analysis flow continues to use only the last 3 months (CSV file).

## Changes

- storage: add Drizzle schema, client, and auto-migration on startup
- domains: add history repository with dual-parsing flow
- handlers: add getAll, getByPeriod, getByProperty endpoints with auth
- ui: add dashboard upload section with htmx

## Spec

refs specs/002-monthly-profit-historical-data/

## Verification

- [x] bunx tsc --noEmit passes
- [x] bun test passes (35/35)
- [x] Manual smoke test via docs/http/history.http
- [x] git-workflow conventions followed
- [x] CHANGELOG.md updated to 0.10.0

## Notes

- Zero new dependencies in production (drizzle-orm was user-approved)
- Migrations run programmatically on server startup for fly.io compatibility
EOF
)"
```

### Example 2: Bug fix PR

```bash
gh pr create \
  --base main \
  --head fix/empty-email-prevention \
  --title "fix: prevent sending emails with empty property list" \
  --body "$(cat <<'EOF'
## Summary

- Validate property list before sending the email.
- Retry analysis once if the list is empty, and notify the admin.
- Fixes the empty email issue reported in #1.

## Spec

refs specs/001-empty-email-prevention/

## Verification

- [x] bunx tsc --noEmit passes
- [x] bun test passes
- [x] Manual smoke test via docs/http/properties.http
- [x] git-workflow conventions followed
- [x] CHANGELOG.md updated to 0.9.1
EOF
)"
```

## Don't

- Do not push directly to `main` — always use a feature or fix branch.
- Do not open a PR with a vague title like "updates" or "fixes" — use the conventional commit format.
- Do not skip the pre-flight checks — a clean working tree and a branch with commits ahead of main are required.
- Do not open a PR without a body — reviewers need context.
- Do not use `git push --force` unless the user explicitly asks for it.

## Related skills

- `git-workflow` — branch naming and commit message conventions
- `code-review` — review checklist applied during PR review
- `planning` — creates `specs/NNN-name/` directories referenced in PR bodies
- `changelog` — registers user-facing changes that PRs typically introduce
