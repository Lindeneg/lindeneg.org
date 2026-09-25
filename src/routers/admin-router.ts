import {Router, type RequestHandler} from "express";

export function makeAdminRouter(publicRouter: Router, adminAuth: RequestHandler, protectedRouters: Router[]): Router {
    const router = Router();

    // public
    router.use(publicRouter);

    router.use(adminAuth);
    // behind auth
    for (const protectedRouter of protectedRouters) {
        router.use(protectedRouter);
    }

    return router;
}
