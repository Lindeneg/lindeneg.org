import {describe, expect, it, vi} from "vitest";
import express from "express";
import {failure, success} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import {makeHealthRouter} from "../../../src/routers/health-router.js";
import type DataService from "../../../src/services/data-service.js";
import {fake} from "../helpers.js";
import {serve} from "../serve.js";

async function check(result: Awaited<ReturnType<DataService["checkHealth"]>>) {
    const app = express();
    app.use(makeHealthRouter(fake<DataService>({checkHealth: vi.fn().mockResolvedValue(result)})));
    const server = await serve(app);
    const res = await fetch(`${server.url}/healthz`);
    const body = await res.json();
    await server.close();
    return {status: res.status, body};
}

describe("health router", () => {
    it("answers 200 when the database responds", async () => {
        expect(await check(success(0))).toEqual({status: 200, body: {status: "ok"}});
    });

    it("answers 503 when the database fails", async () => {
        expect(await check(failure(AppError.DB_ERROR))).toEqual({status: 503, body: {status: "unavailable"}});
    });
});
