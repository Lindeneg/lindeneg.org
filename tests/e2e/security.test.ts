import {beforeAll, describe, expect, it} from "vitest";
import {BASE_URL, clearCache, db, env, get, login, postForm, uid} from "./helpers.js";

// every rate-limit test gets its own client address, which the server trusts from localhost (TRUST_PROXY
// defaults to loopback), so a lockout here never reaches the other tests
let nextClient = 1;
const clientIp = () => `203.0.113.${nextClient++}`;

const fromClient = (ip: string, path: string, init: RequestInit & {headers?: Record<string, string>} = {}) =>
    fetch(BASE_URL + path, {...init, redirect: "manual", headers: {"x-forwarded-for": ip, ...init.headers}});

describe("security, through the real server", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    describe("open redirects", () => {
        it.each(["//evil.com/", "//Evil", "///evil.com/x/", "//About"])("keeps %s on the site", async (path) => {
            const res = await fetch(BASE_URL + path, {redirect: "manual"});

            expect(res.status).toBe(301);
            expect(res.headers.get("location")).toMatch(/^\/(?![/\\])/);
        });
    });

    describe("security headers", () => {
        it.each(["/", "/blog", "/admin/login"])("sets them on %s", async (path) => {
            const res = await fetch(BASE_URL + path, {redirect: "manual"});
            const csp = res.headers.get("content-security-policy") ?? "";

            expect(res.headers.get("x-powered-by")).toBeNull();
            expect(res.headers.get("x-content-type-options")).toBe("nosniff");
            expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
            // youtube refuses embeds without a referrer, so it must not be no-referrer
            expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain("script-src 'self' https://cdn.jsdelivr.net");
            expect(csp).toContain("object-src 'none'");
        });
    });

    describe("login rate limit", () => {
        const attempt = (ip: string, password: string) =>
            fromClient(ip, "/admin/login", {
                method: "POST",
                body: new URLSearchParams({email: env.SUPER_USER!.email, password}),
            });

        it("locks a client out after 10 failed logins, even with the right password", async () => {
            const ip = clientIp();
            for (let i = 0; i < 10; i++) expect((await attempt(ip, "wrong-password")).status).toBe(401);

            const locked = await attempt(ip, env.SUPER_USER!.password);

            expect(locked.status).toBe(429);
            expect(await locked.text()).toContain("Too many failed attempts, try again in 15 minutes");
        });

        it("keeps other clients able to log in", async () => {
            const locked = clientIp();
            for (let i = 0; i < 11; i++) await attempt(locked, "wrong-password");

            expect((await attempt(clientIp(), env.SUPER_USER!.password)).status).toBe(302);
        });
    });

    describe("password change rate limit", () => {
        it("locks a client out after 10 wrong current passwords, without changing the password", async () => {
            const ip = clientIp();
            const change = (currentPassword: string) =>
                fromClient(ip, "/admin/settings/password", {
                    method: "POST",
                    headers: {cookie},
                    body: new URLSearchParams({
                        currentPassword,
                        newPassword: "an-attacker-password",
                        confirmPassword: "an-attacker-password",
                    }),
                });
            const before = await db.p.user.findUniqueOrThrow({where: {email: env.SUPER_USER!.email}});

            for (let i = 0; i < 10; i++) expect((await change("wrong-password")).status).toBe(400);
            const locked = await change(env.SUPER_USER!.password);

            expect(locked.status).toBe(429);
            expect(await locked.text()).toContain("Too many failed attempts, try again in 15 minutes");
            const after = await db.p.user.findUniqueOrThrow({where: {email: env.SUPER_USER!.email}});
            expect(after.password).toBe(before.password);
            expect(after.tokenVersion).toBe(before.tokenVersion);
        });
    });

    describe("contact api", () => {
        const send = (ip: string, body: string) =>
            fromClient(ip, "/api/cl-software", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body,
            });
        const message = (name: string) => JSON.stringify({name, email: "a@example.com", message: "Hi"});

        it("takes 5 messages per client per 10 minutes, then answers 429", async () => {
            const ip = clientIp();
            for (let i = 0; i < 5; i++) expect((await send(ip, message(`Limit ${uid()}`))).status).toBe(200);

            const limited = await send(ip, message(`Limit ${uid()}`));

            expect(limited.status).toBe(429);
            expect(await limited.json()).toEqual({error: "too many requests, try again later"});
        });

        it("answers malformed json with a 400 json error", async () => {
            const res = await send(clientIp(), "{not json");

            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({error: "invalid json"});
        });

        it("answers a body over 32kb with a 413 json error", async () => {
            const res = await send(
                clientIp(),
                JSON.stringify({name: "a", email: "a@example.com", message: "x".repeat(40_000)})
            );

            expect(res.status).toBe(413);
            expect(await res.json()).toEqual({error: "message too large"});
        });
    });

    describe("body limits", () => {
        it("answers a form over 2mb with a 413 page, before it reaches any route", async () => {
            const res = await fromClient(clientIp(), "/admin/login", {
                method: "POST",
                body: new URLSearchParams({email: "a@example.com", password: "y".repeat(2 * 1024 * 1024 + 1)}),
            });

            expect(res.status).toBe(413);
            expect(await res.text()).toContain("That was too large to send.");
        });
    });

    describe("html injection", () => {
        const payloads = [
            `<script>alert("xss")</script>`,
            `<img src="x" onerror="alert(1)">`,
            `[click](javascript:alert(1))`,
            `<iframe src="https://evil.example/embed"></iframe>`,
        ];

        const expectInert = (html: string) => {
            expect(html).not.toContain(`<script>alert("xss")</script>`);
            expect(html).not.toMatch(/onerror=/i);
            expect(html).not.toMatch(/href="javascript:/i);
            expect(html).not.toContain("evil.example");
        };

        it("renders a post's title and markdown inert on the public site", async () => {
            const slug = `inject-${uid()}`;
            await db.p.post.create({
                data: {
                    title: `<script>alert("xss")</script>`,
                    slug,
                    content: payloads.join("\n\n"),
                    published: true,
                    publishedAt: new Date(),
                    author: {connect: {email: env.SUPER_USER!.email}},
                },
            });
            await clearCache(cookie);

            const post = await get(`/blog/${slug}`);
            const list = await get("/blog");

            expect(post.status).toBe(200);
            expectInert(post.html);
            expect(post.html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
            expectInert(list.html);
        });

        it("renders page sections, nav items and the brand inert", async () => {
            const slug = `inject-${uid()}`;
            await db.p.page.create({
                data: {
                    name: `Inject ${uid()}`,
                    slug,
                    title: `<script>alert("xss")</script>`,
                    description: `"><script>alert("xss")</script>`,
                    published: true,
                    sections: {create: {content: payloads.join("\n\n"), published: true}},
                },
            });
            const navigation = await db.p.navigation.findFirstOrThrow();
            const item = await db.p.navigationItem.create({
                data: {
                    navigationId: navigation.id,
                    name: `<script>alert("xss")</script>`,
                    href: `"><script>alert("xss")</script>`,
                },
            });
            await clearCache(cookie);

            const page = await get(`/${slug}`);

            expect(page.status).toBe(200);
            expectInert(page.html);
            await db.p.navigationItem.delete({where: {id: item.id}});
            await clearCache(cookie);
        });

        it("renders a contact message inert in the admin inbox", async () => {
            const name = `Inject ${uid()}`;
            await fromClient(clientIp(), "/api/cl-software", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({name, email: "a@example.com", message: payloads.join("\n")}),
            });

            const inbox = await get("/admin/messages?pageSize=100", cookie);

            expect(inbox.html).toContain(name);
            expect(inbox.html).not.toContain(`<script>alert("xss")</script>`);
            expect(inbox.html).not.toMatch(/<img src="x" onerror/i);
        });
    });

    it("still lets the signed-in admin work after all of the above", async () => {
        expect((await postForm("/admin/settings/cache/clear", {}, cookie)).status).toBe(302);
    });
});
