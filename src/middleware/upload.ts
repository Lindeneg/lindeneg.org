import multer from "multer";
import type {RequestHandler} from "express";
import {MAX_FORM_BYTES, MAX_UPLOAD_BYTES} from "../lib/http.js";

const upload = multer({
    storage: multer.memoryStorage(),
    // a text field (a post's markdown) gets the same limit as a whole urlencoded form; fields and parts are
    // capped so the total a multipart form can buffer stays bounded (the post form has 6 fields and 1 file)
    limits: {fileSize: MAX_UPLOAD_BYTES, fieldSize: MAX_FORM_BYTES, fields: 20, parts: 25},
});

// upload.single, but a rejected form becomes req.uploadError (the file) or req.fieldTooLarge (a text field)
// so the route can re-render its form instead of hitting the error page
export function singleImage(field: string): RequestHandler {
    const handler = upload.single(field);
    return (req, res, next) => {
        handler(req, res, (err: unknown) => {
            if (!(err instanceof multer.MulterError)) return next(err);
            if (err.code === "LIMIT_FIELD_VALUE") {
                req.fieldTooLarge = true;
                return next();
            }
            req.uploadError =
                err.code === "LIMIT_FILE_SIZE"
                    ? `Image must be ${MAX_UPLOAD_BYTES / 1024 / 1024}MB or smaller`
                    : "Upload failed, try again";
            next();
        });
    };
}
