# Templates

Use these as the **strict** structure for `spec.md`, `plan.md`, and `tasks.md`. Fill every section; mark "None" or "N/A" only when truly not applicable. Do not rename sections — consistency lets reviewers and tools rely on the structure.

## spec.md Template

```markdown
# [NNN] [Feature Name]

## Summary

One-paragraph overview of what and why. No implementation details.

## User Stories

- As a [role], I want [capability], so that [outcome].
- As a [role], I want [capability], so that [outcome].

## Functional Requirements

- FR-1: ...
- FR-2: ...

## Acceptance Criteria (EARS)

### Ubiquitous
- The system shall [X].
- The system shall [Y].

### Event-driven
- When [trigger], the system shall [response].
- When [trigger], the system shall [response].

### State-driven
- While [state], the system shall [behavior].
- While [state], the system shall [behavior].

### Unwanted behavior
- If [condition], then the system shall [response].
- If [condition], then the system shall [response].

### Optional features
- Where [feature enabled], the system shall [behavior].
- Where [feature enabled], the system shall [behavior].

## Non-Functional Requirements

- **Performance**: ... (e.g., p95 latency budgets, throughput targets)
- **Security**: ... (e.g., authn/authz, secret handling, input validation)
- **Observability**: ... (e.g., logs, metrics, traces)
- **Reliability**: ... (e.g., fallback behavior, retries, timeouts)

## Out of Scope

- ... (be explicit about what the system will NOT do)

## Open Questions

- ... (anything blocking the spec from being final)

## References

- Constitution: [AGENTS.md](../../../AGENTS.md)
- Related specs: specs/NNN-other-name/
```

## plan.md Template

```markdown
# [NNN] [Feature Name] — Technical Plan

## Summary

One-paragraph overview of the implementation approach and key trade-offs.

## Architecture

Which layers are touched (per the AGENTS.md constitution). Use the same vocabulary as the codebase.

- **Domains**: ... (e.g., `src/domains/<name>/<use-case>.ts`)
- **Adapters**: ... (e.g., `src/adapters/<external-service>/`)
- **Repositories**: ... (e.g., `src/repositories/<entity>/`)
- **Handlers**: ... (e.g., `src/handlers/<resource>/<action>.handler.ts`)
- **Routes**: ... (e.g., `src/routes/<resource>/index.ts`)

## Data Model

```typescript
// TypeScript types and (Zod) validation schemas.
// Mark fields as readonly. Use type aliases, never `any`.
type Offer = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly token: Token;
};
```

## API Contracts

```typescript
// Hono route definitions: method, path, request schema, response schema.
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const offers = new Hono().get(
  "/",
  zValidator("query", z.object({ /* ... */ })),
  async (c) => {
    // delegates to handler
  }
);
```

## Dependencies

- **New runtime dependencies**: (none expected; otherwise link to an ADR)
- **New dev dependencies**: (none expected; otherwise link to an ADR)

## Migration / Rollout

If touching existing code, document:

- Backwards-compatibility strategy
- Feature-flag plan (if applicable)
- Rollback plan

## Test Strategy

- **Unit tests** (in `domains/`): ... — list the cases that map to EARS criteria.
- **Integration tests** (at adapter/repository boundaries): ...
- **Smoke tests**: `docs/http/<resource>.http` — describe the manual flow.

## Risks & Trade-offs

- ... (call out non-obvious decisions and why they were made)

## References

- Spec: [spec.md](./spec.md)
- Constitution: [AGENTS.md](../../../AGENTS.md)
```

## tasks.md Template

```markdown
# [NNN] [Feature Name] — Tasks

Each task is atomic, independently shippable, and verifiable. Execute in order. Stop and update the spec if a task reveals new requirements.

## T-001: [Task title]

- **Objective**: ...
- **Depends on**: (none / T-NNN)
- **Inputs**: (files to read, specs to consult)
- **Outputs**: (files to create or modify)
- **Acceptance check**:
  - [ ] ... (concrete, testable condition)
  - [ ] ... (maps to one or more EARS criteria from spec.md)
  - [ ] `bun run lint` passes (if defined)
  - [ ] `bun run typecheck` passes (if defined)
  - [ ] Unit / integration tests pass

## T-002: [Task title]

- **Objective**: ...
- **Depends on**: T-001
- **Inputs**: ...
- **Outputs**: ...
- **Acceptance check**:
  - [ ] ...

## Verification (after all tasks)

- [ ] Every EARS acceptance criterion from spec.md is covered by a passing test.
- [ ] `bun run lint` passes (if defined).
- [ ] `bun run typecheck` passes (if defined).
- [ ] Manual smoke test passes (link to `docs/http/<resource>.http` if available).
- [ ] `git-workflow` skill conventions followed for branch and commits.
- [ ] PR description references `specs/NNN-name/`.
```
