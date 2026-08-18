# 002 Alexa Endpoint — Tasks

Each task is atomic, independently shippable, and verifiable. Execute in order. Stop and update the spec if a task reveals new requirements.

## T-001: Define Alexa request/response types in `src/lib/alexa/type.ts`

- **Objective**: Create the TypeScript type definitions for the Alexa Skills Kit request and response JSON envelopes. All types use `interface` or `type` aliases — no `any`, no enums. `AlexaIntentName` includes `| string` so unknown intents are accepted at compile time and routed to the fallback at runtime.
- **Depends on**: none
- **Inputs**: `specs/002-alexa-endpoint/plan.md` (Data Model section), `src/lib/battery/type.ts` (convention reference), `src/lib/user/type.ts` (convention reference).
- **Outputs**: `src/lib/alexa/type.ts`.
- **Acceptance check**:
  - [ ] `AlexaRequest`, `AlexaResponse`, `AlexaRequestBody`, `AlexaContext`, `AlexaSystem`, `AlexaApplication`, `AlexaIntent`, `AlexaSession`, `AlexaOutputSpeech`, `AlexaCard`, `AlexaReprompt`, `AlexaResponseBody` are all defined.
  - [ ] No `any` is used anywhere in the file.
  - [ ] `AlexaIntentName` is a union of known intents plus `string`.
  - [ ] `bun run build` (`tsc`) passes with no type errors.
  - [ ] Maps to EARS: "The system shall define all Alexa-related TypeScript types in `src/lib/alexa/type.ts` using no `any`."

## T-002: Create the `alexa-auth.ts` middleware for skill-ID verification

- **Objective**: Add `src/middlewares/alexa-auth.ts` that reads the JSON body via `c.req.json()`, extracts `context.System.application.applicationId`, and verifies it against the `ALEXA_SKILL_IDS` comma-separated whitelist using constant-time comparison. Returns HTTP 401 on mismatch, missing field, or unconfigured whitelist. Follows the same pattern as `src/middlewares/api-key.ts`.
- **Depends on**: none (independent of T-001; the middleware uses an inline type for the body slice, not the full `AlexaRequest`).
- **Inputs**: `src/middlewares/api-key.ts` (pattern reference for `secureCompare` and error handling), `specs/002-alexa-endpoint/plan.md` (API Contracts — middleware section).
- **Outputs**: `src/middlewares/alexa-auth.ts`, `src/middlewares/alexa-auth.test.ts`.
- **Acceptance check**:
  - [ ] `alexaAuth` is exported and callable as a Hono middleware `(c: Context, next: Next) => Promise<Response | void>`.
  - [ ] Valid skill ID → `next()` is called.
  - [ ] Invalid skill ID → returns 401 with `{ error: "invalid skill id" }`.
  - [ ] Missing `applicationId` in body → returns 401 with `{ error: "skill id is missing from request" }`.
  - [ ] Empty/unset `ALEXA_SKILL_IDS` → returns 401 with `{ error: "alexa skill ids whitelist is not configured" }`.
  - [ ] Multiple skill IDs in whitelist → any match passes.
  - [ ] Constant-time comparison is used (same `secureCompare` pattern as `api-key.ts`).
  - [ ] No `any` is used.
  - [ ] `bun test` passes — all middleware tests green.
  - [ ] Maps to EARS: "When a `POST /alexa` request arrives, the system shall verify `context.System.application.applicationId`…", "If the request's `context.System.application.applicationId` does not match…then the system shall return HTTP 401…", "While the `ALEXA_SKILL_IDS` environment variable is unset or empty, the system shall reject all `/alexa` requests with HTTP 401."

## T-003: Create the `AlexaService` in `src/services/alexa.service.ts`

- **Objective**: Implement the business logic class that receives an `AlexaRequest`, routes by `request.type` and `request.intent.name`, fetches battery data through the shared `Memory` cache + `retry` + `GrowattService` pipeline, builds Spanish response strings, and returns an `AlexaResponse`. Include a static `errorResponse()` method for graceful upstream-failure handling. Include a private `getBattery()` method that checks the cache first, then fetches with retry and updates the cache. Round battery level and consumption to whole numbers using `Math.round()`.
- **Depends on**: T-001
- **Inputs**: `src/lib/alexa/type.ts`, `src/lib/battery/type.ts`, `src/helpers/memory.ts`, `src/helpers/retry.helper.ts`, `src/services/growatt.service.ts`, `src/helpers/logger.helper.ts`, `specs/002-alexa-endpoint/plan.md` (Response message catalog).
- **Outputs**: `src/services/alexa.service.ts`, `src/services/alexa.service.test.ts`.
- **Acceptance check**:
  - [ ] `AlexaService.handle(request: AlexaRequest): Promise<AlexaResponse>` is the sole public method (plus `errorResponse()` static).
  - [ ] `LaunchRequest` → welcome message, `shouldEndSession: false`, card included.
  - [ ] `BatteryLevelIntent` → "Tu inversor tiene actualmente {level} por ciento de batería", `shouldEndSession: true`, card included.
  - [ ] `HomeConsumptionIntent` → "El consumo actual del hogar es de {watts} vatios.", `shouldEndSession: true`, card included.
  - [ ] `AMAZON.HelpIntent` → help message, `shouldEndSession: false`, card included.
  - [ ] `AMAZON.CancelIntent` → "Hasta luego.", `shouldEndSession: true`, card included.
  - [ ] `AMAZON.StopIntent` → "Hasta luego.", `shouldEndSession: true`, card included.
  - [ ] Unknown intent → fallback message, `shouldEndSession: false`, card included.
  - [ ] `SessionEndedRequest` → no `outputSpeech`, no card, `shouldEndSession: true`.
  - [ ] Battery level rounded to whole number (e.g., `78.7` → `78`).
  - [ ] Consumption rounded to whole number (e.g., `800.4` → `800`).
  - [ ] Cache hit: `getBattery()` returns cached data, `GrowattService.get` not called.
  - [ ] Cache miss: `getBattery()` calls `retry(GrowattService.get, 3, 5)` and stores result in `Memory` with key `"battery"`.
  - [ ] GrowattService throws: `BatteryLevelIntent` returns "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde." with `shouldEndSession: true`.
  - [ ] GrowattService throws: `HomeConsumptionIntent` returns the same error message with `shouldEndSession: true`.
  - [ ] Every response (except `SessionEndedRequest`) includes `version: "1.0"`, `response.outputSpeech` with `type: "PlainText"`, and `response.card` with `type: "Simple"`.
  - [ ] `errorResponse()` is a static method returning an `AlexaResponse` with the error message and `shouldEndSession: true`.
  - [ ] No `Context` or HTTP import — the service is transport-agnostic.
  - [ ] No `any` is used.
  - [ ] `bun test` passes — all service tests green.
  - [ ] Maps to EARS: all Event-driven criteria for intent routing, "When the cached battery data exists…", "When the cached battery data is missing…", "While the Growatt upstream is unreachable…", "If the GrowattService throws an error…".

## T-004: Create the `alexa` handler in `src/handlers/alexa.ts`

- **Objective**: Add the Hono sub-router with a single `POST /` route that reads the JSON body (cached from the `alexaAuth` middleware by Hono's body cache), delegates to `AlexaService.handle()`, and returns the `AlexaResponse` as JSON with HTTP 200. On any unexpected error, return `AlexaService.errorResponse()` with HTTP 200 (not 500) so Alexa speaks a graceful message.
- **Depends on**: T-003
- **Inputs**: `src/handlers/status.ts` (pattern reference), `src/services/alexa.service.ts`, `src/lib/alexa/type.ts`.
- **Outputs**: `src/handlers/alexa.ts`, `src/handlers/alexa.test.ts`.
- **Acceptance check**:
  - [ ] `alexa` is a `Hono` instance exported from the module.
  - [ ] `POST /` with a `LaunchRequest` body → 200, response body has `version: "1.0"` and `response.outputSpeech`.
  - [ ] `POST /` with a `BatteryLevelIntent` body → 200, response body contains the battery level in the speech text.
  - [ ] `POST /` with a `HomeConsumptionIntent` body → 200, response body contains the consumption in the speech text.
  - [ ] `POST /` with an invalid/unexpected body → 200 with fallback error response (not 500).
  - [ ] No business logic in the handler — it only parses, delegates, and responds.
  - [ ] No `any` is used.
  - [ ] `bun test` passes — all handler tests green.
  - [ ] Maps to EARS: "The system shall expose `POST /alexa`…", "The system shall return JSON with `Content-Type: application/json`…".

## T-005: Wire the `/alexa` route and middleware in `src/index.ts`

- **Objective**: Register `app.use("/alexa/*", alexaAuth)` and `app.route("/alexa", alexa)` in `src/index.ts`. The middleware must be registered after `cors()` and `timeout()` so those still apply to `/alexa` requests. Add a comment documenting the middleware ordering.
- **Depends on**: T-002, T-004
- **Inputs**: `src/index.ts`, `src/middlewares/alexa-auth.ts`, `src/handlers/alexa.ts`.
- **Outputs**: modified `src/index.ts`.
- **Acceptance check**:
  - [ ] `import { alexaAuth } from "./middlewares/alexa-auth"` is present.
  - [ ] `import { alexa } from "./handlers/alexa"` is present.
  - [ ] `app.use("/alexa/*", alexaAuth)` is registered after `cors()` and `timeout()`.
  - [ ] `app.route("/alexa", alexa)` is registered after the middleware.
  - [ ] `bun dev` starts without error.
  - [ ] `GET /` (health check) still returns `{ data: "ok" }`.
  - [ ] `POST /alexa` without a valid skill ID returns 401.
  - [ ] `POST /alexa` with a valid skill ID and `LaunchRequest` body returns 200 with Alexa response.
  - [ ] Maps to EARS: "The system shall expose `POST /alexa` as the sole Alexa skill endpoint."

## T-006: Add `ALEXA_SKILL_IDS` to `.env.example`

- **Objective**: Document the new `ALEXA_SKILL_IDS` environment variable in `.env.example` so operators know it exists. Show an empty value (to be filled with comma-separated skill IDs).
- **Depends on**: T-002
- **Inputs**: `.env.example`.
- **Outputs**: modified `.env.example`.
- **Acceptance check**:
  - [ ] `ALEXA_SKILL_IDS=` is present in `.env.example`.
  - [ ] No other env vars are modified.

## T-007: Create the Alexa interaction model JSON

- **Objective**: Create `docs/alexa/interaction-model.json` containing the full Alexa interaction model for the es-US locale. Include the invocation name "planta", the two custom intents (`BatteryLevelIntent`, `HomeConsumptionIntent`) with all sample utterances from the user's examples, and the three built-in intents (`AMAZON.HelpIntent`, `AMAZON.CancelIntent`, `AMAZON.StopIntent`) with Spanish sample utterances. The file must be valid JSON importable via the Alexa Developer Console or ASK CLI.
- **Depends on**: none (documentation task, independent of code tasks).
- **Inputs**: User's example utterances from the requirements, `specs/002-alexa-endpoint/spec.md` (FR-16).
- **Outputs**: `docs/alexa/interaction-model.json`.
- **Acceptance check**:
  - [ ] File is valid JSON (parseable by `JSON.parse`).
  - [ ] `interactionModel.language.invocationName` is `"planta"`.
  - [ ] `BatteryLevelIntent` is present with all 8 sample utterances: "cuánta batería queda", "qué nivel tiene la batería", "cuánto queda de batería", "dime la batería", "batería", "nivel de batería", "cuál es el nivel de la batería", "carga de la batería".
  - [ ] `HomeConsumptionIntent` is present with all 6 sample utterances: "cuánto consume el hogar", "consumo actual", "qué consumo hay", "cuánta energía se consume", "consumo de energía", "cuánto estoy consumiendo".
  - [ ] `AMAZON.HelpIntent` is present with Spanish samples: "ayuda", "ayúdame", "qué puedo hacer".
  - [ ] `AMAZON.CancelIntent` is present with Spanish samples: "cancelar", "cancela".
  - [ ] `AMAZON.StopIntent` is present with Spanish samples: "para", "detente", "stop".
  - [ ] `types` array is empty (no custom slot types needed).
  - [ ] Maps to EARS: "The system shall provide a complete Alexa interaction model JSON file (es-US locale) ready for import…"

## T-008: Create kulala-nvim HTTP test examples in `docs/http/alexa.http`

- **Objective**: Add `docs/http/alexa.http` with example POST requests for each Alexa request type (LaunchRequest, BatteryLevelIntent, HomeConsumptionIntent, AMAZON.HelpIntent, AMAZON.StopIntent, SessionEndedRequest). Follow the kulala-nvim format used in `docs/http/status.http` and `docs/http/auth.http`. Include a comment noting that the `ALEXA_SKILL_IDS` env var must contain the skill ID used in the request bodies.
- **Depends on**: T-005
- **Inputs**: `docs/http/status.http` (format reference), `docs/skills/kulala-nvim/SKILL.md` (format guide), `src/lib/alexa/type.ts` (request shapes).
- **Outputs**: `docs/http/alexa.http`.
- **Acceptance check**:
  - [ ] File follows the kulala-nvim `###` separator format.
  - [ ] `@url` variable is defined as `http://localhost:3000/alexa`.
  - [ ] At least 6 example requests are present (one per request type/intent).
  - [ ] Each request body is valid JSON matching the `AlexaRequest` type.
  - [ ] Each request body includes a `context.System.application.applicationId` field.
  - [ ] Maps to EARS: smoke test coverage for all intent types.

## T-009: Final verification — typecheck, tests, and smoke test

- **Objective**: Confirm the full feature is complete and all acceptance criteria pass. Run `tsc`, `bun test`, and a manual smoke test.
- **Depends on**: T-001 through T-008
- **Inputs**: entire `src/` tree, `docs/alexa/`, `docs/http/alexa.http`.
- **Outputs**: verification report (pass/fail).
- **Acceptance check**:
  - [ ] `bun run build` passes — `tsc` emits no errors.
  - [ ] `bun test` passes — all existing tests (status, auth, logger) and new tests (alexa service, alexa-auth middleware, alexa handler) are green.
  - [ ] No `any` is used in any new file (`rg "\bany\b" src/lib/alexa/ src/middlewares/alexa-auth.ts src/services/alexa.service.ts src/handlers/alexa.ts` returns zero matches).
  - [ ] No `console.*` calls in new files (use `logger` helper).
  - [ ] Manual smoke: `bun dev` → `POST /alexa` with LaunchRequest body (valid skill ID) → 200 with Spanish welcome message.
  - [ ] Manual smoke: `POST /alexa` with BatteryLevelIntent body → 200 with "Tu inversor tiene actualmente {level} por ciento de batería".
  - [ ] Manual smoke: `POST /alexa` with HomeConsumptionIntent body → 200 with "El consumo actual del hogar es de {watts} vatios."
  - [ ] Manual smoke: `POST /alexa` without valid skill ID → 401.
  - [ ] Manual smoke: `GET /` still returns `{ data: "ok" }` (no regression).
  - [ ] Manual smoke: `GET /status` with API key still works (no regression).
  - [ ] `docs/alexa/interaction-model.json` is valid JSON.
  - [ ] Maps to EARS: all Ubiquitous criteria (response format, version, outputSpeech, card, Spanish, no business logic in handler, no `any`).

## Verification (after all tasks)

- [ ] Every EARS acceptance criterion from spec.md is covered by a passing test or verification step.
- [ ] `bun run build` passes — `tsc` emits no errors.
- [ ] `bun test` passes — all tests green.
- [ ] No `any` in new files.
- [ ] No `console.*` in new files (use `logger`).
- [ ] Manual smoke test passes: `docs/http/alexa.http` requests return correct Alexa responses.
- [ ] `docs/alexa/interaction-model.json` is valid and importable.
- [ ] `git-workflow` skill conventions followed: branch `feature/alexa-endpoint`, commits prefixed `feat:`/`chore:`/`docs:`, lowercase, imperative, < 50 chars.
- [ ] `CHANGELOG.md` updated per `changelog` skill with a new version block.
- [ ] PR description references `specs/002-alexa-endpoint/`.
