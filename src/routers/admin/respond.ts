import type {Response} from "express";
import {AppError} from "../../lib/errors.js";
import {send} from "../../lib/http.js";
import type {User} from "../../repositories/user-repository.js";
import {ErrorView} from "../../ui/views/admin/error.js";

export type AdminPage = {user: User; currentPath: string};

export function errorStatus(ctx: AppError): number {
    switch (ctx) {
        case AppError.NOT_FOUND:
            return 404;
        case AppError.CONFLICT:
            return 409;
        case AppError.UPLOAD_ERROR:
            return 502;
        default:
            return 500;
    }
}

// the admin error page when loading something fails, e.g. sendLoadError(res, page, ctx, "Post")
export function sendLoadError(res: Response, page: AdminPage, ctx: AppError, what: string) {
    const message = ctx === AppError.NOT_FOUND ? `${what} not found` : `Failed to load ${what.toLowerCase()}`;
    send(res, ErrorView({...page, message}), errorStatus(ctx));
}

// the admin error page when an action fails, e.g. sendActionError(res, page, ctx, "Post", "delete post")
export function sendActionError(res: Response, page: AdminPage, ctx: AppError, what: string, action: string) {
    const message = ctx === AppError.NOT_FOUND ? `${what} not found` : `Failed to ${action}`;
    send(res, ErrorView({...page, message}), errorStatus(ctx));
}
