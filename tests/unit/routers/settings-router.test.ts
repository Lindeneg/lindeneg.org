import {afterEach, beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import express from "express";
import {failure, success} from "../../../src/lib/result.js";
import {settingsRouter} from "../../../src/routers/admin/settings.js";
import AuthService, {AuthError} from "../../../src/services/auth-service.js";
import type TemplateService from "../../../src/services/template-service.js";
import type UserService from "../../../src/services/user-service.js";
import {fake, makeUser} from "../helpers.js";
import {serve, type Served} from "../serve.js";

describe("settings router password change", () => {
    let changePassword: Mock;
    let server: Served;

    const change = (currentPassword = "wrong-password") =>
        fetch(`${server.url}/settings/password`, {
            method: "POST",
            body: new URLSearchParams({
                currentPassword,
                newPassword: "a-new-password-123",
                confirmPassword: "a-new-password-123",
            }),
            redirect: "manual",
        });

    beforeEach(async () => {
        changePassword = vi.fn().mockResolvedValue(failure(AuthError.INVALID_CREDENTIALS));
        const app = express();
        app.use(express.urlencoded({extended: true}));
        app.use((req, _res, next) => {
            req.auth = makeUser();
            next();
        });
        app.use(
            settingsRouter(
                fake<UserService>({}),
                fake<AuthService>({changePassword, setAuthCookies: vi.fn()}),
                fake<TemplateService>({cacheStats: () => ({entries: 0, maxEntries: 500, hits: 0, misses: 0})})
            )
        );
        server = await serve(app);
    });

    afterEach(() => server.close());

    it("rejects a wrong current password", async () => {
        const res = await change();

        expect(res.status).toBe(400);
        expect(await res.text()).toContain("Wrong password");
    });

    it("locks password changes for the client after 10 failed attempts, even with the right password", async () => {
        for (let i = 0; i < 10; i++) expect((await change()).status).toBe(400);

        changePassword.mockResolvedValue(success("token"));
        const locked = await change("right-password");

        expect(locked.status).toBe(429);
        expect(await locked.text()).toContain("Too many failed attempts, try again in 15 minutes");
        expect(changePassword).toHaveBeenCalledTimes(10);
    });

    it("does not count successful changes toward the limit", async () => {
        changePassword.mockResolvedValue(success("token"));
        for (let i = 0; i < 15; i++) expect((await change("right-password")).status).toBe(302);

        changePassword.mockResolvedValue(failure(AuthError.INVALID_CREDENTIALS));
        expect((await change()).status).toBe(400);
    });
});
