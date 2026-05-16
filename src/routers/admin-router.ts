import {Router, type RequestHandler} from "express";
import type {AdminDeps} from "./admin/lib.js";
import {loginRouter, logoutRouter} from "./admin/auth.js";
import {dashboardRouter} from "./admin/dashboard.js";
import {pagesRouter} from "./admin/pages.js";
import {blogRouter} from "./admin/blog.js";
import {navigationRouter} from "./admin/navigation.js";
import {messagesRouter} from "./admin/messages.js";
import {settingsRouter} from "./admin/settings.js";

export type AdminRouterDeps = AdminDeps & {adminAuth: RequestHandler};

export function makeAdminRouter(deps: AdminRouterDeps): Router {
    const router = Router();

    router.use(loginRouter(deps));
    router.use(deps.adminAuth);
    router.use(logoutRouter(deps));
    router.use(dashboardRouter(deps));
    router.use(pagesRouter(deps));
    router.use(blogRouter(deps));
    router.use(navigationRouter(deps));
    router.use(messagesRouter(deps));
    router.use(settingsRouter(deps));

    return router;
}
