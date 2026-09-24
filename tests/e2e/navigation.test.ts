import {beforeAll, describe, expect, it} from "vitest";
import {db, get, login, postForm, uid} from "./helpers.js";

describe("navigation", () => {
    let cookie: string;
    let navigationId: string;

    beforeAll(async () => {
        cookie = await login();
        navigationId = (await db.p.navigation.findFirstOrThrow()).id;
    });

    const itemFields = (name: string, overrides: Record<string, string> = {}) => ({
        navigationId,
        name,
        href: `/${name.toLowerCase()}`,
        position: "1",
        alignment: "LEFT",
        ...overrides,
    });

    it("renders the navigation and item form", async () => {
        expect((await get("/admin/navigation", cookie)).status).toBe(200);
        expect((await get("/admin/nav-items/new", cookie)).status).toBe(200);
    });

    it("updates the brand name on the public site", async () => {
        expect((await postForm("/admin/navigation", {brandName: ""}, cookie)).status).toBe(400);

        const brand = `Brand ${uid()}`;
        const res = await postForm("/admin/navigation", {brandName: brand}, cookie);
        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/navigation");

        expect((await get("/blog")).html).toContain(brand);
    });

    it("rejects an invalid item", async () => {
        const res = await postForm("/admin/nav-items/new", itemFields(`Item${uid()}`, {alignment: "UP"}), cookie);

        expect(res.status).toBe(400);
    });

    it("creates, edits and deletes an item", async () => {
        const name = `Item${uid()}`;
        const created = await postForm("/admin/nav-items/new", itemFields(name), cookie);
        expect(created.status).toBe(302);
        expect((await get("/blog")).html).toContain(name);

        const item = await db.p.navigationItem.findFirstOrThrow({where: {name}});
        expect((await get(`/admin/nav-items/${item.id}/edit`, cookie)).status).toBe(200);

        const renamed = `Item${uid()}`;
        const edited = await postForm(`/admin/nav-items/${item.id}/edit`, itemFields(renamed, {newTab: "1"}), cookie);
        expect(edited.status).toBe(302);
        const html = (await get("/blog")).html;
        expect(html).toContain(renamed);
        expect(html).not.toContain(name);

        const deleted = await postForm(`/admin/nav-items/${item.id}/delete`, {}, cookie);
        expect(deleted.status).toBe(302);
        expect((await get("/blog")).html).not.toContain(renamed);
    });

    it("returns 404 for an unknown item", async () => {
        const res = await get("/admin/nav-items/does-not-exist/edit", cookie);

        expect(res.status).toBe(404);
        expect(res.html).toContain("Item not found");
    });
});
