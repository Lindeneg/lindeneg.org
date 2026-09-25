import {beforeAll, describe, expect, it} from "vitest";
import {DEFAULT_PAGE_SIZE} from "../../src/lib/pagination.js";
import {MAX_FORM_BYTES, MAX_UPLOAD_BYTES} from "../../src/lib/http.js";
import {clearCache, db, get, idFromLocation, imageBlob, login, postForm, postMultipart, uid} from "./helpers.js";

const POST_EDIT = /^\/admin\/blog\/([^/]+)\/edit$/;
const FAKE_IMAGE = /https:\/\/images\.test\/fake-\d+/;

describe("blog", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    // a public page as it looks once the cache is cleared; caching itself is covered in cache.test.ts
    const site = async (path: string) => {
        await clearCache(cookie);
        return get(path);
    };

    type PostOpts = {published?: boolean; thumbnail?: boolean; remove?: boolean; tags?: string};

    function postFields(title: string, opts: PostOpts = {}) {
        const form = new FormData();
        form.set("title", title);
        form.set("content", `Content of ${title}`);
        if (opts.published) form.set("published", "1");
        if (opts.thumbnail) form.set("thumbnail", imageBlob(), "thumb.png");
        if (opts.remove) form.set("removeThumbnail", "1");
        if (opts.tags !== undefined) form.set("tags", opts.tags);
        return form;
    }

    async function createPost(title: string, opts: Omit<PostOpts, "remove"> = {}) {
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

        const list = await site("/blog");
        expect(list.status).toBe(200);
        expect(list.html).toContain(title);

        const post = await site(`/blog/${slug}`);
        expect(post.status).toBe(200);
        expect(post.html).toContain(`Content of ${title}`);
    });

    it("hides drafts from the public site", async () => {
        const {slug} = await createPost(`Draft ${uid()}`);

        expect((await site(`/blog/${slug}`)).status).toBe(404);
    });

    it("rejects a title that collides with an existing slug", async () => {
        const title = `Post ${uid()}`;
        await createPost(title);

        const res = await postMultipart("/admin/blog/new", postFields(title), cookie);
        expect(res.status).toBe(409);
        expect(res.html).toContain("Another post already uses this slug");
    });

    it("keeps an explicit slug when the title changes", async () => {
        const slug = `kept-${uid()}`;
        const create = postFields(`Post ${uid()}`, {published: true});
        create.set("slug", slug);
        const res = await postMultipart("/admin/blog/new", create, cookie);
        const id = idFromLocation(res.location, POST_EDIT);

        const edit = postFields(`Renamed ${uid()}`, {published: true});
        edit.set("slug", slug);
        expect((await postMultipart(`/admin/blog/${id}/edit`, edit, cookie)).status).toBe(302);

        expect((await db.p.post.findUniqueOrThrow({where: {id}})).slug).toBe(slug);
        expect((await site(`/blog/${slug}`)).status).toBe(200);
    });

    it("rejects an oversized thumbnail with a form error instead of the error page", async () => {
        const form = postFields(`Post ${uid()}`);
        form.set("thumbnail", new Blob([Buffer.alloc(MAX_UPLOAD_BYTES + 1)], {type: "image/png"}), "big.png");

        const res = await postMultipart("/admin/blog/new", form, cookie);
        expect(res.status).toBe(400);
        expect(res.html).toContain("Image must be 10MB or smaller");
    });

    it("keeps the saved content and tags on the edit form when an oversized thumbnail stops the upload", async () => {
        const title = `Post ${uid()}`;
        const tag = `kept${uid()}`;
        const {id} = await createPost(title, {published: true, tags: tag});

        // the browser sends the editor header (title, published) first, then slug, thumbnail, tags and content; when
        // multer rejects the file, whether the fields after it still arrive depends on timing, so this sends them
        // missing, the case the fallback is for
        const form = new FormData();
        form.set("title", `Renamed ${title}`);
        form.set("slug", "");
        form.set("thumbnail", new Blob([Buffer.alloc(MAX_UPLOAD_BYTES + 1)], {type: "image/png"}), "big.png");

        const res = await postMultipart(`/admin/blog/${id}/edit`, form, cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain("Image must be 10MB or smaller");
        expect(res.html).toMatch(new RegExp(`name="title"\\s+value="Renamed ${title}"`));
        expect(res.html.match(/<textarea[^>]*name="content"[\s\S]*?<\/textarea>/)?.[0]).toContain(
            `>Content of ${title}</textarea>`
        );
        expect(res.html).toContain(`name="tags" value="${tag}"`);
        expect(res.html).not.toMatch(/name="published" form="md-form" value="1" checked/);
    });

    it("says a post over the form limit is too large, at the top and not as an image error", async () => {
        const form = postFields(`Post ${uid()}`);
        form.set("content", "x".repeat(MAX_FORM_BYTES + 1));

        const res = await postMultipart("/admin/blog/new", form, cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain(`<div class="form-top-error">The post is too large to save (max 2MB)</div>`);
        expect(res.html).not.toContain("Upload failed");
    });

    it("lists published posts by when they were published, not when they were created", async () => {
        const drafted = `Drafted ${uid()}`;
        const direct = `Direct ${uid()}`;
        const {id: draftedId} = await createPost(drafted);
        await createPost(direct, {published: true});
        await postMultipart(`/admin/blog/${draftedId}/edit`, postFields(drafted, {published: true}), cookie);

        const html = (await site("/blog")).html;
        expect(html.indexOf(drafted)).toBeGreaterThan(-1);
        expect(html.indexOf(drafted)).toBeLessThan(html.indexOf(direct));
    });

    it("keeps the first publish date when a post is unpublished and published again", async () => {
        const title = `Post ${uid()}`;
        const {id} = await createPost(title, {published: true});
        const first = (await db.p.post.findUniqueOrThrow({where: {id}})).publishedAt;

        await postMultipart(`/admin/blog/${id}/edit`, postFields(title), cookie);
        await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {published: true}), cookie);

        expect((await db.p.post.findUniqueOrThrow({where: {id}})).publishedAt).toEqual(first);
    });

    it("renders the post page with author, publish date, reading time and tags", async () => {
        const title = `Post ${uid()}`;
        const tag = `tag${uid()}`;
        const {id, slug} = await createPost(title, {published: true, tags: tag});
        const post = await db.p.post.findUniqueOrThrow({where: {id}, include: {author: true}});

        const html = (await site(`/blog/${slug}`)).html;
        expect(html).toContain(`<h1 class="blog-post-title">${title}</h1>`);
        expect(html).toContain(`<p class="blog-post-author">${post.author.name}</p>`);
        expect(html).toContain(`<time datetime="${post.publishedAt!.toISOString()}" data-local-date="long">`);
        expect(html).toContain("1 min read");
        expect(html).toContain(`href="/blog?tag=${tag}"`);
    });

    it("shows the thumbnail on the post card", async () => {
        const title = `Post ${uid()}`;
        await createPost(title, {published: true, thumbnail: true});

        const card = (await site("/blog")).html.match(
            new RegExp(`<a href="/blog/[^"]+" class="post-card">(?:(?!</a>).)*${title}`, "s")
        );
        expect(card?.[0]).toMatch(/<img src="https:\/\/images\.test\/fake-\d+"/);
    });

    it("removes tags no post uses anymore", async () => {
        const [old, kept] = [`old${uid()}`, `kept${uid()}`];
        const title = `Tagged ${uid()}`;
        const {id} = await createPost(title, {tags: `${old}, ${kept}`});

        await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {tags: kept}), cookie);
        expect(await db.p.tag.findUnique({where: {name: old}})).toBeNull();
        expect(await db.p.tag.findUnique({where: {name: kept}})).not.toBeNull();

        await postForm(`/admin/blog/${id}/delete`, {}, cookie);
        expect(await db.p.tag.findUnique({where: {name: kept}})).toBeNull();
    });

    it("keeps a tag another post still uses", async () => {
        const shared = `shared${uid()}`;
        const {id} = await createPost(`A ${uid()}`, {tags: shared});
        await createPost(`B ${uid()}`, {tags: shared});

        await postForm(`/admin/blog/${id}/delete`, {}, cookie);

        expect(await db.p.tag.findUnique({where: {name: shared}})).not.toBeNull();
    });

    it("keeps what was typed when the post is invalid", async () => {
        const form = postFields("");
        form.set("content", "Typed body");
        form.set("tags", "typed-tag");

        const res = await postMultipart("/admin/blog/new", form, cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain(">Typed body</textarea>");
        expect(res.html).toContain(`value="typed-tag"`);
    });

    it("dates a post when it is first published", async () => {
        const title = `Post ${uid()}`;
        const {id} = await createPost(title);
        expect((await db.p.post.findUniqueOrThrow({where: {id}})).publishedAt).toBeNull();

        await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {published: true}), cookie);
        expect((await db.p.post.findUniqueOrThrow({where: {id}})).publishedAt).toBeInstanceOf(Date);
    });

    it("replaces and removes the thumbnail", async () => {
        const title = `Post ${uid()}`;
        const {id} = await createPost(title, {published: true, thumbnail: true});
        const before = (await db.p.post.findUnique({where: {id}}))!.thumbnail;

        const replaced = await postMultipart(
            `/admin/blog/${id}/edit`,
            postFields(title, {published: true, thumbnail: true}),
            cookie
        );
        expect(replaced.status).toBe(302);
        expect(replaced.location).toBe(`/admin/blog/${id}/edit`);
        const after = (await db.p.post.findUnique({where: {id}}))!.thumbnail;
        expect(after).toMatch(FAKE_IMAGE);
        expect(after).not.toBe(before);

        const removed = await postMultipart(
            `/admin/blog/${id}/edit`,
            postFields(title, {published: true, remove: true}),
            cookie
        );
        expect(removed.status).toBe(302);
        const post = await db.p.post.findUnique({where: {id}});
        expect(post).toMatchObject({thumbnail: null, thumbnailId: null});
    });

    it("updates the title and slug", async () => {
        const {id, slug} = await createPost(`Post ${uid()}`, {published: true});
        const title = `Renamed ${uid()}`;

        const res = await postMultipart(`/admin/blog/${id}/edit`, postFields(title, {published: true}), cookie);
        expect(res.status).toBe(302);

        const newSlug = (await db.p.post.findUnique({where: {id}}))!.slug;
        expect(newSlug).not.toBe(slug);
        expect((await site(`/blog/${slug}`)).status).toBe(404);
        expect((await site(`/blog/${newSlug}`)).html).toContain(title);
    });

    it("deletes a post", async () => {
        const {id, slug} = await createPost(`Post ${uid()}`, {published: true});

        const res = await postForm(`/admin/blog/${id}/delete`, {}, cookie);
        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/blog");
        expect((await site(`/blog/${slug}`)).status).toBe(404);
        expect((await get(`/admin/blog/${id}/edit`, cookie)).status).toBe(404);
    });

    it("returns 404 for blog pages past the end", async () => {
        expect((await site("/blog?page=9999")).status).toBe(404);
    });

    describe("tags", () => {
        const tagsOf = async (id: string) =>
            (await db.p.post.findUniqueOrThrow({where: {id}, include: {tags: true}})).tags.map((t) => t.name).sort();

        it("normalizes tags on create and shows them in the editor", async () => {
            const suffix = uid();
            const {id} = await createPost(`Tagged ${uid()}`, {
                tags: `Jazz${suffix}, Music Theory${suffix} ,jazz${suffix},`,
            });

            expect(await tagsOf(id)).toEqual([`jazz${suffix}`, `music-theory${suffix}`]);
            expect((await get(`/admin/blog/${id}/edit`, cookie)).html).toContain(
                `jazz${suffix}, music-theory${suffix}`
            );
        });

        it("filters the public list by tag", async () => {
            const tag = `tag${uid()}`;
            const tagged = await createPost(`Tagged ${uid()}`, {published: true, tags: tag});
            const other = await createPost(`Untagged ${uid()}`, {published: true});
            const taggedTitle = (await db.p.post.findUniqueOrThrow({where: {id: tagged.id}})).title;
            const otherTitle = (await db.p.post.findUniqueOrThrow({where: {id: other.id}})).title;

            const res = await site(`/blog?tag=${tag}`);
            expect(res.status).toBe(200);
            expect(res.html).toContain(taggedTitle);
            expect(res.html).not.toContain(otherTitle);
            expect(res.html).toContain(`aria-current="page"><span class="tag-hash">#</span>${tag}`);

            expect((await site("/blog")).html).toContain(`href="/blog?tag=${tag}"`);
            expect((await site(`/blog/${tagged.slug}`)).html).toContain(
                `<a href="/blog?tag=${tag}" class="tag"><span class="tag-hash">#</span>${tag}</a>`
            );
            expect(res.html).toContain(`<p class="post-card-topic">${tag}</p>`);
        });

        it("returns 404 for unknown tags and tags with only drafts", async () => {
            const draftOnly = `draft${uid()}`;
            await createPost(`Draft ${uid()}`, {tags: draftOnly});

            expect((await site(`/blog?tag=unknown${uid()}`)).status).toBe(404);
            expect((await site(`/blog?tag=${draftOnly}`)).status).toBe(404);
        });

        it("replaces tags on edit", async () => {
            const before = `before${uid()}`;
            const after = `after${uid()}`;
            const title = `Retagged ${uid()}`;
            const {id} = await createPost(title, {published: true, tags: before});
            expect((await site(`/blog?tag=${before}`)).status).toBe(200);

            const res = await postMultipart(
                `/admin/blog/${id}/edit`,
                postFields(title, {published: true, tags: after}),
                cookie
            );
            expect(res.status).toBe(302);

            expect(await tagsOf(id)).toEqual([after]);
            expect((await site(`/blog?tag=${before}`)).status).toBe(404);
            expect((await site(`/blog?tag=${after}`)).status).toBe(200);
        });

        it("keeps the tag in pagination links", async () => {
            const tag = `paged${uid()}`;
            for (let i = 0; i <= DEFAULT_PAGE_SIZE; i++) {
                await createPost(`Paged ${uid()}`, {published: true, tags: tag});
            }

            const first = await site(`/blog?tag=${tag}`);
            expect(first.html).toContain(`href="/blog?tag=${tag}&amp;page=2"`);

            const second = await site(`/blog?tag=${tag}&page=2`);
            expect(second.status).toBe(200);
            expect(second.html).toContain("Page 2 of 2");
        });
    });
});
