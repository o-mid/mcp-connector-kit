import pino, { type Logger } from "pino";
import type { ToolContext } from "../contract/types.js";

/** Creates the shared JSON logger for gateway and CLI. */
export function createMckLogger(level: string): Logger {
  return pino({
    level: level || "info",
    name: "mck",
    base: { service: "mck" },
  });
}

/** Adapts pino to the minimal ToolContext log interface. */
export function toolLogFromPino(logger: Logger): ToolContext["log"] {
  return {
    info: (obj, msg) => logger.info(obj, msg),
    warn: (obj, msg) => logger.warn(obj, msg),
  };
}
