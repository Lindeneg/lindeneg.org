import {afterEach, beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import express from "express";
import {emptySuccess, failure} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import {makeApiRouter} from "../../../src/routers/api-router.js";
import type MessageService from "../../../src/services/message-service.js";
import {fake} from "../helpers.js";
import {serve, type Served} from "../serve.js";

const ALLOWED = "https://freelance.example";

describe("contact api", () => {
    let create: Mock;
    let server: Served;

    const post = (body: unknown, headers: Record<string, string> = {}) =>
        fetch(`${server.url}/api/cl-software`, {
            method: "POST",
            headers: {"content-type": "application/json", origin: ALLOWED, ...headers},
            body: typeof body === "string" ? body : JSON.stringify(body),
        });

    const valid = {name: "Grace", email: "grace@example.com", message: "Hello"};

    beforeEach(async () => {
        create = vi.fn().mockResolvedValue(emptySuccess());
        const app = express();
        app.use("/api", makeApiRouter(fake<MessageService>({create}), [ALLOWED]));
        server = await serve(app);
    });

    afterEach(() => server.close());

    it("stores a valid message and answers with success", async () => {
        const res = await post({name: "  Grace  ", email: "grace@example.com", message: " Hello "});

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({success: true});
        expect(create).toHaveBeenCalledWith({name: "Grace", email: "grace@example.com", message: "Hello"});
    });

    it.each([
        ["an empty name", {...valid, name: " "}, "name"],
        ["a name over 200 characters", {...valid, name: "x".repeat(201)}, "name"],
        ["an invalid email", {...valid, email: "not-an-email"}, "email"],
        ["an empty message", {...valid, message: ""}, "message"],
        ["a message over 10000 characters", {...valid, message: "x".repeat(10_001)}, "message"],
    ])("rejects %s with a 400 and field errors", async (_, body, field) => {
        const res = await post(body);

        expect(res.status).toBe(400);
        expect((await res.json()).errors).toHaveProperty(field);
        expect(create).not.toHaveBeenCalled();
    });

    it("rejects a body that is not json", async () => {
        const res = await fetch(`${server.url}/api/cl-software`, {
            method: "POST",
            headers: {"content-type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams(valid),
        });

        expect(res.status).toBe(400);
        expect(create).not.toHaveBeenCalled();
    });

    it("answers a body over 32kb with a 413 json error", async () => {
        const res = await post({...valid, message: "x".repeat(40_000)});

        expect(res.status).toBe(413);
        expect(await res.json()).toEqual({error: "message too large"});
        expect(create).not.toHaveBeenCalled();
    });

    it("answers malformed json with a 400 json error", async () => {
        const res = await post("{not json");

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({error: "invalid json"});
    });

    it("answers a failed save with a 500 json error", async () => {
        create.mockResolvedValue(failure(AppError.DB_ERROR));

        const res = await post(valid);

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({error: "failed to save message"});
    });

    it("allows the configured origin cross-origin, including the preflight", async () => {
        const preflight = await fetch(`${server.url}/api/cl-software`, {
            method: "OPTIONS",
            headers: {
                origin: ALLOWED,
                "access-control-request-method": "POST",
                "access-control-request-headers": "content-type",
            },
        });
        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("access-control-allow-origin")).toBe(ALLOWED);

        const res = await post(valid);
        expect(res.headers.get("access-control-allow-origin")).toBe(ALLOWED);
    });

    it("gives other origins no cors headers", async () => {
        const res = await post(valid, {origin: "https://evil.example"});

        expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("allows 5 messages per 10 minutes per client, then answers 429", async () => {
        for (let i = 0; i < 5; i++) expect((await post(valid)).status).toBe(200);

        const limited = await post(valid);

        expect(limited.status).toBe(429);
        expect(await limited.json()).toEqual({error: "too many requests, try again later"});
        expect(create).toHaveBeenCalledTimes(5);
    });

    it("does not count preflights toward the limit", async () => {
        for (let i = 0; i < 10; i++) {
            await fetch(`${server.url}/api/cl-software`, {
                method: "OPTIONS",
                headers: {origin: ALLOWED, "access-control-request-method": "POST"},
            });
        }

        expect((await post(valid)).status).toBe(200);
    });
});
