import {beforeAll, describe, expect, it} from "vitest";
import {clearCache, db, get, login, postForm, uid} from "./helpers.js";

describe("navigation", () => {
    let cookie: string;
    let navigationId: string;

    beforeAll(async () => {
        cookie = await login();
        navigationId = (await db.p.navigation.findFirstOrThrow()).id;
    });

    // the public site as it looks once the cache is cleared
    const site = async () => {
        await clearCache(cookie);
        return (await get("/blog")).html;
    };

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

        expect(await site()).toContain(brand);
    });

    it("rejects an invalid item", async () => {
        const res = await postForm("/admin/nav-items/new", itemFields(`Item${uid()}`, {alignment: "UP"}), cookie);

        expect(res.status).toBe(400);
    });

    it("creates, edits and deletes an item", async () => {
        const name = `Item${uid()}`;
        const created = await postForm("/admin/nav-items/new", itemFields(name), cookie);
        expect(created.status).toBe(302);
        expect(await site()).toContain(name);

        const item = await db.p.navigationItem.findFirstOrThrow({where: {name}});
        expect((await get(`/admin/nav-items/${item.id}/edit`, cookie)).status).toBe(200);

        const renamed = `Item${uid()}`;
        const edited = await postForm(`/admin/nav-items/${item.id}/edit`, itemFields(renamed, {newTab: "1"}), cookie);
        expect(edited.status).toBe(302);
        const html = await site();
        expect(html).toContain(renamed);
        expect(html).not.toContain(name);

        const deleted = await postForm(`/admin/nav-items/${item.id}/delete`, {}, cookie);
        expect(deleted.status).toBe(302);
        expect(await site()).not.toContain(renamed);
    });

    // the public link for an item, from the desktop nav
    const publicLink = async (name: string) => {
        const html = await site();
        return html.match(new RegExp(`<a [^>]*class="nav-link"[^>]*>${name}.*?</a>`))?.[0] ?? "";
    };

    it("opens an item in a new tab only while it is ticked, external links included", async () => {
        const name = `Ext${uid()}`;
        await postForm(
            "/admin/nav-items/new",
            itemFields(name, {href: "https://example.com", newTab: "1", alignment: "RIGHT"}),
            cookie
        );
        const item = await db.p.navigationItem.findFirstOrThrow({where: {name}});
        expect(await publicLink(name)).toContain(`target="_blank"`);
        expect((await get(`/admin/nav-items/${item.id}/edit`, cookie)).html).toMatch(/name="newTab" value="1" checked/);

        const unticked = await postForm(
            `/admin/nav-items/${item.id}/edit`,
            itemFields(name, {href: "https://example.com", alignment: "RIGHT"}),
            cookie
        );
        expect(unticked.status).toBe(302);

        expect((await db.p.navigationItem.findUniqueOrThrow({where: {id: item.id}})).newTab).toBe(false);
        expect(await publicLink(name)).not.toContain(`target="_blank"`);
        expect((await get(`/admin/nav-items/${item.id}/edit`, cookie)).html).toMatch(/name="newTab" value="1" \/>/);

        await postForm(`/admin/nav-items/${item.id}/delete`, {}, cookie);
    });

    it("trims the name and href", async () => {
        const name = `Trim${uid()}`;
        await postForm(
            "/admin/nav-items/new",
            itemFields(name, {name: `  ${name} `, href: "\thttps://example.com "}),
            cookie
        );

        const item = await db.p.navigationItem.findFirstOrThrow({where: {name}});
        expect(item.href).toBe("https://example.com");
        await postForm(`/admin/nav-items/${item.id}/delete`, {}, cookie);
    });

    it("adds items to the site's navigation whatever navigation id the form sends", async () => {
        const name = `Forged${uid()}`;
        const res = await postForm("/admin/nav-items/new", itemFields(name, {navigationId: "someone-elses"}), cookie);
        expect(res.status).toBe(302);

        const item = await db.p.navigationItem.findFirstOrThrow({where: {name}});
        expect(item.navigationId).toBe(navigationId);
        await postForm(`/admin/nav-items/${item.id}/delete`, {}, cookie);
    });

    it("orders items on the site by position", async () => {
        const [late, early] = [`Late${uid()}`, `Early${uid()}`];
        await postForm("/admin/nav-items/new", itemFields(late, {position: "91"}), cookie);
        await postForm("/admin/nav-items/new", itemFields(early, {position: "90"}), cookie);

        const html = await site();
        expect(html.indexOf(`>${early}<`)).toBeGreaterThan(-1);
        expect(html.indexOf(`>${early}<`)).toBeLessThan(html.indexOf(`>${late}<`));

        for (const name of [late, early]) {
            const item = await db.p.navigationItem.findFirstOrThrow({where: {name}});
            await postForm(`/admin/nav-items/${item.id}/delete`, {}, cookie);
        }
    });

    it("keeps what was typed when the item is invalid", async () => {
        const res = await postForm(
            "/admin/nav-items/new",
            itemFields("Typed", {href: "/typed", position: "-1"}),
            cookie
        );

        expect(res.status).toBe(400);
        expect(res.html).toContain(`value="Typed"`);
        expect(res.html).toContain(`value="/typed"`);
    });

    it("returns 404 for an unknown item", async () => {
        const res = await get("/admin/nav-items/does-not-exist/edit", cookie);

        expect(res.status).toBe(404);
        expect(res.html).toContain("Item not found");
    });
});
