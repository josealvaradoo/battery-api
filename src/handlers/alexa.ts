import { Hono } from "hono";
import AlexaService from "../services/alexa.service";
import type { AlexaRequest, AlexaResponse } from "../lib/alexa/type";
import {
  PRIVACY_POLICY_HTML,
  TERMS_OF_USE_HTML,
} from "../lib/alexa/policies";

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

// Public policy documents required by Amazon for skill certification.
// These must be reachable without authentication, so they are registered
// outside the alexaAuth middleware scope (which only protects POST /alexa).
alexa.get("/privacy", (c) => c.html(PRIVACY_POLICY_HTML, 200));
alexa.get("/terms", (c) => c.html(TERMS_OF_USE_HTML, 200));

export { alexa };