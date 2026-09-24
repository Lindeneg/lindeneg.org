import {beforeAll, describe, expect, it} from "vitest";
import {cacheStats, db, get, idFromLocation, login, postForm, postMultipart, uid} from "./helpers.js";

const POST_EDIT = /^\/admin\/blog\/([^/]+)\/edit$/;

describe("page cache", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    function postFields(title: string, content: string) {
        const form = new FormData();
        form.set("title", title);
        form.set("content", content);
        form.set("published", "1");
        return form;
    }

    async function createPost(title: string) {
        const res = await postMultipart("/admin/blog/new", postFields(title, "original"), cookie);
        const id = idFromLocation(res.location, POST_EDIT);
        const post = await db.p.post.findUniqueOrThrow({where: {id}});
        return {id, slug: post.slug, title};
    }

    it("editing one post keeps other cached pages", async () => {
        const a = await createPost(`Cached ${uid()}`);
        const b = await createPost(`Cached ${uid()}`);
        await get(`/blog/${a.slug}`);
        await get(`/blog/${b.slug}`);

        const before = await cacheStats(cookie);
        await postMultipart(`/admin/blog/${a.id}/edit`, postFields(a.title, "edited"), cookie);

        expect((await get(`/blog/${b.slug}`)).status).toBe(200);
        expect((await get(`/blog/${a.slug}`)).html).toContain("edited");

        const after = await cacheStats(cookie);
        expect(after.hits - before.hits).toBe(1);
        expect(after.misses - before.misses).toBe(1);
    });

    it("a navigation change drops every cached page", async () => {
        await get("/blog");
        expect((await cacheStats(cookie)).entries).toBeGreaterThan(0);

        await postForm("/admin/navigation", {brandName: `Brand ${uid()}`}, cookie);

        expect((await cacheStats(cookie)).entries).toBe(0);
    });

    it("clearing the cache from settings empties it", async () => {
        await get("/blog");

        const res = await postForm("/admin/settings/cache/clear", {}, cookie);

        expect(res.status).toBe(302);
        expect((await cacheStats(cookie)).entries).toBe(0);
    });
});
