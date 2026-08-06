import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { logger } from "./logger.helper";

/* ---------- Console spies ---------- */

const spyLog = mock(() => {});
const spyError = mock(() => {});
const spyWarn = mock(() => {});
const spyDebug = mock(() => {});

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalDebug = console.debug;

beforeEach(() => {
  spyLog.mockClear();
  spyError.mockClear();
  spyWarn.mockClear();
  spyDebug.mockClear();

  console.log = spyLog;
  console.error = spyError;
  console.warn = spyWarn;
  console.debug = spyDebug;
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
  console.debug = originalDebug;
});

/* ---------- Tests ---------- */

describe("logger", () => {
  test("logs info messages to console.log at the default level", () => {
    delete process.env.LOG_LEVEL;

    logger.info("Starting app...");

    expect(spyLog).toHaveBeenCalledWith("[INFO] Starting app...");
  });

  test("logs error messages to console.error with meta", () => {
    process.env.LOG_LEVEL = "info";

    logger.error("Growatt fetch failed", { status: 502 });

    expect(spyError).toHaveBeenCalledWith(
      "[ERROR] Growatt fetch failed status=502",
    );
  });

  test("suppresses debug messages when LOG_LEVEL=info", () => {
    process.env.LOG_LEVEL = "info";

    logger.debug("Attempt 1 of 3");

    expect(spyDebug).not.toHaveBeenCalled();
  });

  test("emits only error messages when LOG_LEVEL=error", () => {
    process.env.LOG_LEVEL = "error";

    logger.info("hello");
    logger.warn("careful");
    logger.error("boom");

    expect(spyError).toHaveBeenCalledWith("[ERROR] boom");
    expect(spyLog).not.toHaveBeenCalled();
    expect(spyWarn).not.toHaveBeenCalled();
    expect(spyDebug).not.toHaveBeenCalled();
  });

  test("defaults to the info level when LOG_LEVEL is unset", () => {
    delete process.env.LOG_LEVEL;

    logger.info("hello");
    logger.debug("noise");

    expect(spyLog).toHaveBeenCalledWith("[INFO] hello");
    expect(spyDebug).not.toHaveBeenCalled();
  });

  test("does not throw when console is unavailable", () => {
    const originalConsole = globalThis.console;
    Object.defineProperty(globalThis, "console", {
      value: undefined,
      configurable: true,
    });

    try {
      expect(() => logger.info("message")).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, "console", {
        value: originalConsole,
        configurable: true,
      });
    }
  });

  test("does not throw when meta cannot be serialized", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => logger.info("message", circular)).not.toThrow();
    expect(spyLog).toHaveBeenCalledWith("[INFO] message");
  });
});
