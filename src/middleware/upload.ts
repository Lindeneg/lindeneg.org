import multer from "multer";
import type {RequestHandler} from "express";
import {MAX_UPLOAD_BYTES} from "../lib/http.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: MAX_UPLOAD_BYTES},
});

// upload.single, but a rejected file becomes req.uploadError so the route can re-render its form
export function singleImage(field: string): RequestHandler {
    const handler = upload.single(field);
    return (req, res, next) => {
        handler(req, res, (err: unknown) => {
            if (!(err instanceof multer.MulterError)) return next(err);
            req.uploadError =
                err.code === "LIMIT_FILE_SIZE"
                    ? `Image must be ${MAX_UPLOAD_BYTES / 1024 / 1024}MB or smaller`
                    : "Upload failed, try again";
            next();
        });
    };
}
