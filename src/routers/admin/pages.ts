import {Router} from "express";
import z from "zod";
import {parsePagination, toSkipTake} from "../../lib/pagination.js";
import {slugify} from "../../lib/slugify.js";
import {PageFormView} from "../../ui/admin/views/page-form.js";
import {PagesListView} from "../../ui/admin/views/pages-list.js";
import {SectionFormView} from "../../ui/admin/views/section-form.js";
import {type AdminDeps, fieldErrors, loadUser, send, toBool} from "./lib.js";

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

export function pagesRouter(deps: AdminDeps): Router {
    const router = Router();

    const findSectionWithPage = async (sectionId: string) => {
        const all = await deps.pageRepo.list({});
        if (!all.ok) return null;
        for (const p of all.data.data) {
            const s = p.sections.find((x) => x.id === sectionId);
            if (s) return {page: p, section: s};
        }
        return null;
    };

    router.get("/pages", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");

        const pagination = parsePagination(req);
        const result = await deps.pageRepo.list(toSkipTake(pagination));
        if (!result.ok) return send(res, "Failed to load pages", 500);

        const totalPages = Math.max(1, Math.ceil(result.data.total / pagination.pageSize));
        send(
            res,
            PagesListView({
                user,
                currentPath: "/admin/pages",
                pages: result.data.data,
                page: pagination.page,
                totalPages,
            })
        );
    });

    router.get("/pages/new", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        send(res, PageFormView({user, currentPath: "/admin/pages", mode: "create"}));
    });

    router.post("/pages/new", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");

        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "create",
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }

        const data = parsed.data;
        const slug = data.slug && data.slug.trim() !== "" ? slugify(data.slug) : slugify(data.name);

        const result = await deps.pageRepo.create({
            name: data.name,
            slug,
            title: data.title,
            description: data.description,
            published: data.published,
        });
        if (!result.ok) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "create",
                    values: req.body,
                    topError: "Failed to create page (name or slug may already exist)",
                }),
                400
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${result.data.id}/edit`);
    });

    router.get("/pages/:id/edit", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");

        const result = await deps.pageRepo.getById(req.params.id);
        if (!result.ok || !result.data) return send(res, "Page not found", 404);
        send(res, PageFormView({user, currentPath: "/admin/pages", mode: "edit", page: result.data}));
    });

    router.post("/pages/:id/edit", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");

        const existing = await deps.pageRepo.getById(req.params.id);
        if (!existing.ok || !existing.data) return send(res, "Page not found", 404);

        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const data = parsed.data;
        const slug = data.slug && data.slug.trim() !== "" ? slugify(data.slug) : slugify(data.name);

        const updated = await deps.pageRepo.update(req.params.id, {
            name: data.name,
            slug,
            title: data.title,
            description: data.description,
            published: data.published,
        });
        if (!updated.ok) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    topError: "Failed to update page (name or slug may already exist)",
                }),
                400
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${req.params.id}/edit`);
    });

    router.post("/pages/:id/delete", async (req, res) => {
        const result = await deps.pageRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed to delete page", 500);
        deps.templateService.clearCache();
        res.redirect(302, "/admin/pages");
    });

    router.get("/pages/:pageId/sections/new", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const pageResult = await deps.pageRepo.getById(req.params.pageId);
        if (!pageResult.ok || !pageResult.data) return send(res, "Page not found", 404);
        send(
            res,
            SectionFormView({
                mode: "create",
                page: pageResult.data,
                values: {position: pageResult.data.sections.length, content: "", published: false},
            })
        );
    });

    router.post("/pages/:pageId/sections/new", async (req, res) => {
        const pageResult = await deps.pageRepo.getById(req.params.pageId);
        if (!pageResult.ok || !pageResult.data) return send(res, "Page not found", 404);

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                SectionFormView({
                    mode: "create",
                    page: pageResult.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.sectionRepo.create({
            pageId: req.params.pageId,
            ...parsed.data,
        });
        if (!result.ok) {
            return send(
                res,
                SectionFormView({
                    mode: "create",
                    page: pageResult.data,
                    values: req.body,
                    topError: "Failed to create section",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${req.params.pageId}/edit`);
    });

    router.get("/sections/:id/edit", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const found = await findSectionWithPage(req.params.id);
        if (!found) return send(res, "Section not found", 404);
        send(res, SectionFormView({mode: "edit", page: found.page, section: found.section}));
    });

    router.post("/sections/:id/edit", async (req, res) => {
        const found = await findSectionWithPage(req.params.id);
        if (!found) return send(res, "Section not found", 404);

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                SectionFormView({
                    mode: "edit",
                    page: found.page,
                    section: found.section,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.sectionRepo.update(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                SectionFormView({
                    mode: "edit",
                    page: found.page,
                    section: found.section,
                    values: req.body,
                    topError: "Failed to update section",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${found.page.id}/edit`);
    });

    router.post("/sections/:id/delete", async (req, res) => {
        const found = await findSectionWithPage(req.params.id);
        const result = await deps.sectionRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        deps.templateService.clearCache();
        res.redirect(302, found ? `/admin/pages/${found.page.id}/edit` : "/admin/pages");
    });

    return router;
}
