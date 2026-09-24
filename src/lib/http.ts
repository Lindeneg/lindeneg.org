import type {Response} from "express";

export function send(res: Response, html: string, status = 200) {
    res.status(status).type("html").send(html);
}
