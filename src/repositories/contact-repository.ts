import type {AsyncResult} from "../lib/result.js";
import type {DbError} from "../lib/errors.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {ContactMessage} from "../generated/prisma/client.js";
import type DataService from "../services/data-service.js";
import type {SkipTake, PaginatedResult} from "../lib/pagination.js";

class ContactRepository {
    constructor(private readonly db: DataService) {}

    list(opts: Partial<SkipTake> = {}): AsyncResult<PaginatedResult<ContactMessage>, DbError> {
        return this.db.run(
            "contact-repo.list",
            Promise.all([
                this.db.p.contactMessage.findMany({
                    orderBy: {createdAt: "desc"},
                    skip: opts.skip,
                    take: opts.take,
                }),
                this.db.p.contactMessage.count(),
            ]).then(([data, total]) => ({data, total}))
        );
    }

    count(where: {read?: boolean} = {}): AsyncResult<number, DbError> {
        return this.db.run("contact-repo.count", this.db.p.contactMessage.count({where}));
    }

    getById(id: string): AsyncResult<MaybeNull<ContactMessage>, DbError> {
        return this.db.run("contact-repo.getById", this.db.p.contactMessage.findUnique({where: {id}}));
    }

    create(data: RawModel<ContactMessage>): AsyncResult<ContactMessage, DbError> {
        return this.db.run("contact-repo.create", this.db.p.contactMessage.create({data}));
    }

    update(id: string, data: RawModelUpdate<ContactMessage>): AsyncResult<ContactMessage, DbError> {
        return this.db.run("contact-repo.update", this.db.p.contactMessage.update({where: {id}, data}));
    }

    delete(id: string): AsyncResult<ContactMessage, DbError> {
        return this.db.run("contact-repo.delete", this.db.p.contactMessage.delete({where: {id}}));
    }
}

export default ContactRepository;
