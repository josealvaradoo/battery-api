import { describe, test, expect, mock, beforeEach } from "bun:test";
import { alexaAuth } from "./alexa-auth";

/* ---------- Helpers ---------- */

const VALID_SKILL_ID = "amzn1.ask.skill.valid-skill";

const createFakeContext = (body: unknown) => ({
  req: { json: async () => body },
  json: (obj: unknown, status: number) => ({ status, body: obj }),
});

const createBody = (applicationId?: string) => ({
  version: "1.0",
  context: {
    System: {
      application: applicationId ? { applicationId } : {},
    },
  },
  request: { type: "LaunchRequest" },
});

/* ---------- Tests ---------- */

describe("alexaAuth middleware", () => {
  beforeEach(() => {
    process.env.ALEXA_SKILL_IDS = VALID_SKILL_ID;
  });

  test("calls next() when the skill ID is valid", async () => {
    const next = mock(() => Promise.resolve());
    const c = createFakeContext(createBody(VALID_SKILL_ID));

    const result = await alexaAuth(c as never, next as never);

    expect(next).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  test("returns 401 when the skill ID is invalid", async () => {
    const next = mock(() => Promise.resolve());
    const c = createFakeContext(createBody("amzn1.ask.skill.other-skill"));

    const result = await alexaAuth(c as never, next as never);

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ error: "invalid skill id" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when applicationId is missing from the body", async () => {
    const next = mock(() => Promise.resolve());
    const c = createFakeContext(createBody());

    const result = await alexaAuth(c as never, next as never);

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ error: "skill id is missing from request" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when the whitelist is empty", async () => {
    process.env.ALEXA_SKILL_IDS = "";
    const next = mock(() => Promise.resolve());
    const c = createFakeContext(createBody(VALID_SKILL_ID));

    const result = await alexaAuth(c as never, next as never);

    expect(result.status).toBe(401);
    expect(result.body).toEqual({
      error: "alexa skill ids whitelist is not configured",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("passes when any of multiple whitelist entries matches", async () => {
    process.env.ALEXA_SKILL_IDS = "amzn1.ask.skill.first,amzn1.ask.skill.second";
    const next = mock(() => Promise.resolve());
    const c = createFakeContext(createBody("amzn1.ask.skill.second"));

    const result = await alexaAuth(c as never, next as never);

    expect(next).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  test("returns 401 when the body is not valid JSON", async () => {
    const next = mock(() => Promise.resolve());
    const c = {
      req: {
        json: async () => {
          throw new Error("invalid json");
        },
      },
      json: (obj: unknown, status: number) => ({ status, body: obj }),
    };

    const result = await alexaAuth(c as never, next as never);

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ error: "alexa authentication failed" });
    expect(next).not.toHaveBeenCalled();
  });
});