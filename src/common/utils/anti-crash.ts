import fs from "fs";
import chalk from "chalk";
import { DateTime } from "luxon";

type ErrorHandler = (error: Error, origin: string) => void;
type UnhandledRejectionHandler = (reason: unknown, promise: Promise<unknown>) => void;

interface ErrorLogger {
  logError: (error: unknown) => void;
  init: () => Promise<void>;
}

const antiCrash: ErrorLogger = {
  logError: (error: unknown): void => {
    const timestamp = DateTime.now().toISO();
    const errorStack = error instanceof Error ? error.stack : JSON.stringify(error);
    const logMessage = `${timestamp} - ${errorStack}\n`;

    fs.appendFile("error.log", logMessage, (writeError) => {
      if (writeError) {
        console.error(chalk.yellow("⚠️  Failed to write to error log:"), writeError);
      }
    });
  },

  init: async (): Promise<void> => {
    console.log(chalk.green("🛡️  AntiCrash system initializing..."));

    const exceptionHandler: ErrorHandler = (error, origin) => {
      console.error(chalk.redBright("💥  Uncaught Exception:"), error);
      console.error(chalk.yellow(`🗂️  Origin: ${origin}`));
      antiCrash.logError(error);
    };

    const rejectionHandler: UnhandledRejectionHandler = (reason, promise) => {
      console.error(chalk.redBright("⚠️  Unhandled Rejection at:"), promise);
      console.error(chalk.yellow("📑  Reason:"), reason);
      antiCrash.logError(reason);
    };

    const monitorHandler: ErrorHandler = (error, origin) => {
      console.warn(chalk.yellow("🔍  Exception Monitor:"), error);
      console.warn(chalk.yellow(`📌  Origin: ${origin}`));
    };

    // Register process handlers
    process
      .on("uncaughtException", exceptionHandler)
      .on("unhandledRejection", rejectionHandler)
      .on("uncaughtExceptionMonitor", monitorHandler);

    console.log(chalk.green("✅  AntiCrash system ready!"));
  },
};

export default antiCrash;
