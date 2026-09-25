import {Router} from "express";
import {send} from "../../lib/http.js";
import {getAuth} from "../../middleware/admin-auth.js";
import type DashboardService from "../../services/dashboard-service.js";
import {DashboardView} from "../../ui/views/admin/dashboard.js";

export function dashboardRouter(dashboardService: DashboardService): Router {
    const router = Router();

    router.get("/", async (req, res) => {
        const counts = await dashboardService.counts();
        send(res, DashboardView({user: getAuth(req), currentPath: "/admin", counts}));
    });

    return router;
}
