import {beforeAll, describe, expect, it} from "vitest";
import {db, get, login} from "./helpers.js";

describe("dashboard", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
        await db.p.contactMessage.create({data: {name: "Unread", email: "u@example.com", message: "hi"}});
    });

    it("shows counts matching the database", async () => {
        const [pages, posts, messages, unread] = await Promise.all([
            db.p.page.count(),
            db.p.post.count(),
            db.p.contactMessage.count(),
            db.p.contactMessage.count({where: {read: false}}),
        ]);

        const res = await get("/admin", cookie);
        expect(res.status).toBe(200);

        const values = [...res.html.matchAll(/<p class="stat-value">(\d+)<\/p>/g)].map((m) => Number(m[1]));
        expect(values).toEqual([pages, posts, messages]);
        expect(res.html).toContain(`${unread} unread`);
    });
});
