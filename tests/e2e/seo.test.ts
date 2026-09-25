import {beforeAll, describe, expect, it} from "vitest";
import {clearCache, db, env, get, idFromLocation, imageBlob, login, postMultipart, uid} from "./helpers.js";

const POST_EDIT = /^\/admin\/blog\/([^/]+)\/edit$/;

describe("seo", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    async function createPost(title: string, fields: {published?: boolean; thumbnail?: boolean; tags?: string} = {}) {
        const form = new FormData();
        form.set("title", title);
        form.set("content", `Intro of ${title}.\n\nMore.`);
        form.set("tags", fields.tags ?? "");
        if (fields.published ?? true) form.set("published", "1");
        if (fields.thumbnail) form.set("thumbnail", imageBlob(), "thumb.png");
        const res = await postMultipart("/admin/blog/new", form, cookie);
        const id = idFromLocation(res.location, POST_EDIT);
        return db.p.post.findUniqueOrThrow({where: {id}});
    }

    it("serves robots.txt pointing at the sitemap and keeping crawlers out of the admin and api", async () => {
        const res = await get("/robots.txt");

        expect(res.status).toBe(200);
        expect(res.html).toBe(
            `User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${env.SITE_URL}/sitemap.xml\n`
        );
    });

    it("lists published pages and posts in the sitemap, but not unpublished ones", async () => {
        const name = uid();
        const published = await db.p.page.create({
            data: {name: `Seo ${name}`, slug: `seo-${name}`, title: "Seo", description: "", published: true},
        });
        const hidden = await db.p.page.create({
            data: {name: `Hidden ${name}`, slug: `hidden-${name}`, title: "Hidden", description: "", published: false},
        });
        const post = await createPost(`Mapped ${uid()}`);
        const draft = await createPost(`Unmapped ${uid()}`, {published: false});
        await clearCache(cookie);

        const res = await get("/sitemap.xml");

        expect(res.status).toBe(200);
        expect(res.html).toContain(`<loc>${env.SITE_URL}/${published.slug}</loc>`);
        expect(res.html).toContain(`<loc>${env.SITE_URL}/blog</loc>`);
        expect(res.html).toContain(`<loc>${env.SITE_URL}/blog/${post.slug}</loc>`);
        expect(res.html).not.toContain(hidden.slug);
        expect(res.html).not.toContain(draft.slug);
    });

    it("lists at most 20 published posts in the feed, newest first", async () => {
        const post = await createPost(`Fed ${uid()}`, {tags: "seo-feed"});
        const draft = await createPost(`Unfed ${uid()}`, {published: false});
        await clearCache(cookie);

        const res = await get("/blog/feed.xml");
        const links = [...res.html.matchAll(/<item>\s*<title>.*?<\/title>\s*<link>(.*?)<\/link>/gs)].map((m) => m[1]);
        const dates = [...res.html.matchAll(/<pubDate>(.*?)<\/pubDate>/g)].map((m) => Date.parse(m[1]));

        expect(res.status).toBe(200);
        expect(links.length).toBeGreaterThan(0);
        expect(links.length).toBeLessThanOrEqual(20);
        expect(links[0]).toBe(`${env.SITE_URL}/blog/${post.slug}`);
        expect(dates).toEqual([...dates].sort((a, b) => b - a));
        expect(res.html).toContain(`<description>Intro of ${post.title}.</description>`);
        expect(res.html).toContain("<category>seo-feed</category>");
        expect(res.html).not.toContain(draft.slug);
    });

    it("links every public page to the feed", async () => {
        expect((await get("/blog")).html).toContain(`href="/blog/feed.xml"`);
    });

    it("gives a post its canonical url, preview tags and structured data", async () => {
        const post = await createPost(`Previewed ${uid()}`, {thumbnail: true, tags: "seo-tag"});
        const url = `${env.SITE_URL}/blog/${post.slug}`;

        const {html} = await get(`/blog/${post.slug}`);

        expect(html).toContain(`<link rel="canonical" href="${url}" />`);
        expect(html).toContain(`<meta name="description" content="Intro of ${post.title}." />`);
        expect(html).toContain(`<meta property="og:url" content="${url}" />`);
        expect(html).toContain(`<meta property="og:type" content="article" />`);
        expect(html).toContain(`<meta property="og:image" content="${post.thumbnail}" />`);
        expect(html).toContain(`<meta name="twitter:card" content="summary_large_image" />`);
        expect(html).toContain(`<meta property="article:tag" content="seo-tag" />`);
        const json = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
        expect(json).toMatchObject({"@type": "BlogPosting", headline: post.title, mainEntityOfPage: url});
    });

    it("canonicalizes the first blog page to /blog", async () => {
        await createPost(`Listed ${uid()}`);
        await clearCache(cookie);

        const {html} = await get("/blog?page=1");

        expect(html).toContain(`<link rel="canonical" href="${env.SITE_URL}/blog" />`);
    });

    it("keeps the admin login and admin pages out of search engines", async () => {
        const noindex = `<meta name="robots" content="noindex" />`;

        expect((await get("/admin/login")).html).toContain(noindex);
        expect((await get("/admin", cookie)).html).toContain(noindex);
        expect((await get("/admin/blog/new", cookie)).html).toContain(noindex);
        expect((await get("/blog")).html).not.toContain(noindex);
    });
});
