# 001 Logger — Technical Plan

## Summary

Introduce a thin, typed logger helper (`src/helpers/logger.helper.ts`) that wraps `console` with level filtering and a consistent format, then migrate every `console.*` call site in `src/` (excluding tests) to use it. Wire Hono's built-in `hono/logger` middleware globally in `src/index.ts` as the first middleware so every request is observable on entry and exit. Delete the credential-leaking `console.log("token:", token)` in `handlers/auth.ts`. No new runtime dependencies are required — `hono/logger` ships with Hono and the helper is pure TypeScript.

## Architecture

Per the AGENTS.md constitution, the codebase is organized by responsibility (`handlers/`, `services/`, `middlewares/`, `helpers/`, `lib/`). This feature touches the following layers:

- **Helpers**: `src/helpers/logger.helper.ts` (new) — pure utility, singleton, no HTTP awareness. Sits alongside `memory.ts`, `retry.helper.ts`, and `jwt.helper.ts`.
- **Helpers (barrel)**: `src/helpers/index.ts` — re-export the logger so call sites can import from the barrel, consistent with the existing `delay` re-export.
- **Middlewares**: `src/index.ts` — register `hono/logger` globally. No new middleware file is created (YAGNI: Hono's built-in logger is sufficient for v1).
- **Handlers**: `src/handlers/auth.ts` — remove the `console.log("token:", token)` leak; replace remaining `console.error` calls with the logger.
- **Services**: `src/services/auth.service.ts`, `src/services/growatt.service.ts` — replace `console.error` calls with the logger.
- **Helpers (existing)**: `src/helpers/retry.helper.ts` — replace `console.log`/`console.error` with the logger.
- **Composition root**: `src/index.ts` — replace `console.log("Starting app...")` with the logger; register `hono/logger`.

### Why no new middleware file?

The code review proposed a custom `request-logger.ts` with correlation IDs and structured JSON. The user explicitly scoped this feature to "start log using `hono/logger`". Per YAGNI, the custom middleware is deferred to a future spec. `hono/logger` provides method + path + elapsed-time logging out of the box with zero code.

### Middleware ordering rationale

The current `src/index.ts` registers middlewares in this order:
```ts
app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());
app.use("/status/*", authenticate);
```

The `hono/logger` middleware must be registered **first** so it wraps the entire pipeline and observes every request — including 401s from `authenticate` and timeouts from `timeout`. The new order:
```ts
app.use(logger());          // hono/logger — observe every request
app.use(poweredBy());
app.use("*", cors());
app.use(timeout(30000));
app.use("/status/*", authenticate);
```

## Data Model

```typescript
// src/helpers/logger.helper.ts

type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
```

- `LogLevel` is a union type — no `any`, no enums (per project style: type aliases preferred).
- `meta` is an optional record for structured context (e.g., `{ attempt: 1, maxRetries: 3 }`). Plain text output for v1 will append it as `key=value` pairs.
- The logger is a singleton object exported as both a named export (`logger`) and a default export, matching the convention of `memory.ts`.

## API Contracts

No HTTP API changes. The logger helper is an internal module with no routes.

The `hono/logger` middleware is imported and registered in `src/index.ts`:

```typescript
import { logger as honoLogger } from "hono/logger";

app.use(honoLogger());
```

This produces console output like:
```
-- GET /status
✨ elapsed: 12ms
```

## Dependencies

- **New runtime dependencies**: none. `hono/logger` ships with `hono` (already in `package.json` at `^4.6.8`).
- **New dev dependencies**: none.

No ADR is required — the stack-minimalism rule in AGENTS.md is respected.

## Migration / Rollout

This is a pure refactor + one security fix. There is no behavior change visible to API consumers.

### Call-site inventory (complete — every `console.*` in `src/` excluding tests)

| File | Line | Current call | Replacement |
|------|------|-------------|-------------|
| `src/index.ts` | ~22 | `console.log("Starting app...")` | `logger.info("Starting app...")` |
| `src/handlers/auth.ts` | ~30 | `console.log("token:", token)` | **DELETE** (security leak) |
| `src/handlers/auth.ts` | ~48 | `console.error(error)` | `logger.error("Google auth failed", { error })` |
| `src/handlers/auth.ts` | ~70 | `console.error(error)` | `logger.error("Google revoke failed", { error })` |
| `src/handlers/auth.ts` | ~92 | `console.error(error)` | `logger.error("Profile fetch failed", { error })` |
| `src/services/auth.service.ts` | ~28 | `console.error("Invalid user")` | `logger.warn("Invalid user", { username })` |
| `src/services/auth.service.ts` | ~32 | `console.error("Invalid password")` | `logger.warn("Invalid password")` |
| `src/services/auth.service.ts` | ~88 | `console.error("Failed to revoke Google session:", error)` | `logger.error("Failed to revoke Google session", { error })` |
| `src/services/growatt.service.ts` | ~33 | `console.error(error)` | `logger.error("Growatt fetch failed", { error })` |
| `src/helpers/retry.helper.ts` | ~14 | `console.log(\`Attempt ${attempt} of ${maxRetries}\`)` | `logger.debug(\`Attempt ${attempt} of ${maxRetries}\`)` |
| `src/helpers/retry.helper.ts` | ~17 | `console.error(\`Attempt ${attempt} failed: ...\`)` | `logger.warn(\`Attempt ${attempt} failed: ${(error as Error).message}\`)` |

### Backwards-compatibility strategy
No public API changes. Internal log output format changes from raw `console` to leveled output — acceptable since logs are operational, not contractual.

### Rollback plan
Revert the commits. No data migration, no env-var removal required (the new `LOG_LEVEL` var defaults to `info` when absent).

### Environment variable
Add `LOG_LEVEL` to `.env.example`:
```
LOG_LEVEL=info
```

## Test Strategy

- **Unit tests** (`src/helpers/logger.helper.test.ts` — new):
  - `logger.info` writes to `console.log`.
  - `logger.error` writes to `console.error`.
  - `logger.debug` is suppressed when `LOG_LEVEL=info`.
  - `logger.error` is emitted when `LOG_LEVEL=error` and `info` is suppressed.
  - Default level is `info` when `LOG_LEVEL` is unset.
  - The logger swallows internal errors (best-effort) — does not throw.
  - Maps to EARS: "When the `LOG_LEVEL` environment variable is set…", "While the `LOG_LEVEL` is `error`…", "Where the `LOG_LEVEL`…is `debug`…".

- **Existing handler tests** (`src/handlers/auth.test.ts`, `src/handlers/status.test.ts`):
  - Must still pass after the `console.*` migration. The `auth.test.ts` "returns a JWT on valid Google token" test must not break when the `console.log("token:", token)` line is removed.
  - No new tests required in handlers — the logger is mocked or transparent.

- **Smoke test**: `docs/http/status.http` and `docs/http/auth.http` — verify the server starts and `hono/logger` prints request lines to stdout.

## Risks & Trade-offs

- **`hono/logger` vs. custom middleware**: Choosing the built-in means no correlation IDs and plain-text output for v1. Trade-off: zero code, zero deps, ships immediately. A future spec can upgrade to a custom middleware when structured output is required. This respects YAGNI today.
- **Logger helper swallows internal errors**: Best-effort logging means a logging bug cannot break the request path. Trade-off: silent logging failures are harder to diagnose. Acceptable for v1 given the small surface.
- **`meta` as `Record<string, unknown>`**: Slightly looser than a fully-typed schema. Trade-off: avoids over-engineering a structured-logging schema before the output format is decided. Tighten in a future spec if structured JSON is adopted.
- **Test files keep `console.*`**: Out of scope per spec. Test output via `bun:test`'s own reporters is intentional and should not be routed through the app logger.

## References

- Spec: [spec.md](./spec.md)
- Constitution: [AGENTS.md](../../AGENTS.md)
- Code review: this plan is the direct output of a senior code review of the current logging state.