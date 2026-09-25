import {Router, type Request, type Response} from "express";
import {AppError} from "../lib/errors.js";
import type {Result} from "../lib/result.js";
import {slugify} from "../lib/slugify.js";
import {pagePath} from "../services/template-service.js";
import type TemplateService from "../services/template-service.js";

function decodePath(path: string): string {
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
}

export function makeSitePublicRouter(templateService: TemplateService): Router {
    const router = Router();

    const sendNotFound = async (res: Response, currentPath: string) => {
        const notFound = await templateService.getNotFound(currentPath);
        res.status(404).type("html").send(notFound);
    };

    const sendServerError = async (res: Response, currentPath: string) => {
        const serverError = await templateService.getServerError(currentPath);
        res.status(500).type("html").send(serverError);
    };

    // a missing page is a 404, a failing database a 500
    const sendResult = async (req: Request, res: Response, result: Result<string, AppError>) => {
        if (result.ok) return res.type("html").send(result.data);
        if (result.ctx === AppError.NOT_FOUND) return sendNotFound(res, req.path);
        await sendServerError(res, req.path);
    };

    router.get("/blog", async (req, res) => {
        const page = Number(req.query.page) || 1;
        const tag = typeof req.query.tag === "string" && req.query.tag !== "" ? req.query.tag : undefined;
        await sendResult(req, res, await templateService.getBlogList(page, tag));
    });

    router.get("/blog/:slug", async (req, res) => {
        await sendResult(req, res, await templateService.getBlogPost(req.params.slug));
    });

    router.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();

        // a path with a file extension is a missing static file, never a page
        if (/\.[a-z0-9]+$/i.test(req.path)) {
            res.status(404).type("text").send("Not found");
            return;
        }

        // every page has exactly one url, so variants (case, trailing slash, /home) redirect to it
        const slug = slugify(decodePath(req.path)) || "home";
        const canonical = pagePath(slug);
        if (req.path !== canonical) {
            res.redirect(301, canonical + req.url.slice(req.path.length));
            return;
        }

        await sendResult(req, res, await templateService.getPage(slug));
    });

    return router;
}
