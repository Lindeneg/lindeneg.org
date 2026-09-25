import {Router} from "express";
import {send} from "../../lib/http.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {ErrorView} from "../../ui/views/admin/error.js";

// mounted last behind adminAuth, so a signed-in admin with a mistyped url stays in the admin
export function notFoundRouter(): Router {
    const router = Router();
    router.use((req, res) => {
        send(res, ErrorView({user: getAuth(req), currentPath: req.baseUrl + req.path, message: "Page not found"}), 404);
    });
    return router;
}
