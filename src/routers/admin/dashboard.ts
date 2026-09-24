import {Router} from "express";
import {send} from "../../lib/http.js";
import {getAuth} from "../../middleware/admin-auth.js";
import type DashboardService from "../../services/dashboard-service.js";
import type TemplateService from "../../services/template-service.js";

export function dashboardRouter(dashboardService: DashboardService, templates: TemplateService): Router {
    const router = Router();

    router.get("/", async (req, res) => {
        const user = getAuth(req);
        const counts = await dashboardService.counts();
        send(res, templates.admin.dashboard({user, currentPath: "/admin", counts}));
    });

    return router;
}
