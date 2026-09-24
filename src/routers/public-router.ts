import {Router, type Response} from "express";
import {slugify} from "../lib/slugify.js";
import type TemplateService from "../services/template-service.js";

export function makeSitePublicRouter(templateService: TemplateService): Router {
    const router = Router();

    const sendNotFound = async (res: Response, currentPath: string) => {
        const notFound = await templateService.getNotFound(currentPath);
        res.status(404).type("html").send(notFound);
    };

    router.get("/blog", async (req, res) => {
        const page = Number(req.query.page) || 1;
        const result = await templateService.getBlogList(page);
        if (result.ok) return res.type("html").send(result.data);
        await sendNotFound(res, req.path);
    });

    router.get("/blog/:slug", async (req, res) => {
        const result = await templateService.getBlogPost(req.params.slug);
        if (result.ok) return res.type("html").send(result.data);
        await sendNotFound(res, req.path);
    });

    router.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const name = slugify(req.path) || "home";
        const result = await templateService.getPage(name, req.path);
        if (result.ok) return res.type("html").send(result.data);
        await sendNotFound(res, req.path);
    });

    return router;
}
