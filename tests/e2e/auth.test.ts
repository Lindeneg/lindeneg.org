import {beforeAll, describe, expect, it} from "vitest";
import {env, get, login, postForm} from "./helpers.js";

describe("login", () => {
    it("renders the login page", async () => {
        const res = await get("/admin/login");

        expect(res.status).toBe(200);
        expect(res.html).toContain(`action="/admin/login"`);
    });

    it("rejects an invalid email with 400", async () => {
        const res = await postForm("/admin/login", {email: "not-an-email", password: "x"});

        expect(res.status).toBe(400);
        expect(res.html).toContain("Enter a valid email and password");
    });

    it("rejects wrong credentials with 401", async () => {
        const res = await postForm("/admin/login", {email: env.SUPER_USER!.email, password: "wrong"});

        expect(res.status).toBe(401);
        expect(res.html).toContain("Invalid email or password");
        expect(res.setCookies).toEqual([]);
    });

    it("sets an httpOnly cookie and redirects to /admin on success", async () => {
        const res = await postForm("/admin/login", {
            email: env.SUPER_USER!.email,
            password: env.SUPER_USER!.password,
        });

        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin");
        const cookie = res.setCookies.find((c) => c.startsWith(`${env.JWT_COOKIE_NAME}=`));
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Strict/i);
    });
});

describe("session", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    it("gives access to the dashboard", async () => {
        const res = await get("/admin", cookie);

        expect(res.status).toBe(200);
        expect(res.html).toContain("Dashboard");
    });

    it("logout clears the cookie", async () => {
        const res = await postForm("/admin/logout", {}, await login());

        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/login");
        const cleared = res.setCookies.find((c) => c.startsWith(`${env.JWT_COOKIE_NAME}=`));
        expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("never renders a password hash", async () => {
        const paths = ["/admin", "/admin/settings", "/admin/blog", "/admin/pages", "/", "/blog"];
        for (const path of paths) {
            const res = await get(path, cookie);
            expect(res.html, path).not.toMatch(/\$2[aby]\$/);
        }
    });
});
