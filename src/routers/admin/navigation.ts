import {Router} from "express";
import z from "zod";
import {NavItemFormView} from "../../ui/admin/views/nav-item-form.js";
import {NavView} from "../../ui/admin/views/nav.js";
import {type AdminDeps, fieldErrors, loadUser, send, toBool} from "./lib.js";

const NavBrandSchema = z.object({
    brandName: z.string().min(1, "Required"),
});

const NavItemSchema = z.object({
    navigationId: z.string().min(1, "Required"),
    name: z.string().min(1, "Required"),
    href: z.string().min(1, "Required"),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    alignment: z.enum(["LEFT", "RIGHT"]),
    newTab: z.unknown().transform(toBool),
});

export function navigationRouter(deps: AdminDeps): Router {
    const router = Router();

    router.get("/navigation", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const result = await deps.navigationRepo.get();
        if (!result.ok || !result.data) return send(res, "Navigation not found", 404);
        send(res, NavView({user, currentPath: "/admin/navigation", nav: result.data}));
    });

    router.post("/navigation", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);

        const parsed = NavBrandSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavView({
                    user,
                    currentPath: "/admin/navigation",
                    nav: navResult.data,
                    brandValues: req.body,
                    brandErrors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.navigationRepo.update(navResult.data.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavView({
                    user,
                    currentPath: "/admin/navigation",
                    nav: navResult.data,
                    brandValues: req.body,
                    brandTopError: "Failed to update",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.get("/nav-items/new", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);
        send(
            res,
            NavItemFormView({
                user,
                currentPath: "/admin/navigation",
                mode: "create",
                nav: navResult.data,
            })
        );
    });

    router.post("/nav-items/new", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "create",
                    nav: navResult.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.navigationItemRepo.create(parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "create",
                    nav: navResult.data,
                    values: req.body,
                    topError: "Failed to create",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.get("/nav-items/:id/edit", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);
        const item = navResult.data.items.find((i) => i.id === req.params.id);
        if (!item) return send(res, "Item not found", 404);
        send(
            res,
            NavItemFormView({
                user,
                currentPath: "/admin/navigation",
                mode: "edit",
                nav: navResult.data,
                item,
            })
        );
    });

    router.post("/nav-items/:id/edit", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);
        const item = navResult.data.items.find((i) => i.id === req.params.id);
        if (!item) return send(res, "Item not found", 404);

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "edit",
                    nav: navResult.data,
                    item,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.navigationItemRepo.update(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "edit",
                    nav: navResult.data,
                    item,
                    values: req.body,
                    topError: "Failed to update",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.post("/nav-items/:id/delete", async (req, res) => {
        const result = await deps.navigationItemRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    return router;
}
