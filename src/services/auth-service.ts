import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type {Request, Response} from "express";
import {success, failure, type Result, type AsyncResult} from "../lib/result.js";
import type {MaybeUndefined, NodeEnv, ValueOf} from "../lib/types.js";
import type UserRepository from "../repositories/user-repository.js";
import type {User} from "../repositories/user-repository.js";
import type LoggerService from "./logger-service.js";

export interface AuthServiceOpts {
    cookieName: string;
    secret: string;
    saltRounds: number;
    expiryMs: number;
    mode: NodeEnv;
}

export const AuthError = {
    INVALID_CREDENTIALS: "invalid_credentials",
    UNAUTHENTICATED: "unauthenticated",
    ADMIN_ALREADY_CREATED: "admin_already_created",
    DB_ERROR: "db_error",
    INTERNAL_ERROR: "internal_error",
} as const;

export type AuthError = ValueOf<typeof AuthError>;

type AccessTokenPayload = {
    userId: string;
    name: string;
    role: string;
};

class AuthService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly opts: AuthServiceOpts,
        private readonly log: LoggerService
    ) {}

    async login(email: string, password: string): AsyncResult<string, AuthError> {
        const userResult = await this.userRepo.getWithPasswordByEmail(email);
        if (!userResult.ok) return failure(AuthError.DB_ERROR);
        if (!userResult.data) return failure(AuthError.INVALID_CREDENTIALS);

        const user = userResult.data;

        const compareResult = await this.#comparePassword(password, user.password);
        if (!compareResult.ok || !compareResult.data) return failure(AuthError.INVALID_CREDENTIALS);

        const tokenResult = this.#generateAccessToken({
            userId: user.id,
            name: user.name,
            role: user.role,
        });
        if (!tokenResult.ok) return failure(AuthError.INTERNAL_ERROR);

        return success(tokenResult.data);
    }

    async authenticate(token: MaybeUndefined<string>): AsyncResult<User, AuthError> {
        if (!token) return failure(AuthError.UNAUTHENTICATED);

        const verified = this.#verifyAccessToken(token);
        if (!verified.ok) return failure(AuthError.UNAUTHENTICATED);

        const userResult = await this.userRepo.get(verified.data.userId);
        if (!userResult.ok) return failure(AuthError.DB_ERROR);
        if (!userResult.data || userResult.data.name !== verified.data.name) {
            return failure(AuthError.UNAUTHENTICATED);
        }

        return success(userResult.data);
    }

    async createSuperUserOnce(email: string, name: string, password: string): AsyncResult<User, AuthError> {
        const hasAdmin = await this.userRepo.hasAdmin();
        if (!hasAdmin.ok) return failure(AuthError.DB_ERROR);
        if (hasAdmin.data) return failure(AuthError.ADMIN_ALREADY_CREATED);

        const hash = await this.#hashPassword(password);
        if (!hash.ok) return failure(AuthError.INTERNAL_ERROR);

        const result = await this.userRepo.create({
            email,
            name,
            password: hash.data,
            role: "ADMIN",
        });
        if (!result.ok) return failure(AuthError.DB_ERROR);

        return success(result.data);
    }

    getToken(req: Request): MaybeUndefined<string> {
        return req.cookies?.[this.opts.cookieName];
    }

    setAuthCookies(res: Response, accessToken: string): void {
        const secure = this.opts.mode === "production";
        res.cookie(this.opts.cookieName, accessToken, {
            httpOnly: true,
            secure,
            sameSite: "strict",
            maxAge: this.opts.expiryMs,
        });
    }

    clearAuthCookies(res: Response): void {
        res.clearCookie(this.opts.cookieName);
    }

    async #hashPassword(password: string): AsyncResult<string> {
        try {
            const hash = await bcrypt.hash(password, this.opts.saltRounds);
            return success(hash);
        } catch (err) {
            this.log.error(err, "auth-service.hashPassword");
            return failure("failed to hash password");
        }
    }

    async #comparePassword(password: string, hash: string): AsyncResult<boolean> {
        try {
            const match = await bcrypt.compare(password, hash);
            return success(match);
        } catch (err) {
            this.log.error(err, "auth-service.comparePassword");
            return failure("failed to compare password");
        }
    }

    #generateAccessToken(payload: AccessTokenPayload): Result<string> {
        try {
            const token = jwt.sign(payload, this.opts.secret, {
                expiresIn: Math.floor(this.opts.expiryMs / 1000),
            });
            return success(token);
        } catch (err) {
            this.log.error(err, "auth-service.generateAccessToken");
            return failure("failed to generate access token");
        }
    }

    #verifyAccessToken(token: string): Result<AccessTokenPayload> {
        try {
            const payload = jwt.verify(token, this.opts.secret) as AccessTokenPayload;
            return success(payload);
        } catch (err) {
            this.log.error(err, "auth-service.verifyAccessToken");
            return failure("invalid or expired access token");
        }
    }
}

export default AuthService;
