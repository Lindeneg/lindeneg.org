import {Router} from "express";
import z from "zod";
import {AppError} from "../../lib/errors.js";
import {send} from "../../lib/http.js";
import {checkbox, fieldErrors, requiredText} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import type NavigationService from "../../services/navigation-service.js";
import {NavView} from "../../ui/views/admin/nav.js";
import {NavItemFormView} from "../../ui/views/admin/nav-item-form.js";
import {errorStatus, sendActionError, sendLoadError} from "./respond.js";

const NavBrandSchema = z.object({
    brandName: requiredText(),
});

const NavItemSchema = z.object({
    name: requiredText(),
    href: requiredText(),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    alignment: z.enum(["LEFT", "RIGHT"]),
    newTab: checkbox(),
});

const currentPath = "/admin/navigation";

export function navigationRouter(navigationService: NavigationService): Router {
    const router = Router();

    router.get("/navigation", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const nav = await navigationService.get();
        if (!nav.ok) return sendLoadError(res, page, nav.ctx, "Navigation");
        send(res, NavView({...page, nav: nav.data}));
    });

    router.post("/navigation", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const nav = await navigationService.get();
        if (!nav.ok) return sendLoadError(res, page, nav.ctx, "Navigation");

        const parsed = NavBrandSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavView({...page, nav: nav.data, brandValues: req.body, brandErrors: fieldErrors(parsed.error)}),
                400
            );
        }
        const result = await navigationService.updateBrand(nav.data.id, parsed.data.brandName);
        if (!result.ok) {
            return send(
                res,
                NavView({...page, nav: nav.data, brandValues: req.body, brandTopError: "Failed to update"}),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, currentPath);
    });

    router.get("/nav-items/new", (req, res) => {
        send(res, NavItemFormView({user: getAuth(req), currentPath, mode: "create"}));
    });

    router.post("/nav-items/new", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const nav = await navigationService.get();
        if (!nav.ok) return sendLoadError(res, page, nav.ctx, "Navigation");

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavItemFormView({...page, mode: "create", values: req.body, errors: fieldErrors(parsed.error)}),
                400
            );
        }
        const result = await navigationService.createItem(nav.data.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavItemFormView({...page, mode: "create", values: req.body, topError: "Failed to create"}),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, currentPath);
    });

    router.get("/nav-items/:id/edit", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const found = await navigationService.getItem(req.params.id);
        if (!found.ok) return sendLoadError(res, page, found.ctx, "Item");
        send(res, NavItemFormView({...page, mode: "edit", item: found.data.item}));
    });

    router.post("/nav-items/:id/edit", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const found = await navigationService.getItem(req.params.id);
        if (!found.ok) return sendLoadError(res, page, found.ctx, "Item");

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavItemFormView({
                    ...page,
                    mode: "edit",
                    item: found.data.item,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await navigationService.updateItem(req.params.id, parsed.data);
        if (!result.ok) {
            if (result.ctx === AppError.NOT_FOUND) return sendLoadError(res, page, result.ctx, "Item");
            return send(
                res,
                NavItemFormView({
                    ...page,
                    mode: "edit",
                    item: found.data.item,
                    values: req.body,
                    topError: "Failed to update",
                }),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, currentPath);
    });

    router.post("/nav-items/:id/delete", async (req, res) => {
        const result = await navigationService.deleteItem(req.params.id);
        if (!result.ok) {
            return sendActionError(res, {user: getAuth(req), currentPath}, result.ctx, "Item", "delete item");
        }
        res.redirect(302, currentPath);
    });

    return router;
}
