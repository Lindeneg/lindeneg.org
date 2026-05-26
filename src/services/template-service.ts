import type {Navigation, NavigationItem, Page, PageSection, Post, User} from "@prisma/client";
import {success, failure, type Result} from "../lib/result.js";
import {DEFAULT_PAGE_SIZE, paginate, toSkipTake, type Paginated} from "../lib/pagination.js";
import {BlogList} from "../ui/views/blog-list.js";
import {BlogPost} from "../ui/views/blog-post.js";
import {NotFound} from "../ui/views/not-found.js";
import {Page as PageView} from "../ui/views/page.js";
import type NavigationRepository from "../repositories/navigation-repository.js";
import type PageRepository from "../repositories/page-repository.js";
import type PostRepository from "../repositories/post-repository.js";

export const TEMPLATE_ERR = {
    PAGE_NOT_FOUND: "page-not-found",
    NAV_NOT_FOUND: "nav-not-found",
    POST_NOT_FOUND: "post-not-found",
    BLOG_LIST_ERROR: "blog-list-error",
} as const;

export type TemplateError = (typeof TEMPLATE_ERR)[keyof typeof TEMPLATE_ERR];

export type NavigationWithItems = Navigation & {items: NavigationItem[]};
export type PageWithSections = Page & {sections: PageSection[]};
export type PostWithAuthor = Post & {author: User};

const FALLBACK_NAV: NavigationWithItems = {
    id: "",
    brandName: "Lindeneg",
    items: [],
};

class TemplateService {
    // TODO think about invalidation, TTL etc..
    #cache: Map<string, string> = new Map();

    constructor(
        private readonly pageRepo: PageRepository,
        private readonly navigationRepo: NavigationRepository,
        private readonly postRepo: PostRepository
    ) {}

    async getPage(slug: string, currentPath: string): Promise<Result<string, TemplateError>> {
        return this.#render(
            `page:${slug}@${currentPath}`,
            async () => {
                const result = await this.pageRepo.getBySlug(slug);
                if (!result.ok) return failure(TEMPLATE_ERR.PAGE_NOT_FOUND);
                if (!result.data || !result.data.published) {
                    return failure(TEMPLATE_ERR.PAGE_NOT_FOUND);
                }
                return success(result.data);
            },
            (page, nav) => PageView({page, nav, currentPath})
        );
    }

    async getBlogList(page: number, currentPath: string): Promise<Result<string, TemplateError>> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const pagination = {page: safePage, pageSize: DEFAULT_PAGE_SIZE};
        return this.#render(
            `blog:list:${safePage}@${currentPath}`,
            async () => {
                const result = await this.postRepo.list(toSkipTake(pagination), {published: true});
                if (!result.ok) return failure(TEMPLATE_ERR.BLOG_LIST_ERROR);
                return success(paginate(result.data.data, result.data.total, pagination));
            },
            (posts, nav) => BlogList({posts, nav, currentPath})
        );
    }

    async getBlogPost(slug: string, currentPath: string): Promise<Result<string, TemplateError>> {
        return this.#render(
            `blog:post:${slug}@${currentPath}`,
            async () => {
                const result = await this.postRepo.getBySlug(slug);
                if (!result.ok) return failure(TEMPLATE_ERR.POST_NOT_FOUND);
                if (!result.data || !result.data.published) {
                    return failure(TEMPLATE_ERR.POST_NOT_FOUND);
                }
                return success(result.data);
            },
            (post, nav) => BlogPost({post, nav, currentPath})
        );
    }

    async getNotFound(currentPath: string): Promise<string> {
        const nav = await this.#loadNav();
        return NotFound(nav, currentPath);
    }

    clearCache(): void {
        this.#cache.clear();
    }

    async #loadNav(): Promise<NavigationWithItems> {
        const result = await this.navigationRepo.get();
        if (result.ok && result.data) return result.data;
        return FALLBACK_NAV;
    }

    async #render<T>(
        cacheKey: string,
        load: () => Promise<Result<T, TemplateError>>,
        render: (data: T, nav: NavigationWithItems) => string
    ): Promise<Result<string, TemplateError>> {
        const cached = this.#cache.get(cacheKey);
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
        this.#cache.set(cacheKey, html);
        return success(html);
    }
}

export {type Paginated};
export default TemplateService;
