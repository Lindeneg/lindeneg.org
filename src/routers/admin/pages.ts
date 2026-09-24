import {Router} from "express";
import z from "zod";
import {send} from "../../lib/http.js";
import {parsePagination} from "../../lib/pagination.js";
import {fieldErrors, toBool} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {PageError} from "../../services/page-service.js";
import type PageService from "../../services/page-service.js";
import type TemplateService from "../../services/template-service.js";

const PageSchema = z.object({
    name: z.string().min(1, "Required"),
    slug: z.string().optional(),
    title: z.string().min(1, "Required"),
    description: z.string().default(""),
    published: z.unknown().transform(toBool),
});

const SectionSchema = z.object({
    content: z.string().min(1, "Required"),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    published: z.unknown().transform(toBool),
});

const currentPath = "/admin/pages";

export function pagesRouter(pageService: PageService, templates: TemplateService): Router {
    const router = Router();

    const loadError = (ctx: PageError, what: string) => {
        const notFound = ctx === PageError.NOT_FOUND;
        return {status: notFound ? 404 : 500, message: notFound ? `${what} not found` : `Failed to load ${what.toLowerCase()}`};
    };

    router.get("/pages", async (req, res) => {
        const user = getAuth(req);
        const result = await pageService.list(parsePagination(req));
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to load pages"}), 500);
        }
        send(res, templates.admin.pagesList({user, currentPath, pages: result.data}));
    });

    router.get("/pages/new", (req, res) => {
        const user = getAuth(req);
        send(res, templates.admin.pageForm({user, currentPath, mode: "create"}));
    });

    router.post("/pages/new", async (req, res) => {
        const user = getAuth(req);
        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.pageForm({
                    user,
                    currentPath,
                    mode: "create",
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await pageService.create(parsed.data);
        if (!result.ok) {
            return send(
                res,
                templates.admin.pageForm({
                    user,
                    currentPath,
                    mode: "create",
                    values: req.body,
                    topError: "Failed to create page (name or slug may already exist)",
                }),
                400
            );
        }
        res.redirect(302, `/admin/pages/${result.data.id}/edit`);
    });

    router.get("/pages/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const result = await pageService.get(req.params.id);
        if (!result.ok) {
            const {status, message} = loadError(result.ctx, "Page");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }
        send(res, templates.admin.pageForm({user, currentPath, mode: "edit", page: result.data}));
    });

    router.post("/pages/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const existing = await pageService.get(req.params.id);
        if (!existing.ok) {
            const {status, message} = loadError(existing.ctx, "Page");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }

        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.pageForm({
                    user,
                    currentPath,
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await pageService.update(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                templates.admin.pageForm({
                    user,
                    currentPath,
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    topError: "Failed to update page (name or slug may already exist)",
                }),
                400
            );
        }
        res.redirect(302, `/admin/pages/${req.params.id}/edit`);
    });

    router.post("/pages/:id/delete", async (req, res) => {
        const user = getAuth(req);
        const result = await pageService.delete(req.params.id);
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to delete page"}), 500);
        }
        res.redirect(302, currentPath);
    });

    router.get("/pages/:pageId/sections/new", async (req, res) => {
        const user = getAuth(req);
        const page = await pageService.get(req.params.pageId);
        if (!page.ok) {
            const {status, message} = loadError(page.ctx, "Page");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }
        send(
            res,
            templates.admin.sectionForm({
                mode: "create",
                page: page.data,
                values: {position: page.data.sections.length, content: "", published: false},
            })
        );
    });

    router.post("/pages/:pageId/sections/new", async (req, res) => {
        const user = getAuth(req);
        const page = await pageService.get(req.params.pageId);
        if (!page.ok) {
            const {status, message} = loadError(page.ctx, "Page");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.sectionForm({
                    mode: "create",
                    page: page.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await pageService.createSection(page.data.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                templates.admin.sectionForm({
                    mode: "create",
                    page: page.data,
                    values: req.body,
                    topError: "Failed to create section",
                }),
                500
            );
        }
        res.redirect(302, `/admin/pages/${page.data.id}/edit`);
    });

    router.get("/sections/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const result = await pageService.getSection(req.params.id);
        if (!result.ok) {
            const {status, message} = loadError(result.ctx, "Section");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }
        send(res, templates.admin.sectionForm({mode: "edit", page: result.data.page, section: result.data}));
    });

    router.post("/sections/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const found = await pageService.getSection(req.params.id);
        if (!found.ok) {
            const {status, message} = loadError(found.ctx, "Section");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.sectionForm({
                    mode: "edit",
                    page: found.data.page,
                    section: found.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await pageService.updateSection(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                templates.admin.sectionForm({
                    mode: "edit",
                    page: found.data.page,
                    section: found.data,
                    values: req.body,
                    topError: "Failed to update section",
                }),
                500
            );
        }
        res.redirect(302, `/admin/pages/${found.data.pageId}/edit`);
    });

    router.post("/sections/:id/delete", async (req, res) => {
        const user = getAuth(req);
        const result = await pageService.deleteSection(req.params.id);
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to delete section"}), 500);
        }
        res.redirect(302, `/admin/pages/${result.data.pageId}/edit`);
    });

    return router;
}
