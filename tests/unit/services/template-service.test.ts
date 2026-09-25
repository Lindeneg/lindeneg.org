import {beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import {failure, success} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import PageCache, {CacheTag} from "../../../src/lib/page-cache.js";
import TemplateService from "../../../src/services/template-service.js";
import PageService from "../../../src/services/page-service.js";
import PostService from "../../../src/services/post-service.js";
import NavigationService from "../../../src/services/navigation-service.js";
import type {ImageStore} from "../../../src/services/image-store.js";
import type PageRepository from "../../../src/repositories/page-repository.js";
import type SectionRepository from "../../../src/repositories/section-repository.js";
import type NavigationRepository from "../../../src/repositories/navigation-repository.js";
import type NavigationItemRepository from "../../../src/repositories/navigation-item-repository.js";
import type PostRepository from "../../../src/repositories/post-repository.js";
import {fake, fakeLog, makeNav, makePage, makePost} from "../helpers.js";

describe("TemplateService", () => {
    let getBySlug: Mock;
    let getNav: Mock;
    let listPosts: Mock;
    let listTags: Mock;
    let getPost: Mock;
    let cache: PageCache;
    let service: TemplateService;

    beforeEach(() => {
        getBySlug = vi.fn().mockResolvedValue(success(makePage()));
        getNav = vi.fn().mockResolvedValue(success(makeNav()));
        listPosts = vi.fn().mockResolvedValue(success({data: [makePost()], total: 1}));
        listTags = vi.fn().mockResolvedValue(success([{name: "jazz", count: 1}]));
        getPost = vi.fn().mockImplementation(async (slug: string) => success(makePost({id: slug, slug})));
        cache = new PageCache(100);
        // the real services on fake repositories, so the published-only rules are covered too
        service = new TemplateService(
            new PageService(fake<PageRepository>({getBySlug}), fake<SectionRepository>({}), cache),
            new PostService(
                fake<PostRepository>({list: listPosts, getBySlug: getPost, listPublishedTags: listTags}),
                fake<ImageStore>({}),
                cache,
                fakeLog()
            ),
            new NavigationService(fake<NavigationRepository>({get: getNav}), fake<NavigationItemRepository>({}), cache),
            cache
        );
    });

    describe("getBlogList with tags", () => {
        it("filters by the tag and marks it active in the tag bar", async () => {
            const result = await service.getBlogList(1, "jazz");

            if (!result.ok) throw new Error("expected success");
            expect(listPosts).toHaveBeenCalledWith(expect.anything(), {published: true, tag: "jazz"}, "publishedAt");
            expect(result.data).toContain(
                `href="/blog" class="tag" aria-current="page"><span class="tag-hash">#</span>jazz`
            );
            expect(result.data).toContain(`#jazz</span> <a href="/blog" class="blog-title-clear">clear</a></h1>`);
        });

        it("renders the tag bar without an active tag", async () => {
            const result = await service.getBlogList(1, undefined);

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain(`<a href="/blog" class="tag" aria-current="page">All</a>`);
            expect(result.data).toContain(`href="/blog?tag=jazz"`);
        });

        it("treats a tag without published posts as not found and does not cache it", async () => {
            listPosts.mockResolvedValue(success({data: [], total: 0}));

            expect(await service.getBlogList(1, "nope")).toEqual(failure(AppError.NOT_FOUND));
            await service.getBlogList(1, "nope");
            expect(listPosts).toHaveBeenCalledTimes(2);
        });

        it("caches each tag separately", async () => {
            await service.getBlogList(1, "jazz");
            await service.getBlogList(1, "jazz");
            await service.getBlogList(1, undefined);

            expect(listPosts).toHaveBeenCalledTimes(2);
        });

        it("fails with a db error when the tags can't be loaded", async () => {
            listTags.mockResolvedValue(failure(AppError.DB_ERROR));

            expect(await service.getBlogList(1, undefined)).toEqual(failure(AppError.DB_ERROR));
        });
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
            await service.getBlogList(1, undefined);
            await service.getBlogPost("a");

            cache.invalidate([CacheTag.blogList]);
            await service.getBlogList(1, undefined);
            await service.getBlogPost("a");

            expect(listPosts).toHaveBeenCalledTimes(2);
            expect(getPost).toHaveBeenCalledOnce();
        });

        it("drops a page by id", async () => {
            await service.getPage("about");

            cache.invalidate([CacheTag.page("page-1")]);
            await service.getPage("about");

            expect(getBySlug).toHaveBeenCalledTimes(2);
        });

        it("drops everything on a nav change", async () => {
            await service.getPage("about");
            await service.getBlogList(1, undefined);
            await service.getBlogPost("a");

            cache.invalidate([CacheTag.nav]);

            expect(service.cacheStats().entries).toBe(0);
        });
    });

    describe("getPage", () => {
        it("renders a published page", async () => {
            const result = await service.getPage("about");

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain("<title>About</title>");
            expect(result.data).toContain("<h1>About</h1>");
        });

        it("caches per slug", async () => {
            await service.getPage("about");
            await service.getPage("about");

            expect(getBySlug).toHaveBeenCalledOnce();
        });

        it("renders the home page as the current path /", async () => {
            const result = await service.getPage("home");

            if (!result.ok) throw new Error("expected success");
            expect(getBySlug).toHaveBeenCalledWith("home");
        });

        it("hides unpublished pages and does not cache the miss", async () => {
            getBySlug.mockResolvedValue(success(makePage({published: false})));

            expect(await service.getPage("about")).toEqual(failure(AppError.NOT_FOUND));
            await service.getPage("about");
            expect(getBySlug).toHaveBeenCalledTimes(2);
        });

        it("renders with the fallback navigation when none exists", async () => {
            getNav.mockResolvedValue(success(null));

            const result = await service.getPage("about");

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain("Lindeneg");
        });

        it("fails with a db error, not a 404, when the database fails", async () => {
            getNav.mockResolvedValue(failure(AppError.DB_ERROR));

            expect(await service.getPage("about")).toEqual(failure(AppError.DB_ERROR));
        });

        it("re-renders after the cache is cleared", async () => {
            await service.getPage("about");
            service.clearCache();
            await service.getPage("about");

            expect(getBySlug).toHaveBeenCalledTimes(2);
        });
    });

    describe("getBlogList", () => {
        it("renders the requested page of published posts", async () => {
            const result = await service.getBlogList(1, undefined);

            expect(result.ok).toBe(true);
            expect(listPosts).toHaveBeenCalledWith(
                expect.objectContaining({skip: 0}),
                {published: true, tag: undefined},
                "publishedAt"
            );
        });

        it("renders an empty first page", async () => {
            listPosts.mockResolvedValue(success({data: [], total: 0}));

            const result = await service.getBlogList(1, undefined);

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain("No posts yet");
        });

        it("rejects pages past the end so they are never cached", async () => {
            expect(await service.getBlogList(999, undefined)).toEqual(failure(AppError.NOT_FOUND));
            await service.getBlogList(999, undefined);
            expect(listPosts).toHaveBeenCalledTimes(2);
        });

        it("treats invalid page numbers as page 1", async () => {
            await service.getBlogList(NaN, undefined);
            await service.getBlogList(-3, undefined);

            expect(listPosts).toHaveBeenCalledOnce();
        });
    });

    describe("getBlogPost", () => {
        it("hides drafts", async () => {
            getPost.mockResolvedValue(success(makePost({published: false})));

            expect(await service.getBlogPost("hello-world")).toEqual(failure(AppError.NOT_FOUND));
        });

        it("renders the publish date as a localizable utc date", async () => {
            const result = await service.getBlogPost("hello-world");

            if (!result.ok) throw new Error("expected success");
            expect(result.data).toContain(
                `<time datetime="2024-01-05T12:00:00.000Z" data-local-date="long">January 5, 2024</time>`
            );
        });

        it("never renders the author's password hash", async () => {
            const author = {...makePost().author, password: "$2b$04$secret-hash"};
            getPost.mockResolvedValue(success(makePost({author})));

            const result = await service.getBlogPost("hello-world");

            if (!result.ok) throw new Error("expected success");
            expect(result.data).not.toContain("$2b$");
        });
    });

    describe("error pages", () => {
        it("renders the 404 page with a default navigation when the database fails", async () => {
            getNav.mockResolvedValue(failure(AppError.DB_ERROR));

            expect(await service.getNotFound("/missing")).toContain("404");
        });

        it("renders the 500 page with a default navigation when the database fails", async () => {
            getNav.mockResolvedValue(failure(AppError.DB_ERROR));

            expect(await service.getServerError("/about")).toContain("500");
        });
    });
});
