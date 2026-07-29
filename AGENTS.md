# Overview

This project is a Bun REST API built on Hono that proxies the [Growatt](https://www.growatt.com/) cloud API to expose the current state of a battery (level + charging status) over a clean HTTP interface. Responses are cached in an in-process memory store for a configurable TTL (default `CACHE_TTL=240` seconds) so that consumers can poll frequently without hammering the upstream. Persisting historical data is out of scope.

## Your role

You are a senior backend engineer expert on Bun, Node.js, TypeScript and Hono. You design and implement the API following clean-code and Hono best practices, and you follow the provided skills to complete every task in the project's style.

## Directory Structure

```
src/
|_ handlers/
  |_ auth.ts
  |_ status.ts
|_ helpers/
  |_ delay.helper.ts
  |_ index.ts
  |_ jwt.helper.ts
  |_ memory.ts
  |_ retry.helper.ts
|_ lib/
  |_ battery/
    |_ type.ts
  |_ user/
    |_ type.ts
|_ middlewares/
  |_ api-key.ts
  |_ auth-router.ts
  |_ jwt.ts
|_ services/
  |_ auth.service.ts
  |_ growatt.service.ts
|_ index.ts
```

Request/response examples for manual smoke-testing live in [`docs/http/`](./docs/http/) and are designed to be consumed with **kulala.nvim**.

## Main commands

- **bun start**: run the production server (`bun src/index.ts`)
- **bun dev**: run the development server with hot reload (`bun --watch src/index.ts`)
- **bun run build**: transpile TypeScript with `tsc`

## Technologies Used

- **Bun**: as the JavaScript/TypeScript runtime
- **TypeScript**: for type safety and better code quality
- **Hono**: for building an ultrafast and lightweight REST API
- **google-auth-library**: to verify Google OAuth ID tokens
- **@supabase/supabase-js**: declared dependency (used by future expansions)
- **In-process memory cache** (`src/helpers/memory.ts`): single TTL-bounded cache shared across requests

## Architecture

The codebase is organized by responsibility:

- `handlers/` — HTTP entry points. Receive the Hono context, parse and validate input, delegate to services, and return a JSON response. **No business logic here.**
- `services/` — Business logic. Talk to the Growatt upstream, perform authentication, build the `Battery` payload. Independent of the HTTP layer.
- `middlewares/` — Cross-cutting concerns: API key auth, JWT verification, auth router (API key vs. Bearer).
- `helpers/` — Pure utilities: retry, delay, JWT sign/verify, in-memory cache.
- `lib/` — Shared TypeScript types (`battery`, `user`).

The server is wired up in `src/index.ts`: `cors`, `poweredBy`, a 30s `timeout`, and the `authenticate` middleware on `/status/*` (which accepts either an `x-api-key` header or a `Bearer` JWT).

## Do

- Use TypeScript for all the code in the project.
- Follow the best practices for writing clean and maintainable code, such as using meaningful variable names, writing modular code, and adding JSDoc comments where necessary.
- Follow the best practices for Hono, such as defining routes in a separate file and using middleware for common tasks like error handling and logging.
- When a new external integration is added (Growatt, Google, Supabase, …), keep the implementation in `services/` behind a clearly named class.
- When introducing a new shared type, add it to `src/lib/<entity>/type.ts`.

## Don't

- Never use `any`. Define proper types for all variables, function parameters, and return values.
- Do not put business logic in handlers. Handlers parse, delegate, and respond.
- Do not put HTTP / `Context` handling inside services. Services must be transport-agnostic so they can be reused or unit-tested.
- Do not introduce new runtime dependencies without a clear justification. The current stack is intentionally small.

## Skills

You must use skills for specific tasks in agent mode. Every skill is a guide for how to do the task following the project styleguide.

| Skill Name          | Description                                                   | Location                                 |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| planning            | How to create a spec-driven plan                              | docs/skills/planning/SKILL.md            |
| code-review         | How to make code reviews                                      | docs/skills/code-review/SKILL.md         |
| git-workflow        | How to write work-branches and commits                        | docs/skills/git-workflow/SKILL.md        |
| create-pull-request | How to open a PR on GitHub following git-workflow conventions | docs/skills/create-pull-request/SKILL.md |
| kulala-nvim         | How to write http docs using kulala-nvim                      | docs/skills/kulala-nvim/SKILL.md         |
| context7            | How to get documentation about anything                       | docs/skills/context7/SKILL.md            |
| find-skills         | How to look and get new skills                                | docs/skills/find-skills/SKILL.md         |
| skill-creation      | How to create new skills                                      | docs/skills/skill-creation/SKILL.md      |
| changelog           | How to add registers in CHANGELOG.md                          | docs/skills/changelog/SKILL.md           |
| solid-principles    | How to write clean code                                       | docs/skills/solid-principles/SKILL.md    |
| typescript          | How to write good typescript code                             | docs/skills/typescript/SKILL.md          |
| hono-handlers       | How to write handlers for hono                                | docs/skills/hono-handlers/SKILL.md       |
| hono-domains        | How to write business logic in domains                        | docs/skills/hono-domains/SKILL.md        |
| hono-models         | How to define models in hono                                  | docs/skills/hono-models/SKILL.md         |
| hono-errors         | How to define errors in hono                                  | docs/skills/hono-errors/SKILL.md         |

If the user asks you for your available skills you have to review `docs/skills` directory.

## Authentication

Three authentication paths are supported and orchestrated in `src/middlewares/auth-router.ts`:

1. **API key** (`x-api-key` header) — compared in constant time against the comma-separated `API_KEYS_WHITELIST`. Used for service-to-service calls.
2. **JWT** (`Authorization: Bearer <token>`) — verified with `JWT_SECRET` via `hono/jwt`. The token is issued by `auth.service.ts` after a successful Google OAuth flow.
3. **Google OAuth** — `POST /auth/google` exchanges a Google ID token for an app JWT. A whitelist of allowed emails (`GOOGLE_EMAILS_WHITELIST`) gates the exchange.

The legacy `POST /auth` username/password flow is **deprecated** and must not be used for new integrations.

## Caching

Responses from the Growatt upstream are cached in-process through the `Memory` singleton (`src/helpers/memory.ts`). Behaviour:

- TTL is read from `CACHE_TTL` (seconds). Defaults to 300 when the env var is missing.
- The `?cache=false` query parameter on `GET /status` forces a refresh and rewrites the cached value.
- The `GET /status` response includes an `is_cached` boolean so consumers can tell whether they got a cached payload.

The cache is **per-process**. It does not survive restarts and is not shared across replicas; this is intentional given the project's "ephemeral, no historical data" goal.
