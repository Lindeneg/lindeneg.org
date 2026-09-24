import {beforeAll, describe, expect, it} from "vitest";
import {db, get, login, postForm, uid} from "./helpers.js";

describe("messages", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    const seed = (name: string) =>
        db.p.contactMessage.create({data: {name, email: "sender@example.com", message: `Hello from ${name}`}});

    it("lists messages", async () => {
        const name = `Sender ${uid()}`;
        await seed(name);

        const res = await get("/admin/messages?pageSize=100", cookie);
        expect(res.status).toBe(200);
        expect(res.html).toContain(name);
    });

    it("toggles the read flag", async () => {
        const message = await seed(`Sender ${uid()}`);

        const first = await postForm(`/admin/messages/${message.id}/toggle-read`, {}, cookie);
        expect(first.status).toBe(302);
        expect(first.location).toBe("/admin/messages");
        expect((await db.p.contactMessage.findUniqueOrThrow({where: {id: message.id}})).read).toBe(true);

        await postForm(`/admin/messages/${message.id}/toggle-read`, {}, cookie);
        expect((await db.p.contactMessage.findUniqueOrThrow({where: {id: message.id}})).read).toBe(false);
    });

    it("returns 404 when toggling an unknown message", async () => {
        const res = await postForm("/admin/messages/does-not-exist/toggle-read", {}, cookie);

        expect(res.status).toBe(404);
        expect(res.html).toContain("Message not found");
    });

    it("deletes a message", async () => {
        const message = await seed(`Sender ${uid()}`);

        const res = await postForm(`/admin/messages/${message.id}/delete`, {}, cookie);
        expect(res.status).toBe(302);
        expect(await db.p.contactMessage.findUnique({where: {id: message.id}})).toBeNull();
    });
});
