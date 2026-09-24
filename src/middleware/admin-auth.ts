import type {Request, Response, NextFunction} from "express";
import type AuthService from "../services/auth-service.js";
import type UserRepository from "../repositories/user-repository.js";

export function createAdminAuth(
    authService: AuthService,
    userRepo: UserRepository,
    cookieName: string
) {
    const toLogin = (res: Response) => res.redirect(302, "/admin/login");

    return async (req: Request, res: Response, next: NextFunction) => {

        const token = req.cookies?.[cookieName];
        if (!token) return toLogin(res);

        const verified = authService.verifyAccessToken(token);
        if (!verified.ok) return toLogin(res);

        const userResult = await userRepo.get(verified.data.userId);
        if (!userResult.ok || !userResult.data || userResult.data.name !== verified.data.name) {
            return toLogin(res);
        }

        req.auth = {...verified.data};
        next();
    };
}
