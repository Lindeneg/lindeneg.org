import {Router, type Request} from "express";
import z from "zod";
import {send} from "../../lib/http.js";
import {fieldErrors} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {singleImage} from "../../middleware/upload.js";
import {AuthError} from "../../services/auth-service.js";
import type AuthService from "../../services/auth-service.js";
import type TemplateService from "../../services/template-service.js";
import type UserService from "../../services/user-service.js";
import {SettingsView, type SettingsViewProps} from "../../ui/views/admin/settings.js";
import {errorStatus} from "./respond.js";

// bcrypt only uses the first 72 bytes of a password
const PasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Required"),
        newPassword: z.string().min(12, "Use at least 12 characters").max(72, "Use at most 72 characters"),
        confirmPassword: z.string(),
    })
    .refine((p) => p.newPassword === p.confirmPassword, {path: ["confirmPassword"], message: "Passwords don't match"});

const currentPath = "/admin/settings";

export function settingsRouter(userService: UserService, authService: AuthService, templates: TemplateService): Router {
    const router = Router();

    const view = (req: Request, props: Partial<SettingsViewProps> = {}) =>
        SettingsView({user: getAuth(req), currentPath, cacheStats: templates.cacheStats(), ...props});

    router.get("/settings", (req, res) => {
        send(res, view(req, {passwordChanged: req.query.password === "changed"}));
    });

    router.post("/settings/photo", singleImage("photo"), async (req, res) => {
        if (req.uploadError) return send(res, view(req, {photoError: req.uploadError}), 400);
        if (!req.file) return send(res, view(req, {photoError: "Choose an image"}), 400);

        const result = await userService.uploadPhoto(getAuth(req), req.file);
        if (!result.ok) return send(res, view(req, {photoError: "Upload failed"}), errorStatus(result.ctx));
        res.redirect(302, currentPath);
    });

    router.post("/settings/photo/delete", async (req, res) => {
        const result = await userService.deletePhoto(getAuth(req));
        if (!result.ok) return send(res, view(req, {photoError: "Failed to remove photo"}), errorStatus(result.ctx));
        res.redirect(302, currentPath);
    });

    router.post("/settings/password", async (req, res) => {
        const parsed = PasswordSchema.safeParse(req.body);
        if (!parsed.success) return send(res, view(req, {passwordErrors: fieldErrors(parsed.error)}), 400);

        const {currentPassword, newPassword} = parsed.data;
        const result = await authService.changePassword(getAuth(req).id, currentPassword, newPassword);
        if (!result.ok) {
            if (result.ctx === AuthError.INVALID_CREDENTIALS) {
                return send(res, view(req, {passwordErrors: {currentPassword: "Wrong password"}}), 400);
            }
            return send(res, view(req, {passwordTopError: "Failed to change password"}), 500);
        }
        // the change revoked the old cookie's token, so this session gets a fresh one
        authService.setAuthCookies(res, result.data);
        res.redirect(302, `${currentPath}?password=changed`);
    });

    router.post("/settings/cache/clear", (_req, res) => {
        templates.clearCache();
        res.redirect(302, currentPath);
    });

    return router;
}
