import type {Request, Response, NextFunction} from "express";
import type LoggerService from "../services/logger-service.js";

export type GlobalErrorHandler = (error: any, _: Request, res: Response, next: NextFunction) => void;

export function makeGlobalErrorHandler(log: LoggerService): GlobalErrorHandler {
    return (error, _req, res, next) => {
        if (res.headersSent) {
            log.error(error, "error after headers sent");
            return next(error);
        }
        log.error(error, "unhandled error");
        res.status(500).type("html").send("<!doctype html><h1>Something went wrong.</h1>");
    };
}
