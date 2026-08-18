# 001 Logger

## Summary

The codebase has no mechanism to detect and log when an endpoint is triggered, and every log today is a scattered `console.*` call with no format, no level, and no correlation. One of those calls (`console.log("token:", token)` in `handlers/auth.ts`) leaks a raw Google OAuth ID token in plaintext — a credential-disclosure vulnerability. This spec introduces a centralized logger helper, migrates all `console.*` call sites to it, removes the token leak, and wires Hono's built-in `hono/logger` middleware so every request is observable on entry and exit. No new runtime dependencies are introduced.

## User Stories

- As an API operator, I want every endpoint trigger to be logged, so that I can observe traffic and diagnose issues without adding print statements ad hoc.
- As an API operator, I want all logs to flow through a single helper, so that format, level, and redaction are consistent across the codebase.
- As a security-conscious maintainer, I want the raw Google OAuth token to never appear in logs, so that credentials cannot be disclosed via server output.
- As a developer, I want a typed logger with levels (debug/info/warn/error), so that I can filter noise in production and verbose output in development.

## Functional Requirements

- FR-1: The system shall log every HTTP request on entry (method + path) and on exit (status + elapsed time) via a request-logger middleware.
- FR-2: The system shall provide a centralized logger helper (`src/helpers/logger.helper.ts`) exposing `debug`, `info`, `warn`, and `error` methods.
- FR-3: The system shall replace every existing `console.log` and `console.error` call site with a call to the centralized logger.
- FR-4: The system shall remove the `console.log("token:", token)` statement in `src/handlers/auth.ts` that prints the raw Google OAuth ID token.
- FR-5: The system shall use Hono's built-in `hono/logger` middleware as the request-logger, registered globally in `src/index.ts`.
- FR-6: The logger helper shall read a `LOG_LEVEL` environment variable to filter output; the default level shall be `info`.

## Acceptance Criteria (EARS)

### Ubiquitous
- The system shall route all application log output through the centralized logger helper in `src/helpers/logger.helper.ts`.
- The system shall expose the logger as a singleton importable from `src/helpers/logger.helper.ts`.
- The system shall support the log levels `debug`, `info`, `warn`, and `error`.
- The system shall register the `hono/logger` middleware globally in `src/index.ts` before route handlers.

### Event-driven
- When an HTTP request arrives at any route, the system shall log the request method and path.
- When an HTTP request completes, the system shall log the response status and elapsed time in milliseconds.
- When the `LOG_LEVEL` environment variable is set, the system shall suppress log lines below that level.
- When the `LOG_LEVEL` environment variable is unset, the system shall default to the `info` level.

### State-driven
- While the `LOG_LEVEL` is `error`, the system shall emit only `error`-level lines.

### Unwanted behavior
- If the `console.log("token:", token)` statement in `src/handlers/auth.ts` is encountered during review, then the system shall have removed it.
- If a `console.log` or `console.error` call remains in `src/` after migration, then the system shall have failed its acceptance check.

### Optional features
- Where the `LOG_LEVEL` environment variable is `debug`, the system shall emit `debug`-level lines.

## Non-Functional Requirements

- **Performance**: The logger helper shall add negligible overhead (< 0.1ms per call on the happy path). The `hono/logger` middleware shall not buffer or transform request bodies.
- **Security**: The raw Google OAuth ID token shall never appear in any log line. The logger helper shall not log request headers or bodies by default, preventing accidental credential disclosure.
- **Observability**: Every request shall produce at least one log line on entry and one on exit. Every retry attempt shall produce a log line. Every service-level error shall produce an `error`-level log line.
- **Reliability**: A logging failure shall never break the request path; the logger helper shall swallow internal errors silently (best-effort logging).
- **Maintainability**: The logger helper shall be the single source of truth for log format and level filtering, satisfying DRY and Separation of Concerns.

## Out of Scope

- Structured JSON log output (plain text is acceptable for v1).
- Correlation/request IDs propagated to downstream service logs.
- Log shipping to external sinks (Datadog, CloudWatch, etc.).
- Redaction of arbitrary sensitive fields beyond the token removal in `handlers/auth.ts`.
- Migration of `console.*` calls inside test files (`*.test.ts`).
- Replacement of `hono/logger` with a custom request-logger middleware (deferred per YAGNI).

## Open Questions

- Should the logger output structured JSON or plain text? (Assume plain text for v1; structured output deferred.)
- Should a correlation/request ID be stamped into the Hono context now? (Assume no for v1; deferred to a future spec.)

## References

- Constitution: [AGENTS.md](../../AGENTS.md)
- Code review findings: this spec is the direct output of a senior code review of the current logging state.