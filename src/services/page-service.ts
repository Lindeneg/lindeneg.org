import {success, failure, type AsyncResult} from "../lib/result.js";
import type {ValueOf} from "../lib/types.js";
import {paginate, toSkipTake, type Paginated, type PaginationParams} from "../lib/pagination.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import {slugify} from "../lib/slugify.js";
import type {Page, PageSection} from "@prisma/client";
import type PageRepository from "../repositories/page-repository.js";
import type {PageWithSections} from "../repositories/page-repository.js";
import type SectionRepository from "../repositories/section-repository.js";
import type {SectionWithPage} from "../repositories/section-repository.js";

export const PageError = {
    NOT_FOUND: "not_found",
    DB_ERROR: "db_error",
} as const;

export type PageError = ValueOf<typeof PageError>;

export interface PageInput {
    name: string;
    slug?: string;
    title: string;
    description: string;
    published: boolean;
}

export interface SectionInput {
    content: string;
    position: number;
    published: boolean;
}

class PageService {
    constructor(
        private readonly pageRepo: PageRepository,
        private readonly sectionRepo: SectionRepository,
        private readonly cache: PageCache
    ) {}

    async list(pagination: PaginationParams): AsyncResult<Paginated<PageWithSections>, PageError> {
        const result = await this.pageRepo.list(toSkipTake(pagination));
        if (!result.ok) return failure(PageError.DB_ERROR);
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async get(id: string): AsyncResult<PageWithSections, PageError> {
        const result = await this.pageRepo.getById(id);
        if (!result.ok) return failure(PageError.DB_ERROR);
        if (!result.data) return failure(PageError.NOT_FOUND);
        return success(result.data);
    }

    async create(input: PageInput): AsyncResult<PageWithSections, PageError> {
        const result = await this.pageRepo.create(this.#toPageData(input));
        if (!result.ok) return failure(PageError.DB_ERROR);
        return success(result.data);
    }

    async update(id: string, input: PageInput): AsyncResult<PageWithSections, PageError> {
        const result = await this.pageRepo.update(id, this.#toPageData(input));
        if (!result.ok) return failure(PageError.DB_ERROR);
        this.cache.invalidate([CacheTag.page(id)]);
        return success(result.data);
    }

    async delete(id: string): AsyncResult<Page, PageError> {
        const result = await this.pageRepo.delete(id);
        if (!result.ok) return failure(PageError.DB_ERROR);
        this.cache.invalidate([CacheTag.page(id)]);
        return success(result.data);
    }

    async getSection(id: string): AsyncResult<SectionWithPage, PageError> {
        const result = await this.sectionRepo.getById(id);
        if (!result.ok) return failure(PageError.DB_ERROR);
        if (!result.data) return failure(PageError.NOT_FOUND);
        return success(result.data);
    }

    async createSection(pageId: string, input: SectionInput): AsyncResult<PageSection, PageError> {
        const result = await this.sectionRepo.create({pageId, ...input});
        if (!result.ok) return failure(PageError.DB_ERROR);
        this.cache.invalidate([CacheTag.page(pageId)]);
        return success(result.data);
    }

    async updateSection(id: string, input: SectionInput): AsyncResult<PageSection, PageError> {
        const result = await this.sectionRepo.update(id, input);
        if (!result.ok) return failure(PageError.DB_ERROR);
        this.cache.invalidate([CacheTag.page(result.data.pageId)]);
        return success(result.data);
    }

    async deleteSection(id: string): AsyncResult<PageSection, PageError> {
        const result = await this.sectionRepo.delete(id);
        if (!result.ok) return failure(PageError.DB_ERROR);
        this.cache.invalidate([CacheTag.page(result.data.pageId)]);
        return success(result.data);
    }

    #toPageData(input: PageInput) {
        const slug = input.slug && input.slug.trim() !== "" ? input.slug : input.name;
        return {
            name: input.name,
            slug: slugify(slug),
            title: input.title,
            description: input.description,
            published: input.published,
        };
    }
}

export default PageService;
