import { describe, test, expect, mock, beforeEach } from "bun:test";

/* ---------- Mocks ---------- */

const mockHandle = mock((): Promise<unknown> => Promise.resolve({}));
const mockErrorResponse = mock(() => ({
  version: "1.0",
  response: {
    outputSpeech: {
      type: "PlainText",
      text: "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde.",
    },
    shouldEndSession: true,
  },
}));

mock.module("../services/alexa.service", () => ({
  default: {
    handle: mockHandle,
    errorResponse: mockErrorResponse,
  },
}));

/* ---------- Import handler after mocks ---------- */

import { alexa } from "./alexa";

/* ---------- Helpers ---------- */

const createBody = (type: string, intentName?: string) => ({
  version: "1.0",
  context: {
    System: {
      application: { applicationId: "amzn1.ask.skill.test" },
    },
  },
  request: {
    type,
    requestId: "req-1",
    timestamp: "2024-01-01T00:00:00Z",
    locale: "es-US",
    ...(intentName ? { intent: { name: intentName } } : {}),
  },
});

/* ---------- Tests ---------- */

describe("POST /alexa", () => {
  beforeEach(() => {
    mockHandle.mockClear();
    mockErrorResponse.mockClear();
  });

  test("returns 200 with version 1.0 and outputSpeech for a LaunchRequest", async () => {
    mockHandle.mockResolvedValue({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Bienvenido a Planta. Puedes preguntarme por el nivel de batería o por el consumo del hogar. ¿Qué deseas saber?",
        },
        shouldEndSession: false,
      },
    });

    const res = await alexa.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createBody("LaunchRequest")),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version).toBe("1.0");
    expect(body.response.outputSpeech.text).toContain("Bienvenido a Planta");
    expect(mockHandle).toHaveBeenCalledTimes(1);
  });

  test("returns 200 with battery level in speech for a BatteryLevelIntent", async () => {
    mockHandle.mockResolvedValue({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Tu inversor tiene actualmente 85 por ciento de batería",
        },
        shouldEndSession: true,
      },
    });

    const res = await alexa.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createBody("IntentRequest", "BatteryLevelIntent")),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.response.outputSpeech.text).toContain("85 por ciento");
    expect(mockHandle).toHaveBeenCalledTimes(1);
  });

  test("returns 200 with consumption in speech for a HomeConsumptionIntent", async () => {
    mockHandle.mockResolvedValue({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "El consumo actual del hogar es de 800 vatios.",
        },
        shouldEndSession: true,
      },
    });

    const res = await alexa.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createBody("IntentRequest", "HomeConsumptionIntent")),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.response.outputSpeech.text).toContain("800 vatios");
    expect(mockHandle).toHaveBeenCalledTimes(1);
  });

  test("returns 200 with fallback error response on invalid body (not 500)", async () => {
    mockHandle.mockRejectedValueOnce(new Error("unexpected failure"));

    const res = await alexa.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ not: "an alexa request" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version).toBe("1.0");
    expect(body.response.outputSpeech.text).toContain(
      "Lo siento, no pude obtener la información del inversor",
    );
    expect(mockErrorResponse).toHaveBeenCalledTimes(1);
  });
});