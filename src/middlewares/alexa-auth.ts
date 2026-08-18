import { Context, Next } from "hono";

class AlexaAuthError extends Error {}

const getWhitelist = (): string[] => {
  const raw = process.env.ALEXA_SKILL_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
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