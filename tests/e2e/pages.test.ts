import {beforeAll, describe, expect, it} from "vitest";
import {clearCache, db, get, idFromLocation, login, postForm, uid} from "./helpers.js";

const PAGE_EDIT = /^\/admin\/pages\/([^/]+)\/edit$/;

describe("pages", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    // a public page as it looks once the cache is cleared; caching itself is covered in cache.test.ts
    const site = async (path: string) => {
        await clearCache(cookie);
        return get(path);
    };

    const pageFields = (name: string, overrides: Record<string, string> = {}) => ({
        name,
        slug: "",
        title: `${name} title`,
        description: "e2e page",
        published: "1",
        ...overrides,
    });

    async function createPage(name: string, overrides: Record<string, string> = {}) {
        const res = await postForm("/admin/pages/new", pageFields(name, overrides), cookie);
        expect(res.status).toBe(302);
        return idFromLocation(res.location, PAGE_EDIT);
    }

    it("lists pages and renders the new page form", async () => {
        expect((await get("/admin/pages", cookie)).status).toBe(200);
        expect((await get("/admin/pages/new", cookie)).status).toBe(200);
    });

    it("rejects invalid input with field errors", async () => {
        const res = await postForm("/admin/pages/new", pageFields("", {title: ""}), cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain("Required");
    });

    it("creates a page with a slug derived from the name and serves it publicly", async () => {
        const name = `Page ${uid()}`;
        const id = await createPage(name);

        const page = await db.p.page.findUnique({where: {id}});
        expect(page?.slug).toBe(name.toLowerCase().replace(" ", "-"));

        const res = await site(`/${page!.slug}`);
        expect(res.status).toBe(200);
        expect(res.html).toContain(`<title>${name} title</title>`);
    });

    it("slugifies a custom slug", async () => {
        const custom = `Custom Slug ${uid()}`;
        const id = await createPage(`Page ${uid()}`, {slug: custom});

        const page = await db.p.page.findUnique({where: {id}});
        expect(page?.slug).toBe(custom.toLowerCase().replaceAll(" ", "-"));
    });

    it("rejects a duplicate name", async () => {
        const name = `Page ${uid()}`;
        await createPage(name);

        const res = await postForm("/admin/pages/new", pageFields(name), cookie);
        expect(res.status).toBe(409);
        expect(res.html).toContain("Another page already uses this name or slug");
    });

    it("rejects slugs the site routes itself", async () => {
        const res = await postForm("/admin/pages/new", pageFields(`Page ${uid()}`, {slug: "blog"}), cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain("Reserved by the site");
    });

    it("redirects url variants to the canonical page url", async () => {
        const id = await createPage(`Page ${uid()}`);
        const slug = (await db.p.page.findUnique({where: {id}}))!.slug;

        const upper = await get(`/${slug.toUpperCase()}/?x=1`);
        expect(upper.status).toBe(301);
        expect(upper.location).toBe(`/${slug}?x=1`);

        const home = await get("/home");
        expect(home.status).toBe(301);
        expect(home.location).toBe("/");
    });

    it("renders published sections in position order with the page's meta description", async () => {
        const id = await createPage(`Page ${uid()}`, {description: "Meta for search"});
        const slug = (await db.p.page.findUnique({where: {id}}))!.slug;
        const [first, second, draft] = [`first-${uid()}`, `second-${uid()}`, `draft-${uid()}`];
        await postForm(
            `/admin/pages/${id}/sections/new`,
            {content: `# ${second}`, position: "2", published: "1"},
            cookie
        );
        await postForm(`/admin/pages/${id}/sections/new`, {content: `# ${draft}`, position: "0"}, cookie);
        await postForm(
            `/admin/pages/${id}/sections/new`,
            {content: `# ${first}`, position: "1", published: "1"},
            cookie
        );

        const html = (await site(`/${slug}`)).html;
        expect(html.indexOf(first)).toBeGreaterThan(-1);
        expect(html.indexOf(first)).toBeLessThan(html.indexOf(second));
        expect(html).not.toContain(draft);
        expect(html).toContain(`<meta name="description" content="Meta for search" />`);
    });

    it("keeps what was typed when the page is invalid", async () => {
        const res = await postForm("/admin/pages/new", pageFields("Typed name", {title: ""}), cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain(`value="Typed name"`);
    });

    it("serves the 404 page for paths with more than one segment, instead of redirecting", async () => {
        const id = await createPage(`Page ${uid()}`);
        const slug = (await db.p.page.findUnique({where: {id}}))!.slug;
        const [head, ...rest] = slug.split("-");

        const res = await get(`/${head}/${rest.join("-")}`);

        expect(res.status).toBe(404);
        expect(res.html).toContain("This page doesn't exist.");
    });

    it("keeps a signed-in admin in the admin on a mistyped admin url", async () => {
        const res = await get("/admin/does-not-exist", cookie);

        expect(res.status).toBe(404);
        expect(res.html).toContain("Page not found");
        expect(res.html).toContain("admin-sidebar");
    });

    it("answers missing static files with a plain 404", async () => {
        const res = await get(`/missing-${uid()}.js`);

        expect(res.status).toBe(404);
        expect(res.html).toBe("Not found");
    });

    it("hides unpublished pages once the cache is cleared", async () => {
        const name = `Page ${uid()}`;
        const id = await createPage(name);
        const slug = (await db.p.page.findUnique({where: {id}}))!.slug;

        expect((await site(`/${slug}`)).status).toBe(200);

        const {published: _, ...unpublished} = pageFields(name);
        const edit = await postForm(`/admin/pages/${id}/edit`, unpublished, cookie);
        expect(edit.status).toBe(302);
        expect(edit.location).toBe(`/admin/pages/${id}/edit`);

        expect((await site(`/${slug}`)).status).toBe(404);
    });

    it("manages sections, shown on the site once the cache is cleared", async () => {
        const id = await createPage(`Page ${uid()}`);
        const slug = (await db.p.page.findUnique({where: {id}}))!.slug;
        const marker = `section-${uid()}`;

        expect((await get(`/admin/pages/${id}/sections/new`, cookie)).status).toBe(200);

        const invalid = await postForm(`/admin/pages/${id}/sections/new`, {content: "x", position: "-1"}, cookie);
        expect(invalid.status).toBe(400);

        const created = await postForm(
            `/admin/pages/${id}/sections/new`,
            {content: `# ${marker}`, position: "0", published: "1"},
            cookie
        );
        expect(created.status).toBe(302);
        expect(created.location).toBe(`/admin/pages/${id}/edit`);
        expect((await site(`/${slug}`)).html).toContain(marker);

        const section = await db.p.pageSection.findFirst({where: {pageId: id}});
        expect((await get(`/admin/sections/${section!.id}/edit`, cookie)).status).toBe(200);

        const edited = await postForm(
            `/admin/sections/${section!.id}/edit`,
            {content: `# ${marker}-edited`, position: "0", published: "1"},
            cookie
        );
        expect(edited.status).toBe(302);
        expect((await site(`/${slug}`)).html).toContain(`${marker}-edited`);

        const deleted = await postForm(`/admin/sections/${section!.id}/delete`, {}, cookie);
        expect(deleted.status).toBe(302);
        expect(deleted.location).toBe(`/admin/pages/${id}/edit`);
        expect((await site(`/${slug}`)).html).not.toContain(marker);
    });

    it("deletes a page", async () => {
        const id = await createPage(`Page ${uid()}`);

        const res = await postForm(`/admin/pages/${id}/delete`, {}, cookie);
        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/pages");

        expect((await get(`/admin/pages/${id}/edit`, cookie)).status).toBe(404);
    });

    it("renders the admin error page for unknown ids", async () => {
        const page = await get("/admin/pages/does-not-exist/edit", cookie);
        expect(page.status).toBe(404);
        expect(page.html).toContain("Page not found");

        const section = await get("/admin/sections/does-not-exist/edit", cookie);
        expect(section.status).toBe(404);
        expect(section.html).toContain("Section not found");
    });

    it("serves the public 404 page for unknown paths", async () => {
        const res = await get(`/does-not-exist-${uid()}`);

        expect(res.status).toBe(404);
        expect(res.html).toContain("This page doesn't exist.");
    });
});
