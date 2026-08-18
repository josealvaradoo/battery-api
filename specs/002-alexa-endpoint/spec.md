# 002 Alexa Endpoint

## Summary

Add a new `POST /alexa` endpoint that serves as the HTTPS backend for an Amazon Alexa custom skill (invocation name "planta"). The skill lets the user ask Alexa — in Spanish (es-US) — for the current battery level and the current home power consumption. The endpoint receives the Alexa Skills Kit JSON request, verifies the caller's skill ID against an env-var whitelist, routes the request by type and intent name, fetches battery data from the existing GrowattService through the shared in-memory cache, and returns an Alexa-formatted JSON response with a Spanish spoken string. No new runtime dependencies are introduced.

## User Stories

- As a homeowner, I want to ask Alexa "cuánta batería queda" and hear the current battery percentage, so that I can check my solar battery without opening an app.
- As a homeowner, I want to ask Alexa "cuánto consume el hogar" and hear the current power draw in watts, so that I can monitor my energy usage hands-free.
- As a homeowner, I want to open the "planta" skill and hear a welcome message, so that I know what I can ask.
- As a homeowner, I want to say "ayuda" and hear what commands are available, so that I can discover the skill's capabilities.
- As an API operator, I want the Alexa endpoint to verify the skill ID, so that only my authorized Alexa skill can trigger it.
- As an API operator, I want the Alexa endpoint to reuse the existing in-memory cache, so that Alexa requests do not hammer the Growatt upstream.
- As an API operator, I want a ready-to-import interaction model JSON, so that I can configure the skill in the Alexa Developer Console without manual work.

## Functional Requirements

- FR-1: The system shall expose a `POST /alexa` endpoint that accepts Alexa Skills Kit JSON request bodies.
- FR-2: The system shall verify the request's `context.System.application.applicationId` against the comma-separated `ALEXA_SKILL_IDS` whitelist environment variable before processing any request.
- FR-3: The system shall handle `LaunchRequest` by returning a Spanish welcome message and keeping the session open (`shouldEndSession: false`).
- FR-4: The system shall handle `IntentRequest` with intent name `BatteryLevelIntent` by returning the current battery level (rounded to a whole number) as a Spanish spoken string and ending the session (`shouldEndSession: true`).
- FR-5: The system shall handle `IntentRequest` with intent name `HomeConsumptionIntent` by returning the current home power consumption in watts (rounded to a whole number) as a Spanish spoken string and ending the session (`shouldEndSession: true`).
- FR-6: The system shall handle `AMAZON.HelpIntent` by returning a Spanish help message listing the available commands and keeping the session open (`shouldEndSession: false`).
- FR-7: The system shall handle `AMAZON.CancelIntent` and `AMAZON.StopIntent` by returning a Spanish goodbye message and ending the session (`shouldEndSession: true`).
- FR-8: The system shall handle `SessionEndedRequest` by returning a response with no `outputSpeech` and `shouldEndSession: true`.
- FR-9: The system shall handle unrecognized intent names by returning a Spanish fallback message and keeping the session open (`shouldEndSession: false`).
- FR-10: The system shall reuse the in-memory cache (`Memory` singleton, key `"battery"`) for Growatt data, consistent with the `/status` endpoint behavior.
- FR-11: The system shall round the battery level and consumption values to whole numbers before inserting them into the spoken response.
- FR-12: The system shall always respond in Spanish regardless of the request's `locale` field.
- FR-13: The system shall return responses in the Alexa Skills Kit JSON response format with `version`, `response.outputSpeech`, and `response.shouldEndSession` fields.
- FR-14: The system shall include a `Simple` card in the response with the same text as the `outputSpeech` for Echo Show devices and the Alexa app.
- FR-15: The system shall return a Spanish error message as an Alexa-formatted response (not an HTTP error) when the Growatt upstream fails, and shall end the session.
- FR-16: The system shall provide a complete Alexa interaction model JSON file (es-US locale) ready for import into the Alexa Developer Console or ASK CLI.

## Acceptance Criteria (EARS)

### Ubiquitous

- The system shall expose `POST /alexa` as the sole Alexa skill endpoint.
- The system shall return JSON with `Content-Type: application/json` for every Alexa response.
- The system shall always include `version: "1.0"` in the Alexa response envelope.
- The system shall always include a `response.outputSpeech` object with `type: "PlainText"` for all spoken responses.
- The system shall always include a `response.card` object of type `"Simple"` containing the same text as the `outputSpeech`.
- The system shall respond in Spanish for every intent and request type.
- The system shall route all business logic through `AlexaService` and keep `handlers/alexa.ts` free of business logic.
- The system shall define all Alexa-related TypeScript types in `src/lib/alexa/type.ts` using no `any`.

### Event-driven

- When a `POST /alexa` request arrives, the system shall parse the JSON body and verify `context.System.application.applicationId` against `ALEXA_SKILL_IDS` before processing.
- When the request type is `LaunchRequest`, the system shall return a Spanish welcome message with `shouldEndSession: false`.
- When the request type is `IntentRequest` and the intent name is `BatteryLevelIntent`, the system shall return "Tu inversor tiene actualmente {level} por ciento de batería" with `shouldEndSession: true`.
- When the request type is `IntentRequest` and the intent name is `HomeConsumptionIntent`, the system shall return "El consumo actual del hogar es de {watts} vatios." with `shouldEndSession: true`.
- When the request type is `IntentRequest` and the intent name is `AMAZON.HelpIntent`, the system shall return a Spanish help message with `shouldEndSession: false`.
- When the request type is `IntentRequest` and the intent name is `AMAZON.CancelIntent` or `AMAZON.StopIntent`, the system shall return a Spanish goodbye message with `shouldEndSession: true`.
- When the request type is `SessionEndedRequest`, the system shall return a response with no `outputSpeech` and `shouldEndSession: true`.
- When the request type is `IntentRequest` and the intent name is not recognized, the system shall return a Spanish fallback message with `shouldEndSession: false`.
- When the cached battery data exists and is not expired, the system shall use it without calling the Growatt upstream.
- When the cached battery data is missing or expired, the system shall fetch fresh data from GrowattService with retry and update the cache.

### State-driven

- While the `ALEXA_SKILL_IDS` environment variable is unset or empty, the system shall reject all `/alexa` requests with HTTP 401.
- While the Growatt upstream is unreachable after all retries, the system shall return a Spanish error message as an Alexa-formatted response with `shouldEndSession: true`.

### Unwanted behavior

- If the request's `context.System.application.applicationId` does not match any value in `ALEXA_SKILL_IDS`, then the system shall return HTTP 401 with a JSON error body and shall not process the request.
- If the request body is not valid JSON or is missing the `context.System.application.applicationId` field, then the system shall return HTTP 401.
- If the GrowattService throws an error during a `BatteryLevelIntent` or `HomeConsumptionIntent` request, then the system shall return "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde." with `shouldEndSession: true`.
- If the request body contains unknown properties, then the system shall not break and shall process the known fields.

### Optional features

- Where the request `locale` is `es-US`, the system shall respond in Spanish.
- Where the request `locale` is any other value, the system shall still respond in Spanish (es-US is the only configured locale).

## Non-Functional Requirements

- **Performance**: The `/alexa` endpoint shall respond within the same latency budget as `/status` (cache hit < 50ms, cache miss < 5s including retries). The Alexa platform enforces an 8-second timeout; the existing 30-second Hono `timeout` middleware is sufficient.
- **Security**: The endpoint shall verify the Alexa skill ID from the request body against an env-var whitelist using constant-time comparison to prevent timing attacks. No request shall be processed without successful verification. The endpoint shall not require API-key or JWT auth (Alexa cannot send custom headers); skill-ID verification is the sole auth mechanism.
- **Observability**: Every `/alexa` request shall be logged by the existing `hono/logger` middleware (method + path + elapsed time). Service-level errors shall produce `error`-level log lines via the existing `logger` helper. Intent routing decisions shall produce `debug`-level log lines.
- **Reliability**: If the Growatt upstream fails, the endpoint shall return a graceful Spanish error message (not an HTTP 500) so Alexa speaks a friendly message instead of an error sound. The retry helper (3 attempts, 5s delay) shall be reused for upstream calls.
- **Maintainability**: All Alexa types shall live in `src/lib/alexa/type.ts`. All business logic shall live in `src/services/alexa.service.ts`. The handler shall only parse, delegate, and respond. No new runtime dependencies.

## Out of Scope

- Cryptographic request signature verification (Signature + SignatureCertChainUrl headers) — deferred to a future spec; skill-ID verification is sufficient for a private skill.
- Account linking between Alexa and the API's JWT/OAuth flow.
- Multi-locale support beyond es-US (es-ES, es-MX are not configured).
- Name-free interaction (requires Amazon approval for public skills).
- APL (Alexa Presentation Language) visual directives for Echo Show screens.
- AudioPlayer interface for long-form audio.
- Progressive responses.
- Dialog management (slot collection, confirmation, delegation).
- `CanFulfillIntentRequest` handling (not enabled in the skill).
- Refactoring the `/status` handler's cache logic into a shared helper (deferred; the Alexa service replicates the pattern independently).
- Persisting historical data (consistent with the project's "ephemeral, no historical data" goal).

## Open Questions

None. All questions were resolved during the requirements-gathering phase:

- **Locale**: es-US only (Alexa does not support es-VE; es-US is the closest available).
- **Home consumption data source**: The existing `output_power` field (Growatt's `storage.outPutPower`) represents home consumption.
- **Authentication**: Skill ID verification only, via `ALEXA_SKILL_IDS` comma-separated whitelist env var.
- **Invocation name**: "planta" (common Venezuelan term for "planta eléctrica" — power generator/battery).
- **Built-in intents**: All standard ones handled (LaunchRequest, HelpIntent, CancelIntent, StopIntent, SessionEndedRequest).
- **Caching**: Reuse the existing `Memory` singleton with the `"battery"` key.
- **HTTPS**: Already handled externally; no code changes needed.
- **Interaction model**: Full JSON file provided for import.
- **Response language**: Always Spanish.
- **Value rounding**: Round to whole numbers.

## References

- Constitution: [AGENTS.md](../../AGENTS.md)
- Related specs: [specs/001-logger/](../001-logger/)
- Alexa Skills Kit — Request and Response JSON Reference: https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html
- Alexa Skills Kit — Handle Requests Sent by Alexa: https://developer.amazon.com/en-US/docs/alexa/custom-skills/handle-requests-sent-by-alexa.html
- Alexa Skills Kit — Host a Custom Skill as a Web Service: https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-a-web-service.html
