# EARS Notation

EARS (Easy Approach to Requirements Syntax) was created by Alistair Mavin at Rolls-Royce. It produces requirements unambiguous enough for an LLM to act on and for a test to verify against.

## The 5 Patterns

### 1. Ubiquitous

**Use when:** the requirement is always true, in every state.

**Template:** `The system shall [behavior].`

**Examples:**

- The system shall log every authentication attempt.
- The system shall return JSON for every successful response.
- The system shall use TypeScript strict mode.
- The system shall namespace Redis keys under `reental:`.

### 2. Event-driven

**Use when:** the requirement triggers on a specific event or input.

**Template:** `When [trigger], the system shall [response].`

**Examples:**

- When a user submits the login form, the system shall validate credentials against the auth provider.
- When the cache TTL expires, the system shall re-fetch from the upstream scraper.
- When an HTTP request fails with a 5xx status, the system shall retry up to 3 times with exponential backoff.
- When `GET /offers` is called, the system shall return the cached payload if it exists.

### 3. State-driven

**Use when:** the requirement applies only while the system is in a particular state.

**Template:** `While [state], the system shall [behavior].`

**Examples:**

- While a scrape is in progress, the system shall return the cached payload with a `stale` flag.
- While the Redis connection is unavailable, the system shall degrade gracefully to direct scraping and log a warning.
- While a sync is paused, the system shall reject incoming writes with HTTP 409.

### 4. Unwanted behavior

**Use when:** describing the system's response to an error, failure, or undesired condition.

**Template:** `If [condition], then the system shall [response].`

**Examples:**

- If credential validation fails 3 times in 60 seconds, then the system shall lock the account for 15 minutes.
- If the Redis call exceeds 200ms, then the system shall fall back to the upstream scraper.
- If the rate limit is exceeded, then the system shall return HTTP 429 with a `Retry-After` header.
- If the scraper fails, then the system shall return HTTP 502 with a structured error body.

### 5. Optional features

**Use when:** the requirement only applies when a feature flag or configuration is enabled.

**Template:** `Where [feature is included], the system shall [behavior].`

**Examples:**

- Where deepseek summarization is enabled, the system shall summarize scraped offers before storing in Redis.
- Where the `verbose` query parameter is `true`, the system shall include debug fields in the response.
- Where a user has multi-factor authentication enabled, the system shall require a TOTP code after password validation.

## Combining Patterns

Real requirements often combine patterns. Write them as separate EARS statements; do not nest.

```markdown
### Event-driven
- When a `GET /offers` request arrives and the cache key is missing, the system shall scrape reental.com and store the result in Redis with a 1-hour TTL.

### Unwanted behavior
- If the scraper fails, then the system shall return HTTP 502 with a structured error body and shall not write a cache entry.
```

## Anti-Patterns

❌ **Vague:** "The system shall be fast."  
✅ **Testable:** "The system shall respond to `GET /offers` within 200ms at p95 under 100 RPS."

❌ **Implementation-coupled:** "The system shall use a Redis `Map` to cache results."  
✅ **Behavior-focused:** "The system shall cache `/offers` responses in Redis with a 1-hour TTL."

❌ **Multiple claims in one:** "The system shall validate input, return errors, and log them."  
✅ **One claim per criterion:** split into three EARS statements.

❌ **Unbounded quantifier:** "The system shall retry forever."  
✅ **Bounded quantifier:** "The system shall retry up to 3 times with exponential backoff (100ms, 400ms, 1.6s)."

❌ **Imperative in code style:** "Return 404 when the user is not found."  
✅ **Declarative in spec style:** "When the requested user does not exist, the system shall return HTTP 404 with a structured error body."

## EARS for Tests

Every EARS criterion is **directly testable**. Map each one to:

- A unit test (for domain logic) — usually in a `*.test.ts` next to the implementation.
- An integration test (at adapter/repository boundaries).
- An entry in the `tasks.md` "Verification" checklist for Phase 4.

When writing tasks, prefer wording the acceptance check as the EARS criterion, restated: e.g., "AC: cache hit returns within 50ms without calling upstream."
