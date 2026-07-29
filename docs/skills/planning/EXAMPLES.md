# Examples

A complete SDD walkthrough for a real feature in this codebase. Use as a reference when unsure how to structure your own spec, plan, and tasks.

## Example: Add a 1-hour Redis cache to the `/offers` endpoint

### Why this example

- Realistic: AGENTS.md already mandates 1-hour caching for scraped data.
- Small enough to read end-to-end in 5 minutes.
- Touches multiple layers (repository, adapter, composition root) — exercises the hexagonal architecture.

### Directory

```
specs/001-cache-offers-in-redis/
├── spec.md
├── plan.md
└── tasks.md
```

### spec.md (excerpt)

```markdown
# 001 Cache offers in Redis for 1 hour

## Summary

The `/offers` endpoint scrapes reental.com on every request. Cache the result in Redis for 1 hour to reduce upstream load and improve response time. AGENTS.md already mandates 1-hour caching — this spec makes it executable.

## User Stories

- As an API consumer, I want `/offers` to respond quickly, so that my client does not time out.
- As a system operator, I want to avoid hammering reental.com, so that we do not get rate-limited or blocked.

## Functional Requirements

- FR-1: On cache miss, scrape reental.com and store the result in Redis with a 1-hour TTL.
- FR-2: On cache hit, return the cached payload without scraping.
- FR-3: Cache keys must be namespaced under `offers:` to avoid collisions.

## Acceptance Criteria (EARS)

### Ubiquitous
- The system shall namespace all cache keys under the `offers:` prefix in Redis.
- The system shall return JSON content type for every successful response.

### Event-driven
- When a `GET /offers` request arrives and the cache key is missing, the system shall scrape reental.com and store the result in Redis.
- When a `GET /offers` request arrives and the cache key exists, the system shall return the cached payload without scraping.
- When a cache entry is older than 1 hour, the system shall treat it as a cache miss.

### State-driven
- While the Redis connection is unavailable, the system shall scrape reental.com directly and log a warning.

### Unwanted behavior
- If the scraper fails, then the system shall return HTTP 502 with a structured error body.
- If the Redis call exceeds 200ms, then the system shall fall back to direct scraping.
- If a cache write fails, then the system shall log the error and return the scraped payload.

## Non-Functional Requirements

- **Performance**: p95 response time under 50ms on cache hit, 2s on cache miss.
- **Observability**: log every cache hit/miss with request id and duration in milliseconds.
- **Reliability**: cache failure must never break the request path.

## Out of Scope

- Cache invalidation API.
- Per-user or per-token cache partitioning.
- Stale-while-revalidate semantics.

## Open Questions

- Should the cache key include query parameters? (Assume no for v1.)

## References

- Constitution: [AGENTS.md](../../../AGENTS.md)
```

### plan.md (excerpt)

```markdown
# 001 Cache offers in Redis for 1 hour — Technical Plan

## Summary

Add a `RedisOffersRepository` decorator over the existing scraper-based repository. The handler stays unchanged. The new repository checks Redis first, falls back to scraping on miss, and writes the result back with a 1-hour TTL.

## Architecture

- **Domains**: `src/domains/offers/get-offers.ts` — no change.
- **Repositories**: `src/repositories/offers/` — add `redis-offers.repository.ts` (decorator pattern).
- **Adapters**: `src/adapters/redis/` — use existing client; add a `cacheGet` / `cacheSet` helper if not present.
- **Handlers**: `src/handlers/offers/get-offers.handler.ts` — no change.
- **Routes**: `src/routes/offers/index.ts` — no change.
- **Composition root**: `src/index.ts` — wire the new repository over the existing one.

## Data Model

```typescript
// src/repositories/offers/types.ts (new)
type Offer = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly token: Token;
};
type Offers = ReadonlyArray<Offer>;
```

## API Contracts

No change. `GET /offers` returns the same `Offers` shape.

## Dependencies

None new. All required packages are already in `package.json`.

## Test Strategy

- **Unit**: `src/repositories/offers/redis-offers.repository.test.ts` — uses an in-memory Redis fake.
  - Cache hit → returns cached value, does not call upstream.
  - Cache miss → calls upstream, stores with 1-hour TTL.
  - Redis error → falls back to upstream, does not throw.
  - Cache write failure → upstream payload still returned.
- **Integration**: smoke test via `docs/http/offers.http`.

## Risks & Trade-offs

- Decorator pattern keeps the change small but couples repository composition to Redis availability. Acceptable per AGENTS.md "Redis is required".

## References

- Spec: [spec.md](./spec.md)
- Constitution: [AGENTS.md](../../../AGENTS.md)
```

### tasks.md (excerpt)

```markdown
# 001 Cache offers in Redis for 1 hour — Tasks

## T-001: Define the cache key strategy

- **Objective**: Add a `cacheKeys.offers()` helper that returns `"offers:v1"`.
- **Depends on**: none
- **Inputs**: AGENTS.md, existing adapter code.
- **Outputs**: `src/adapters/redis/keys.ts`
- **Acceptance check**:
  - [ ] `cacheKeys.offers()` returns the string `"offers:v1"`.
  - [ ] Unit test exists.

## T-002: Implement RedisOffersRepository decorator

- **Objective**: Wrap the existing offers repository. On read, check Redis first; on miss, call upstream and store.
- **Depends on**: T-001
- **Inputs**: `specs/001-cache-offers-in-redis/spec.md`, `src/repositories/offers/`.
- **Outputs**: `src/repositories/offers/redis-offers.repository.ts`
- **Acceptance check**:
  - [ ] All EARS criteria in spec.md have a corresponding unit test.
  - [ ] Cache hit returns without calling upstream.
  - [ ] Cache miss calls upstream and stores with 1-hour TTL.
  - [ ] Redis failure falls back to upstream and logs a warning.

## T-003: Wire the new repository in the composition root

- **Objective**: Replace the direct repository binding with the Redis-decorated version.
- **Depends on**: T-002
- **Inputs**: `src/index.ts`
- **Outputs**: updated `src/index.ts`
- **Acceptance check**:
  - [ ] `bun dev` starts without error.
  - [ ] `GET /offers` returns the same response shape as before.
  - [ ] First call hits the upstream; second call within 1h returns the cached payload.

## T-004: Observability and final verification

- **Objective**: Log cache hit/miss + duration, then run full verification.
- **Depends on**: T-003
- **Inputs**: spec.md acceptance criteria.
- **Outputs**: logging updates; final checklist pass.
- **Acceptance check**:
  - [ ] All EARS criteria in spec.md pass.
  - [ ] `bun run lint` passes (if defined).
  - [ ] `bun run typecheck` passes (if defined).
  - [ ] `docs/http/offers.http` smoke test passes.

## Verification (after all tasks)

- [ ] Every EARS acceptance criterion from spec.md is covered by a passing test.
- [ ] `bun run lint` passes (if defined).
- [ ] `bun run typecheck` passes (if defined).
- [ ] `docs/http/offers.http` smoke test passes.
- [ ] Branch and commits follow `git-workflow` conventions.
- [ ] PR description references `specs/001-cache-offers-in-redis/`.
```

### Execution Tips

Suggested commit sequence (one commit per task; see `git-workflow` skill):

```bash
# T-001
git checkout -b feature/cache-offers-in-redis
git add src/adapters/redis/keys.ts src/adapters/redis/keys.test.ts
git commit -m "feat: add redis cache key helper for offers"

# T-002
git add src/repositories/offers/redis-offers.repository.ts src/repositories/offers/redis-offers.repository.test.ts
git commit -m "feat: add redis-decorated offers repository"

# T-003
git add src/index.ts
git commit -m "refactor: wire redis-decorated offers repository in composition root"

# T-004
git commit -m "chore: log cache hit and miss for offers endpoint"
```

When opening the PR, reference the spec directory in the body: `refs specs/001-cache-offers-in-redis/`.
