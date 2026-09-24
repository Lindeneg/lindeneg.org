import {describe, expect, it, vi} from "vitest";
import type {Request, Response} from "express";
import {failure, success} from "../../../src/lib/result.js";
import {createAdminAuth, getAuth} from "../../../src/middleware/admin-auth.js";
import type AuthService from "../../../src/services/auth-service.js";
import {AuthError} from "../../../src/services/auth-service.js";
import {fake, makeUser} from "../helpers.js";

function setup(result: Awaited<ReturnType<AuthService["authenticate"]>>) {
    const authService = fake<AuthService>({
        getToken: vi.fn().mockReturnValue("token"),
        authenticate: vi.fn().mockResolvedValue(result),
    });
    const req = fake<Request>({});
    const redirect = vi.fn();
    const res = fake<Response>({redirect});
    const next = vi.fn();
    return {middleware: createAdminAuth(authService), req, res, redirect, next};
}

describe("createAdminAuth", () => {
    it("sets req.auth and continues for an authenticated user", async () => {
        const {middleware, req, res, next, redirect} = setup(success(makeUser()));

        await middleware(req, res, next);

        expect(req.auth).toEqual(makeUser());
        expect(next).toHaveBeenCalledOnce();
        expect(redirect).not.toHaveBeenCalled();
    });

    it("redirects to login otherwise", async () => {
        const {middleware, req, res, next, redirect} = setup(failure(AuthError.UNAUTHENTICATED));

        await middleware(req, res, next);

        expect(redirect).toHaveBeenCalledWith(302, "/admin/login");
        expect(next).not.toHaveBeenCalled();
        expect(req.auth).toBeUndefined();
    });
});

describe("getAuth", () => {
    it("returns the authenticated user", () => {
        const user = makeUser();
        expect(getAuth(fake<Request>({auth: user}))).toBe(user);
    });

    it("throws on a route without adminAuth", () => {
        expect(() => getAuth(fake<Request>({}))).toThrow();
    });
});
