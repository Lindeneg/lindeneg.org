import type {AsyncResult} from "../lib/result.js";
import type {DbError} from "../lib/errors.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {Page, PageSection} from "../generated/prisma/client.js";
import type DataService from "../services/data-service.js";
import type {SkipTake, PaginatedResult} from "../lib/pagination.js";

export type PageWithSections = Page & {sections: PageSection[]};

const include = {sections: {orderBy: {position: "asc"}}} as const;

class PageRepository {
    constructor(private readonly db: DataService) {}

    list(opts: Partial<SkipTake> = {}): AsyncResult<PaginatedResult<PageWithSections>, DbError> {
        return this.db.run(
            "page-repo.list",
            Promise.all([
                this.db.p.page.findMany({
                    include,
                    orderBy: {createdAt: "desc"},
                    skip: opts.skip,
                    take: opts.take,
                }),
                this.db.p.page.count(),
            ]).then(([data, total]) => ({data, total}))
        );
    }

    count(): AsyncResult<number, DbError> {
        return this.db.run("page-repo.count", this.db.p.page.count());
    }

    getById(id: string): AsyncResult<MaybeNull<PageWithSections>, DbError> {
        return this.db.run("page-repo.getById", this.db.p.page.findUnique({where: {id}, include}));
    }

    getBySlug(slug: string): AsyncResult<MaybeNull<PageWithSections>, DbError> {
        return this.db.run("page-repo.getBySlug", this.db.p.page.findUnique({where: {slug}, include}));
    }

    create(data: RawModel<Page>): AsyncResult<PageWithSections, DbError> {
        return this.db.run("page-repo.create", this.db.p.page.create({data, include}));
    }

    update(id: string, data: RawModelUpdate<Page>): AsyncResult<PageWithSections, DbError> {
        return this.db.run("page-repo.update", this.db.p.page.update({where: {id}, data, include}));
    }

    delete(id: string): AsyncResult<Page, DbError> {
        return this.db.run("page-repo.delete", this.db.p.page.delete({where: {id}}));
    }
}

export default PageRepository;
