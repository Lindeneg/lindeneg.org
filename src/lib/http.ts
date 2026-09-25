import type {Response} from "express";

// image uploads; the form inputs check it before submitting, multer enforces it
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function send(res: Response, html: string, status = 200) {
    res.status(status).type("html").send(html);
}
