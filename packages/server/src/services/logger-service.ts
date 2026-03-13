import pino, { type LogFn, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { Request } from 'express';
import type { NodeEnv } from '@lindeneg/shared';

// TODO just get from environment
function getLogLevel(nodeEnv: NodeEnv) {
  switch (nodeEnv) {
    case 'test':
      return 'silent';
    case 'development':
      return 'debug';
    default:
      return 'info';
  }
}

class LoggerService {
  readonly #logger: Logger;

  constructor(nodeEnv: NodeEnv) {
    this.#logger = pino({
      level: getLogLevel(nodeEnv),
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,req,res,reqId,responseTime,userId',
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
        const user = r.auth?.userId ? ` user=${r.auth.userId}` : '';
        return `${req.id} ${req.method} ${req.url} ${res.statusCode}${user} ${responseTime}ms`;
      },
      customErrorMessage: (req, res, err) => {
        const r = req as Request;
        const user = r.auth?.userId ? ` user=${r.auth.userId}` : '';
        return `${req.id} ${req.method} ${req.url} ${res.statusCode}${user} ${err.message}`;
      },
    });
  }
}

export default LoggerService;
