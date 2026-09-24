import {beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import {failure, success} from "../../../src/lib/result.js";
import PageCache, {CacheTag} from "../../../src/lib/page-cache.js";
import TemplateService, {TEMPLATE_ERR} from "../../../src/services/template-service.js";
import type PageRepository from "../../../src/repositories/page-repository.js";
import type NavigationRepository from "../../../src/repositories/navigation-repository.js";
import type PostRepository from "../../../src/repositories/post-repository.js";
import {fake, makeNav, makePage, makePost} from "../helpers.js";

describe("TemplateService", () => {
    let getBySlug: Mock;
    let getNav: Mock;
    let listPosts: Mock;
    let getPost: Mock;
    let cache: PageCache;
    let service: TemplateService;

    beforeEach(() => {
        getBySlug = vi.fn().mockResolvedValue(success(makePage()));
        getNav = vi.fn().mockResolvedValue(success(makeNav()));
        listPosts = vi.fn().mockResolvedValue(success({data: [makePost()], total: 1}));
        getPost = vi.fn().mockImplementation(async (slug: string) => success(makePost({id: slug, slug})));
        cache = new PageCache(100);
        service = new TemplateService(
            fake<PageRepository>({getBySlug}),
            fake<NavigationRepository>({get: getNav}),
            fake<PostRepository>({list: listPosts, getBySlug: getPost}),
            cache
        );
    });

    describe("cache tags", () => {
        it("drops only the invalidated post", async () => {
            await service.getBlogPost("a");
            await service.getBlogPost("b");

            cache.invalidate([CacheTag.post("a")]);
            await service.getBlogPost("a");
            await service.getBlogPost("b");

            expect(getPost.mock.calls.map(([slug]) => slug)).toEqual(["a", "b", "a"]);
        });

        it("drops a post when its author changes", async () => {
            await service.getBlogPost("a");

            cache.invalidate([CacheTag.user("user-1")]);
            await service.getBlogPost("a");

            expect(getPost).toHaveBeenCalledTimes(2);
        });

        it("drops the blog list but not posts on blog-list invalidation", async () => {
            await service.getBlogList(1);
            await service.getBlogPost("a");

            cache.invalidate([CacheTag.blogList]);
            await service.getBlogList(1);
            await service.getBlogPost("a");

            expect(listPosts).toHaveBeenCalledTimes(2);
            expect(getPost).toHaveBeenCalledOnce();
        });

        it("drops a page by id", async () => {
            await service.getPage("about", "/about");

            cache.invalidate([CacheTag.page("page-1")]);
            await service.getPage("about", "/about");

            expect(getBySlug).toHaveBeenCalledTimes(2);
        });

        it("drops everything on a nav change", async () => {
            await service.getPage("about", "/about");
            await service.getBlogList(1);
            await service.getBlogPost("a");

            cache.invalidate([CacheTag.nav]);

            expect(service.cacheStats().entries).toBe(0);
        });
    });

    describe("getPage", () => {
        it("renders a published page", async () => {
            const result = await service.getPage("about", "/about");

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain("<title>About</title>");
            expect(result.data).toContain("<h1>About</h1>");
        });

        it("caches the canonical path, including case and trailing slash variants", async () => {
            await service.getPage("about", "/about");
            await service.getPage("about", "/About/");

            expect(getBySlug).toHaveBeenCalledOnce();
        });

        it("caches the home page at /", async () => {
            await service.getPage("home", "/");
            await service.getPage("home", "/");

            expect(getBySlug).toHaveBeenCalledOnce();
        });

        it("does not cache non-canonical paths that slugify to the same page", async () => {
            await service.getPage("foo-bar", "/foo_bar");
            await service.getPage("foo-bar", "/foo_bar");

            expect(getBySlug).toHaveBeenCalledTimes(2);
        });

        it("hides unpublished pages and does not cache the miss", async () => {
            getBySlug.mockResolvedValue(success(makePage({published: false})));

            expect(await service.getPage("about", "/about")).toEqual(failure(TEMPLATE_ERR.PAGE_NOT_FOUND));
            await service.getPage("about", "/about");
            expect(getBySlug).toHaveBeenCalledTimes(2);
        });

        it("fails when the navigation is missing", async () => {
            getNav.mockResolvedValue(success(null));

            expect(await service.getPage("about", "/about")).toEqual(failure(TEMPLATE_ERR.NAV_NOT_FOUND));
        });

        it("re-renders after the cache is cleared", async () => {
            await service.getPage("about", "/about");
            service.clearCache();
            await service.getPage("about", "/about");

            expect(getBySlug).toHaveBeenCalledTimes(2);
        });
    });

    describe("getBlogList", () => {
        it("renders the requested page of published posts", async () => {
            const result = await service.getBlogList(1);

            expect(result.ok).toBe(true);
            expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({skip: 0}), {published: true});
        });

        it("renders an empty first page", async () => {
            listPosts.mockResolvedValue(success({data: [], total: 0}));

            const result = await service.getBlogList(1);

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain("No posts yet");
        });

        it("rejects pages past the end so they are never cached", async () => {
            expect(await service.getBlogList(999)).toEqual(failure(TEMPLATE_ERR.PAGE_NOT_FOUND));
            await service.getBlogList(999);
            expect(listPosts).toHaveBeenCalledTimes(2);
        });

        it("treats invalid page numbers as page 1", async () => {
            await service.getBlogList(NaN);
            await service.getBlogList(-3);

            expect(listPosts).toHaveBeenCalledOnce();
        });
    });

    describe("getBlogPost", () => {
        it("hides drafts", async () => {
            getPost.mockResolvedValue(success(makePost({published: false})));

            expect(await service.getBlogPost("hello-world")).toEqual(failure(TEMPLATE_ERR.POST_NOT_FOUND));
        });

        it("never renders the author's password hash", async () => {
            const author = {...makePost().author, password: "$2b$04$secret-hash"};
            getPost.mockResolvedValue(success(makePost({author})));

            const result = await service.getBlogPost("hello-world");

            if (!result.ok) throw new Error("expected success");
            expect(result.data).not.toContain("$2b$");
        });
    });

    describe("getNotFound", () => {
        it("falls back to a default navigation", async () => {
            getNav.mockResolvedValue(failure("db"));

            expect(await service.getNotFound("/missing")).toContain("404");
        });
    });
});
