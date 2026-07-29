import { Context, Next } from "hono";

class CustomApiKeyError extends Error {}

const getWhitelist = (): string[] => {
  const raw = process.env.API_KEYS_WHITELIST ?? "";
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
};

const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

export const apiKeyAuth = async (c: Context, next: Next) => {
  try {
    const provided = c.req.header("x-api-key");

    if (!provided) {
      throw new CustomApiKeyError("api key is not provided");
    }

    const whitelist = getWhitelist();
    if (whitelist.length === 0) {
      throw new CustomApiKeyError("api key whitelist is not configured");
    }

    const isValid = whitelist.some((key) => secureCompare(provided, key));
    if (!isValid) {
      throw new CustomApiKeyError("invalid api key");
    }

    return next();
  } catch (error) {
    if (error instanceof CustomApiKeyError) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ error: "invalid api key" }, 401);
  }
};