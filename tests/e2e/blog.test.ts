import {beforeAll, describe, expect, it} from "vitest";
import {db, get, idFromLocation, imageBlob, login, postForm, postMultipart, uid} from "./helpers.js";

const POST_EDIT = /^\/admin\/blog\/([^/]+)\/edit$/;
const FAKE_IMAGE = /https:\/\/images\.test\/fake-\d+/;

describe("blog", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    function postFields(title: string, opts: {published?: boolean; thumbnail?: boolean; remove?: boolean} = {}) {
        const form = new FormData();
        form.set("title", title);
        form.set("content", `Content of ${title}`);
        if (opts.published) form.set("published", "1");
        if (opts.thumbnail) form.set("thumbnail", imageBlob(), "thumb.png");
        if (opts.remove) form.set("removeThumbnail", "1");
        return form;
    }

    async function createPost(title: string, opts: {published?: boolean; thumbnail?: boolean} = {}) {
        const res = await postMultipart("/admin/blog/new", postFields(title, opts), cookie);
        expect(res.status).toBe(302);
        const id = idFromLocation(res.location, POST_EDIT);
        const post = await db.p.post.findUnique({where: {id}});
        return {id, slug: post!.slug};
    }

    it("lists posts and renders the editor", async () => {
        expect((await get("/admin/blog", cookie)).status).toBe(200);
        expect((await get("/admin/blog/new", cookie)).status).toBe(200);
    });

    it("rejects a post without a title", async () => {
        const res = await postMultipart("/admin/blog/new", postFields(""), cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain("Required");
    });

    it("creates a published post with a thumbnail and serves it publicly", async () => {
        const title = `Post ${uid()}`;
        const {id, slug} = await createPost(title, {published: true, thumbnail: true});

        expect((await get(`/admin/blog/${id}/edit`, cookie)).html).toMatch(FAKE_IMAGE);

        const list = await get("/blog");
        expect(list.status).toBe(200);
        expect(list.html).toContain(title);

        const post = await get(`/blog/${slug}`);
        expect(post.status).toBe(200);
        expect(post.html).toContain(`Content of ${title}`);
    });

    it("hides drafts from the public site", async () => {
        const {slug} = await createPost(`Draft ${uid()}`);

        expect((await get(`/blog/${slug}`)).status).toBe(404);
    });

    it("rejects a title that collides with an existing slug", async () => {
        const title = `Post ${uid()}`;
        await createPost(title);

        const res = await postMultipart("/admin/blog/new", postFields(title), cookie);
        expect(res.status).toBe(400);
        expect(res.html).toContain("title may collide");
    });

    it("replaces and removes the thumbnail", async () => {
        const title = `Post ${uid()}`;
        const {id} = await createPost(title, {published: true, thumbnail: true});
        const before = (await db.p.post.findUnique({where: {id}}))!.thumbnail;

        const replaced = await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {published: true, thumbnail: true}), cookie);
        expect(replaced.status).toBe(302);
        expect(replaced.location).toBe(`/admin/blog/${id}/edit`);
        const after = (await db.p.post.findUnique({where: {id}}))!.thumbnail;
        expect(after).toMatch(FAKE_IMAGE);
        expect(after).not.toBe(before);

        const removed = await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {published: true, remove: true}), cookie);
        expect(removed.status).toBe(302);
        const post = await db.p.post.findUnique({where: {id}});
        expect(post).toMatchObject({thumbnail: "", thumbnailId: ""});
    });

    it("updates the title and slug", async () => {
        const {id, slug} = await createPost(`Post ${uid()}`, {published: true});
        const title = `Renamed ${uid()}`;

        const res = await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {published: true}), cookie);
        expect(res.status).toBe(302);

        const newSlug = (await db.p.post.findUnique({where: {id}}))!.slug;
        expect(newSlug).not.toBe(slug);
        expect((await get(`/blog/${slug}`)).status).toBe(404);
        expect((await get(`/blog/${newSlug}`)).html).toContain(title);
    });

    it("deletes a post", async () => {
        const {id, slug} = await createPost(`Post ${uid()}`, {published: true});

        const res = await postForm(`/admin/blog/${id}/delete`, {}, cookie);
        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/blog");
        expect((await get(`/blog/${slug}`)).status).toBe(404);
        expect((await get(`/admin/blog/${id}/edit`, cookie)).status).toBe(404);
    });

    it("returns 404 for blog pages past the end", async () => {
        expect((await get("/blog?page=9999")).status).toBe(404);
    });
});
