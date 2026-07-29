---
name: git-workflow
description: Create new work-branches for new features and add commits following the git workflow styleguide.
---

# Git workflow Skill

Git workflow skill works for creating new branches (and name them), stash changes and write perfect commits.

## When to use

Use this skill when you are working on a new feature and you have to create a new git branch, name it, or create commits.

## How to use

When asked to work on a new feature, you have to create a new branch, and create their commits.

1. Always do use `git` on terminal for any command of this skill.
2. Create a new branch named `feature/<name>` or `fix/<name>` according the case, if any.
3. Do use `git add` to add the files you want to commit, never add files you don't want to commit.
4. Do use `git stash` to save your changes if you are working on something else.
5. Create atomic and small commits for any change you do, and write a good commit message following the git workflow styleguide.
6. Commits messages must be in English and lowercase.
7. Commits must start with a `fix:` prefix if changes fixes something.
8. Commits must start with a `feat:` prefix if changes adds a new feature.
9. Commits must start with a `refactor:` prefix if changes refactors code without adding features or fixing bugs.
10. Commits must start with a `chore:` prefix if changes are related to maintenance or build process.
11. Commits must start with a `docs:` prefix if changes are related to documentation.
12. Commits prefix must be followed by a short description starting with an imperative verb, and must be less than 50 characters.

### Examples

```bash
git checkout -b feature/property-domain
```

```bash
git stash src/domain/property.ts
```

```bash
git commit -m "feat: add property domain"
```
