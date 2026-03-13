import type {Request, Response, NextFunction} from "express";
import {HttpException} from "../lib/http-exception.js";

export type GlobalErrorHandler = (
    error: any,
    _: Request,
    res: Response,
    next: NextFunction
) => void;

export const globalErrorHandler: GlobalErrorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        console.error("error after headers sent", {reqId: req.id, err: error});
        return next(error);
    }
    if (error instanceof HttpException) {
        console.error({reqId: req.id, statusCode: error.statusCode, message: error.message});
        res.status(error.statusCode).json(error.toResponse());
    } else if (error instanceof Error) {
        console.error("unhandled error", {err: error});
        res.status(500).json(error.message);
    } else {
        console.error("unknown error", {reqId: req.id, err: error});
        res.status(500).json({
            message: "Something went wrong. Please try again.",
        });
    }
};
