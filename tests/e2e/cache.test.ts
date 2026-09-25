import {beforeAll, describe, expect, it} from "vitest";
import {cacheStats, clearCache, db, get, idFromLocation, login, postForm, postMultipart, uid} from "./helpers.js";

const POST_EDIT = /^\/admin\/blog\/([^/]+)\/edit$/;

// only the clear button in the admin settings empties the cache; saving content never does
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

    it("serves a cached page from the cache on the next visit", async () => {
        const post = await createPost(`Cached ${uid()}`);
        await get(`/blog/${post.slug}`);

        const before = await cacheStats(cookie);
        await get(`/blog/${post.slug}`);
        const after = await cacheStats(cookie);

        expect(after.hits - before.hits).toBe(1);
        expect(after.misses - before.misses).toBe(0);
    });

    it("keeps showing a page as it was until the cache is cleared", async () => {
        const post = await createPost(`Cached ${uid()}`);
        expect((await get(`/blog/${post.slug}`)).html).toContain("original");

        await postMultipart(`/admin/blog/${post.id}/edit`, postFields(post.title, "edited"), cookie);
        expect((await get(`/blog/${post.slug}`)).html).toContain("original");

        await clearCache(cookie);
        expect((await get(`/blog/${post.slug}`)).html).toContain("edited");
    });

    it("keeps every cached page through a navigation change", async () => {
        await get("/blog");
        const before = (await cacheStats(cookie)).entries;
        expect(before).toBeGreaterThan(0);

        await postForm("/admin/navigation", {brandName: `Brand ${uid()}`}, cookie);

        expect((await cacheStats(cookie)).entries).toBe(before);
    });

    it("clearing the cache from settings empties it", async () => {
        await get("/blog");

        const res = await postForm("/admin/settings/cache/clear", {}, cookie);

        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/settings");
        expect((await cacheStats(cookie)).entries).toBe(0);
    });
});
