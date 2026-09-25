import {Router} from "express";
import z from "zod";
import {send} from "../../lib/http.js";
import {optStr} from "../../lib/validation.js";
import {failedAttemptLimiter, TOO_MANY_FAILED_ATTEMPTS} from "../../middleware/failed-attempt-limiter.js";
import {AuthError} from "../../services/auth-service.js";
import type AuthService from "../../services/auth-service.js";
import {LoginView} from "../../ui/views/admin/login.js";

const LoginSchema = z.object({
    email: z.email("Enter a valid email"),
    password: z.string().min(1, "Required"),
});

export function loginRouter(authService: AuthService): Router {
    const router = Router();

    const loginLimiter = failedAttemptLimiter((req, res) => {
        send(res, LoginView({error: TOO_MANY_FAILED_ATTEMPTS, email: optStr(req.body?.email)}), 429);
    });

    router.get("/login", (_req, res) => {
        send(res, LoginView({}));
    });

    router.post("/login", loginLimiter, async (req, res) => {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                LoginView({error: "Enter a valid email and password", email: optStr(req.body?.email)}),
                400
            );
        }
        const result = await authService.login(parsed.data.email, parsed.data.password);
        if (!result.ok) {
            const invalid = result.ctx === AuthError.INVALID_CREDENTIALS;
            return send(
                res,
                LoginView({
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
