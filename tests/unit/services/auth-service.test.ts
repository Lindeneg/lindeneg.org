import {beforeAll, beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {failure, success} from "../../../src/lib/result.js";
import AuthService, {AuthError} from "../../../src/services/auth-service.js";
import type UserRepository from "../../../src/repositories/user-repository.js";
import {fake, fakeLog, makeUser, makeUserWithPassword} from "../helpers.js";

const opts = {cookieName: "auth", secret: "test-secret", saltRounds: 4, expiryMs: 60_000, mode: "test" as const};

describe("AuthService", () => {
    let hash: string;
    let repo: Record<"get" | "getWithPasswordByEmail" | "hasAdmin" | "create", Mock>;
    let service: AuthService;

    beforeAll(async () => {
        hash = await bcrypt.hash("correct horse", 4);
    });

    beforeEach(() => {
        repo = {
            get: vi.fn().mockResolvedValue(success(makeUser())),
            getWithPasswordByEmail: vi.fn().mockResolvedValue(success(makeUserWithPassword(hash))),
            hasAdmin: vi.fn().mockResolvedValue(success(false)),
            create: vi.fn().mockResolvedValue(success(makeUser())),
        };
        service = new AuthService(fake<UserRepository>(repo), opts, fakeLog());
    });

    describe("login", () => {
        it("returns a token for valid credentials", async () => {
            const result = await service.login("admin@example.com", "correct horse");

            if (!result.ok) throw new Error("expected success");
            const payload = jwt.verify(result.data, opts.secret) as Record<string, unknown>;
            expect(payload).toMatchObject({userId: "user-1", name: "Ada Lovelace", role: "ADMIN"});
            expect(payload).not.toHaveProperty("password");
        });

        it("rejects an unknown email", async () => {
            repo.getWithPasswordByEmail.mockResolvedValue(success(null));

            expect(await service.login("x@example.com", "correct horse")).toEqual(
                failure(AuthError.INVALID_CREDENTIALS)
            );
        });

        it("rejects a wrong password", async () => {
            expect(await service.login("admin@example.com", "wrong")).toEqual(failure(AuthError.INVALID_CREDENTIALS));
        });

        it("reports db errors separately", async () => {
            repo.getWithPasswordByEmail.mockResolvedValue(failure("db"));

            expect(await service.login("admin@example.com", "correct horse")).toEqual(failure(AuthError.DB_ERROR));
        });
    });

    describe("authenticate", () => {
        const token = (payload: object, secret = opts.secret) => jwt.sign(payload, secret);
        const valid = {userId: "user-1", name: "Ada Lovelace", role: "ADMIN"};

        it("returns the user for a valid token", async () => {
            expect(await service.authenticate(token(valid))).toEqual(success(makeUser()));
            expect(repo.get).toHaveBeenCalledWith("user-1");
        });

        it("rejects a missing token without hitting the db", async () => {
            expect(await service.authenticate(undefined)).toEqual(failure(AuthError.UNAUTHENTICATED));
            expect(repo.get).not.toHaveBeenCalled();
        });

        it("rejects a token signed with another secret", async () => {
            expect(await service.authenticate(token(valid, "other"))).toEqual(failure(AuthError.UNAUTHENTICATED));
        });

        it("rejects a deleted user", async () => {
            repo.get.mockResolvedValue(success(null));

            expect(await service.authenticate(token(valid))).toEqual(failure(AuthError.UNAUTHENTICATED));
        });

        it("rejects a token issued before the user was renamed", async () => {
            repo.get.mockResolvedValue(success(makeUser({name: "Renamed"})));

            expect(await service.authenticate(token(valid))).toEqual(failure(AuthError.UNAUTHENTICATED));
        });
    });

    describe("createSuperUserOnce", () => {
        it("creates an admin with a hashed password", async () => {
            const result = await service.createSuperUserOnce("a@example.com", "Ada", "secret");

            expect(result.ok).toBe(true);
            const data = repo.create.mock.calls[0][0];
            expect(data).toMatchObject({email: "a@example.com", name: "Ada", role: "ADMIN"});
            expect(data.password).not.toBe("secret");
            expect(await bcrypt.compare("secret", data.password)).toBe(true);
        });

        it("does nothing when an admin exists", async () => {
            repo.hasAdmin.mockResolvedValue(success(true));

            expect(await service.createSuperUserOnce("a@example.com", "Ada", "secret")).toEqual(
                failure(AuthError.ADMIN_ALREADY_CREATED)
            );
            expect(repo.create).not.toHaveBeenCalled();
        });
    });
});
