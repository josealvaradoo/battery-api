/**
 * Supported log levels, ordered from least to most severe.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Maps each log level to its matching console method.
 */
const CONSOLE_METHODS: Record<LogLevel, "log" | "debug" | "warn" | "error"> = {
  debug: "debug",
  info: "log",
  warn: "warn",
  error: "error",
};

/**
 * Numeric rank per level so level filtering is a trivial comparison.
 */
const LOG_LEVEL_RANKS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Type guard for the `LOG_LEVEL` environment variable value.
 */
const isLogLevel = (value: string | undefined): value is LogLevel => {
  return value === "debug" || value === "info" || value === "warn" || value === "error";
};

/**
 * Resolves the configured level, defaulting to "info" when unset or invalid.
 */
const getCurrentLevel = (): LogLevel => {
  return isLogLevel(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : "info";
};

/**
 * Formats the optional meta record as "key=value" pairs.
 * Returns an empty string when the record cannot be serialized.
 */
const formatMeta = (meta: Record<string, unknown>): string => {
  try {
    return Object.entries(meta)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
  } catch {
    return "";
  }
};

/**
 * Emits a leveled log line through the matching console method.
 * Best-effort: never throws, even when console or serialization fails.
 */
const emit = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void => {
  try {
    if (LOG_LEVEL_RANKS[level] < LOG_LEVEL_RANKS[getCurrentLevel()]) {
      return;
    }

    const consoleMethod = console[CONSOLE_METHODS[level]];
    if (typeof consoleMethod !== "function") {
      return;
    }

    const formattedMeta = meta ? formatMeta(meta) : "";
    const metaSuffix = formattedMeta ? ` ${formattedMeta}` : "";
    consoleMethod(`[${level.toUpperCase()}] ${message}${metaSuffix}`);
  } catch {
    // Best-effort logging: a logging failure must never break the request path.
  }
};

interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Singleton logger with level filtering.
 * Level filtering reads the `LOG_LEVEL` environment variable (default "info").
 */
export const logger: Logger = {
  debug: (message, meta) => emit("debug", message, meta),
  info: (message, meta) => emit("info", message, meta),
  warn: (message, meta) => emit("warn", message, meta),
  error: (message, meta) => emit("error", message, meta),
};

export default logger;
