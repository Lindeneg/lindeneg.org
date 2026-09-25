import {emptySuccess, type EmptyResult, type AsyncResult} from "../lib/result.js";
import type {DbError} from "../lib/errors.js";
import type {MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {Navigation, NavigationItem} from "../generated/prisma/client.js";
import type DataService from "../services/data-service.js";

export type NavigationWithItems = Navigation & {items: NavigationItem[]};

const include = {items: {orderBy: {position: "asc"}}} as const;

class NavigationRepository {
    constructor(private readonly db: DataService) {}

    get(): AsyncResult<MaybeNull<NavigationWithItems>, DbError> {
        return this.db.run("navigation-repo.get", this.db.p.navigation.findFirst({include}));
    }

    // succeeds whether the navigation was created now or already existed, so a failure is a real db error
    async createOnce(): Promise<EmptyResult<DbError>> {
        const count = await this.db.run("navigation-repo.createOnce.count", this.db.p.navigation.count());
        if (!count.ok) return count;
        if (count.data > 0) return emptySuccess();

        const created = await this.db.run(
            "navigation-repo.createOnce.create",
            this.db.p.navigation.create({data: {brandName: "Brandname"}})
        );
        if (!created.ok) return created;
        return emptySuccess();
    }

    update(id: string, data: RawModelUpdate<Navigation>): AsyncResult<Navigation, DbError> {
        return this.db.run("navigation-repo.update", this.db.p.navigation.update({where: {id}, data}));
    }
}

export default NavigationRepository;
