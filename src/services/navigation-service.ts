import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import {AppError, type DbError} from "../lib/errors.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import type {RawModel} from "../lib/types.js";
import type {NavigationItem} from "../generated/prisma/client.js";
import type NavigationRepository from "../repositories/navigation-repository.js";
import type {NavigationWithItems} from "../repositories/navigation-repository.js";
import type NavigationItemRepository from "../repositories/navigation-item-repository.js";

// the navigation an item belongs to is decided by the server, not by the form
export type NavigationItemInput = Omit<RawModel<NavigationItem>, "navigationId">;

class NavigationService {
    constructor(
        private readonly navigationRepo: NavigationRepository,
        private readonly navigationItemRepo: NavigationItemRepository,
        private readonly cache: PageCache
    ) {}

    async ensureExists(): Promise<EmptyResult<DbError>> {
        return this.navigationRepo.createOnce();
    }

    async get(): AsyncResult<NavigationWithItems, AppError> {
        const result = await this.navigationRepo.get();
        if (!result.ok) return result;
        if (!result.data) return failure(AppError.NOT_FOUND);
        return success(result.data);
    }

    async getItem(id: string): AsyncResult<{nav: NavigationWithItems; item: NavigationItem}, AppError> {
        const nav = await this.get();
        if (!nav.ok) return nav;
        const item = nav.data.items.find((i) => i.id === id);
        if (!item) return failure(AppError.NOT_FOUND);
        return success({nav: nav.data, item});
    }

    async updateBrand(id: string, brandName: string): Promise<EmptyResult<AppError>> {
        const result = await this.navigationRepo.update(id, {brandName});
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }

    async createItem(navigationId: string, input: NavigationItemInput): Promise<EmptyResult<AppError>> {
        const result = await this.navigationItemRepo.create({...input, navigationId});
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }

    async updateItem(id: string, input: NavigationItemInput): Promise<EmptyResult<AppError>> {
        const result = await this.navigationItemRepo.update(id, input);
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }

    async deleteItem(id: string): Promise<EmptyResult<AppError>> {
        const result = await this.navigationItemRepo.delete(id);
        if (!result.ok) return result;
        this.cache.invalidate([CacheTag.nav]);
        return emptySuccess();
    }
}

export default NavigationService;
