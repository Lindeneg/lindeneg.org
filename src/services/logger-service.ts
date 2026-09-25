import pino, {type LevelWithSilent, type LogFn, type Logger} from "pino";
import {pinoHttp} from "pino-http";
import type {Request} from "express";
import type {NodeEnv} from "../lib/types.js";

const defaultLevels: Record<NodeEnv, LevelWithSilent> = {
    test: "silent",
    development: "debug",
    production: "info",
};

class LoggerService {
    readonly #logger: Logger;

    // level is LOG_LEVEL when set, otherwise derived from NODE_ENV
    constructor(nodeEnv: NodeEnv, level?: LevelWithSilent) {
        this.#logger = pino({
            level: level ?? defaultLevels[nodeEnv],
            // production writes json lines to stdout for the container runtime to collect
            transport:
                nodeEnv === "production"
                    ? undefined
                    : {
                          target: "pino-pretty",
                          options: {
                              colorize: true,
                              translateTime: "HH:MM:ss",
                              ignore: "pid,hostname,req,res,reqId,responseTime,userId",
                          },
                      },
        });
    }

    // just so i can do logService.trace instead of logService.logger.trace
    trace(...args: Parameters<LogFn>) {
        this.#logger.trace(...args);
    }
    debug(...args: Parameters<LogFn>) {
        this.#logger.debug(...args);
    }
    info(...args: Parameters<LogFn>) {
        this.#logger.info(...args);
    }
    warn(...args: Parameters<LogFn>) {
        this.#logger.warn(...args);
    }
    error(...args: Parameters<LogFn>) {
        this.#logger.error(...args);
    }
    fatal(...args: Parameters<LogFn>) {
        this.#logger.fatal(...args);
    }

    makeRequestLogger() {
        return pinoHttp({
            logger: this.#logger,
            quietReqLogger: true,
            customSuccessMessage: (req, res, responseTime) => {
                const r = req as Request;
                const user = r.auth ? ` user=${r.auth.id}` : "";
                return `${req.id} ${req.method} ${req.url} ${res.statusCode}${user} ${responseTime}ms`;
            },
            customErrorMessage: (req, res, err) => {
                const r = req as Request;
                const user = r.auth ? ` user=${r.auth.id}` : "";
                return `${req.id} ${req.method} ${req.url} ${res.statusCode}${user} ${err.message}`;
            },
        });
    }
}

export default LoggerService;
