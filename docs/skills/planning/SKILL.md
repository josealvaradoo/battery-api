---
name: planning
description: Creates spec-driven development plans with EARS acceptance criteria for the Reental Bun + Hono REST API. Produces a versioned spec.md, technical plan.md, and atomic tasks.md under specs/NNN-name/. Use when the user asks to plan, spec, design, break down, or estimate a feature, bug fix, or refactor.
---

# Spec-Driven Planning

Creates executable specifications, technical plans, and task breakdowns for the Reental codebase using **Spec-Driven Development (SDD)**. The spec is the source of truth; the code is a regenerable output.

## When to Use

Use this skill when the user:

- Asks to "plan", "spec", "design", "spec out", or "break down" a feature.
- Says "create a plan", "write a spec", "what's the plan for…", "estimate this".
- Wants to add, change, or refactor anything in `src/`.

## Constitution

The project rules live in [`AGENTS.md`](../../../AGENTS.md) and are **non-negotiable**. Every spec and plan must respect:

- **Stack**: Bun + TypeScript + Hono + Redis. No new runtime dependencies without an ADR.
- **Architecture**: Hexagonal (ports & adapters). Layers: `adapters/`, `domains/`, `handlers/`, `models/`, `repositories/`, `routes/`. No cross-layer leakage.
- **Types**: TypeScript strict mode. **No `any`**. JSDoc on public APIs.
- **Concerns**: Business logic in `domains/`, HTTP in `handlers/`, persistence in `repositories/`, external services in `adapters/`.

If a spec violates the constitution, fix the spec — do not bend the rules.

## The 4-Phase Workflow

Copy this checklist and track progress:

```
SDD Progress:
- [ ] Phase 1 — Specify: write spec.md (what & why, EARS criteria)
- [ ] Phase 2 — Plan:     write plan.md (how: architecture, data, API)
- [ ] Phase 3 — Tasks:    write tasks.md (atomic, testable units)
- [ ] Phase 4 — Implement: execute tasks.md, verify against spec
- [ ] Human review at EVERY phase boundary before continuing
```

**Never skip a phase.** Cheap iterations on the spec save expensive iterations on the code.

### Phase 1 — Specify

**Goal:** Capture _what_ the system should do and _why_ — no implementation details.

**Output:** `specs/NNN-kebab-name/spec.md`

**Required sections** (use [TEMPLATES.md](TEMPLATES.md)):

- User stories: `As a [role], I want [capability], so that [outcome].`
- Functional requirements (FR-1, FR-2, …).
- **Acceptance criteria in [EARS](EARS.md) notation** — mandatory.
- Non-functional requirements (perf, security, observability, reliability).
- Out-of-scope (bound the work).
- Open questions.

**Checkpoint:** Stop. User must approve the spec before Phase 2.

### Phase 2 — Plan

**Goal:** Translate the spec into a _technical_ plan grounded in the constitution.

**Output:** `specs/NNN-kebab-name/plan.md`

**Required sections:**

- Architecture decisions and rationale (cite the layers from AGENTS.md).
- Data model (TypeScript types, validation schemas).
- API contracts (Hono routes, request/response schemas).
- Library/framework choices (no new deps without an ADR).
- Migration / rollout strategy (if touching existing code).
- Test strategy (unit in `domains/`, integration at boundaries).

**Checkpoint:** Stop. User must approve the plan before Phase 3.

### Phase 3 — Tasks

**Goal:** Decompose the plan into atomic, independently-shippable tasks. A junior engineer (or agent) should be able to execute one task at a time without guessing.

**Output:** `specs/NNN-kebab-name/tasks.md`

**Each task has:** ID (T-NNN), objective, dependencies, inputs (files/specs to read), outputs (files to create/modify), acceptance check.

Number tasks in execution order. Group by layer or phase when natural.

**Checkpoint:** Stop. User must approve the task list before Phase 4.

### Phase 4 — Implement

Execute tasks in order, one at a time. After each task:

1. Run the task's acceptance check (lint, typecheck, test).
2. Commit with `feat:`, `fix:`, `refactor:`, or `chore:` prefix (see `git-workflow` skill).
3. Reference the spec/plan in commit messages when relevant: `refs specs/NNN-name/`.

If a task reveals that the spec or plan is wrong, **stop, update the spec, then continue**. Never silently deviate.

## EARS — Quick Reference

EARS (Easy Approach to Requirements Syntax) turns fuzzy requirements into testable, AI-parseable statements. Use it for **every acceptance criterion**.

| Pattern          | Template                                              | Example                                                                                  |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Ubiquitous**   | The system shall [X].                                 | The system shall log every authentication attempt.                                       |
| **Event-driven** | When [trigger], the system shall [response].          | When a user submits the login form, the system shall validate credentials.               |
| **State-driven** | While [state], the system shall [behavior].           | While a sync is in progress, the system shall show a non-dismissable progress indicator. |
| **Unwanted**     | If [condition], then the system shall [response].     | If validation fails 3 times in 60s, then the system shall lock the account for 15 min.   |
| **Optional**     | Where [feature enabled], the system shall [behavior]. | Where deepseek summarization is enabled, the system shall summarize scraped offers.      |

Full reference with more examples and anti-patterns: [EARS.md](EARS.md).

## Choosing the Workflow

```
Is the user asking for a new feature or behavior?
  → Follow the full 4-phase workflow above.

Is the user asking to fix a bug?
  → Phase 1 (spec) is a bug-report spec: symptom, root-cause hypothesis, EARS criteria for the fix.
  → Phase 2 (plan) is small. Phase 3 (tasks) is usually 1–3 tasks.

Is the user asking to refactor (no behavior change)?
  → Phase 1 spec describes current vs. target behavior (they must match).
  → Phase 2 plan is the dominant phase.
  → Phase 3 tasks are mechanical.
```

## Directory Layout

```
specs/
└── NNN-kebab-name/        # e.g., 001-cache-offers-in-redis
    ├── spec.md            # Phase 1: what & why
    ├── plan.md            # Phase 2: how
    └── tasks.md           # Phase 3: in what order
```

- `NNN` is a zero-padded sequence number (001, 002, …). Pick the next available.
- Name directories in kebab-case, lowercase, English.
- One feature/fix/refactor = one spec directory. Do not mix unrelated work.

## References

- [TEMPLATES.md](TEMPLATES.md) — full templates for `spec.md`, `plan.md`, `tasks.md`.
- [EARS.md](EARS.md) — EARS notation deep-dive with examples and anti-patterns.
- [EXAMPLES.md](EXAMPLES.md) — end-to-end example for a real feature.
- [AGENTS.md](../../../AGENTS.md) — project constitution (non-negotiable rules).
- `git-workflow` skill — commit conventions and branch naming.
- `code-review` skill — review at phase boundaries.
