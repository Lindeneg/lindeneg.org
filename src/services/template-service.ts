import {success, failure, type AsyncResult} from "../lib/result.js";
import {AppError} from "../lib/errors.js";
import type {MaybeUndefined} from "../lib/types.js";
import {DEFAULT_PAGE_SIZE} from "../lib/pagination.js";
import {CacheTag, type CacheStats} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import type {NavigationWithItems} from "../repositories/navigation-repository.js";
import {BlogListView} from "../ui/views/site/blog-list.js";
import {BlogPostView} from "../ui/views/site/blog-post.js";
import {NotFoundView} from "../ui/views/site/not-found.js";
import {ServerErrorView} from "../ui/views/site/server-error.js";
import {PageView} from "../ui/views/site/page.js";
import type NavigationService from "./navigation-service.js";
import type PageService from "./page-service.js";
import type PostService from "./post-service.js";

const FALLBACK_NAV: NavigationWithItems = {
    id: "",
    brandName: "Lindeneg",
    items: [],
};

export function pagePath(slug: string): string {
    return slug === "home" ? "/" : `/${slug}`;
}

// renders the public site from published content, caching the html per canonical url
class TemplateService {
    constructor(
        private readonly pageService: PageService,
        private readonly postService: PostService,
        private readonly navigationService: NavigationService,
        private readonly cache: PageCache
    ) {}

    async getPage(slug: string): AsyncResult<string, AppError> {
        return this.#render(
            `page:${slug}`,
            () => this.pageService.getPublishedBySlug(slug),
            (page) => [CacheTag.page(page.id)],
            (page, nav) => PageView({page, nav, currentPath: pagePath(slug)})
        );
    }

    async getBlogList(page: number, tag: MaybeUndefined<string>): AsyncResult<string, AppError> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const pagination = {page: safePage, pageSize: DEFAULT_PAGE_SIZE};
        return this.#render(
            `blog:list:${tag ?? ""}:${safePage}`,
            async () => {
                const [posts, tags] = await Promise.all([
                    this.postService.listPublished(pagination, tag),
                    this.postService.listPublishedTags(),
                ]);
                if (!posts.ok) return posts;
                if (!tags.ok) return tags;
                // an unknown tag or a page past the end is a 404, which also keeps them out of the cache
                if ((tag && posts.data.total === 0) || (safePage > 1 && safePage > posts.data.totalPages)) {
                    return failure(AppError.NOT_FOUND);
                }
                return success({posts: posts.data, tags: tags.data});
            },
            () => [CacheTag.blogList],
            ({posts, tags}, nav) => BlogListView({posts, tags, activeTag: tag, nav, currentPath: "/blog"})
        );
    }

    async getBlogPost(slug: string): AsyncResult<string, AppError> {
        return this.#render(
            `blog:post:${slug}`,
            () => this.postService.getPublishedBySlug(slug),
            (post) => [CacheTag.post(post.id), CacheTag.user(post.authorId)],
            (post, nav) => BlogPostView({post, nav, currentPath: `/blog/${slug}`})
        );
    }

    // error pages render even when the database is down, falling back to a bare navigation
    async getNotFound(currentPath: string): Promise<string> {
        const nav = await this.#loadNav();
        return NotFoundView({nav: nav.ok ? nav.data : FALLBACK_NAV, currentPath});
    }

    async getServerError(currentPath: string): Promise<string> {
        const nav = await this.#loadNav();
        return ServerErrorView({nav: nav.ok ? nav.data : FALLBACK_NAV, currentPath});
    }

    clearCache(): void {
        this.cache.clear();
    }

    cacheStats(): CacheStats {
        return this.cache.stats();
    }

    // a missing navigation row is not fatal, the site renders with the fallback
    async #loadNav(): AsyncResult<NavigationWithItems, AppError> {
        const result = await this.navigationService.get();
        if (!result.ok && result.ctx === AppError.NOT_FOUND) return success(FALLBACK_NAV);
        return result;
    }

    async #render<T>(
        cacheKey: string,
        load: () => AsyncResult<T, AppError>,
        tags: (data: T) => string[],
        render: (data: T, nav: NavigationWithItems) => string
    ): AsyncResult<string, AppError> {
        const cached = this.cache.get(cacheKey);
        if (cached) return success(cached);

        const [dataResult, navResult] = await Promise.all([load(), this.#loadNav()]);
        if (!dataResult.ok) return dataResult;
        if (!navResult.ok) return navResult;

        const html = render(dataResult.data, navResult.data);
        this.cache.set(cacheKey, html, [CacheTag.nav, ...tags(dataResult.data)]);
        return success(html);
    }
}

export default TemplateService;
