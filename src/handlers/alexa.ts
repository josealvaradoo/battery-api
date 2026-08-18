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