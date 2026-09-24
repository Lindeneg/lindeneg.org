import {Router} from "express";
import z from "zod";
import {send} from "../../lib/http.js";
import {optStr} from "../../lib/validation.js";
import {AuthError} from "../../services/auth-service.js";
import type AuthService from "../../services/auth-service.js";
import type TemplateService from "../../services/template-service.js";

const LoginSchema = z.object({
    email: z.email("Enter a valid email"),
    password: z.string().min(1, "Required"),
});

export function loginRouter(authService: AuthService, templates: TemplateService): Router {
    const router = Router();

    router.get("/login", (_req, res) => {
        send(res, templates.admin.login({}));
    });

    router.post("/login", async (req, res) => {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.login({
                    error: "Enter a valid email and password",
                    email: optStr(req.body?.email),
                }),
                400
            );
        }
        const result = await authService.login(parsed.data.email, parsed.data.password);
        if (!result.ok) {
            const invalid = result.ctx === AuthError.INVALID_CREDENTIALS;
            return send(
                res,
                templates.admin.login({
                    error: invalid ? "Invalid email or password" : "Something went wrong, try again",
                    email: parsed.data.email,
                }),
                invalid ? 401 : 500
            );
        }
        authService.setAuthCookies(res, result.data);
        res.redirect(302, "/admin");
    });

    return router;
}

export function logoutRouter(authService: AuthService): Router {
    const router = Router();
    router.post("/logout", (_req, res) => {
        authService.clearAuthCookies(res);
        res.redirect(302, "/admin/login");
    });
    return router;
}
