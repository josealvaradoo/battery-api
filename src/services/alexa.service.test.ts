import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { Battery } from "../lib/battery/type";
import type { AlexaRequest, AlexaRequestType } from "../lib/alexa/type";

/* ---------- Mocks ---------- */

const mockBattery: Battery = {
  level: 78.7,
  is_charging: true,
  output_power: 800.4,
};

const mockGet = mock((): Promise<Battery> => Promise.resolve(mockBattery));

mock.module("../services/growatt.service", () => ({
  default: { get: mockGet },
}));

const mockMemoryGet = mock((): Battery | null => null);
const mockMemorySet = mock((): void => {});
const mockMemoryInstance = {
  get: mockMemoryGet,
  set: mockMemorySet,
};

mock.module("../helpers/memory", () => ({
  default: {
    getInstance: mock(() => mockMemoryInstance),
  },
}));

const retryMock = mock((fn: () => Promise<unknown>) => fn());

mock.module("../helpers/retry.helper", () => ({
  default: retryMock,
}));

/* ---------- Import service after mocks ---------- */

import AlexaService from "./alexa.service";

/* ---------- Helpers ---------- */

const createRequest = (
  type: AlexaRequestType,
  intentName?: string,
): AlexaRequest => ({
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
    ...(intentName
      ? { intent: { name: intentName, confirmationStatus: "NONE" } }
      : {}),
  },
});

const launchRequest = (): AlexaRequest => createRequest("LaunchRequest");
const intentRequest = (intentName: string): AlexaRequest =>
  createRequest("IntentRequest", intentName);
const sessionEndedRequest = (): AlexaRequest =>
  createRequest("SessionEndedRequest");

/* ---------- Tests ---------- */

describe("AlexaService", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockMemoryGet.mockClear();
    mockMemorySet.mockClear();
    retryMock.mockClear();
    mockGet.mockResolvedValue(mockBattery);
    mockMemoryGet.mockReturnValue(null);
  });

  test("LaunchRequest returns welcome message with shouldEndSession false", async () => {
    const response = await AlexaService.handle(launchRequest());

    expect(response.version).toBe("1.0");
    expect(response.response.outputSpeech?.text).toBe(
      "Bienvenido a Planta. Puedes preguntarme por el nivel de batería o por el consumo del hogar. ¿Qué deseas saber?",
    );
    expect(response.response.shouldEndSession).toBe(false);
    expect(response.response.card).toEqual({
      type: "Simple",
      title: "Planta",
      content:
        "Bienvenido a Planta. Puedes preguntarme por el nivel de batería o por el consumo del hogar. ¿Qué deseas saber?",
    });
  });

  test("BatteryLevelIntent returns rounded battery level with shouldEndSession true", async () => {
    const response = await AlexaService.handle(
      intentRequest("BatteryLevelIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Tu inversor tiene actualmente 78 por ciento de batería",
    );
    expect(response.response.shouldEndSession).toBe(true);
    expect(response.response.card).toEqual({
      type: "Simple",
      title: "Planta",
      content: "Tu inversor tiene actualmente 78 por ciento de batería",
    });
  });

  test("HomeConsumptionIntent returns rounded consumption with shouldEndSession true", async () => {
    const response = await AlexaService.handle(
      intentRequest("HomeConsumptionIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "El consumo actual del hogar es de 800 vatios.",
    );
    expect(response.response.shouldEndSession).toBe(true);
  });

  test("AMAZON.HelpIntent returns help message with shouldEndSession false", async () => {
    const response = await AlexaService.handle(
      intentRequest("AMAZON.HelpIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Puedes preguntarme cosas como 'cuánta batería queda' o 'cuánto consume el hogar'. ¿Qué deseas saber?",
    );
    expect(response.response.shouldEndSession).toBe(false);
  });

  test("AMAZON.CancelIntent returns goodbye with shouldEndSession true", async () => {
    const response = await AlexaService.handle(
      intentRequest("AMAZON.CancelIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe("Hasta luego.");
    expect(response.response.shouldEndSession).toBe(true);
  });

  test("AMAZON.StopIntent returns goodbye with shouldEndSession true", async () => {
    const response = await AlexaService.handle(
      intentRequest("AMAZON.StopIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe("Hasta luego.");
    expect(response.response.shouldEndSession).toBe(true);
  });

  test("unknown intent returns fallback message with shouldEndSession false", async () => {
    const response = await AlexaService.handle(
      intentRequest("AMAZON.FallbackIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Lo siento, no entendí eso. Puedes preguntarme por el nivel de batería o por el consumo del hogar.",
    );
    expect(response.response.shouldEndSession).toBe(false);
  });

  test("SessionEndedRequest has no outputSpeech and no card", async () => {
    const response = await AlexaService.handle(sessionEndedRequest());

    expect(response.version).toBe("1.0");
    expect(response.response.outputSpeech).toBeUndefined();
    expect(response.response.card).toBeUndefined();
    expect(response.response.shouldEndSession).toBe(true);
  });

  test("uses cached battery data without calling GrowattService.get", async () => {
    const cached: Battery = {
      level: 50,
      is_charging: false,
      output_power: 180,
    };
    mockMemoryGet.mockReturnValue(cached);

    const response = await AlexaService.handle(
      intentRequest("BatteryLevelIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Tu inversor tiene actualmente 50 por ciento de batería",
    );
    expect(mockGet).not.toHaveBeenCalled();
    expect(retryMock).not.toHaveBeenCalled();
  });

  test("fetches via retry and stores in memory on cache miss", async () => {
    const response = await AlexaService.handle(
      intentRequest("BatteryLevelIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Tu inversor tiene actualmente 78 por ciento de batería",
    );
    expect(retryMock).toHaveBeenCalled();
    expect(mockMemorySet).toHaveBeenCalledWith("battery", mockBattery);
  });

  test("BatteryLevelIntent returns error message when Growatt throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("Growatt unavailable"));

    const response = await AlexaService.handle(
      intentRequest("BatteryLevelIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde.",
    );
    expect(response.response.shouldEndSession).toBe(true);
  });

  test("HomeConsumptionIntent returns error message when Growatt throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("Growatt unavailable"));

    const response = await AlexaService.handle(
      intentRequest("HomeConsumptionIntent"),
    );

    expect(response.response.outputSpeech?.text).toBe(
      "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde.",
    );
    expect(response.response.shouldEndSession).toBe(true);
  });

  test("errorResponse returns the error message with shouldEndSession true", () => {
    const response = AlexaService.errorResponse();

    expect(response.version).toBe("1.0");
    expect(response.response.outputSpeech?.text).toBe(
      "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde.",
    );
    expect(response.response.shouldEndSession).toBe(true);
  });
});
