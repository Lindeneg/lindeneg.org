import {Router} from "express";
import type DataService from "../services/data-service.js";

// for the container healthcheck: up means the process answers and the database responds
export function makeHealthRouter(dataService: DataService): Router {
    const router = Router();

    router.get("/healthz", async (_req, res) => {
        const result = await dataService.checkHealth();
        res.status(result.ok ? 200 : 503).json({status: result.ok ? "ok" : "unavailable"});
    });

    return router;
}
