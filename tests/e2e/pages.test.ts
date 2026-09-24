import {beforeAll, describe, expect, it} from "vitest";
import {db, get, idFromLocation, login, postForm, uid} from "./helpers.js";

const PAGE_EDIT = /^\/admin\/pages\/([^/]+)\/edit$/;

describe("pages", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

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

        const res = await get(`/${page!.slug}`);
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
        expect(res.status).toBe(400);
        expect(res.html).toContain("may already exist");
    });

    it("hides unpublished pages and reflects edits immediately", async () => {
        const name = `Page ${uid()}`;
        const id = await createPage(name);
        const slug = (await db.p.page.findUnique({where: {id}}))!.slug;

        expect((await get(`/${slug}`)).status).toBe(200);

        const {published: _, ...unpublished} = pageFields(name);
        const edit = await postForm(`/admin/pages/${id}/edit`, unpublished, cookie);
        expect(edit.status).toBe(302);
        expect(edit.location).toBe(`/admin/pages/${id}/edit`);

        expect((await get(`/${slug}`)).status).toBe(404);
    });

    it("manages sections and invalidates the public cache", async () => {
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
        expect((await get(`/${slug}`)).html).toContain(marker);

        const section = await db.p.pageSection.findFirst({where: {pageId: id}});
        expect((await get(`/admin/sections/${section!.id}/edit`, cookie)).status).toBe(200);

        const edited = await postForm(
            `/admin/sections/${section!.id}/edit`,
            {content: `# ${marker}-edited`, position: "0", published: "1"},
            cookie
        );
        expect(edited.status).toBe(302);
        expect((await get(`/${slug}`)).html).toContain(`${marker}-edited`);

        const deleted = await postForm(`/admin/sections/${section!.id}/delete`, {}, cookie);
        expect(deleted.status).toBe(302);
        expect(deleted.location).toBe(`/admin/pages/${id}/edit`);
        expect((await get(`/${slug}`)).html).not.toContain(marker);
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
