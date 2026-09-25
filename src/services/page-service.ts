import {success, failure, type AsyncResult} from "../lib/result.js";
import {AppError} from "../lib/errors.js";
import {paginate, toSkipTake, type Paginated, type PaginationParams} from "../lib/pagination.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import {slugify} from "../lib/slugify.js";
import type {Page, PageSection} from "../generated/prisma/client.js";
import type PageRepository from "../repositories/page-repository.js";
import type {PageWithSections} from "../repositories/page-repository.js";
import type SectionRepository from "../repositories/section-repository.js";
import type {SectionWithPage} from "../repositories/section-repository.js";

export interface PageInput {
    name: string;
    // derived from the name when blank
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

export function pageSlug(input: {name: string; slug?: string}): string {
    return slugify(input.slug?.trim() || input.name);
}

class PageService {
    constructor(
        private readonly pageRepo: PageRepository,
        private readonly sectionRepo: SectionRepository,
        private readonly cache: PageCache
    ) {}

    async list(pagination: PaginationParams): AsyncResult<Paginated<PageWithSections>, AppError> {
        const result = await this.pageRepo.list(toSkipTake(pagination));
        if (!result.ok) return result;
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async get(id: string): AsyncResult<PageWithSections, AppError> {
        const result = await this.pageRepo.getById(id);
        if (!result.ok) return result;
        if (!result.data) return failure(AppError.NOT_FOUND);
        return success(result.data);
    }

    async getPublishedBySlug(slug: string): AsyncResult<PageWithSections, AppError> {
        const result = await this.pageRepo.getBySlug(slug);
        if (!result.ok) return result;
        if (!result.data || !result.data.published) return failure(AppError.NOT_FOUND);
        return success(result.data);
    }

    async create(input: PageInput): AsyncResult<PageWithSections, AppError> {
        return this.pageRepo.create(this.#toPageData(input));
    }

    async update(id: string, input: PageInput): AsyncResult<PageWithSections, AppError> {
        const result = await this.pageRepo.update(id, this.#toPageData(input));
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.page(id)]);
        return success(result.data);
    }

    async delete(id: string): AsyncResult<Page, AppError> {
        const result = await this.pageRepo.delete(id);
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.page(id)]);
        return success(result.data);
    }

    async getSection(id: string): AsyncResult<SectionWithPage, AppError> {
        const result = await this.sectionRepo.getById(id);
        if (!result.ok) return result;
        if (!result.data) return failure(AppError.NOT_FOUND);
        return success(result.data);
    }

    async createSection(pageId: string, input: SectionInput): AsyncResult<PageSection, AppError> {
        const result = await this.sectionRepo.create({pageId, ...input});
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.page(pageId)]);
        return success(result.data);
    }

    async updateSection(id: string, input: SectionInput): AsyncResult<PageSection, AppError> {
        const result = await this.sectionRepo.update(id, input);
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.page(result.data.pageId)]);
        return success(result.data);
    }

    async deleteSection(id: string): AsyncResult<PageSection, AppError> {
        const result = await this.sectionRepo.delete(id);
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.page(result.data.pageId)]);
        return success(result.data);
    }

    #toPageData(input: PageInput) {
        return {
            name: input.name,
            slug: pageSlug(input),
            title: input.title,
            description: input.description,
            published: input.published,
        };
    }
}

export default PageService;
