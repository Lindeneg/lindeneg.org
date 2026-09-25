import {describe, expect, it} from "vitest";
import express from "express";
import LoggerService from "../../../src/services/logger-service.js";
import {serve} from "../serve.js";

// collects every json line the logger writes
function captureLines() {
    const lines: string[] = [];
    return {lines, destination: {write: (line: string) => void lines.push(line)}};
}

describe("LoggerService request logging", () => {
    it("never writes the auth cookie, authorization header or set-cookie to the log", async () => {
        const {lines, destination} = captureLines();
        const log = new LoggerService("production", "info", destination);
        const app = express();
        app.use(log.makeRequestLogger());
        app.get("/", (_req, res) => {
            res.cookie("lindeneg-org-auth", "SET.COOKIE.TOKEN");
            res.send("ok");
        });
        const server = await serve(app);

        await fetch(`${server.url}/?q=1`, {
            headers: {cookie: "lindeneg-org-auth=REQUEST.COOKIE.TOKEN", authorization: "Bearer AUTH.HEADER.TOKEN"},
        });
        await server.close();

        const output = lines.join("");
        expect(output).not.toContain("REQUEST.COOKIE.TOKEN");
        expect(output).not.toContain("AUTH.HEADER.TOKEN");
        expect(output).not.toContain("SET.COOKIE.TOKEN");

        const entry = JSON.parse(lines.find((line) => line.includes('"req"'))!);
        expect(entry.req.headers.cookie).toBe("[redacted]");
        expect(entry.req.headers.authorization).toBe("[redacted]");
        expect(entry.res.headers["set-cookie"]).toBe("[redacted]");
        expect(entry.req.url).toBe("/?q=1");
    });
});
