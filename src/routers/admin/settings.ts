import {Router} from "express";
import {send} from "../../lib/http.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {upload} from "../../middleware/upload.js";
import type TemplateService from "../../services/template-service.js";
import type UserService from "../../services/user-service.js";

const currentPath = "/admin/settings";

export function settingsRouter(userService: UserService, templates: TemplateService): Router {
    const router = Router();

    router.get("/settings", (req, res) => {
        const user = getAuth(req);
        send(res, templates.admin.settings({user, currentPath, cacheStats: templates.cacheStats()}));
    });

    router.post("/settings/photo", upload.single("photo"), async (req, res) => {
        const user = getAuth(req);
        const cacheStats = templates.cacheStats();
        if (!req.file) {
            return send(
                res,
                templates.admin.settings({user, currentPath, cacheStats, photoError: "Choose an image"}),
                400
            );
        }
        const result = await userService.uploadPhoto(user, req.file);
        if (!result.ok) {
            return send(
                res,
                templates.admin.settings({user, currentPath, cacheStats, photoError: "Upload failed"}),
                500
            );
        }
        res.redirect(302, currentPath);
    });

    router.post("/settings/photo/delete", async (req, res) => {
        const user = getAuth(req);
        const result = await userService.deletePhoto(user);
        if (!result.ok) {
            const cacheStats = templates.cacheStats();
            return send(
                res,
                templates.admin.settings({user, currentPath, cacheStats, photoError: "Failed to remove photo"}),
                500
            );
        }
        res.redirect(302, currentPath);
    });

    router.post("/settings/cache/clear", (_req, res) => {
        templates.clearCache();
        res.redirect(302, currentPath);
    });

    return router;
}
