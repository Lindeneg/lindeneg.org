import {Router} from "express";
import {SettingsView} from "../../ui/admin/views/settings.js";
import {type AdminDeps, bufferToDataUri, loadUser, send, upload} from "./lib.js";

export function settingsRouter(deps: AdminDeps): Router {
    const router = Router();

    router.get("/settings", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        send(res, SettingsView({user, currentPath: "/admin/settings"}));
    });

    router.post("/settings/photo", upload.single("photo"), async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        if (!req.file) {
            return send(
                res,
                SettingsView({user, currentPath: "/admin/settings", photoError: "Choose an image"}),
                400
            );
        }
        const result = await deps.userService.uploadPhoto(user.id, bufferToDataUri(req.file));
        if (!result.ok) {
            return send(
                res,
                SettingsView({user, currentPath: "/admin/settings", photoError: "Upload failed"}),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/settings");
    });

    router.post("/settings/photo/delete", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const result = await deps.userService.deletePhoto(user.id);
        if (!result.ok) {
            return send(
                res,
                SettingsView({
                    user,
                    currentPath: "/admin/settings",
                    photoError: "Failed to remove photo",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/settings");
    });

    router.post("/settings/cache/clear", (_req, res) => {
        deps.templateService.clearCache();
        res.redirect(302, "/admin/settings");
    });

    return router;
}
