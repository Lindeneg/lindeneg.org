import type {Request, Response, NextFunction} from "express";
import {HttpException} from "../lib/http-exception.js";
import type AuthService from "../services/auth-service.js";
import type UserRepository from "../repositories/user-repository.js";

export function createAuthenticate(
    authService: AuthService,
    userRepo: UserRepository,
    cookieName: string
) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const token = req.cookies?.[cookieName];
        if (!token) {
            return next(HttpException.unauthorized());
        }

        const result = authService.verifyAccessToken(token);
        if (!result.ok) {
            return next(HttpException.unauthorized());
        }

        const userResult = await userRepo.get(result.data.userId);
        if (!userResult.ok || !userResult.data || userResult.data.name !== result.data.name) {
            return next(HttpException.unauthorized());
        }

        req.auth = {
            ...result.data,
        };

        next();
    };
}
