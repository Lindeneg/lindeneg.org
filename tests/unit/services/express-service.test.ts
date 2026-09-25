import {afterEach, describe, expect, it, vi} from "vitest";
import {createServer, type Server} from "node:net";
import type {AddressInfo} from "node:net";
import {Router, type Request, type Response} from "express";
import ExpressService, {type ExpressOpts} from "../../../src/services/express-service.js";
import LoggerService from "../../../src/services/logger-service.js";
import {makeGlobalErrorHandler} from "../../../src/lib/error-handler.js";
import {serve, type Served} from "../serve.js";

function build(opts: Partial<ExpressOpts> = {}) {
    const health = Router().get("/healthz", (_req, res) => void res.json({status: "ok"}));
    const api = Router()
        .get("/ping", (_req, res) => void res.json({api: true}))
        .post("/echo", (req, res) => void res.json({body: req.body ?? null, cookies: req.cookies ?? null}));
    const echo = (req: Request, res: Response) => void res.json({body: req.body ?? null, cookies: req.cookies ?? null});
    const admin = Router()
        .get("/", (_req, res) => void res.send("admin"))
        .post("/form", echo);
    const site = Router()
        .get("/ip", (req, res) => void res.send(req.ip))
        .post("/form", echo)
        .get("/boom", () => {
            throw new Error("boom");
        })
        .get("/", (_req, res) => void res.send("site"));
    const log = new LoggerService("test");
    return new ExpressService({port: 0, production: false, ...opts}, log, makeGlobalErrorHandler(log), {
        health,
        api,
        admin,
        public: site,
    });
}

describe("ExpressService", () => {
    let server: Served | undefined;

    afterEach(async () => {
        await server?.close();
        server = undefined;
    });

    const request = async (service: ExpressService, path: string, init?: RequestInit) => {
        server = await serve(service.app);
        return fetch(server.url + path, init);
    };

    it("mounts the api under /api, the admin under /admin and the site at the root", async () => {
        const service = build();
        server = await serve(service.app);

        expect(await (await fetch(`${server.url}/api/ping`)).json()).toEqual({api: true});
        expect(await (await fetch(`${server.url}/admin`)).text()).toBe("admin");
        expect(await (await fetch(`${server.url}/`)).text()).toBe("site");
        expect(await (await fetch(`${server.url}/healthz`)).json()).toEqual({status: "ok"});
    });

    it("sets security headers and hides the framework", async () => {
        const res = await request(build(), "/");
        const csp = res.headers.get("content-security-policy") ?? "";

        expect(res.headers.get("x-powered-by")).toBeNull();
        expect(res.headers.get("x-content-type-options")).toBe("nosniff");
        expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
        expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self' https://cdn.jsdelivr.net");
        expect(csp).toContain("style-src 'self'");
        expect(csp).toContain("font-src 'self'");
        expect(csp).toContain("img-src 'self' data: https:");
        expect(csp).toContain("frame-src https://www.youtube.com https://youtube.com");
        expect(csp).toContain("object-src 'none'");
    });

    it("only forces https in production, without covering other subdomains", async () => {
        const dev = await request(build({production: false}), "/");
        expect(dev.headers.get("strict-transport-security")).toBeNull();
        expect(dev.headers.get("content-security-policy")).not.toContain("upgrade-insecure-requests");
        await server!.close();

        const prod = await request(build({production: true}), "/");
        const hsts = prod.headers.get("strict-transport-security") ?? "";
        expect(hsts).toContain("max-age=");
        expect(hsts).not.toContain("includeSubDomains");
        expect(prod.headers.get("content-security-policy")).toContain("upgrade-insecure-requests");
    });

    it("uses the forwarded client ip only when told to trust the proxy", async () => {
        const headers = {"x-forwarded-for": "203.0.113.7"};

        const untrusted = await request(build(), "/ip", {headers});
        expect(await untrusted.text()).not.toBe("203.0.113.7");
        await server!.close();

        const trusted = await request(build({trustProxy: "loopback"}), "/ip", {headers});
        expect(await trusted.text()).toBe("203.0.113.7");
    });

    it("parses forms and cookies for the admin", async () => {
        const res = await request(build(), "/admin/form", {
            method: "POST",
            headers: {cookie: "a=1"},
            body: new URLSearchParams({b: "2"}),
        });

        expect(await res.json()).toEqual({body: {b: "2"}, cookies: {a: "1"}});
    });

    it("does not parse json for the admin", async () => {
        const res = await request(build(), "/admin/form", {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify({a: "1"}),
        });

        expect((await res.json()).body).toBeNull();
    });

    it("gives the public site neither parsed forms nor cookies, it only serves GETs", async () => {
        const res = await request(build(), "/form", {
            method: "POST",
            headers: {cookie: "a=1"},
            body: new URLSearchParams({b: "2"}),
        });

        expect(await res.json()).toEqual({body: null, cookies: null});
    });

    it("gives the api neither parsed forms nor cookies, it only takes json", async () => {
        const res = await request(build(), "/api/echo", {
            method: "POST",
            headers: {cookie: "a=1"},
            body: new URLSearchParams({name: "x"}),
        });

        expect(await res.json()).toEqual({body: null, cookies: null});
    });

    it("answers an admin form over 2mb with a 413 instead of the error page", async () => {
        const res = await request(build(), "/admin/form", {
            method: "POST",
            body: new URLSearchParams({x: "y".repeat(2 * 1024 * 1024 + 1)}),
        });

        expect(res.status).toBe(413);
        expect(await res.text()).toContain("That was too large to send.");
    });

    it("renders the generic error page for an unhandled error", async () => {
        const res = await request(build(), "/boom");

        expect(res.status).toBe(500);
        expect(await res.text()).toContain("Something went wrong.");
    });

    describe("start", () => {
        let blocker: Server | undefined;

        afterEach(() => new Promise<void>((resolve) => (blocker ? blocker.close(() => resolve()) : resolve())));

        it("fails instead of pretending to listen when the port is taken", async () => {
            // bound the same way app.listen binds (all interfaces), so the port is really taken
            blocker = createServer();
            await new Promise<void>((resolve) => blocker!.listen(0, () => resolve()));
            const {port} = blocker.address() as AddressInfo;

            const result = await build({port}).start(() => {});

            expect(result.ok).toBe(false);
        });

        it("listens and stops again", async () => {
            const probe = createServer();
            await new Promise<void>((resolve) => probe.listen(0, () => resolve()));
            const {port} = probe.address() as AddressInfo;
            await new Promise<void>((resolve) => probe.close(() => resolve()));

            const service = build({port});
            expect((await service.start(() => {})).ok).toBe(true);
            expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(200);

            await service.teardown();
            await expect(fetch(`http://127.0.0.1:${port}/`)).rejects.toThrow();
        });

        it("hands a server error after startup to onError, so the app shuts down, instead of swallowing it", async () => {
            const service = build();
            const listen = vi.spyOn(service.app, "listen");
            const onError = vi.fn();
            expect((await service.start(onError)).ok).toBe(true);
            const server = listen.mock.results[0].value as import("node:http").Server;

            expect(server.listenerCount("error")).toBe(1);
            const error = new Error("accept failed");
            server.emit("error", error);

            expect(onError).toHaveBeenCalledWith(error);
            await service.teardown();
        });

        it("tears down without having started", async () => {
            await expect(build().teardown()).resolves.toBeUndefined();
        });
    });
});

describe("global error handler", () => {
    it("passes the error on when the response has already started", () => {
        const next = vi.fn();
        const log = new LoggerService("test");
        const error = new Error("late");

        makeGlobalErrorHandler(log)(error, {} as never, {headersSent: true} as never, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
