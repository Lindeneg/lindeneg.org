import {afterEach, beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import express from "express";
import {failure, success} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import {makeSitePublicRouter} from "../../../src/routers/public-router.js";
import type TemplateService from "../../../src/services/template-service.js";
import {fake} from "../helpers.js";
import {serve, type Served} from "../serve.js";

describe("public router", () => {
    let templates: Record<"getPage" | "getBlogList" | "getBlogPost" | "getNotFound" | "getServerError", Mock>;
    let server: Served;

    const get = (path: string, init: RequestInit = {}) => fetch(server.url + path, {redirect: "manual", ...init});

    beforeEach(async () => {
        templates = {
            getPage: vi.fn().mockResolvedValue(success("<p>page</p>")),
            getBlogList: vi.fn().mockResolvedValue(success("<p>list</p>")),
            getBlogPost: vi.fn().mockResolvedValue(success("<p>post</p>")),
            getNotFound: vi.fn().mockResolvedValue("<p>404</p>"),
            getServerError: vi.fn().mockResolvedValue("<p>500</p>"),
        };
        const app = express();
        app.use(makeSitePublicRouter(fake<TemplateService>(templates)));
        server = await serve(app);
    });

    afterEach(() => server.close());

    describe("pages", () => {
        it("serves / as the home page", async () => {
            const res = await get("/");

            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toMatch(/text\/html/);
            expect(await res.text()).toBe("<p>page</p>");
            expect(templates.getPage).toHaveBeenCalledWith("home");
        });

        it("serves a page by its slug", async () => {
            expect((await get("/about")).status).toBe(200);
            expect(templates.getPage).toHaveBeenCalledWith("about");
        });

        it("answers HEAD like GET", async () => {
            expect((await get("/about", {method: "HEAD"})).status).toBe(200);
        });

        it.each([
            ["/About", "/about"],
            ["/about/", "/about"],
            ["/home", "/"],
            ["/Home/", "/"],
        ])("redirects %s to its canonical url %s without loading the page", async (path, canonical) => {
            const res = await get(path);

            expect(res.status).toBe(301);
            expect(res.headers.get("location")).toBe(canonical);
            expect(templates.getPage).not.toHaveBeenCalled();
        });

        it.each([
            ["/foo/bar", "foo/bar"],
            ["/about_me", "about_me"],
        ])("looks %s up as it is, so it is a 404 rather than another page", async (path, slug) => {
            templates.getPage.mockResolvedValue(failure(AppError.NOT_FOUND));

            const res = await get(path);

            expect(res.status).toBe(404);
            expect(templates.getPage).toHaveBeenCalledWith(slug);
        });

        it("keeps the query string when redirecting", async () => {
            const res = await get("/About?ref=nav&x=1");

            expect(res.headers.get("location")).toBe("/about?ref=nav&x=1");
        });

        it("renders the 404 page for a missing page", async () => {
            templates.getPage.mockResolvedValue(failure(AppError.NOT_FOUND));

            const res = await get("/missing");

            expect(res.status).toBe(404);
            expect(await res.text()).toBe("<p>404</p>");
            expect(templates.getNotFound).toHaveBeenCalledWith("/missing");
        });

        it("renders the 500 page, not a 404, when the database fails", async () => {
            templates.getPage.mockResolvedValue(failure(AppError.DB_ERROR));

            const res = await get("/about");

            expect(res.status).toBe(500);
            expect(await res.text()).toBe("<p>500</p>");
            expect(templates.getServerError).toHaveBeenCalledWith("/about");
            expect(templates.getNotFound).not.toHaveBeenCalled();
        });

        it("answers a missing static file with a plain 404 and no page lookup", async () => {
            for (const path of ["/app.js", "/favicon.png", "/styles.css.map", "/wp-login.php"]) {
                const res = await get(path);

                expect(res.status, path).toBe(404);
                expect(await res.text(), path).toBe("Not found");
            }
            expect(templates.getPage).not.toHaveBeenCalled();
            expect(templates.getNotFound).not.toHaveBeenCalled();
        });

        it("lets other methods fall through", async () => {
            expect((await get("/about", {method: "POST"})).status).toBe(404);
            expect(templates.getPage).not.toHaveBeenCalled();
        });
    });

    describe("blog", () => {
        it("passes the page and tag to the blog list", async () => {
            const res = await get("/blog?page=2&tag=jazz");

            expect(res.status).toBe(200);
            expect(await res.text()).toBe("<p>list</p>");
            expect(templates.getBlogList).toHaveBeenCalledWith(2, "jazz");
        });

        it.each([
            ["/blog", 1, undefined],
            ["/blog?page=abc", 1, undefined],
            ["/blog?page=0", 1, undefined],
            ["/blog?tag=", 1, undefined],
            ["/blog?tag=a&tag=b", 1, undefined],
        ])("reads %s as page %s, tag %s", async (path, page, tag) => {
            await get(path);

            expect(templates.getBlogList).toHaveBeenCalledWith(page, tag);
        });

        it("serves a post by its slug", async () => {
            const res = await get("/blog/hello-world");

            expect(await res.text()).toBe("<p>post</p>");
            expect(templates.getBlogPost).toHaveBeenCalledWith("hello-world");
        });

        it("maps a missing post to 404 and a database failure to 500", async () => {
            templates.getBlogPost.mockResolvedValueOnce(failure(AppError.NOT_FOUND));
            expect((await get("/blog/missing")).status).toBe(404);

            templates.getBlogPost.mockResolvedValueOnce(failure(AppError.DB_ERROR));
            expect((await get("/blog/any")).status).toBe(500);
        });

        it("maps blog list failures the same way", async () => {
            templates.getBlogList.mockResolvedValueOnce(failure(AppError.NOT_FOUND));
            expect((await get("/blog?page=99")).status).toBe(404);

            templates.getBlogList.mockResolvedValueOnce(failure(AppError.DB_ERROR));
            expect((await get("/blog")).status).toBe(500);
        });
    });
});
