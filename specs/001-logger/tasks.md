# 001 Logger — Tasks

Each task is atomic, independently shippable, and verifiable. Execute in order. Stop and update the spec if a task reveals new requirements.

## T-001: Delete the credential-leaking `console.log` in `handlers/auth.ts`

- **Objective**: Remove the `console.log("token:", token)` statement in the `POST /google` handler that prints the raw Google OAuth ID token in plaintext. This is a security fix and the first step before any logging migration.
- **Depends on**: none
- **Inputs**: `src/handlers/auth.ts`, `specs/001-logger/spec.md` (FR-4, Unwanted behavior AC).
- **Outputs**: modified `src/handlers/auth.ts`.
- **Acceptance check**:
  - [ ] The line `console.log("token:", token)` no longer exists in `src/handlers/auth.ts`.
  - [ ] No other `console.log("token"…` pattern exists anywhere in `src/`.
  - [ ] `bun test` passes — the `auth.test.ts` "returns a JWT on valid Google token" test still passes.
  - [ ] Maps to EARS: "If the `console.log("token:", token)` statement…is encountered during review, then the system shall have removed it."

## T-002: Create the `logger.helper.ts` singleton

- **Objective**: Add `src/helpers/logger.helper.ts` exposing a typed `logger` singleton with `debug`, `info`, `warn`, and `error` methods. Level filtering reads from `LOG_LEVEL` env var (default `info`). The helper swallows internal errors (best-effort) and never throws.
- **Depends on**: none (independent of T-001; can be developed in parallel but committed after).
- **Inputs**: `specs/001-logger/plan.md` (Data Model section), `src/helpers/memory.ts` (singleton convention reference).
- **Outputs**: `src/helpers/logger.helper.ts`, `src/helpers/logger.helper.test.ts`.
- **Acceptance check**:
  - [ ] `logger.info`, `logger.debug`, `logger.warn`, `logger.error` are all callable and typed.
  - [ ] No `any` is used — `LogLevel` is a union type; `meta` is `Record<string, unknown>`.
  - [ ] When `LOG_LEVEL=info`, `logger.debug` produces no output.
  - [ ] When `LOG_LEVEL=error`, only `logger.error` produces output.
  - [ ] When `LOG_LEVEL` is unset, the default level is `info`.
  - [ ] The logger does not throw if `console` is unavailable or `JSON.stringify` fails on `meta`.
  - [ ] Unit tests in `logger.helper.test.ts` cover: info writes to `console.log`, error writes to `console.error`, debug suppressed at `info` level, error-only filtering, default level, no-throw on internal error.
  - [ ] Maps to EARS: "The system shall support the log levels…", "When the `LOG_LEVEL`…is set…", "While the `LOG_LEVEL` is `error`…", "Where the `LOG_LEVEL`…is `debug`…".

## T-003: Re-export the logger from the helpers barrel

- **Objective**: Add the logger to `src/helpers/index.ts` so call sites can import from the barrel, consistent with the existing `delay` re-export.
- **Depends on**: T-002
- **Inputs**: `src/helpers/index.ts`.
- **Outputs**: modified `src/helpers/index.ts`.
- **Acceptance check**:
  - [ ] `import { logger } from "../helpers"` works from any `src/` file.
  - [ ] `bun run build` (`tsc`) passes with no type errors.

## T-004: Migrate `console.*` in `src/helpers/retry.helper.ts`

- **Objective**: Replace `console.log` and `console.error` in the retry helper with `logger.debug` and `logger.warn` respectively. The attempt log becomes `debug` (noisy operational detail); the failure log becomes `warn` (recoverable failure).
- **Depends on**: T-003
- **Inputs**: `src/helpers/retry.helper.ts`, `specs/001-logger/plan.md` (call-site inventory).
- **Outputs**: modified `src/helpers/retry.helper.ts`.
- **Acceptance check**:
  - [ ] No `console.log` or `console.error` remains in `src/helpers/retry.helper.ts`.
  - [ ] `logger.debug` is used for the "Attempt N of M" line.
  - [ ] `logger.warn` is used for the "Attempt N failed" line.
  - [ ] `bun test` passes — `status.test.ts` mocks `retry.helper` so behavior is unaffected.

## T-005: Migrate `console.*` in `src/services/auth.service.ts`

- **Objective**: Replace the three `console.error` calls in `AuthService` with `logger.warn` (for invalid user/password — expected auth failures) and `logger.error` (for the revoke failure — unexpected upstream error).
- **Depends on**: T-003
- **Inputs**: `src/services/auth.service.ts`, `specs/001-logger/plan.md` (call-site inventory).
- **Outputs**: modified `src/services/auth.service.ts`.
- **Acceptance check**:
  - [ ] No `console.error` remains in `src/services/auth.service.ts`.
  - [ ] `logger.warn("Invalid user", …)` and `logger.warn("Invalid password")` replace the first two calls.
  - [ ] `logger.error("Failed to revoke Google session", …)` replaces the third call.
  - [ ] `bun test` passes — `auth.test.ts` mocks `auth.service` so behavior is unaffected.

## T-006: Migrate `console.*` in `src/services/growatt.service.ts`

- **Objective**: Replace the `console.error(error)` call in `GrowattService.get` with `logger.error("Growatt fetch failed", { error })`.
- **Depends on**: T-003
- **Inputs**: `src/services/growatt.service.ts`, `specs/001-logger/plan.md` (call-site inventory).
- **Outputs**: modified `src/services/growatt.service.ts`.
- **Acceptance check**:
  - [ ] No `console.error` remains in `src/services/growatt.service.ts`.
  - [ ] `logger.error` is used with a descriptive message and the error in `meta`.
  - [ ] `bun test` passes — `status.test.ts` mocks `growatt.service` so behavior is unaffected.

## T-007: Migrate remaining `console.*` in `src/handlers/auth.ts`

- **Objective**: Replace the three remaining `console.error(error)` calls in `handlers/auth.ts` (in `/google`, `/google/revoke`, and `/profile` handlers) with `logger.error` calls carrying a descriptive message and the error in `meta`.
- **Depends on**: T-001, T-003
- **Inputs**: `src/handlers/auth.ts`, `specs/001-logger/plan.md` (call-site inventory).
- **Outputs**: modified `src/handlers/auth.ts`.
- **Acceptance check**:
  - [ ] No `console.error` remains in `src/handlers/auth.ts`.
  - [ ] No `console.log` remains in `src/handlers/auth.ts` (T-001 already removed the token leak).
  - [ ] Each `logger.error` call has a unique, descriptive message identifying the handler.
  - [ ] `bun test` passes — all `auth.test.ts` tests pass.

## T-008: Wire `hono/logger` and migrate the startup log in `src/index.ts`

- **Objective**: Register Hono's built-in `logger` middleware globally as the **first** middleware in `src/index.ts` so every request is logged on entry and exit. Replace `console.log("Starting app…")` with `logger.info("Starting app…")`. Document the middleware ordering with a comment.
- **Depends on**: T-003
- **Inputs**: `src/index.ts`, `specs/001-logger/plan.md` (Middleware ordering rationale).
- **Outputs**: modified `src/index.ts`.
- **Acceptance check**:
  - [ ] `import { logger as honoLogger } from "hono/logger"` is present.
  - [ ] `app.use(honoLogger())` is registered **before** `poweredBy()`, `cors()`, `timeout()`, and `authenticate`.
  - [ ] `console.log("Starting app...")` is replaced with `logger.info("Starting app...")`.
  - [ ] No `console.*` remains in `src/index.ts`.
  - [ ] `bun dev` starts and prints a request line for `GET /` (health check).
  - [ ] Maps to EARS: "When an HTTP request arrives…shall log the request method and path", "When an HTTP request completes…shall log the response status and elapsed time".

## T-009: Add `LOG_LEVEL` to `.env.example`

- **Objective**: Document the new `LOG_LEVEL` environment variable in `.env.example` so operators know it exists. Default value shown is `info`.
- **Depends on**: T-002
- **Inputs**: `.env.example`.
- **Outputs**: modified `.env.example`.
- **Acceptance check**:
  - [ ] `LOG_LEVEL=info` is present in `.env.example`.
  - [ ] No other env vars are modified.

## T-010: Final verification — no `console.*` remains in `src/` (excluding tests)

- **Objective**: Confirm the migration is complete. Run a search for `console.log` and `console.error` across `src/` excluding `*.test.ts` and assert zero matches. Run the full test suite and typecheck.
- **Depends on**: T-001 through T-009
- **Inputs**: entire `src/` tree.
- **Outputs**: verification report (pass/fail).
- **Acceptance check**:
  - [ ] `rg "console\.(log|error|warn|debug)" src/ --glob '!*.test.ts'` returns zero matches.
  - [ ] `bun test` passes — all existing tests green.
  - [ ] `bun run build` passes — `tsc` emits no errors.
  - [ ] Manual smoke: `bun dev` → `GET /` → observe `hono/logger` output → `GET /status` (with valid API key) → observe request log.
  - [ ] Maps to EARS: "If a `console.log` or `console.error` call remains in `src/` after migration, then the system shall have failed its acceptance check."

## Verification (after all tasks)

- [ ] Every EARS acceptance criterion from spec.md is covered by a passing test or verification step.
- [ ] `bun test` passes.
- [ ] `bun run build` passes.
- [ ] `rg "console\.(log|error|warn|debug)" src/ --glob '!*.test.ts'` returns zero matches.
- [ ] Manual smoke test passes: `hono/logger` prints request lines; `logger.*` calls produce leveled output.
- [ ] `git-workflow` skill conventions followed: branch `feature/logger`, commits prefixed `fix:`/`feat:`/`refactor:`/`chore:`, lowercase, imperative, < 50 chars.
- [ ] `CHANGELOG.md` updated per `changelog` skill with a new version block.
- [ ] PR description references `specs/001-logger/`.