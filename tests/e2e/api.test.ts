import {describe, expect, it} from "vitest";
import {BASE_URL, db, env, get, login, uid} from "./helpers.js";

// the freelance site posts its contact form here, cross-origin
describe("contact api", () => {
    const origin = env.ORIGINS[0];

    const post = (body: unknown, headers: Record<string, string> = {}) =>
        fetch(`${BASE_URL}/api/cl-software`, {
            method: "POST",
            headers: {"content-type": "application/json", origin, ...headers},
            body: JSON.stringify(body),
        });

    it("stores a valid message as unread", async () => {
        const name = `Api ${uid()}`;

        const res = await post({name, email: "api@example.com", message: "Hello"});

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({success: true});
        const stored = await db.p.contactMessage.findFirstOrThrow({where: {name}});
        expect(stored).toMatchObject({email: "api@example.com", message: "Hello", read: false});
    });

    it("shows a sent message as unread in the admin inbox", async () => {
        const name = `Inbox ${uid()}`;
        await post({name, email: "inbox@example.com", message: "Please get back to me"});

        const html = (await get("/admin/messages?pageSize=100", await login())).html;
        const row = html.match(
            new RegExp(
                `<details class="message-row is-unread">(?:(?!</details>).)*${name}(?:(?!</details>).)*</details>`,
                "s"
            )
        );
        expect(row?.[0]).toContain("inbox@example.com");
        expect(row?.[0]).toContain("Please get back to me");
    });

    it("rejects invalid input with field errors", async () => {
        const res = await post({name: "", email: "not-an-email", message: "Hi"});

        expect(res.status).toBe(400);
        expect((await res.json()).errors).toHaveProperty("email");
    });

    it("allows the configured origin to call it cross-origin", async () => {
        const preflight = await fetch(`${BASE_URL}/api/cl-software`, {
            method: "OPTIONS",
            headers: {
                origin,
                "access-control-request-method": "POST",
                "access-control-request-headers": "content-type",
            },
        });

        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("access-control-allow-origin")).toBe(origin);
    });

    it("keeps cors headers off the rest of the site", async () => {
        const res = await fetch(`${BASE_URL}/blog`, {headers: {origin}});

        expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("answers the health check", async () => {
        const res = await get("/healthz");

        expect(res.status).toBe(200);
        expect(JSON.parse(res.html)).toEqual({status: "ok"});
    });
});
