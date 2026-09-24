import {success, failure, type AsyncResult} from "../lib/result.js";
import type {MaybeNull, MaybeUndefined, ValueOf} from "../lib/types.js";
import {DEFAULT_PAGE_SIZE, paginate, toSkipTake} from "../lib/pagination.js";
import {CacheTag, type CacheStats} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import type NavigationRepository from "../repositories/navigation-repository.js";
import type {NavigationWithItems} from "../repositories/navigation-repository.js";
import type PageRepository from "../repositories/page-repository.js";
import type PostRepository from "../repositories/post-repository.js";
import {normalizePath} from "../ui/lib.js";
import {BlogListView} from "../ui/views/site/blog-list.js";
import {BlogPostView} from "../ui/views/site/blog-post.js";
import {NotFoundView} from "../ui/views/site/not-found.js";
import {PageView} from "../ui/views/site/page.js";
import {BlogListView as AdminBlogListView} from "../ui/views/admin/blog-list.js";
import {DashboardView} from "../ui/views/admin/dashboard.js";
import {ErrorView} from "../ui/views/admin/error.js";
import {LoginView} from "../ui/views/admin/login.js";
import {MessagesListView} from "../ui/views/admin/messages-list.js";
import {NavItemFormView} from "../ui/views/admin/nav-item-form.js";
import {NavView} from "../ui/views/admin/nav.js";
import {PageFormView} from "../ui/views/admin/page-form.js";
import {PagesListView} from "../ui/views/admin/pages-list.js";
import {PostFormView} from "../ui/views/admin/post-form.js";
import {SectionFormView} from "../ui/views/admin/section-form.js";
import {SettingsView} from "../ui/views/admin/settings.js";

export const TEMPLATE_ERR = {
    PAGE_NOT_FOUND: "page-not-found",
    NAV_NOT_FOUND: "nav-not-found",
    POST_NOT_FOUND: "post-not-found",
    BLOG_LIST_ERROR: "blog-list-error",
} as const;

export type TemplateError = ValueOf<typeof TEMPLATE_ERR>;

const FALLBACK_NAV: NavigationWithItems = {
    id: "",
    brandName: "Lindeneg",
    items: [],
};

class TemplateService {
    readonly admin = {
        blogList: AdminBlogListView,
        dashboard: DashboardView,
        error: ErrorView,
        login: LoginView,
        messagesList: MessagesListView,
        nav: NavView,
        navItemForm: NavItemFormView,
        pageForm: PageFormView,
        pagesList: PagesListView,
        postForm: PostFormView,
        sectionForm: SectionFormView,
        settings: SettingsView,
    };

    constructor(
        private readonly pageRepo: PageRepository,
        private readonly navigationRepo: NavigationRepository,
        private readonly postRepo: PostRepository,
        private readonly cache: PageCache
    ) {}

    async getPage(slug: string, currentPath: string): AsyncResult<string, TemplateError> {
        const path = normalizePath(currentPath);
        const isCanonical = path === `/${slug}` || (slug === "home" && path === "/");
        return this.#render(
            isCanonical ? `page:${path}` : null,
            async () => {
                const result = await this.pageRepo.getBySlug(slug);
                if (!result.ok) return failure(TEMPLATE_ERR.PAGE_NOT_FOUND);
                if (!result.data || !result.data.published) {
                    return failure(TEMPLATE_ERR.PAGE_NOT_FOUND);
                }
                return success(result.data);
            },
            (page) => [CacheTag.page(page.id)],
            (page, nav) => PageView({page, nav, currentPath: path})
        );
    }

    async getBlogList(page: number, tag: MaybeUndefined<string>): AsyncResult<string, TemplateError> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const pagination = {page: safePage, pageSize: DEFAULT_PAGE_SIZE};
        return this.#render(
            `blog:list:${tag ?? ""}:${safePage}`,
            async () => {
                const [result, tags] = await Promise.all([
                    this.postRepo.list(toSkipTake(pagination), {published: true, tag}),
                    this.postRepo.listPublishedTags(),
                ]);
                if (!result.ok || !tags.ok) return failure(TEMPLATE_ERR.BLOG_LIST_ERROR);
                const posts = paginate(result.data.data, result.data.total, pagination);
                // an unknown tag or a page past the end is a 404, which also keeps them out of the cache
                if ((tag && posts.total === 0) || (safePage > 1 && safePage > posts.totalPages)) {
                    return failure(TEMPLATE_ERR.PAGE_NOT_FOUND);
                }
                return success({posts, tags: tags.data});
            },
            () => [CacheTag.blogList],
            ({posts, tags}, nav) => BlogListView({posts, tags, activeTag: tag, nav, currentPath: "/blog"})
        );
    }

    async getBlogPost(slug: string): AsyncResult<string, TemplateError> {
        return this.#render(
            `blog:post:${slug}`,
            async () => {
                const result = await this.postRepo.getBySlug(slug);
                if (!result.ok) return failure(TEMPLATE_ERR.POST_NOT_FOUND);
                if (!result.data || !result.data.published) {
                    return failure(TEMPLATE_ERR.POST_NOT_FOUND);
                }
                return success(result.data);
            },
            (post) => [CacheTag.post(post.id), CacheTag.user(post.authorId)],
            (post, nav) => BlogPostView({post, nav, currentPath: `/blog/${slug}`})
        );
    }

    async getNotFound(currentPath: string): Promise<string> {
        const nav = await this.#loadNav();
        return NotFoundView({nav, currentPath});
    }

    clearCache(): void {
        this.cache.clear();
    }

    cacheStats(): CacheStats {
        return this.cache.stats();
    }

    async #loadNav(): Promise<NavigationWithItems> {
        const result = await this.navigationRepo.get();
        if (result.ok && result.data) return result.data;
        return FALLBACK_NAV;
    }

    async #render<T>(
        cacheKey: MaybeNull<string>,
        load: () => AsyncResult<T, TemplateError>,
        tags: (data: T) => string[],
        render: (data: T, nav: NavigationWithItems) => string
    ): AsyncResult<string, TemplateError> {
        const cached = cacheKey ? this.cache.get(cacheKey) : undefined;
        if (cached) return success(cached);

        const [dataResult, navResult] = await Promise.all([load(), this.navigationRepo.get()]);

        if (!navResult.ok) {
            return failure(TEMPLATE_ERR.NAV_NOT_FOUND);
        }
        if (!navResult.data) {
            return failure(TEMPLATE_ERR.NAV_NOT_FOUND);
        }
        if (!dataResult.ok) {
            return failure(dataResult.ctx);
        }

        const html = render(dataResult.data, navResult.data);
        if (cacheKey) this.cache.set(cacheKey, html, [CacheTag.nav, ...tags(dataResult.data)]);
        return success(html);
    }
}

export default TemplateService;
