import {Router} from "express";
import z from "zod";
import {send} from "../../lib/http.js";
import {checkbox, fieldErrors} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {NavigationError} from "../../services/navigation-service.js";
import type NavigationService from "../../services/navigation-service.js";
import type TemplateService from "../../services/template-service.js";

const NavBrandSchema = z.object({
    brandName: z.string().min(1, "Required"),
});

const NavItemSchema = z.object({
    navigationId: z.string().min(1, "Required"),
    name: z.string().min(1, "Required"),
    href: z.string().min(1, "Required"),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    alignment: z.enum(["LEFT", "RIGHT"]),
    newTab: checkbox(),
});

const currentPath = "/admin/navigation";

export function navigationRouter(navigationService: NavigationService, templates: TemplateService): Router {
    const router = Router();

    const loadError = (ctx: NavigationError, what: string) => {
        const notFound = ctx === NavigationError.NOT_FOUND;
        return {
            status: notFound ? 404 : 500,
            message: notFound ? `${what} not found` : `Failed to load ${what.toLowerCase()}`,
        };
    };

    router.get("/navigation", async (req, res) => {
        const user = getAuth(req);
        const nav = await navigationService.get();
        if (!nav.ok) {
            const {status, message} = loadError(nav.ctx, "Navigation");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }
        send(res, templates.admin.nav({user, currentPath, nav: nav.data}));
    });

    router.post("/navigation", async (req, res) => {
        const user = getAuth(req);
        const nav = await navigationService.get();
        if (!nav.ok) {
            const {status, message} = loadError(nav.ctx, "Navigation");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }

        const parsed = NavBrandSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.nav({
                    user,
                    currentPath,
                    nav: nav.data,
                    brandValues: req.body,
                    brandErrors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await navigationService.updateBrand(nav.data.id, parsed.data.brandName);
        if (!result.ok) {
            return send(
                res,
                templates.admin.nav({
                    user,
                    currentPath,
                    nav: nav.data,
                    brandValues: req.body,
                    brandTopError: "Failed to update",
                }),
                500
            );
        }
        res.redirect(302, currentPath);
    });

    router.get("/nav-items/new", async (req, res) => {
        const user = getAuth(req);
        const nav = await navigationService.get();
        if (!nav.ok) {
            const {status, message} = loadError(nav.ctx, "Navigation");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }
        send(res, templates.admin.navItemForm({user, currentPath, mode: "create", nav: nav.data}));
    });

    router.post("/nav-items/new", async (req, res) => {
        const user = getAuth(req);
        const nav = await navigationService.get();
        if (!nav.ok) {
            const {status, message} = loadError(nav.ctx, "Navigation");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.navItemForm({
                    user,
                    currentPath,
                    mode: "create",
                    nav: nav.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await navigationService.createItem(parsed.data);
        if (!result.ok) {
            return send(
                res,
                templates.admin.navItemForm({
                    user,
                    currentPath,
                    mode: "create",
                    nav: nav.data,
                    values: req.body,
                    topError: "Failed to create",
                }),
                500
            );
        }
        res.redirect(302, currentPath);
    });

    router.get("/nav-items/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const found = await navigationService.getItem(req.params.id);
        if (!found.ok) {
            const {status, message} = loadError(found.ctx, "Item");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }
        send(
            res,
            templates.admin.navItemForm({
                user,
                currentPath,
                mode: "edit",
                nav: found.data.nav,
                item: found.data.item,
            })
        );
    });

    router.post("/nav-items/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const found = await navigationService.getItem(req.params.id);
        if (!found.ok) {
            const {status, message} = loadError(found.ctx, "Item");
            return send(res, templates.admin.error({user, currentPath, message}), status);
        }

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.navItemForm({
                    user,
                    currentPath,
                    mode: "edit",
                    nav: found.data.nav,
                    item: found.data.item,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await navigationService.updateItem(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                templates.admin.navItemForm({
                    user,
                    currentPath,
                    mode: "edit",
                    nav: found.data.nav,
                    item: found.data.item,
                    values: req.body,
                    topError: "Failed to update",
                }),
                500
            );
        }
        res.redirect(302, currentPath);
    });

    router.post("/nav-items/:id/delete", async (req, res) => {
        const user = getAuth(req);
        const result = await navigationService.deleteItem(req.params.id);
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to delete item"}), 500);
        }
        res.redirect(302, currentPath);
    });

    return router;
}
