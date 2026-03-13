import {
    success,
    failure,
    emptySuccess,
    type Result,
    type RawModel,
    type MaybeNull,
    type EmptyResult,
} from "@lindeneg/shared";
import type {Navigation, NavigationItem} from "@prisma/client";
import type DataService from "../services/data-service.js";
import type LoggerService from "../services/logger-service.js";

type NavigationWithItems = Navigation & {items: NavigationItem[]};

class NavigationRepository {
    constructor(
        private readonly db: DataService,
        private readonly log: LoggerService
    ) {}

    async get(): Promise<Result<MaybeNull<NavigationWithItems>>> {
        try {
            const navigation = await this.db.p.navigation.findFirst({include: {items: true}});
            return success(navigation);
        } catch (err) {
            this.log.error(err, "navigation-repo.get");
            return failure("failed to get navigation");
        }
    }

    async createOnce(): Promise<EmptyResult> {
        try {
            const count = await this.db.p.navigation.count();
            if (count > 0) return failure("nav already created");
            await this.db.p.navigation.create({
                data: {brandName: "Brandname"},
            });
            return emptySuccess();
        } catch (err) {
            this.log.error(err, "navigation-repo.createOnce");
            return failure("failed to get create navigation");
        }
    }

    async update(
        id: string,
        data: Partial<RawModel<Navigation>>,
        includeItems = false
    ): Promise<Result<NavigationWithItems | Navigation>> {
        try {
            const navigation = await this.db.p.navigation.update({
                where: {id},
                data,
                include: includeItems ? {items: true} : undefined,
            });
            return success(navigation);
        } catch (err) {
            this.log.error(err, "navigation-repo.update");
            return failure("failed to update navigation");
        }
    }
}

export default NavigationRepository;
