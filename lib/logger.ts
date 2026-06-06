import prisma from "./prisma";

export type LogType = "webhook" | "ai_summary" | "cron" | "system";
export type LogLevel = "info" | "warning" | "error";

export async function logToSystem(
  type: LogType,
  level: LogLevel,
  message: string,
  details?: string | object | null
) {
  try {
    let detailsStr: string | null = null;
    if (details) {
      if (typeof details === "string") {
        detailsStr = details;
      } else {
        detailsStr = JSON.stringify(details, null, 2);
      }
    }

    const log = await prisma.systemLog.create({
      data: {
        type,
        level,
        message,
        details: detailsStr,
      },
    });

    // Also console log it
    const consoleMsg = `[SystemLog][${type.toUpperCase()}][${level.toUpperCase()}] ${message}`;
    if (level === "error") {
      console.error(consoleMsg, detailsStr || "");
    } else if (level === "warning") {
      console.warn(consoleMsg, detailsStr || "");
    } else {
      console.log(consoleMsg);
    }

    return log;
  } catch (error) {
    console.error("Failed to write system log to database:", error);
    return null;
  }
}
