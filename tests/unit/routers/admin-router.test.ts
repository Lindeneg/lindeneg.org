import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import express, {Router} from "express";
import {failure, success} from "../../../src/lib/result.js";
import {createAdminAuth} from "../../../src/middleware/admin-auth.js";
import {makeAdminRouter} from "../../../src/routers/admin-router.js";
import {notFoundRouter} from "../../../src/routers/admin/not-found.js";
import AuthService, {AuthError} from "../../../src/services/auth-service.js";
import {fake, makeUser} from "../helpers.js";
import {serve, type Served} from "../serve.js";

describe("admin router", () => {
    let authenticate: ReturnType<typeof vi.fn>;
    let server: Served;

    const get = (path: string, init: RequestInit = {}) =>
        fetch(`${server.url}/admin${path}`, {redirect: "manual", ...init});

    beforeEach(async () => {
        authenticate = vi.fn().mockResolvedValue(success(makeUser()));
        const auth = fake<AuthService>({getToken: () => "token", authenticate});
        const app = express();
        app.use(
            "/admin",
            makeAdminRouter(
                Router().get("/login", (_req, res) => void res.send("login")),
                createAdminAuth(auth),
                [Router().get("/", (_req, res) => void res.send("dashboard")), notFoundRouter()]
            )
        );
        server = await serve(app);
    });

    afterEach(() => server.close());

    it("serves the login page without a session", async () => {
        authenticate.mockResolvedValue(failure(AuthError.UNAUTHENTICATED));

        expect(await (await get("/login")).text()).toBe("login");
    });

    it("sends everything else to login without a session, unknown paths included", async () => {
        authenticate.mockResolvedValue(failure(AuthError.UNAUTHENTICATED));

        for (const path of ["", "/does-not-exist"]) {
            const res = await get(path);
            expect(res.status, path).toBe(302);
            expect(res.headers.get("location"), path).toBe("/admin/login");
        }
    });

    it("serves the admin pages with a session", async () => {
        expect(await (await get("")).text()).toBe("dashboard");
    });

    it("answers an unknown admin path with the admin 404 page, for any method", async () => {
        for (const init of [{}, {method: "POST"}]) {
            const res = await get("/does-not-exist", init);

            expect(res.status).toBe(404);
            const html = await res.text();
            expect(html).toContain("Page not found");
            expect(html).toContain("admin-sidebar");
        }
    });
});
