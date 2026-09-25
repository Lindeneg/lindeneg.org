import {Router} from "express";
import z from "zod";
import {AppError} from "../../lib/errors.js";
import {send} from "../../lib/http.js";
import {parsePagination} from "../../lib/pagination.js";
import {checkbox, fieldErrors, requiredText} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {pageSlug} from "../../services/page-service.js";
import type PageService from "../../services/page-service.js";
import {PageFormView} from "../../ui/views/admin/page-form.js";
import {PagesListView} from "../../ui/views/admin/pages-list.js";
import {SectionFormView} from "../../ui/views/admin/section-form.js";
import {errorStatus, sendActionError, sendLoadError} from "./respond.js";

// paths the site routes itself, so a page with one of these slugs could never be reached
const RESERVED_SLUGS = ["admin", "api", "blog", "healthz"];

const PageSchema = z
    .object({
        name: requiredText(),
        slug: z.string().trim().optional(),
        title: requiredText(),
        description: z.string().trim().default(""),
        published: checkbox(),
    })
    .refine((page) => pageSlug(page) !== "", {
        path: ["slug"],
        message: "Enter a slug with at least one letter or digit",
    })
    .refine((page) => !RESERVED_SLUGS.includes(pageSlug(page)), {
        path: ["slug"],
        message: `Reserved by the site: ${RESERVED_SLUGS.join(", ")}`,
    });

const SectionSchema = z.object({
    content: z.string().refine((content) => content.trim() !== "", "Required"),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    published: checkbox(),
});

const currentPath = "/admin/pages";

function pageSaveError(ctx: AppError): string {
    return ctx === AppError.CONFLICT ? "Another page already uses this name or slug" : "Failed to save page";
}

export function pagesRouter(pageService: PageService): Router {
    const router = Router();

    router.get("/pages", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const result = await pageService.list(parsePagination(req));
        if (!result.ok) return sendLoadError(res, page, result.ctx, "Pages");
        send(res, PagesListView({...page, pages: result.data}));
    });

    router.get("/pages/new", (req, res) => {
        send(res, PageFormView({user: getAuth(req), currentPath, mode: "create"}));
    });

    router.post("/pages/new", async (req, res) => {
        const user = getAuth(req);
        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PageFormView({user, currentPath, mode: "create", values: req.body, errors: fieldErrors(parsed.error)}),
                400
            );
        }
        const result = await pageService.create(parsed.data);
        if (!result.ok) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath,
                    mode: "create",
                    values: req.body,
                    topError: pageSaveError(result.ctx),
                }),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, `/admin/pages/${result.data.id}/edit`);
    });

    router.get("/pages/:id/edit", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const result = await pageService.get(req.params.id);
        if (!result.ok) return sendLoadError(res, page, result.ctx, "Page");
        send(res, PageFormView({...page, mode: "edit", page: result.data}));
    });

    router.post("/pages/:id/edit", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const existing = await pageService.get(req.params.id);
        if (!existing.ok) return sendLoadError(res, page, existing.ctx, "Page");

        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PageFormView({
                    ...page,
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
            if (result.ctx === AppError.NOT_FOUND) return sendLoadError(res, page, result.ctx, "Page");
            return send(
                res,
                PageFormView({
                    ...page,
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    topError: pageSaveError(result.ctx),
                }),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, `/admin/pages/${req.params.id}/edit`);
    });

    router.post("/pages/:id/delete", async (req, res) => {
        const result = await pageService.delete(req.params.id);
        if (!result.ok) {
            return sendActionError(res, {user: getAuth(req), currentPath}, result.ctx, "Page", "delete page");
        }
        res.redirect(302, currentPath);
    });

    router.get("/pages/:pageId/sections/new", async (req, res) => {
        const page = await pageService.get(req.params.pageId);
        if (!page.ok) return sendLoadError(res, {user: getAuth(req), currentPath}, page.ctx, "Page");
        send(
            res,
            SectionFormView({
                mode: "create",
                page: page.data,
                values: {position: page.data.sections.length, content: "", published: false},
            })
        );
    });

    router.post("/pages/:pageId/sections/new", async (req, res) => {
        const page = await pageService.get(req.params.pageId);
        if (!page.ok) return sendLoadError(res, {user: getAuth(req), currentPath}, page.ctx, "Page");

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                SectionFormView({
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
                SectionFormView({
                    mode: "create",
                    page: page.data,
                    values: req.body,
                    topError: "Failed to create section",
                }),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, `/admin/pages/${page.data.id}/edit`);
    });

    router.get("/sections/:id/edit", async (req, res) => {
        const result = await pageService.getSection(req.params.id);
        if (!result.ok) return sendLoadError(res, {user: getAuth(req), currentPath}, result.ctx, "Section");
        send(res, SectionFormView({mode: "edit", page: result.data.page, section: result.data}));
    });

    router.post("/sections/:id/edit", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const found = await pageService.getSection(req.params.id);
        if (!found.ok) return sendLoadError(res, page, found.ctx, "Section");

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                SectionFormView({
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
            if (result.ctx === AppError.NOT_FOUND) return sendLoadError(res, page, result.ctx, "Section");
            return send(
                res,
                SectionFormView({
                    mode: "edit",
                    page: found.data.page,
                    section: found.data,
                    values: req.body,
                    topError: "Failed to update section",
                }),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, `/admin/pages/${found.data.pageId}/edit`);
    });

    router.post("/sections/:id/delete", async (req, res) => {
        const result = await pageService.deleteSection(req.params.id);
        if (!result.ok) {
            return sendActionError(res, {user: getAuth(req), currentPath}, result.ctx, "Section", "delete section");
        }
        res.redirect(302, `/admin/pages/${result.data.pageId}/edit`);
    });

    return router;
}
