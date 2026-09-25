import {afterEach, beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import express from "express";
import {failure, success} from "../../../src/lib/result.js";
import {loginRouter, logoutRouter} from "../../../src/routers/admin/auth.js";
import AuthService, {AuthError} from "../../../src/services/auth-service.js";
import {fake} from "../helpers.js";
import {serve, type Served} from "../serve.js";

describe("login router", () => {
    let login: Mock;
    let setAuthCookies: Mock;
    let server: Served;

    const attempt = (fields: Record<string, string> = {email: "a@example.com", password: "wrong"}) =>
        fetch(`${server.url}/login`, {method: "POST", body: new URLSearchParams(fields), redirect: "manual"});

    beforeEach(async () => {
        login = vi.fn().mockResolvedValue(failure(AuthError.INVALID_CREDENTIALS));
        setAuthCookies = vi.fn((res) => res.cookie("auth", "token"));
        const app = express();
        app.use(express.urlencoded({extended: true}));
        app.use(loginRouter(fake<AuthService>({login, setAuthCookies})));
        server = await serve(app);
    });

    afterEach(() => server.close());

    it("renders the login form", async () => {
        const res = await fetch(`${server.url}/login`);

        expect(res.status).toBe(200);
        expect(await res.text()).toContain(`action="/admin/login"`);
    });

    it("keeps the typed email when the credentials are wrong", async () => {
        const res = await attempt({email: "a@example.com", password: "wrong"});

        expect(res.status).toBe(401);
        const html = await res.text();
        expect(html).toContain("Invalid email or password");
        expect(html).toContain(`value="a@example.com"`);
    });

    it("answers a database failure with a 500 and a retry message", async () => {
        login.mockResolvedValue(failure(AuthError.DB_ERROR));

        const res = await attempt();

        expect(res.status).toBe(500);
        expect(await res.text()).toContain("Something went wrong, try again");
    });

    it("sets the cookie and redirects to the dashboard on success", async () => {
        login.mockResolvedValue(success("token"));

        const res = await attempt({email: "a@example.com", password: "right"});

        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toBe("/admin");
        expect(setAuthCookies).toHaveBeenCalledOnce();
    });

    it("locks logins for the client after 10 failed attempts, even with the right password", async () => {
        for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);

        login.mockResolvedValue(success("token"));
        const locked = await attempt({email: "a@example.com", password: "right"});

        expect(locked.status).toBe(429);
        const html = await locked.text();
        expect(html).toContain("Too many failed attempts, try again in 15 minutes");
        expect(html).toContain(`value="a@example.com"`);
        expect(login).toHaveBeenCalledTimes(10);
    });

    it("does not count successful logins toward the limit", async () => {
        login.mockResolvedValue(success("token"));
        for (let i = 0; i < 15; i++) expect((await attempt()).status).toBe(302);

        login.mockResolvedValue(failure(AuthError.INVALID_CREDENTIALS));
        expect((await attempt()).status).toBe(401);
    });
});

describe("logout router", () => {
    it("clears the cookie and redirects to login", async () => {
        const clearAuthCookies = vi.fn((res) => res.clearCookie("auth"));
        const app = express();
        app.use(logoutRouter(fake<AuthService>({clearAuthCookies})));
        const server = await serve(app);

        const res = await fetch(`${server.url}/logout`, {method: "POST", redirect: "manual"});

        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toBe("/admin/login");
        expect(clearAuthCookies).toHaveBeenCalledOnce();
        await server.close();
    });
});

describe("auth cookie", () => {
    const service = (mode: "production" | "development") =>
        new AuthService(
            fake({}),
            {
                cookieName: "auth",
                secret: "x".repeat(32),
                bcryptRounds: 4,
                expiryMs: 60_000,
                mode,
            },
            fake({})
        );

    it("is httpOnly, strict and secure in production", () => {
        const cookie = vi.fn();
        service("production").setAuthCookies(fake({cookie}), "token");

        expect(cookie).toHaveBeenCalledWith("auth", "token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 60_000,
        });
    });

    it("is not secure outside production, so it works over http locally", () => {
        const cookie = vi.fn();
        service("development").setAuthCookies(fake({cookie}), "token");

        expect(cookie).toHaveBeenCalledWith("auth", "token", expect.objectContaining({secure: false}));
    });
});
