import type {Request, Response, NextFunction} from "express";
import type AuthService from "../services/auth-service.js";
import type UserRepository from "../repositories/user-repository.js";

export function createAdminAuth(
    authService: AuthService,
    userRepo: UserRepository,
    cookieName: string
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const redirect = () => res.redirect(302, "/admin/login");

        const token = req.cookies?.[cookieName];
        if (!token) return redirect();

        const verified = authService.verifyAccessToken(token);
        if (!verified.ok) return redirect();

        const userResult = await userRepo.get(verified.data.userId);
        if (!userResult.ok || !userResult.data || userResult.data.name !== verified.data.name) {
            return redirect();
        }

        req.auth = {...verified.data};
        next();
    };
}
