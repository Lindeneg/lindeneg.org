import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import type {RawModel, ValueOf} from "../lib/types.js";
import type {NavigationItem} from "@prisma/client";
import type NavigationRepository from "../repositories/navigation-repository.js";
import type {NavigationWithItems} from "../repositories/navigation-repository.js";
import type NavigationItemRepository from "../repositories/navigation-item-repository.js";

export const NavigationError = {
    NOT_FOUND: "not_found",
    DB_ERROR: "db_error",
} as const;

export type NavigationError = ValueOf<typeof NavigationError>;

export type NavigationItemInput = RawModel<NavigationItem>;

class NavigationService {
    constructor(
        private readonly navigationRepo: NavigationRepository,
        private readonly navigationItemRepo: NavigationItemRepository,
        private readonly cache: PageCache
    ) {}

    async ensureExists(): Promise<EmptyResult> {
        return this.navigationRepo.createOnce();
    }

    async get(): AsyncResult<NavigationWithItems, NavigationError> {
        const result = await this.navigationRepo.get();
        if (!result.ok) return failure(NavigationError.DB_ERROR);
        if (!result.data) return failure(NavigationError.NOT_FOUND);
        return success(result.data);
    }

    async getItem(
        id: string
    ): AsyncResult<{nav: NavigationWithItems; item: NavigationItem}, NavigationError> {
        const nav = await this.get();
        if (!nav.ok) return nav;
        const item = nav.data.items.find((i) => i.id === id);
        if (!item) return failure(NavigationError.NOT_FOUND);
        return success({nav: nav.data, item});
    }

    async updateBrand(id: string, brandName: string): Promise<EmptyResult<NavigationError>> {
        const result = await this.navigationRepo.update(id, {brandName});
        if (!result.ok) return failure(NavigationError.DB_ERROR);
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }

    async createItem(input: NavigationItemInput): Promise<EmptyResult<NavigationError>> {
        const result = await this.navigationItemRepo.create(input);
        if (!result.ok) return failure(NavigationError.DB_ERROR);
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }

    async updateItem(id: string, input: NavigationItemInput): Promise<EmptyResult<NavigationError>> {
        const result = await this.navigationItemRepo.update(id, input);
        if (!result.ok) return failure(NavigationError.DB_ERROR);
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }

    async deleteItem(id: string): Promise<EmptyResult<NavigationError>> {
        const result = await this.navigationItemRepo.delete(id);
        if (!result.ok) return failure(NavigationError.DB_ERROR);
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }
}

export default NavigationService;
