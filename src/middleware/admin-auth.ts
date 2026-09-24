import type {Request, Response, NextFunction} from "express";
import type AuthService from "../services/auth-service.js";
import type {User} from "../repositories/user-repository.js";

export function createAdminAuth(authService: AuthService) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const result = await authService.authenticate(authService.getToken(req));
        if (!result.ok) return res.redirect(302, "/admin/login");

        req.auth = result.data;
        next();
    };
}

export function getAuth(req: Request): User {
    if (!req.auth) throw new Error("getAuth used on a route not behind adminAuth");
    return req.auth;
}
