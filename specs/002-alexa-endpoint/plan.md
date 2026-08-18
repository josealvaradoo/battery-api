# 002 Alexa Endpoint — Technical Plan

## Summary

Add a `POST /alexa` Hono sub-router protected by a new `alexaAuth` middleware that verifies the Alexa skill ID from the request body against the `ALEXA_SKILL_IDS` env-var whitelist. A new `AlexaService` class encapsulates all business logic: routing by request type and intent name, fetching battery data through the shared `Memory` cache + `retry` + `GrowattService` pipeline, building Spanish spoken responses, and returning an `AlexaResponse` envelope. A new `src/lib/alexa/type.ts` file defines all Alexa request/response types with no `any`. A ready-to-import interaction model JSON is provided under `docs/alexa/`. No new runtime dependencies are required.

## Architecture

Per the AGENTS.md constitution, the codebase is organized by responsibility (`handlers/`, `services/`, `middlewares/`, `helpers/`, `lib/`). This feature touches the following layers:

- **Lib (types)**: `src/lib/alexa/type.ts` (new) — all Alexa request/response TypeScript types. Sits alongside `src/lib/battery/type.ts` and `src/lib/user/type.ts`.
- **Middlewares**: `src/middlewares/alexa-auth.ts` (new) — verifies `context.System.application.applicationId` against `ALEXA_SKILL_IDS` whitelist using constant-time comparison. Reads the JSON body via `c.req.json()` (Hono v4 caches the parsed body, so the handler can read it again without consuming the stream). Returns HTTP 401 on mismatch or missing field.
- **Services**: `src/services/alexa.service.ts` (new) — business logic. Receives the parsed `AlexaRequest`, routes by `request.type` and `request.intent.name`, fetches battery data (cache → retry → GrowattService), builds Spanish response strings, and returns an `AlexaResponse`. Independent of the HTTP layer (no `Context` import).
- **Handlers**: `src/handlers/alexa.ts` (new) — HTTP entry point. Parses the JSON body (cached from middleware), delegates to `AlexaService.handle()`, and returns the `AlexaResponse` as JSON. No business logic.
- **Composition root**: `src/index.ts` — register `app.use("/alexa/*", alexaAuth)` and `app.route("/alexa", alexa)`.
- **Docs**: `docs/http/alexa.http` (new) — kulala-nvim request examples for manual smoke-testing. `docs/alexa/interaction-model.json` (new) — Alexa interaction model for es-US locale, ready for import into the Alexa Developer Console or ASK CLI.
- **Config**: `.env.example` — add `ALEXA_SKILL_IDS` env var.

### Why no new middleware for intent routing?

Intent routing is business logic, not a cross-cutting concern. Per AGENTS.md, business logic belongs in `services/`, not `middlewares/`. The `alexaAuth` middleware only handles authentication (skill-ID verification); everything else is in `AlexaService`.

### Why does the service fetch battery data directly instead of calling the status handler?

The `/status` handler contains cache+fetch logic that is arguably business logic in a handler (a minor existing violation). For the Alexa endpoint, this logic is placed correctly in `AlexaService`. The service uses the same `Memory` singleton, `retry` helper, and `GrowattService` as `/status`, so the cache is shared. Refactoring `/status` to use a shared helper is out of scope for this spec (deferred to a future spec to keep this change atomic).

### Middleware ordering in `src/index.ts`

The current `src/index.ts` registers middlewares in this order:
```ts
app.use(honoLogger());
app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());
app.use("/status/*", authenticate);
```

The new `alexaAuth` middleware is registered for `/alexa/*` only, after `cors()` and `timeout()` so those still apply:
```ts
app.use(honoLogger());
app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());
app.use("/status/*", authenticate);
app.use("/alexa/*", alexaAuth);
```

### Body parsing and Hono's body cache

Hono v4 caches the result of `c.req.json()` in an internal `bodyCache`. This means:
1. The `alexaAuth` middleware calls `c.req.json()` to read the skill ID → the parsed body is cached.
2. The `alexa.ts` handler calls `c.req.json()` again → receives the cached parsed body without consuming the stream a second time.

No `c.set()`/`c.get()` plumbing is needed. This is the simplest approach and avoids coupling the middleware to the handler via context variables.

## Data Model

```typescript
// src/lib/alexa/type.ts

/** Supported Alexa request types. */
type AlexaRequestType =
  | "LaunchRequest"
  | "IntentRequest"
  | "SessionEndedRequest"
  | "CanFulfillIntentRequest";

/** Intent names handled by the skill (string union allows unknown intents for fallback). */
type AlexaIntentName =
  | "BatteryLevelIntent"
  | "HomeConsumptionIntent"
  | "AMAZON.HelpIntent"
  | "AMAZON.CancelIntent"
  | "AMAZON.StopIntent"
  | string;

/** The application object containing the skill ID. */
interface AlexaApplication {
  applicationId: string;
}

/** The System object in the context. */
interface AlexaSystem {
  application: AlexaApplication;
  user?: {
    userId: string;
    accessToken?: string;
  };
  device?: {
    deviceId: string;
  };
  apiEndpoint?: string;
  apiAccessToken?: string;
}

/** The context object in the request envelope. */
interface AlexaContext {
  System: AlexaSystem;
}

/** The intent object in an IntentRequest. */
interface AlexaIntent {
  name: AlexaIntentName;
  confirmationStatus: string;
  slots?: Record<string, {
    name: string;
    value: string;
    confirmationStatus: string;
  }>;
}

/** The request body object (varies by type). */
interface AlexaRequestBody {
  type: AlexaRequestType;
  requestId: string;
  timestamp: string;
  locale: string;
  intent?: AlexaIntent;
  reason?: string;
}

/** The session object (present for standard requests, absent for AudioPlayer etc.). */
interface AlexaSession {
  new: boolean;
  sessionId: string;
  application: AlexaApplication;
  user: {
    userId: string;
    accessToken?: string;
  };
  attributes?: Record<string, unknown>;
}

/** The full Alexa request envelope received via POST. */
interface AlexaRequest {
  version: string;
  session?: AlexaSession;
  context: AlexaContext;
  request: AlexaRequestBody;
}

/** Output speech types. */
type OutputSpeechType = "PlainText" | "SSML";

/** The outputSpeech object in the response. */
interface AlexaOutputSpeech {
  type: OutputSpeechType;
  text?: string;
  ssml?: string;
  playBehavior?: string;
}

/** The card object in the response. */
interface AlexaCard {
  type: "Simple" | "Standard";
  title: string;
  content?: string;
  text?: string;
  image?: {
    smallImageUrl?: string;
    largeImageUrl?: string;
  };
}

/** The reprompt object in the response. */
interface AlexaReprompt {
  outputSpeech: AlexaOutputSpeech;
}

/** The response body object. */
interface AlexaResponseBody {
  outputSpeech: AlexaOutputSpeech;
  card?: AlexaCard;
  reprompt?: AlexaReprompt;
  shouldEndSession: boolean;
}

/** The full Alexa response envelope returned to Alexa. */
interface AlexaResponse {
  version: string;
  sessionAttributes?: Record<string, unknown>;
  response: AlexaResponseBody;
}
```

- All types use `interface` or `type` aliases — no `any`, no enums (per project style).
- `AlexaIntentName` includes `| string` so unknown intents are accepted by the type system and routed to the fallback handler at runtime.
- Fields not used by this skill (e.g., `slots`, `playBehavior`, `image`) are typed but optional, so the code is resilient to new Alexa JSON properties per the Alexa documentation's forward-compatibility note.

## API Contracts

### `POST /alexa`

**Request**: Alexa Skills Kit JSON body (see `AlexaRequest` type). No custom headers required — Alexa sends `Content-Type: application/json` and its own `Signature` / `SignatureCertChainUrl` headers (not verified in this version).

**Response**: Alexa Skills Kit JSON body (see `AlexaResponse` type). HTTP status is always `200` for valid skill IDs, even when the Growatt upstream fails (the error is conveyed as a spoken Spanish string, not an HTTP error). HTTP `401` is returned only when the skill ID verification fails.

```typescript
// src/handlers/alexa.ts
import { Hono } from "hono";
import AlexaService from "../services/alexa.service";
import type { AlexaRequest, AlexaResponse } from "../lib/alexa/type";

const alexa = new Hono();

alexa.post("/", async (c) => {
  try {
    const body = await c.req.json<AlexaRequest>();
    const response: AlexaResponse = await AlexaService.handle(body);
    return c.json(response, 200);
  } catch (error) {
    // Graceful fallback — return an Alexa-formatted error response, not HTTP 500
    const fallback = AlexaService.errorResponse();
    return c.json(fallback, 200);
  }
});

export { alexa };
```

```typescript
// src/middlewares/alexa-auth.ts
import { Context, Next } from "hono";

class AlexaAuthError extends Error {}

const getWhitelist = (): string[] => {
  const raw = process.env.ALEXA_SKILL_IDS ?? "";
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
};

const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

export const alexaAuth = async (c: Context, next: Next) => {
  try {
    const whitelist = getWhitelist();
    if (whitelist.length === 0) {
      throw new AlexaAuthError("alexa skill ids whitelist is not configured");
    }

    const body = await c.req.json<{
      context?: { System?: { application?: { applicationId?: string } } };
    }>();

    const skillId = body?.context?.System?.application?.applicationId;
    if (!skillId) {
      throw new AlexaAuthError("skill id is missing from request");
    }

    const isValid = whitelist.some((id) => secureCompare(skillId, id));
    if (!isValid) {
      throw new AlexaAuthError("invalid skill id");
    }

    return next();
  } catch (error) {
    if (error instanceof AlexaAuthError) {
      return c.json({ error: error.message }, 401);
    }
    return c.json({ error: "alexa authentication failed" }, 401);
  }
};
```

```typescript
// src/services/alexa.service.ts (sketch — full implementation in tasks)
import type { AlexaRequest, AlexaResponse } from "../lib/alexa/type";
import type { Battery } from "../lib/battery/type";
import Memory from "../helpers/memory";
import retry from "../helpers/retry.helper";
import GrowattService from "./growatt.service";
import { logger } from "../helpers";

const MEMORY_KEY = "battery";

class AlexaService {
  public async handle(request: AlexaRequest): Promise<AlexaResponse> {
    switch (request.request.type) {
      case "LaunchRequest":
        return this.launchResponse();
      case "IntentRequest":
        return this.handleIntent(request);
      case "SessionEndedRequest":
        return this.endSessionResponse();
      default:
        return this.fallbackResponse();
    }
  }

  private async handleIntent(request: AlexaRequest): Promise<AlexaResponse> {
    const intentName = request.request.intent?.name ?? "";
    switch (intentName) {
      case "BatteryLevelIntent":
        return this.batteryLevelResponse();
      case "HomeConsumptionIntent":
        return this.homeConsumptionResponse();
      case "AMAZON.HelpIntent":
        return this.helpResponse();
      case "AMAZON.CancelIntent":
      case "AMAZON.StopIntent":
        return this.stopResponse();
      default:
        logger.warn("Unknown Alexa intent", { intentName });
        return this.fallbackResponse();
    }
  }

  private async getBattery(): Promise<Battery> {
    const memory = Memory.getInstance();
    const cached = memory.get<Battery>(MEMORY_KEY);
    if (cached) return cached;
    const data = await retry(GrowattService.get, 3, 5);
    memory.set<Battery>(MEMORY_KEY, data);
    return data;
  }

  // ... response builder methods (see tasks for full detail)
}

export default new AlexaService();
```

### Response message catalog (Spanish, es-US)

| Request / Intent | Spoken response | shouldEndSession |
|---|---|---|
| `LaunchRequest` | "Bienvenido a Planta. Puedes preguntarme por el nivel de batería o por el consumo del hogar. ¿Qué deseas saber?" | `false` |
| `BatteryLevelIntent` | "Tu inversor tiene actualmente {level} por ciento de batería" | `true` |
| `HomeConsumptionIntent` | "El consumo actual del hogar es de {watts} vatios." | `true` |
| `AMAZON.HelpIntent` | "Puedes preguntarme cosas como 'cuánta batería queda' o 'cuánto consume el hogar'. ¿Qué deseas saber?" | `false` |
| `AMAZON.CancelIntent` / `AMAZON.StopIntent` | "Hasta luego." | `true` |
| Unknown intent | "Lo siento, no entendí eso. Puedes preguntarme por el nivel de batería o por el consumo del hogar." | `false` |
| Growatt upstream error | "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde." | `true` |
| `SessionEndedRequest` | (no outputSpeech) | `true` |

### Card content

Every spoken response (except `SessionEndedRequest`) includes a `Simple` card with:
- `title`: "Planta"
- `content`: the same text as the `outputSpeech.text`

## Dependencies

- **New runtime dependencies**: none. All required modules (`hono`, `Memory`, `retry`, `GrowattService`, `logger`) are already in the project.
- **New dev dependencies**: none.

No ADR is required — the stack-minimalism rule in AGENTS.md is respected.

## Migration / Rollout

This is a purely additive feature. No existing routes or behaviors are modified.

### Backwards-compatibility strategy
No public API changes. The new `/alexa` endpoint is independent of `/status` and `/auth`. Existing clients (HomeWatt, macOS toolbar) are unaffected.

### Environment variable
Add `ALEXA_SKILL_IDS` to `.env.example`:
```
ALEXA_SKILL_IDS=
```

### Rollback plan
Revert the commits. Remove the `ALEXA_SKILL_IDS` env var. No data migration required.

## Test Strategy

- **Unit tests** (`src/services/alexa.service.test.ts` — new):
  - `handle(LaunchRequest)` returns a welcome message with `shouldEndSession: false`.
  - `handle(IntentRequest with BatteryLevelIntent)` returns "Tu inversor tiene actualmente {level} por ciento de batería" with `shouldEndSession: true`.
  - `handle(IntentRequest with HomeConsumptionIntent)` returns "El consumo actual del hogar es de {watts} vatios." with `shouldEndSession: true`.
  - `handle(IntentRequest with AMAZON.HelpIntent)` returns a help message with `shouldEndSession: false`.
  - `handle(IntentRequest with AMAZON.CancelIntent)` returns a goodbye message with `shouldEndSession: true`.
  - `handle(IntentRequest with AMAZON.StopIntent)` returns a goodbye message with `shouldEndSession: true`.
  - `handle(IntentRequest with unknown intent)` returns a fallback message with `shouldEndSession: false`.
  - `handle(SessionEndedRequest)` returns a response with no `outputSpeech` and `shouldEndSession: true`.
  - Battery level is rounded to a whole number (e.g., 78.7 → 78).
  - Consumption is rounded to a whole number (e.g., 800.4 → 800).
  - Cache hit: `getBattery()` returns cached data without calling `GrowattService.get`.
  - Cache miss: `getBattery()` calls `GrowattService.get` via `retry` and stores the result.
  - GrowattService throws: `BatteryLevelIntent` returns the Spanish error message with `shouldEndSession: true`.
  - Every response includes `version: "1.0"`, `response.outputSpeech` (except SessionEndedRequest), and `response.card` (except SessionEndedRequest).
  - Mocks: `GrowattService`, `Memory`, `retry` (same pattern as `status.test.ts`).

- **Middleware tests** (`src/middlewares/alexa-auth.test.ts` — new):
  - Valid skill ID → calls `next()`.
  - Invalid skill ID → returns 401.
  - Missing skill ID in body → returns 401.
  - Empty `ALEXA_SKILL_IDS` env var → returns 401.
  - Multiple skill IDs in whitelist → any match passes.

- **Handler tests** (`src/handlers/alexa.test.ts` — new):
  - `POST /` with a `LaunchRequest` body → returns 200 with Alexa response JSON.
  - `POST /` with a `BatteryLevelIntent` body → returns 200 with battery level in speech.
  - `POST /` with invalid body → returns 200 with fallback error response (not 500).
  - Mocks: `AlexaService` (same pattern as `auth.test.ts`).

- **Smoke tests**: `docs/http/alexa.http` — manual testing with kulala-nvim. Includes example request bodies for each intent.

## Risks & Trade-offs

- **Skill-ID verification vs. signature verification**: Skill-ID verification is simpler and sufficient for a private skill, but it is not cryptographically secure — a malicious actor who knows the skill ID could forge requests. Full signature verification (fetching the X.509 cert from `SignatureCertChainUrl` and verifying the `Signature` header) is deferred to a future spec. Trade-off: simplicity and zero deps now, with a documented security gap.
- **Service replicates cache logic from `/status` handler**: The `getBattery()` method in `AlexaService` duplicates the cache-check-then-fetch pattern from `handlers/status.ts`. This is a minor DRY violation but keeps this spec atomic (refactoring `/status` is out of scope). Trade-off: small duplication now, extractable to a shared helper later.
- **Always-Spanish responses**: The service ignores `request.locale` and always responds in Spanish. If the skill is later published in additional locales (es-ES, es-MX), the service will need locale-aware response templates. Trade-off: simplicity now, explicit out-of-scope for multi-locale.
- **`AlexaIntentName` includes `| string`**: This loosens the type so unknown intents are accepted at compile time and routed to the fallback at runtime. Trade-off: the compiler won't catch a typo in a known intent name, but the fallback handler ensures graceful behavior. The alternative (exhaustive union without `string`) would require a type assertion for unknown intents, which is worse.
- **Hono body cache dependency**: The design relies on Hono v4's `c.req.json()` caching behavior (the middleware and handler both call it). If a future Hono version changes this, the handler would fail to read the body. Trade-off: avoids `c.set()`/`c.get()` coupling; documented in the plan so a future change is easy to spot.
- **HTTP 200 for upstream errors**: The endpoint returns HTTP 200 even when Growatt fails, because Alexa expects a valid response envelope (not an HTTP error) to speak a message. Trade-off: HTTP monitoring won't catch Growatt failures via status codes; the `logger.error` call and the spoken error message provide observability instead.

## References

- Spec: [spec.md](./spec.md)
- Constitution: [AGENTS.md](../../AGENTS.md)
- Alexa Skills Kit — Request and Response JSON Reference: https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html
- Alexa Skills Kit — Handle Requests Sent by Alexa: https://developer.amazon.com/en-US/docs/alexa/custom-skills/handle-requests-sent-by-alexa.html
- Alexa Skills Kit — Host a Custom Skill as a Web Service: https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-a-web-service.html
