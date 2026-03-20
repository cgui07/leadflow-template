type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

function maskPhone(value: string): string {
  return value.replace(/(\d{2,4})\d{4,6}(\d{2,4})/g, "$1****$2");
}

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return maskPhone(value);
  }
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.parse(maskPhone(JSON.stringify(value)));
    } catch {
      return value;
    }
  }
  return value;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LEVEL]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: sanitize(context) } : {}),
  };

  const json = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(json);
      break;
    case "warn":
      console.warn(json);
      break;
    default:
      console.log(json);
      break;
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    emit("debug", message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    emit("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    emit("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    emit("error", message, context);
  },
};
