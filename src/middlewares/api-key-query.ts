import { Context, Next } from "hono";
import { validateApiKey } from "./api-key";

class CustomApiKeyQueryError extends Error {}

export const apiKeyQueryAuth = async (c: Context, next: Next) => {
  try {
    const provided = c.req.query("apiKey");

    if (!provided) {
      throw new CustomApiKeyQueryError("api key query param is not provided");
    }

    validateApiKey(provided);

    return next();
  } catch (error) {
    if (error instanceof CustomApiKeyQueryError) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ error: "invalid api key" }, 401);
  }
};
