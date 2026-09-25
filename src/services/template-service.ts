import {success, failure, type AsyncResult} from "../lib/result.js";
import {AppError} from "../lib/errors.js";
import type {MaybeUndefined} from "../lib/types.js";
import {DEFAULT_PAGE_SIZE} from "../lib/pagination.js";
import type {CacheStats} from "./page-cache-service.js";
import type PageCacheService from "./page-cache-service.js";
import type {NavigationWithItems} from "../repositories/navigation-repository.js";
import {BlogListView, blogDescription} from "../ui/views/site/blog-list.js";
import {BlogPostView} from "../ui/views/site/blog-post.js";
import {FeedView} from "../ui/views/site/feed.js";
import {SitemapView, type SitemapUrl} from "../ui/views/site/sitemap.js";
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

const FEED_SIZE = 20;

export function pagePath(slug: string): string {
    return slug === "home" ? "/" : `/${slug}`;
}

function newest(items: {updatedAt: Date}[]): Date {
    return new Date(Math.max(...items.map((item) => item.updatedAt.getTime())));
}

// renders the public site from published content, caching the html per canonical url until the admin clears it
class TemplateService {
    constructor(
        private readonly pageService: PageService,
        private readonly postService: PostService,
        private readonly navigationService: NavigationService,
        private readonly cache: PageCacheService,
        // the public origin, for canonical links, the sitemap and the feed
        private readonly siteUrl: string
    ) {}

    async getPage(slug: string): AsyncResult<string, AppError> {
        const canonical = `${this.siteUrl}${pagePath(slug)}`;
        return this.#render(
            `page:${slug}`,
            () => this.pageService.getPublishedBySlug(slug),
            (page, nav) => PageView({page, nav, currentPath: pagePath(slug), canonical})
        );
    }

    async getBlogList(page: number, tag: MaybeUndefined<string>): AsyncResult<string, AppError> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const pagination = {page: safePage, pageSize: DEFAULT_PAGE_SIZE};
        // the first page is /blog, so ?page=1 isn't a second url for it
        const params = new URLSearchParams({...(tag ? {tag} : {}), ...(safePage > 1 ? {page: String(safePage)} : {})});
        const canonical = `${this.siteUrl}/blog${params.size > 0 ? `?${params}` : ""}`;
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
            ({posts, tags}, nav) => BlogListView({posts, tags, activeTag: tag, nav, currentPath: "/blog", canonical})
        );
    }

    async getBlogPost(slug: string): AsyncResult<string, AppError> {
        return this.#render(
            `blog:post:${slug}`,
            () => this.postService.getPublishedBySlug(slug),
            (post, nav) =>
                BlogPostView({post, nav, currentPath: `/blog/${slug}`, canonical: `${this.siteUrl}/blog/${post.slug}`})
        );
    }

    getRobots(): string {
        return `User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${this.siteUrl}/sitemap.xml\n`;
    }

    // published pages, the blog and published posts; tag and pagination urls are left out
    async getSitemap(): AsyncResult<string, AppError> {
        return this.#render(
            "sitemap",
            async () => {
                const [pages, posts] = await Promise.all([
                    this.pageService.listPublished(),
                    this.postService.listAllPublished(),
                ]);
                if (!pages.ok) return pages;
                if (!posts.ok) return posts;
                return success({pages: pages.data, posts: posts.data});
            },
            ({pages, posts}) => {
                const urls: SitemapUrl[] = pages.map((page) => ({
                    loc: `${this.siteUrl}${pagePath(page.slug)}`,
                    // a page's content lives in its sections, which don't touch the page's updatedAt
                    lastmod: newest([page, ...page.sections.filter((section) => section.published)]),
                }));
                if (posts.length > 0) urls.push({loc: `${this.siteUrl}/blog`, lastmod: newest(posts)});
                for (const post of posts)
                    urls.push({loc: `${this.siteUrl}/blog/${post.slug}`, lastmod: post.updatedAt});
                return SitemapView(urls);
            }
        );
    }

    async getFeed(): AsyncResult<string, AppError> {
        return this.#render(
            "feed",
            async () => {
                const [posts, tags] = await Promise.all([
                    this.postService.listPublished({page: 1, pageSize: FEED_SIZE}, undefined),
                    this.postService.listPublishedTags(),
                ]);
                if (!posts.ok) return posts;
                if (!tags.ok) return tags;
                return success({posts: posts.data.data, tags: tags.data});
            },
            ({posts, tags}, nav) =>
                FeedView({
                    siteUrl: this.siteUrl,
                    brand: nav.brandName,
                    description: blogDescription(nav.brandName, tags),
                    posts,
                })
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
        render: (data: T, nav: NavigationWithItems) => string
    ): AsyncResult<string, AppError> {
        const cached = this.cache.get(cacheKey);
        if (cached) return success(cached);

        const [dataResult, navResult] = await Promise.all([load(), this.#loadNav()]);
        if (!dataResult.ok) return dataResult;
        if (!navResult.ok) return navResult;

        const html = render(dataResult.data, navResult.data);
        this.cache.set(cacheKey, html);
        return success(html);
    }
}

export default TemplateService;
