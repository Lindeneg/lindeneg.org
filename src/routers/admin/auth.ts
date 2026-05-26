import {Router} from "express";
import z from "zod";
import {LoginView} from "../../ui/admin/views/login.js";
import {type AdminDeps, optStr, send} from "./lib.js";

const LoginSchema = z.object({
    email: z.email("Enter a valid email"),
    password: z.string().min(1, "Required"),
});

export function loginRouter(deps: AdminDeps): Router {
    const router = Router();

    router.get("/login", (_req, res) => {
        send(res, LoginView({}));
    });

    router.post("/login", async (req, res) => {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                LoginView({
                    error: "Enter a valid email and password",
                    email: optStr(req.body?.email),
                }),
                400
            );
        }
        const result = await deps.userService.login(parsed.data);
        if (!result.ok) {
            return send(
                res,
                LoginView({error: "Invalid email or password", email: parsed.data.email}),
                401
            );
        }
        deps.authService.setAuthCookies(res, result.data.accessToken);
        res.redirect(302, "/admin");
    });

    return router;
}

export function logoutRouter(deps: AdminDeps): Router {
    const router = Router();
    router.post("/logout", (_req, res) => {
        deps.authService.clearAuthCookies(res);
        res.redirect(302, "/admin/login");
    });
    return router;
}
