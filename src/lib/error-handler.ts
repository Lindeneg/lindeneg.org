import type {Request, Response, NextFunction} from "express";

export type GlobalErrorHandler = (
    error: any,
    _: Request,
    res: Response,
    next: NextFunction
) => void;

export const globalErrorHandler: GlobalErrorHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        console.error("error after headers sent", error);
        return next(error);
    }
    console.error("unhandled error", error);
    res.status(500).type("html").send("<!doctype html><h1>Something went wrong.</h1>");
};
