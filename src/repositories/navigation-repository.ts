import {failure, emptySuccess, type EmptyResult, type AsyncResult} from "../lib/result.js";
import type {MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {Navigation, NavigationItem} from "@prisma/client";
import type DataService from "../services/data-service.js";

export type NavigationWithItems = Navigation & {items: NavigationItem[]};

class NavigationRepository {
    constructor(private readonly db: DataService) {}

    get(): AsyncResult<MaybeNull<NavigationWithItems>> {
        return this.db.run("navigation-repo.get", this.db.p.navigation.findFirst({include: {items: true}}));
    }

    async createOnce(): Promise<EmptyResult> {
        const count = await this.db.run("navigation-repo.createOnce.count", this.db.p.navigation.count());
        if (!count.ok) return count;
        if (count.data > 0) return failure("nav already created");

        const created = await this.db.run(
            "navigation-repo.createOnce.create",
            this.db.p.navigation.create({data: {brandName: "Brandname"}})
        );
        if (!created.ok) return created;
        return emptySuccess();
    }

    update(
        id: string,
        data: RawModelUpdate<Navigation>,
        includeItems = false
    ): AsyncResult<NavigationWithItems | Navigation> {
        return this.db.run(
            "navigation-repo.update",
            this.db.p.navigation.update({
                where: {id},
                data,
                include: includeItems ? {items: true} : undefined,
            })
        );
    }
}

export default NavigationRepository;
