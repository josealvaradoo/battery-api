---
name: changelog
description: Register and track every change made to the codebase, including bug fixes, new features, and improvements.
---

# Changelog Skill

Register and track every change made to the codebase into `CHANGELOG.md`.

## When to use

Use this skill when you or the user have made some change in the codebase.

## How to use

When the codebase is modified.

1. Check if exists the file `CHANGELOG.md` in the root. Otherwise, create it.

2. Append a new block at the beginning increasing the version, date and a short description similar as the commit, but concise.

3. Changelog version must be in the format `MAJOR.MINOR.PATCH` and the date must be in the format `YYYY-MM-DD`. If it's a major change you have to increase the first number, if it's a minor change you have to increase the second number and if it's a patch you have to increase the last number. For example, if the last version is `1.2.3` and you made a minor change, the new version will be `1.3.0`.

### Examples

```markdown
# Changelog

## 1.2.0 (2026-02-11)

---

### Features

- chat: improve the ui for messages
- paywall: replace the standard plan to promotional plan

### Bug fixes

- user: fix the profile avatar for every user

## 1.1.4 (2026-02-10)

---

### Bug fixes

- email: fix email notifications for new messages

## 1.1.3 (2026-02-09)

---

### Bug fixes

- login: fix login for users with special characters in their email
```
